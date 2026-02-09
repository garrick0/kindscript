import * as ts from 'typescript';
import { ASTViewPort, ASTExtractionResult, TypeNodeView, KindDefinitionView, MemberValueView, InstanceDeclarationView } from '../../application/ports/ast.port';
import { SourceFile, TypeChecker } from '../../application/ports/typescript.port';

/**
 * Real implementation of ASTViewPort using the TypeScript compiler API.
 *
 * Piggybacks on TypeScript's type checker for discovery: uses
 * `checker.getSymbolAtLocation()` to resolve `Kind` and `InstanceConfig`
 * references through aliases and re-exports. Falls back to string matching
 * when the checker is unavailable (e.g., in unit tests with mock checkers).
 *
 * Extraction of type arguments, constraints, and member values remains
 * AST-based — the type checker identifies what to extract, the AST
 * provides the syntactic structure.
 */
export class ASTAdapter implements ASTViewPort {

  getKindDefinitions(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<KindDefinitionView[]> {
    const tsSourceFile = this.toTsSourceFile(sourceFile);
    const tsChecker = checker as unknown as ts.TypeChecker;
    if (!tsSourceFile) return { data: [], errors: [] };

    const results: KindDefinitionView[] = [];
    const errors: string[] = [];

    for (const stmt of tsSourceFile.statements) {
      if (!ts.isTypeAliasDeclaration(stmt)) continue;

      const type = stmt.type;
      if (!ts.isTypeReferenceNode(type)) continue;
      if (!this.isSymbolNamed(type.typeName, 'Kind', tsChecker)) continue;

      const typeName = stmt.name.text;

      // First type arg: kind name literal
      let kindNameLiteral = typeName;
      if (type.typeArguments && type.typeArguments.length >= 1) {
        const firstArg = type.typeArguments[0];
        if (ts.isLiteralTypeNode(firstArg) && ts.isStringLiteral(firstArg.literal)) {
          kindNameLiteral = firstArg.literal.text;
        } else {
          errors.push(`Kind '${typeName}': first type argument must be a string literal.`);
        }
      }

      // Second type arg: member properties
      const members: Array<{ name: string; typeName?: string }> = [];
      if (type.typeArguments && type.typeArguments.length >= 2) {
        const membersArg = type.typeArguments[1];
        if (ts.isTypeLiteralNode(membersArg)) {
          for (const member of membersArg.members) {
            if (ts.isPropertySignature(member) && member.name) {
              const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
              let memberTypeName: string | undefined;
              if (member.type) {
                if (ts.isTypeReferenceNode(member.type) && ts.isIdentifier(member.type.typeName)) {
                  memberTypeName = member.type.typeName.text;
                } else if (member.type.kind === ts.SyntaxKind.StringKeyword) {
                  memberTypeName = 'string';
                }
              }
              members.push({ name, typeName: memberTypeName });
            }
          }
        }
      }

      // Third type arg: constraints
      let constraints: TypeNodeView | undefined;
      if (type.typeArguments && type.typeArguments.length >= 3) {
        constraints = this.buildTypeNodeView(type.typeArguments[2], errors);
        if (!constraints) {
          errors.push(`Kind '${typeName}': constraints type argument could not be parsed.`);
        }
      }

      results.push({ typeName, kindNameLiteral, members, constraints });
    }

    return { data: results, errors };
  }

  getInstanceDeclarations(sourceFile: SourceFile, checker: TypeChecker): ASTExtractionResult<InstanceDeclarationView[]> {
    const tsSourceFile = this.toTsSourceFile(sourceFile);
    const tsChecker = checker as unknown as ts.TypeChecker;
    if (!tsSourceFile) return { data: [], errors: [] };

    // Build variable map for identifier resolution
    const varMap = new Map<string, ts.Expression>();
    for (const stmt of tsSourceFile.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          varMap.set(decl.name.text, decl.initializer);
        }
      }
    }

    const results: InstanceDeclarationView[] = [];
    const errors: string[] = [];

