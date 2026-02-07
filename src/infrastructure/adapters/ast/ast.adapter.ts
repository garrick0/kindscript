import * as ts from 'typescript';
import { ASTPort, ASTNode } from '../../../application/ports/ast.port';
import { SourceFile } from '../../../application/ports/typescript.port';

/**
 * Real implementation of ASTPort using the TypeScript compiler API.
 *
 * Each method is a thin wrapper over ts.is*() checks and property access.
 * The adapter casts between ASTNode (domain-safe opaque type) and ts.Node.
 */
export class ASTAdapter implements ASTPort {
  getStatements(sourceFile: SourceFile): ASTNode[] {
    const tsSourceFile = this.toTsSourceFile(sourceFile);
    if (!tsSourceFile) return [];
    return Array.from(tsSourceFile.statements) as unknown as ASTNode[];
  }

  isInterfaceDeclaration(node: ASTNode): boolean {
    return ts.isInterfaceDeclaration(this.toTsNode(node));
  }

  isVariableStatement(node: ASTNode): boolean {
    return ts.isVariableStatement(this.toTsNode(node));
  }

  getDeclarationName(node: ASTNode): string | undefined {
    const tsNode = this.toTsNode(node);

    if (ts.isInterfaceDeclaration(tsNode)) {
      return tsNode.name.text;
    }
    if (ts.isVariableDeclaration(tsNode)) {
      return ts.isIdentifier(tsNode.name) ? tsNode.name.text : undefined;
    }
    if (ts.isVariableStatement(tsNode)) {
      const decl = tsNode.declarationList.declarations[0];
      if (decl && ts.isIdentifier(decl.name)) {
        return decl.name.text;
      }
    }
    return undefined;
  }

  getHeritageTypeNames(node: ASTNode): string[] {
    const tsNode = this.toTsNode(node);
    if (!ts.isInterfaceDeclaration(tsNode)) return [];
    if (!tsNode.heritageClauses) return [];

    const names: string[] = [];
    for (const clause of tsNode.heritageClauses) {
      for (const typeExpr of clause.types) {
        const expr = typeExpr.expression;
        if (ts.isIdentifier(expr)) {
          names.push(expr.text);
        }
      }
    }
    return names;
  }

  getHeritageTypeArgLiterals(node: ASTNode): string[] {
    const tsNode = this.toTsNode(node);
    if (!ts.isInterfaceDeclaration(tsNode)) return [];
    if (!tsNode.heritageClauses) return [];

    const literals: string[] = [];
    for (const clause of tsNode.heritageClauses) {
      for (const typeExpr of clause.types) {
        if (typeExpr.typeArguments) {
          for (const arg of typeExpr.typeArguments) {
            if (ts.isLiteralTypeNode(arg) && ts.isStringLiteral(arg.literal)) {
              literals.push(arg.literal.text);
            }
          }
        }
      }
    }
    return literals;
  }

  getPropertySignatures(node: ASTNode): Array<{ name: string; typeName?: string }> {
    const tsNode = this.toTsNode(node);
    if (!ts.isInterfaceDeclaration(tsNode)) return [];

    const props: Array<{ name: string; typeName?: string }> = [];
    for (const member of tsNode.members) {
      if (ts.isPropertySignature(member) && member.name) {
        const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
        let typeName: string | undefined;

        if (member.type) {
          if (ts.isTypeReferenceNode(member.type) && ts.isIdentifier(member.type.typeName)) {
            typeName = member.type.typeName.text;
          } else if (member.type.kind === ts.SyntaxKind.StringKeyword) {
            typeName = 'string';
          }
        }

        props.push({ name, typeName });
      }
    }
    return props;
  }

  getVariableDeclarations(node: ASTNode): ASTNode[] {
    const tsNode = this.toTsNode(node);
    if (!ts.isVariableStatement(tsNode)) return [];
    return Array.from(tsNode.declarationList.declarations) as unknown as ASTNode[];
  }

