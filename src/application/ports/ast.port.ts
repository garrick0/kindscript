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
 * Port defining AST walking operations needed by the classifier.
 *
 * This interface keeps AST-specific TypeScript compiler operations
 * in a dedicated port, separate from TypeScriptPort (which handles
 * program/import concerns).
 *
 * Each method maps to a specific TypeScript AST operation. The classifier
 * composes them to implement the three responsibilities from V4 Part 4.1:
 * 1. Find Kind definitions (interfaces extending Kind<N>)
 * 2. Find instance declarations (variables typed as Kind types)
 * 3. Find contract descriptors (defineContracts<T>(...) calls)
 */
export interface ASTPort {
  /** Get all top-level statements in a source file */
  getStatements(sourceFile: SourceFile): ASTNode[];

  /** Check if a node is an interface declaration */
  isInterfaceDeclaration(node: ASTNode): boolean;

  /** Check if a node is a variable statement */
  isVariableStatement(node: ASTNode): boolean;

  /** Get the name of a declaration node (interface or variable) */
  getDeclarationName(node: ASTNode): string | undefined;

  /**
   * Get heritage type names from an interface's extends clause.
   * e.g., `interface Foo extends Kind<"Foo">` → ["Kind"]
   */
  getHeritageTypeNames(node: ASTNode): string[];

  /**
   * Get type arguments from the first heritage clause.
   * e.g., `interface Foo extends Kind<"Foo">` → ["Foo"]
   * Returns the string literal values of the type arguments.
   */
  getHeritageTypeArgLiterals(node: ASTNode): string[];

  /**
   * Get property signatures from an interface declaration.
   * Returns name and optional type name for each property.
   */
  getPropertySignatures(node: ASTNode): Array<{ name: string; typeName?: string }>;

  /** Get variable declarations from a variable statement */
  getVariableDeclarations(node: ASTNode): ASTNode[];

  /**
   * Get the type annotation name of a variable declaration.
   * e.g., `const x: OrderingContext = ...` → "OrderingContext"
   */
  getVariableTypeName(node: ASTNode): string | undefined;

  /** Get the initializer expression of a variable declaration */
  getInitializer(node: ASTNode): ASTNode | undefined;

  /** Check if a node is an object literal expression */
  isObjectLiteral(node: ASTNode): boolean;

  /**
   * Get properties from an object literal expression.
   * Returns the name and value node for each property assignment.
   */
  getObjectProperties(node: ASTNode): Array<{ name: string; value: ASTNode }>;

  /** Get the string value of a string literal node, or undefined if not a string literal */
  getStringValue(node: ASTNode): string | undefined;

  /** Check if a node is a call expression */
  isCallExpression(node: ASTNode): boolean;

  /**
   * Get the function name from a call expression.
   * e.g., `defineContracts(...)` → "defineContracts"
   */
  getCallExpressionName(node: ASTNode): string | undefined;

  /**
   * Get type argument string literals from a call expression.
   * e.g., `defineContracts<OrderingContext>(...)` → ["OrderingContext"]
   * Uses the source text of the type arguments.
   */
  getCallTypeArgumentNames(node: ASTNode): string[];

  /** Get the argument nodes from a call expression */
  getCallArguments(node: ASTNode): ASTNode[];

  /** Check if a node is an array literal expression */
  isArrayLiteral(node: ASTNode): boolean;

  /** Get element nodes from an array literal */
  getArrayElements(node: ASTNode): ASTNode[];

  /**
   * Walk all statements in a source file, including nested
   * export declarations and variable statement lists.
   */
  forEachStatement(sourceFile: SourceFile, callback: (node: ASTNode) => void): void;
}