    for (const stmt of tsSourceFile.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      for (const decl of stmt.declarationList.declarations) {
        if (!decl.initializer || !ts.isSatisfiesExpression(decl.initializer)) continue;

        const satisfies = decl.initializer;
        const type = satisfies.type;
        if (!ts.isTypeReferenceNode(type)) continue;
        if (!this.isSymbolNamed(type.typeName, 'InstanceConfig', tsChecker)) continue;

        // Extract kind type name from type argument
        let kindTypeName: string | undefined;
        if (type.typeArguments && type.typeArguments.length >= 1) {
          const arg = type.typeArguments[0];
          if (ts.isTypeReferenceNode(arg) && ts.isIdentifier(arg.typeName)) {
            kindTypeName = arg.typeName.text;
          }
        }
        if (!kindTypeName) {
          const varName = ts.isIdentifier(decl.name) ? decl.name.text : '<unnamed>';
          errors.push(`'${varName} satisfies InstanceConfig' is missing a type argument.`);
          continue;
        }

        const variableName = ts.isIdentifier(decl.name) ? decl.name.text : undefined;
        if (!variableName) continue;

        const expression = satisfies.expression;
        if (!ts.isObjectLiteralExpression(expression)) continue;

        const members = this.extractMemberValues(expression, varMap, errors);
        results.push({ variableName, kindTypeName, members });
      }
    }