  getVariableTypeName(node: ASTNode): string | undefined {
    const tsNode = this.toTsNode(node);
    if (!ts.isVariableDeclaration(tsNode)) return undefined;

    if (tsNode.type && ts.isTypeReferenceNode(tsNode.type) && ts.isIdentifier(tsNode.type.typeName)) {
      return tsNode.type.typeName.text;
    }
    return undefined;
  }

  getInitializer(node: ASTNode): ASTNode | undefined {
    const tsNode = this.toTsNode(node);
    if (ts.isVariableDeclaration(tsNode) && tsNode.initializer) {
      return tsNode.initializer as unknown as ASTNode;
    }
    return undefined;
  }

  isObjectLiteral(node: ASTNode): boolean {
    return ts.isObjectLiteralExpression(this.toTsNode(node));
  }

  getObjectProperties(node: ASTNode): Array<{ name: string; value: ASTNode }> {
    const tsNode = this.toTsNode(node);
    if (!ts.isObjectLiteralExpression(tsNode)) return [];

    const props: Array<{ name: string; value: ASTNode }> = [];
    for (const prop of tsNode.properties) {
      if (ts.isPropertyAssignment(prop) && prop.name) {
        const name = ts.isIdentifier(prop.name)
          ? prop.name.text
          : ts.isStringLiteral(prop.name)
            ? prop.name.text
            : prop.name.getText();
        props.push({ name, value: prop.initializer as unknown as ASTNode });
      }
    }
    return props;
  }

  getStringValue(node: ASTNode): string | undefined {
    const tsNode = this.toTsNode(node);
    if (ts.isStringLiteral(tsNode)) {
      return tsNode.text;
    }
    return undefined;
  }

  isCallExpression(node: ASTNode): boolean {
    return ts.isCallExpression(this.toTsNode(node));
  }

  getCallExpressionName(node: ASTNode): string | undefined {
    const tsNode = this.toTsNode(node);
    if (!ts.isCallExpression(tsNode)) return undefined;

    if (ts.isIdentifier(tsNode.expression)) {
      return tsNode.expression.text;
    }
    return undefined;
  }

  getCallTypeArgumentNames(node: ASTNode): string[] {
    const tsNode = this.toTsNode(node);
    if (!ts.isCallExpression(tsNode)) return [];
    if (!tsNode.typeArguments) return [];

    const names: string[] = [];
    for (const arg of tsNode.typeArguments) {
      if (ts.isTypeReferenceNode(arg) && ts.isIdentifier(arg.typeName)) {
        names.push(arg.typeName.text);
      }
    }
    return names;
  }

  getCallArguments(node: ASTNode): ASTNode[] {
    const tsNode = this.toTsNode(node);
    if (!ts.isCallExpression(tsNode)) return [];
    return Array.from(tsNode.arguments) as unknown as ASTNode[];
  }

  isArrayLiteral(node: ASTNode): boolean {
    return ts.isArrayLiteralExpression(this.toTsNode(node));
  }

  getArrayElements(node: ASTNode): ASTNode[] {
    const tsNode = this.toTsNode(node);
    if (!ts.isArrayLiteralExpression(tsNode)) return [];
    return Array.from(tsNode.elements) as unknown as ASTNode[];
  }

  forEachStatement(sourceFile: SourceFile, callback: (node: ASTNode) => void): void {
    const tsSourceFile = this.toTsSourceFile(sourceFile);
    if (!tsSourceFile) return;

    for (const stmt of tsSourceFile.statements) {
      // Handle export declarations that wrap statements
      if (ts.isExportDeclaration(stmt)) {
        continue; // skip re-exports
      }
      callback(stmt as unknown as ASTNode);
    }
  }

  private toTsNode(node: ASTNode): ts.Node {
    return node as unknown as ts.Node;
  }

  private toTsSourceFile(sourceFile: SourceFile): ts.SourceFile | undefined {
    // The sourceFile's text can be parsed into a ts.SourceFile
    // In practice, the real TS adapter passes ts.SourceFile objects
    // wrapped as SourceFile, so we can cast back
    return (sourceFile as unknown as { __tsSourceFile?: ts.SourceFile }).__tsSourceFile
      ?? ts.createSourceFile(sourceFile.fileName, sourceFile.text, ts.ScriptTarget.Latest, true);
  }
}
