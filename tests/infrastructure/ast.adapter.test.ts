import { ASTAdapter } from '../../src/infrastructure/ast/ast.adapter';
import { SourceFile, TypeChecker } from '../../src/application/ports/typescript.port';

const mockChecker = {} as TypeChecker;

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

  describe('getKindDefinitions', () => {
    it('extracts a simple Kind definition', () => {
      const sf = parseSource('test.ts', `type Ctx = Kind<"Ctx">;`);
      const defs = adapter.getKindDefinitions(sf, mockChecker).data;
      expect(defs).toHaveLength(1);
      expect(defs[0].typeName).toBe('Ctx');
      expect(defs[0].kindNameLiteral).toBe('Ctx');
      expect(defs[0].members).toEqual([]);
      expect(defs[0].constraints).toBeUndefined();
    });

    it('extracts Kind with members', () => {
      const sf = parseSource('test.ts', `
        type Ctx = Kind<"Ctx", {
          domain: DomainLayer;
          infra: InfraLayer;
        }>;
      `);
      const defs = adapter.getKindDefinitions(sf, mockChecker).data;
      expect(defs).toHaveLength(1);
      expect(defs[0].members).toEqual([
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);
    });

    it('extracts Kind with constraints', () => {
      const sf = parseSource('test.ts', `
        type Ctx = Kind<"Ctx", {
          domain: DomainLayer;
          infra: InfraLayer;
        }, {
          noDependency: [["domain", "infra"]];
        }>;
      `);
      const defs = adapter.getKindDefinitions(sf, mockChecker).data;
      expect(defs).toHaveLength(1);
      expect(defs[0].constraints).toBeDefined();
      expect(defs[0].constraints!.kind).toBe('object');
    });

    it('extracts multiple Kind definitions from one file', () => {
      const sf = parseSource('test.ts', `
        type DomainLayer = Kind<"DomainLayer">;
        type InfraLayer = Kind<"InfraLayer">;
        type Ctx = Kind<"Ctx", { domain: DomainLayer; infra: InfraLayer }>;
      `);
      const defs = adapter.getKindDefinitions(sf, mockChecker).data;
      expect(defs).toHaveLength(3);
      expect(defs.map(d => d.typeName)).toEqual(['DomainLayer', 'InfraLayer', 'Ctx']);
    });

    it('ignores non-Kind type aliases', () => {
      const sf = parseSource('test.ts', `
        type Foo = string;
        type Bar = Kind<"Bar">;
        interface Baz {}
      `);
      const defs = adapter.getKindDefinitions(sf, mockChecker).data;
      expect(defs).toHaveLength(1);
      expect(defs[0].typeName).toBe('Bar');
    });

    it('extracts string keyword member type', () => {
      const sf = parseSource('test.ts', `
        type Ctx = Kind<"Ctx", { name: string }>;
      `);
      const defs = adapter.getKindDefinitions(sf, mockChecker).data;
      expect(defs[0].members).toEqual([{ name: 'name', typeName: 'string' }]);
    });
  });

  describe('getInstanceDeclarations', () => {
    it('extracts a simple instance declaration', () => {
      const sf = parseSource('test.ts', `
        const app = {
          domain: {},
          infra: {},
        } satisfies Instance<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf, mockChecker).data;
      expect(decls).toHaveLength(1);
      expect(decls[0].variableName).toBe('app');
      expect(decls[0].kindTypeName).toBe('Ctx');
      expect(decls[0].members).toHaveLength(2);
      expect(decls[0].members[0].name).toBe('domain');
      expect(decls[0].members[1].name).toBe('infra');
    });

    it('resolves identifier references via variable map', () => {
      const sf = parseSource('test.ts', `
        const domain = { entities: {}, ports: {} };
        const app = {
          domain: domain,
        } satisfies Instance<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf, mockChecker).data;
      expect(decls).toHaveLength(1);
      expect(decls[0].members[0].name).toBe('domain');
      expect(decls[0].members[0].children).toHaveLength(2);
      expect(decls[0].members[0].children![0].name).toBe('entities');
      expect(decls[0].members[0].children![1].name).toBe('ports');
    });

    it('extracts nested object children', () => {
      const sf = parseSource('test.ts', `
        const app = {
          domain: {
            entities: {},
            ports: {},
          },
        } satisfies Instance<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf, mockChecker).data;
      expect(decls[0].members[0].children).toHaveLength(2);
      expect(decls[0].members[0].children![0].name).toBe('entities');
      expect(decls[0].members[0].children![1].name).toBe('ports');
    });

    it('ignores non-Instance satisfies expressions', () => {
      const sf = parseSource('test.ts', `
        const app = { domain: {} } satisfies SomeOtherType<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf, mockChecker).data;
      expect(decls).toHaveLength(0);
    });

    it('handles multiple instance declarations', () => {
      const sf = parseSource('test.ts', `
        const ordering = { domain: {} } satisfies Instance<Ctx>;
        const billing = { domain: {} } satisfies Instance<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf, mockChecker).data;
      expect(decls).toHaveLength(2);
      expect(decls[0].variableName).toBe('ordering');
      expect(decls[1].variableName).toBe('billing');
    });

    it('skips instance with no type argument and reports error', () => {
      const sf = parseSource('test.ts', `
        const app = { domain: {} } satisfies Instance;
      `);
      const result = adapter.getInstanceDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('missing a type argument');
    });
  });

  describe('boolean constraint recognition', () => {
    it('recognizes false as a boolean value', () => {
      const sf = parseSource('test.ts', `
        type Ctx = Kind<"Ctx", { domain: DomainLayer }, { pure: false }>;
      `);
      const defs = adapter.getKindDefinitions(sf, mockChecker).data;
      expect(defs).toHaveLength(1);
      expect(defs[0].constraints).toBeDefined();
      expect(defs[0].constraints!.kind).toBe('object');
      if (defs[0].constraints!.kind === 'object') {
        const pureProp = defs[0].constraints!.properties.find(p => p.name === 'pure');
        expect(pureProp).toBeDefined();
        expect(pureProp!.value.kind).toBe('boolean');
      }
    });
  });

  describe('error reporting', () => {
    describe('getKindDefinitions errors', () => {
      it('reports error for non-string-literal first type argument', () => {
        const sf = parseSource('test.ts', `type Ctx = Kind<number>;`);
        const result = adapter.getKindDefinitions(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
        expect(result.errors.some(e => e.includes('first type argument must be a string literal'))).toBe(true);
      });

      it('reports error when constraints cannot be parsed', () => {
        // Union type as constraint — not recognized by buildTypeNodeView
        const sf = parseSource('test.ts', `
          type Ctx = Kind<"Ctx", { domain: D }, string | number>;
        `);
        const result = adapter.getKindDefinitions(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.some(e => e.includes('constraints type argument could not be parsed'))).toBe(true);
      });
    });

    describe('getInstanceDeclarations errors', () => {
      it('reports error for unresolved identifier reference', () => {
        const sf = parseSource('test.ts', `
          const app = {
            domain: externalVar,
          } satisfies Instance<Ctx>;
        `);
        const result = adapter.getInstanceDeclarations(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.some(e => e.includes("variable 'externalVar' not resolved"))).toBe(true);
      });

      it('reports error for unresolved shorthand property', () => {
        const sf = parseSource('test.ts', `
          const app = {
            domain,
          } satisfies Instance<Ctx>;
        `);
        const result = adapter.getInstanceDeclarations(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.some(e => e.includes("variable 'domain' not resolved"))).toBe(true);
      });
    });

    describe('constraint parsing errors', () => {
      it('reports error for non-string element in string list', () => {
        const sf = parseSource('test.ts', `
          type Ctx = Kind<"Ctx", { domain: D }, { noCycles: ["domain", 42] }>;
        `);
        const result = adapter.getKindDefinitions(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.some(e => e.includes('non-string element in string list'))).toBe(true);
      });

      it('reports error for tuple with wrong number of elements', () => {
        const sf = parseSource('test.ts', `
          type Ctx = Kind<"Ctx", { domain: D }, { noDependency: [["a", "b", "c"]] }>;
        `);
        const result = adapter.getKindDefinitions(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.some(e => e.includes('must have exactly 2 elements, got 3'))).toBe(true);
      });

      it('reports error for non-string element in tuple pair', () => {
        const sf = parseSource('test.ts', `
          type Ctx = Kind<"Ctx", { domain: D }, { noDependency: [["a", 42]] }>;
        `);
        const result = adapter.getKindDefinitions(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.some(e => e.includes('non-string element'))).toBe(true);
      });
    });
  });
});