    return { data: results, errors };
  }

  /**
   * Check if a type name resolves to a symbol with the given name.
   *
   * Uses the type checker for alias-safe resolution (handles
   * `import { Kind as K }`), with string matching fallback when
   * the checker is unavailable.
   */
  private isSymbolNamed(typeName: ts.EntityName, expectedName: string, checker: ts.TypeChecker): boolean {
    if (checker && typeof checker.getSymbolAtLocation === 'function') {
      try {
        const symbol = checker.getSymbolAtLocation(typeName);
        if (symbol) {
          // Check the local binding name (e.g., `Kind` from `import { Kind }`)
          if (symbol.name === expectedName) return true;
          // Try resolving through aliases (e.g., `import { Kind as K }`)
          if (symbol.flags & ts.SymbolFlags.Alias) {
            try {
              const aliased = checker.getAliasedSymbol(symbol);
              return aliased.name === expectedName;
            } catch {
              // Module couldn't be resolved — local name already checked above
              return false;
            }
          }
          return false;
        }
      } catch {
        // Fall through to string matching
      }
    }
    return ts.isIdentifier(typeName) && typeName.text === expectedName;
  }

  /**
   * Recursively extract MemberValueView[] from an object literal expression.
   * Resolves identifier references via varMap and recurses into nested
   * object properties as children.
   */
  private extractMemberValues(
    obj: ts.ObjectLiteralExpression,
    varMap: Map<string, ts.Expression>,
    errors: string[],
  ): MemberValueView[] {
    return this.extractMemberValuesFromProps(Array.from(obj.properties), varMap, errors);
  }

  /**
   * Extract MemberValueView[] from an array of object literal element-like nodes.
   */
  private extractMemberValuesFromProps(
    props: ts.ObjectLiteralElementLike[],
    varMap: Map<string, ts.Expression>,
    errors: string[],
  ): MemberValueView[] {
    const results: MemberValueView[] = [];

    for (const prop of props) {
      let name: string;
      let valueExpr: ts.Expression | undefined;

      if (ts.isPropertyAssignment(prop) && prop.name) {
        name = ts.isIdentifier(prop.name)
          ? prop.name.text
          : ts.isStringLiteral(prop.name)
            ? prop.name.text
            : prop.name.getText();
        valueExpr = prop.initializer;
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        name = prop.name.text;
        // Shorthand: { domain } — resolve via varMap
        valueExpr = varMap.get(name);
        if (!valueExpr) {
          errors.push(`InstanceConfig member '${name}': variable '${name}' not resolved (shorthand).`);
        }
      } else {
        continue;
      }

      // Resolve identifier references
      if (valueExpr && ts.isIdentifier(valueExpr)) {
        const resolved = varMap.get(valueExpr.text);
        if (resolved) {
          valueExpr = resolved;
        } else {
          errors.push(`InstanceConfig member '${name}': variable '${valueExpr.text}' not resolved.`);
        }
      }

      const view: MemberValueView = { name };

      if (valueExpr && ts.isObjectLiteralExpression(valueExpr)) {
        const children = this.extractMemberValuesFromProps(
          Array.from(valueExpr.properties), varMap, errors
        );
        if (children.length > 0) {
          view.children = children;
        }
      }

      results.push(view);
    }

    return results;
  }

  private toTsSourceFile(sourceFile: SourceFile): ts.SourceFile | undefined {
    if (sourceFile.handle) {
      return sourceFile.handle as ts.SourceFile;
    }
    // Fallback for test scenarios where handle isn't set
    return ts.createSourceFile(sourceFile.fileName, sourceFile.text, ts.ScriptTarget.Latest, true);
  }

  /**
   * Build a TypeNodeView by structural inference from a ts.TypeNode.
   * Does not switch on property names — determines shape from AST node types.
   */
  private buildTypeNodeView(typeNode: ts.TypeNode, errors: string[]): TypeNodeView | undefined {
    // Boolean: true or false keyword
    if (typeNode.kind === ts.SyntaxKind.TrueKeyword ||
        typeNode.kind === ts.SyntaxKind.FalseKeyword ||
        (ts.isLiteralTypeNode(typeNode) &&
         (typeNode.literal.kind === ts.SyntaxKind.TrueKeyword ||
          typeNode.literal.kind === ts.SyntaxKind.FalseKeyword))) {
      return { kind: 'boolean' };
    }

    // Nested type literal → object with recursion
    if (ts.isTypeLiteralNode(typeNode)) {
      const properties: Array<{ name: string; value: TypeNodeView }> = [];
      for (const member of typeNode.members) {
        if (!ts.isPropertySignature(member) || !member.name || !member.type) continue;
        const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
        const value = this.buildTypeNodeView(member.type, errors);
        if (value) properties.push({ name, value });
      }
      if (properties.length === 0) return undefined;
      return { kind: 'object', properties };
    }

    // Tuple or array type
    const elements = this.getTypeElements(typeNode);
    if (elements.length === 0) return undefined;

    const first = elements[0];

    // Check if first element is a string literal → stringList
    if (ts.isLiteralTypeNode(first) && ts.isStringLiteral(first.literal)) {
      const values: string[] = [];
      for (const e of elements) {
        const s = this.getStringLiteralFromType(e);
        if (s !== undefined) {
          values.push(s);
        } else {
          errors.push(`Constraint contains a non-string element in string list.`);
        }
      }
      return { kind: 'stringList', values };
    }

    // Check if first element is a tuple (nested elements) → tuplePairs
    const innerElements = this.getTypeElements(first);
    if (innerElements.length > 0) {
      const pairs = this.extractTuplePairs(typeNode, errors);
      if (pairs.length > 0) {
        return { kind: 'tuplePairs', values: pairs };
      }
    }

    return undefined;
  }

  /**
   * Extract tuple pairs from a type node: [["a", "b"], ["c", "d"]]
   */
  private extractTuplePairs(typeNode: ts.TypeNode, errors: string[]): [string, string][] {
    const outerElements = this.getTypeElements(typeNode);
    const pairs: [string, string][] = [];

    for (const element of outerElements) {
      const innerElements = this.getTypeElements(element);
      if (innerElements.length === 2) {
        const first = this.getStringLiteralFromType(innerElements[0]);
        const second = this.getStringLiteralFromType(innerElements[1]);
        if (first && second) {
          pairs.push([first, second]);
        } else {
          errors.push(`Constraint tuple pair contains a non-string element.`);
        }
      } else if (innerElements.length > 0) {
        errors.push(`Constraint tuple must have exactly 2 elements, got ${innerElements.length}.`);
      }
    }

    return pairs;
  }

  /**
   * Get elements from a tuple or array type node.
   */
  private getTypeElements(typeNode: ts.TypeNode): ts.TypeNode[] {
    if (ts.isTupleTypeNode(typeNode)) {
      return Array.from(typeNode.elements);
    }
    // Handle ReadonlyArray type reference
    if (ts.isTypeReferenceNode(typeNode) && typeNode.typeArguments) {
      return Array.from(typeNode.typeArguments);
    }
    return [];
  }

  /**
   * Extract a string literal value from a LiteralTypeNode.
   */
  private getStringLiteralFromType(typeNode: ts.TypeNode): string | undefined {
    if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
      return typeNode.literal.text;
    }
    // Handle NamedTupleMember (readonly [keyof Members & string, ...])
    if (ts.isNamedTupleMember?.(typeNode)) {
      return this.getStringLiteralFromType(typeNode.type);
    }
    return undefined;
  }
}
