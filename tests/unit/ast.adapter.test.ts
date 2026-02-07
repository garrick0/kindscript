import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { SourceFile } from '../../src/application/ports/typescript.port';

/**
 * Helper: parse TypeScript source into a SourceFile compatible with ASTAdapter.
 * The ASTAdapter.toTsSourceFile falls back to ts.createSourceFile if
 * no __tsSourceFile is attached, so we just pass text.
 */
function parseSource(fileName: string, source: string): SourceFile {
  return { fileName, text: source };
}

describe('ASTAdapter', () => {
  let adapter: ASTAdapter;

  beforeEach(() => {
    adapter = new ASTAdapter();
  });

  describe('interface declarations', () => {
    it('identifies interface declarations', () => {
      const sf = parseSource('test.ts', `
        interface Foo {}
        const x = 1;
      `);

      const stmts = adapter.getStatements(sf);
      expect(stmts.length).toBeGreaterThanOrEqual(2);
      expect(adapter.isInterfaceDeclaration(stmts[0])).toBe(true);
      expect(adapter.isInterfaceDeclaration(stmts[1])).toBe(false);
    });

    it('extracts declaration name', () => {
      const sf = parseSource('test.ts', `interface MyInterface {}`);
      const stmts = adapter.getStatements(sf);
      expect(adapter.getDeclarationName(stmts[0])).toBe('MyInterface');
    });

    it('extracts heritage type names', () => {
      const sf = parseSource('test.ts', `
        interface OrderingContext extends Kind<"OrderingContext"> {}
      `);
      const stmts = adapter.getStatements(sf);
      const names = adapter.getHeritageTypeNames(stmts[0]);
      expect(names).toContain('Kind');
    });

    it('extracts heritage type argument string literals', () => {
      const sf = parseSource('test.ts', `
        interface OrderingContext extends Kind<"OrderingContext"> {}
      `);
      const stmts = adapter.getStatements(sf);
      const literals = adapter.getHeritageTypeArgLiterals(stmts[0]);
      expect(literals).toContain('OrderingContext');
    });

    it('extracts property signatures', () => {
      const sf = parseSource('test.ts', `
        interface Ctx {
          domain: DomainLayer;
          name: string;
        }
      `);
      const stmts = adapter.getStatements(sf);
      const props = adapter.getPropertySignatures(stmts[0]);
      expect(props).toHaveLength(2);
      expect(props[0]).toEqual({ name: 'domain', typeName: 'DomainLayer' });
      expect(props[1]).toEqual({ name: 'name', typeName: 'string' });
    });

    it('returns empty for non-interface node', () => {
      const sf = parseSource('test.ts', `const x = 1;`);
      const stmts = adapter.getStatements(sf);
      expect(adapter.getHeritageTypeNames(stmts[0])).toEqual([]);
      expect(adapter.getPropertySignatures(stmts[0])).toEqual([]);
    });
  });

  describe('variable statements', () => {
    it('identifies variable statements', () => {
      const sf = parseSource('test.ts', `
        const x: MyType = {};
        interface Foo {}
      `);
      const stmts = adapter.getStatements(sf);
      expect(adapter.isVariableStatement(stmts[0])).toBe(true);
      expect(adapter.isVariableStatement(stmts[1])).toBe(false);
    });

    it('extracts variable declarations', () => {
      const sf = parseSource('test.ts', `const x = 1;`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      expect(decls).toHaveLength(1);
    });

    it('extracts variable type name', () => {
      const sf = parseSource('test.ts', `const ordering: OrderingContext = {} as any;`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      expect(adapter.getVariableTypeName(decls[0])).toBe('OrderingContext');
    });

    it('returns undefined for untyped variable', () => {
      const sf = parseSource('test.ts', `const x = {};`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      expect(adapter.getVariableTypeName(decls[0])).toBeUndefined();
    });
  });

  describe('object literals', () => {
    it('identifies object literal initializers', () => {
      const sf = parseSource('test.ts', `const x = { a: 1 };`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0]);
      expect(init).toBeDefined();
      expect(adapter.isObjectLiteral(init!)).toBe(true);
    });

    it('extracts object properties', () => {
      const sf = parseSource('test.ts', `const x = { kind: "Ctx", location: "src/ordering" };`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      const props = adapter.getObjectProperties(init);
      expect(props).toHaveLength(2);
      expect(props[0].name).toBe('kind');
      expect(props[1].name).toBe('location');
    });

    it('extracts string values from string literals', () => {
      const sf = parseSource('test.ts', `const x = { location: "src/domain" };`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      const props = adapter.getObjectProperties(init);
      expect(adapter.getStringValue(props[0].value)).toBe('src/domain');
    });
  });

  describe('call expressions', () => {
    it('identifies call expressions', () => {
      const sf = parseSource('test.ts', `const x = defineContracts({});`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      expect(adapter.isCallExpression(init)).toBe(true);
    });

    it('extracts call expression name', () => {
      const sf = parseSource('test.ts', `const x = defineContracts({});`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      expect(adapter.getCallExpressionName(init)).toBe('defineContracts');
    });

    it('extracts call type argument names', () => {
      const sf = parseSource('test.ts', `const x = defineContracts<OrderingContext>({});`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      const typeArgs = adapter.getCallTypeArgumentNames(init);
      expect(typeArgs).toEqual(['OrderingContext']);
    });

    it('extracts call arguments', () => {
      const sf = parseSource('test.ts', `const x = foo({}, []);`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      const args = adapter.getCallArguments(init);
      expect(args).toHaveLength(2);
    });
  });

  describe('array literals', () => {
    it('identifies array literals', () => {
      const sf = parseSource('test.ts', `const x = [1, 2, 3];`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      expect(adapter.isArrayLiteral(init)).toBe(true);
    });

    it('extracts array elements', () => {
      const sf = parseSource('test.ts', `const x = ["a", "b"];`);
      const stmts = adapter.getStatements(sf);
      const decls = adapter.getVariableDeclarations(stmts[0]);
      const init = adapter.getInitializer(decls[0])!;
      const elements = adapter.getArrayElements(init);
      expect(elements).toHaveLength(2);
      expect(adapter.getStringValue(elements[0])).toBe('a');
      expect(adapter.getStringValue(elements[1])).toBe('b');
    });
  });

});
