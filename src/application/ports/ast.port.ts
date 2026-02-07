import { SourceFile } from './typescript.port';

/**
 * Opaque wrapper for a TypeScript AST node.
 *
 * The application layer sees nodes as opaque objects. The infrastructure
 * layer casts them to/from real ts.Node instances.
 */
export interface ASTNode {
  /** Opaque node kind identifier */
  readonly __brand?: 'ASTNode';
}

/**
 * Node type checking and property access.
 */
export interface ASTNodePort {
  isInterfaceDeclaration(node: ASTNode): boolean;
  isVariableStatement(node: ASTNode): boolean;
  isObjectLiteral(node: ASTNode): boolean;
  isCallExpression(node: ASTNode): boolean;
  isArrayLiteral(node: ASTNode): boolean;
  getDeclarationName(node: ASTNode): string | undefined;
  getStringValue(node: ASTNode): string | undefined;
  getInitializer(node: ASTNode): ASTNode | undefined;
}

/**
 * Interface and variable declaration queries.
 */
export interface ASTDeclarationPort {
  getHeritageTypeNames(node: ASTNode): string[];
  getHeritageTypeArgLiterals(node: ASTNode): string[];
  getPropertySignatures(node: ASTNode): Array<{ name: string; typeName?: string }>;
  getVariableDeclarations(node: ASTNode): ASTNode[];
  getVariableTypeName(node: ASTNode): string | undefined;
}

/**
 * Call expression and collection queries.
 */
export interface ASTExpressionPort {
  getCallExpressionName(node: ASTNode): string | undefined;
  getCallTypeArgumentNames(node: ASTNode): string[];
  getCallArguments(node: ASTNode): ASTNode[];
  getObjectProperties(node: ASTNode): Array<{ name: string; value: ASTNode }>;
  getArrayElements(node: ASTNode): ASTNode[];
}

/**
 * Statement-level traversal.
 */
export interface ASTTraversalPort {
  getStatements(sourceFile: SourceFile): ASTNode[];
  forEachStatement(sourceFile: SourceFile, callback: (node: ASTNode) => void): void;
}

/**
 * Full AST port — composition of all sub-ports.
 *
 * Consumers should depend on the specific sub-port they need.
 * This composite type is kept for backward compatibility.
 */
export type ASTPort = ASTNodePort & ASTDeclarationPort & ASTExpressionPort & ASTTraversalPort;
