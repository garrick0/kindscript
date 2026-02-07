import { ASTPort, ASTNode } from '../../../application/ports/ast.port';
import { SourceFile } from '../../../application/ports/typescript.port';

/**
 * Mock node types for testing.
 */
interface MockInterfaceNode extends ASTNode {
  __type: 'interface';
  name: string;
  heritageTypeNames: string[];
  heritageTypeArgLiterals: string[];
  properties: Array<{ name: string; typeName?: string }>;
}

interface MockVariableStatementNode extends ASTNode {
  __type: 'variableStatement';
  declarations: MockVariableDeclarationNode[];
}

interface MockVariableDeclarationNode extends ASTNode {
  __type: 'variableDeclaration';
  name: string;
  typeName?: string;
  initializer?: ASTNode;
}

interface MockObjectLiteralNode extends ASTNode {
  __type: 'objectLiteral';
  properties: Array<{ name: string; value: ASTNode }>;
}

interface MockCallExpressionNode extends ASTNode {
  __type: 'callExpression';
  functionName: string;
  typeArgNames: string[];
  args: ASTNode[];
}

interface MockStringLiteralNode extends ASTNode {
  __type: 'stringLiteral';
  value: string;
}

interface MockArrayLiteralNode extends ASTNode {
  __type: 'arrayLiteral';
  elements: ASTNode[];
}

interface MockIdentifierNode extends ASTNode {
  __type: 'identifier';
  name: string;
}

type MockNode =
  | MockInterfaceNode
  | MockVariableStatementNode
  | MockVariableDeclarationNode
  | MockObjectLiteralNode
  | MockCallExpressionNode
  | MockStringLiteralNode
  | MockArrayLiteralNode
  | MockIdentifierNode;

/**
 * Mock implementation of ASTPort for testing ClassifyASTService.
 *
 * Provides a fluent API for building mock AST structures:
 * ```typescript
 * mockAST
 *   .withInterface('OrderingContext', 'Kind', 'OrderingContext', [
 *     { name: 'domain', typeName: 'DomainLayer' },
 *   ])
 *   .withVariable('ordering', 'OrderingContext', { ... });
 * ```
 */
export class MockASTAdapter implements ASTPort {
  private statements = new Map<string, ASTNode[]>();

  // --- Fluent configuration API ---

  /**
   * Add an interface declaration to a source file.
   */
  withInterface(
    fileName: string,
    name: string,
    extendsType: string,
    kindNameLiteral: string,
    properties: Array<{ name: string; typeName?: string }>
  ): this {
    const node: MockInterfaceNode = {
      __type: 'interface',
      name,
      heritageTypeNames: [extendsType],
      heritageTypeArgLiterals: [kindNameLiteral],
      properties,
    };
    this.addStatement(fileName, node);
    return this;
  }

  /**
   * Add a variable statement with one declaration to a source file.
   */
  withVariable(
    fileName: string,
    varName: string,
    typeName: string,
    initializer: ASTNode
  ): this {
    const decl: MockVariableDeclarationNode = {
      __type: 'variableDeclaration',
      name: varName,
      typeName,
      initializer,
    };
    const stmt: MockVariableStatementNode = {
      __type: 'variableStatement',
      declarations: [decl],
    };
    this.addStatement(fileName, stmt);
    return this;
  }

  /**
   * Add a defineContracts call expression to a source file.
   */
  withDefineContractsCall(
    fileName: string,
    kindName: string,
    configObject: ASTNode
  ): this {
    const call: MockCallExpressionNode = {
      __type: 'callExpression',
      functionName: 'defineContracts',
      typeArgNames: [kindName],
      args: [configObject],
    };
    // Wrap in a variable statement since that's how it appears in real code
    const decl: MockVariableDeclarationNode = {
      __type: 'variableDeclaration',
      name: 'contracts',
      initializer: call,
    };
    const stmt: MockVariableStatementNode = {
      __type: 'variableStatement',
      declarations: [decl],
    };
    this.addStatement(fileName, stmt);
    return this;
  }

  /**
   * Add a locate<T>(root, members) call expression to a source file.
   */
  withLocateCall(
    fileName: string,
    varName: string,
    kindName: string,
    rootLocation: string,
    membersObject: ASTNode
  ): this {
    const call: MockCallExpressionNode = {
      __type: 'callExpression',
      functionName: 'locate',
      typeArgNames: [kindName],
      args: [MockASTAdapter.stringLiteral(rootLocation), membersObject],
    };
    const decl: MockVariableDeclarationNode = {
      __type: 'variableDeclaration',
      name: varName,
      initializer: call,
    };
    const stmt: MockVariableStatementNode = {
      __type: 'variableStatement',
      declarations: [decl],
    };
    this.addStatement(fileName, stmt);
    return this;
  }

