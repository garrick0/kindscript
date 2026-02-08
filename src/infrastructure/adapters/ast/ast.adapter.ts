import * as ts from 'typescript';
import { ASTViewPort, TypeNodeView, KindDefinitionView, MemberValueView, InstanceDeclarationView } from '../../../application/ports/ast.port';
import { SourceFile } from '../../../application/ports/typescript.port';

/**
 * Real implementation of ASTViewPort using the TypeScript compiler API.
 *
 * Extracts high-level domain views from TypeScript source files.
 * All AST mechanics (node traversal, type resolution, identifier resolution)
 * are encapsulated here — consumers see only domain-level views.
 */
export class ASTAdapter implements ASTViewPort {

  getKindDefinitions(sourceFile: SourceFile): KindDefinitionView[] {
    const tsSourceFile = this.toTsSourceFile(sourceFile);
    if (!tsSourceFile) return [];

    const results: KindDefinitionView[] = [];

    for (const stmt of tsSourceFile.statements) {
      if (!ts.isTypeAliasDeclaration(stmt)) continue;

      const type = stmt.type;
      if (!ts.isTypeReferenceNode(type) || !ts.isIdentifier(type.typeName)) continue;
      if (type.typeName.text !== 'Kind') continue;

      const typeName = stmt.name.text;

      // First type arg: kind name literal
      let kindNameLiteral = typeName;
      if (type.typeArguments && type.typeArguments.length >= 1) {
        const firstArg = type.typeArguments[0];
        if (ts.isLiteralTypeNode(firstArg) && ts.isStringLiteral(firstArg.literal)) {
          kindNameLiteral = firstArg.literal.text;
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
        constraints = this.buildTypeNodeView(type.typeArguments[2]);
      }

      results.push({ typeName, kindNameLiteral, members, constraints });
    }

    return results;
  }

  getInstanceDeclarations(sourceFile: SourceFile): InstanceDeclarationView[] {
    const tsSourceFile = this.toTsSourceFile(sourceFile);
    if (!tsSourceFile) return [];

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

    for (const stmt of tsSourceFile.statements) {
      if (!ts.isVariableStatement(stmt)) continue;
      for (const decl of stmt.declarationList.declarations) {
        if (!decl.initializer || !ts.isSatisfiesExpression(decl.initializer)) continue;

        const satisfies = decl.initializer;
        const type = satisfies.type;
        if (!ts.isTypeReferenceNode(type) || !ts.isIdentifier(type.typeName)) continue;
        if (type.typeName.text !== 'InstanceConfig') continue;

        // Extract kind type name from type argument
        let kindTypeName: string | undefined;
        if (type.typeArguments && type.typeArguments.length >= 1) {
          const arg = type.typeArguments[0];
          if (ts.isTypeReferenceNode(arg) && ts.isIdentifier(arg.typeName)) {
            kindTypeName = arg.typeName.text;
          }
        }
        if (!kindTypeName) continue;

        const variableName = ts.isIdentifier(decl.name) ? decl.name.text : undefined;
        if (!variableName) continue;

        const expression = satisfies.expression;
        if (!ts.isObjectLiteralExpression(expression)) continue;

        const members = this.extractMemberValues(expression, varMap);
        results.push({ variableName, kindTypeName, members });
      }
    }

    return results;
  }

  /**
   * Recursively extract MemberValueView[] from an object literal expression.
   * Resolves identifier references via varMap, extracts `path` as pathOverride,
   * and recurses into nested object properties as children.
   */
  private extractMemberValues(
    obj: ts.ObjectLiteralExpression,
    varMap: Map<string, ts.Expression>,
  ): MemberValueView[] {
    return this.extractMemberValuesFromProps(Array.from(obj.properties), varMap);
  }

  /**
   * Extract MemberValueView[] from an array of object literal element-like nodes.
   */
  private extractMemberValuesFromProps(
    props: ts.ObjectLiteralElementLike[],
    varMap: Map<string, ts.Expression>,
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
      } else {
        continue;
      }

      // Resolve identifier references
      if (valueExpr && ts.isIdentifier(valueExpr)) {
        const resolved = varMap.get(valueExpr.text);
        if (resolved) {
          valueExpr = resolved;
        }
      }

      const view: MemberValueView = { name };

      if (valueExpr && ts.isObjectLiteralExpression(valueExpr)) {
        // Check for path override: { path: "custom" }
        const pathProp = valueExpr.properties.find(p =>
          ts.isPropertyAssignment(p) &&
          ts.isIdentifier(p.name) &&
          p.name.text === 'path'
        );
        if (pathProp && ts.isPropertyAssignment(pathProp) && ts.isStringLiteral(pathProp.initializer)) {
          view.pathOverride = pathProp.initializer.text;
        }

        // Extract children (non-path properties)
        const childProps = valueExpr.properties.filter(p => {
          if (!ts.isPropertyAssignment(p) || !p.name) return false;
          const propName = ts.isIdentifier(p.name) ? p.name.text : '';
          return propName !== 'path';
        });

        if (childProps.length > 0) {
          const children = this.extractMemberValuesFromProps(childProps, varMap);
          if (children.length > 0) {
            view.children = children;
          }
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
  private buildTypeNodeView(typeNode: ts.TypeNode): TypeNodeView | undefined {
    // Boolean: true keyword
    if (typeNode.kind === ts.SyntaxKind.TrueKeyword ||
        (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.TrueKeyword)) {
      return { kind: 'boolean' };
    }

    // Nested type literal → object with recursion
    if (ts.isTypeLiteralNode(typeNode)) {
      const properties: Array<{ name: string; value: TypeNodeView }> = [];
      for (const member of typeNode.members) {
        if (!ts.isPropertySignature(member) || !member.name || !member.type) continue;
        const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
        const value = this.buildTypeNodeView(member.type);
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
      const values = elements
        .map(e => this.getStringLiteralFromType(e))
        .filter((s): s is string => s !== undefined);
      return { kind: 'stringList', values };
    }

    // Check if first element is a tuple (nested elements) → tuplePairs
    const innerElements = this.getTypeElements(first);
    if (innerElements.length > 0) {
      const pairs = this.extractTuplePairs(typeNode);
      if (pairs.length > 0) {
        return { kind: 'tuplePairs', values: pairs };
      }
    }

    return undefined;
  }

  /**
   * Extract tuple pairs from a type node: [["a", "b"], ["c", "d"]]
   */
  private extractTuplePairs(typeNode: ts.TypeNode): [string, string][] {
    const outerElements = this.getTypeElements(typeNode);
    const pairs: [string, string][] = [];

    for (const element of outerElements) {
      const innerElements = this.getTypeElements(element);
      if (innerElements.length === 2) {
        const first = this.getStringLiteralFromType(innerElements[0]);
        const second = this.getStringLiteralFromType(innerElements[1]);
        if (first && second) {
          pairs.push([first, second]);
        }
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