  /** Create a mock object literal node */
  static objectLiteral(props: Array<{ name: string; value: ASTNode }>): MockObjectLiteralNode {
    return { __type: 'objectLiteral', properties: props };
  }

  /** Create a mock string literal node */
  static stringLiteral(value: string): MockStringLiteralNode {
    return { __type: 'stringLiteral', value };
  }

  /** Create a mock array literal node */
  static arrayLiteral(elements: ASTNode[]): MockArrayLiteralNode {
    return { __type: 'arrayLiteral', elements };
  }

  /** Create a mock identifier node */
  static identifier(name: string): MockIdentifierNode {
    return { __type: 'identifier', name };
  }

  /**
   * Add a raw statement node to a source file (for edge-case testing).
   */
  withStatement(fileName: string, node: ASTNode): this {
    this.addStatement(fileName, node);
    return this;
  }

  reset(): void {
    this.statements.clear();
  }

  // --- ASTPort implementation ---

  getStatements(sourceFile: SourceFile): ASTNode[] {
    return this.statements.get(sourceFile.fileName) ?? [];
  }

  isInterfaceDeclaration(node: ASTNode): boolean {
    return (node as MockNode).__type === 'interface';
  }

  isVariableStatement(node: ASTNode): boolean {
    return (node as MockNode).__type === 'variableStatement';
  }

  getDeclarationName(node: ASTNode): string | undefined {
    const mock = node as MockNode;
    if (mock.__type === 'interface') return mock.name;
    if (mock.__type === 'variableDeclaration') return mock.name;
    if (mock.__type === 'variableStatement') return mock.declarations[0]?.name;
    return undefined;
  }

  getHeritageTypeNames(node: ASTNode): string[] {
    const mock = node as MockNode;
    if (mock.__type === 'interface') return mock.heritageTypeNames;
    return [];
  }

  getHeritageTypeArgLiterals(node: ASTNode): string[] {
    const mock = node as MockNode;
    if (mock.__type === 'interface') return mock.heritageTypeArgLiterals;
    return [];
  }

  getPropertySignatures(node: ASTNode): Array<{ name: string; typeName?: string }> {
    const mock = node as MockNode;
    if (mock.__type === 'interface') return mock.properties;
    return [];
  }

  getVariableDeclarations(node: ASTNode): ASTNode[] {
    const mock = node as MockNode;
    if (mock.__type === 'variableStatement') return mock.declarations;
    return [];
  }

  getVariableTypeName(node: ASTNode): string | undefined {
    const mock = node as MockNode;
    if (mock.__type === 'variableDeclaration') return mock.typeName;
    return undefined;
  }

  getInitializer(node: ASTNode): ASTNode | undefined {
    const mock = node as MockNode;
    if (mock.__type === 'variableDeclaration') return mock.initializer;
    return undefined;
  }

  isObjectLiteral(node: ASTNode): boolean {
    return (node as MockNode).__type === 'objectLiteral';
  }

  getObjectProperties(node: ASTNode): Array<{ name: string; value: ASTNode }> {
    const mock = node as MockNode;
    if (mock.__type === 'objectLiteral') return mock.properties;
    return [];
  }

  getStringValue(node: ASTNode): string | undefined {
    const mock = node as MockNode;
    if (mock.__type === 'stringLiteral') return mock.value;
    return undefined;
  }

  isIdentifier(node: ASTNode): boolean {
    return (node as MockNode).__type === 'identifier';
  }

  getIdentifierName(node: ASTNode): string | undefined {
    const mock = node as MockNode;
    if (mock.__type === 'identifier') return mock.name;
    return undefined;
  }

  isCallExpression(node: ASTNode): boolean {
    return (node as MockNode).__type === 'callExpression';
  }

  getCallExpressionName(node: ASTNode): string | undefined {
    const mock = node as MockNode;
    if (mock.__type === 'callExpression') return mock.functionName;
    return undefined;
  }

  getCallTypeArgumentNames(node: ASTNode): string[] {
    const mock = node as MockNode;
    if (mock.__type === 'callExpression') return mock.typeArgNames;
    return [];
  }

  getCallArguments(node: ASTNode): ASTNode[] {
    const mock = node as MockNode;
    if (mock.__type === 'callExpression') return mock.args;
    return [];
  }

  isArrayLiteral(node: ASTNode): boolean {
    return (node as MockNode).__type === 'arrayLiteral';
  }

  getArrayElements(node: ASTNode): ASTNode[] {
    const mock = node as MockNode;
    if (mock.__type === 'arrayLiteral') return mock.elements;
    return [];
  }

  // --- Private helpers ---

  private addStatement(fileName: string, node: ASTNode): void {
    const existing = this.statements.get(fileName) ?? [];
    existing.push(node);
    this.statements.set(fileName, existing);
  }
}
