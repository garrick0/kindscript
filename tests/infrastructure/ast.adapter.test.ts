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
        } satisfies Instance<Ctx, '.'>;
      `);
      const decls = adapter.getInstanceDeclarations(sf, mockChecker).data;
      expect(decls).toHaveLength(1);
      expect(decls[0].variableName).toBe('app');
      expect(decls[0].kindTypeName).toBe('Ctx');
      expect(decls[0].declaredPath).toBe('.');
      expect(decls[0].members).toHaveLength(2);
      expect(decls[0].members[0].name).toBe('domain');
      expect(decls[0].members[1].name).toBe('infra');
    });

    it('resolves identifier references via variable map', () => {
      const sf = parseSource('test.ts', `
        const domain = { entities: {}, ports: {} };
        const app = {
          domain: domain,
        } satisfies Instance<Ctx, '.'>;
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
        } satisfies Instance<Ctx, '.'>;
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
        const ordering = { domain: {} } satisfies Instance<Ctx, './ordering'>;
        const billing = { domain: {} } satisfies Instance<Ctx, './billing'>;
      `);
      const decls = adapter.getInstanceDeclarations(sf, mockChecker).data;
      expect(decls).toHaveLength(2);
      expect(decls[0].variableName).toBe('ordering');
      expect(decls[0].declaredPath).toBe('./ordering');
      expect(decls[1].variableName).toBe('billing');
      expect(decls[1].declaredPath).toBe('./billing');
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

    it('skips instance with no location path and reports error', () => {
      const sf = parseSource('test.ts', `
        const app = { domain: {} } satisfies Instance<Ctx>;
      `);
      const result = adapter.getInstanceDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('missing a location path');
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
          } satisfies Instance<Ctx, '.'>;
        `);
        const result = adapter.getInstanceDeclarations(sf, mockChecker);
        expect(result.data).toHaveLength(1);
        expect(result.errors.some(e => e.includes("variable 'externalVar' not resolved"))).toBe(true);
      });

      it('reports error for unresolved shorthand property', () => {
        const sf = parseSource('test.ts', `
          const app = {
            domain,
          } satisfies Instance<Ctx, '.'>;
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

  describe('getTopLevelDeclarations', () => {
    it('extracts function declarations', () => {
      const sf = parseSource('test.ts', `
        function decide(cmd: Command) { return []; }
        export function evolve(state: State, event: Event) { return state; }
      `);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ name: 'decide', kind: 'function', exported: false });
      expect(result.data[1]).toMatchObject({ name: 'evolve', kind: 'function', exported: true });
    });

    it('extracts const and let declarations', () => {
      const sf = parseSource('test.ts', `
        export const handler = () => {};
        let counter = 0;
      `);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ name: 'handler', kind: 'const', exported: true });
      expect(result.data[1]).toMatchObject({ name: 'counter', kind: 'let', exported: false });
    });

    it('extracts class declarations', () => {
      const sf = parseSource('test.ts', `
        export class OrderService {}
      `);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ name: 'OrderService', kind: 'class', exported: true });
    });

    it('extracts interface and type declarations', () => {
      const sf = parseSource('test.ts', `
        interface Command {}
        export type Event = { type: string };
      `);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ name: 'Command', kind: 'interface', exported: false });
      expect(result.data[1]).toMatchObject({ name: 'Event', kind: 'type', exported: true });
    });

    it('extracts enum declarations', () => {
      const sf = parseSource('test.ts', `
        export enum Status { Active, Inactive }
      `);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ name: 'Status', kind: 'enum', exported: true });
    });

    it('extracts multiple declarations from a single variable statement', () => {
      const sf = parseSource('test.ts', `
        const a = 1, b = 2;
      `);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('a');
      expect(result.data[1].name).toBe('b');
    });

    it('includes line and column information', () => {
      const sf = parseSource('test.ts', `export const x = 1;`);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].line).toBeGreaterThan(0);
      expect(typeof result.data[0].column).toBe('number');
    });

    it('returns empty for file with no declarations', () => {
      const sf = parseSource('test.ts', `// just a comment`);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(0);
    });

    it('handles mixed declaration types', () => {
      const sf = parseSource('test.ts', `
        export const decide: Decider = (cmd) => [];
        function parseCommand(raw: unknown) { return raw; }
        function deepClone<T>(obj: T): T { return obj; }
        export const evolve: Evolver = (s, e) => s;
      `);
      const result = adapter.getTopLevelDeclarations(sf, mockChecker);
      expect(result.data).toHaveLength(4);
      expect(result.data.map(d => d.name)).toEqual(['decide', 'parseCommand', 'deepClone', 'evolve']);
      expect(result.data[0].exported).toBe(true);
      expect(result.data[1].exported).toBe(false);
      expect(result.data[2].exported).toBe(false);
      expect(result.data[3].exported).toBe(true);
    });
  });

  describe('getTaggedExports', () => {
    it('extracts a single InstanceOf<K> tagged export', () => {
      const sf = parseSource('test.ts', `
        export const decider: InstanceOf<Decider> = { decide: () => [] };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        exportName: 'decider',
        kindTypeName: 'Decider'
      });
      expect(result.errors).toHaveLength(0);
    });

    it('extracts multiple tagged exports from one file', () => {
      const sf = parseSource('test.ts', `
        export const decider: InstanceOf<Decider> = { decide: () => [] };
        export const evolver: InstanceOf<Evolver> = { evolve: (s) => s };
        export const projector: InstanceOf<Projector> = { project: () => ({}) };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({ exportName: 'decider', kindTypeName: 'Decider' });
      expect(result.data[1]).toEqual({ exportName: 'evolver', kindTypeName: 'Evolver' });
      expect(result.data[2]).toEqual({ exportName: 'projector', kindTypeName: 'Projector' });
      expect(result.errors).toHaveLength(0);
    });

    it('ignores non-InstanceOf typed exports', () => {
      const sf = parseSource('test.ts', `
        export const handler: RequestHandler = () => {};
        export const config: Config = {};
        export const decider: InstanceOf<Decider> = { decide: () => [] };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ exportName: 'decider', kindTypeName: 'Decider' });
      expect(result.errors).toHaveLength(0);
    });

    it('ignores non-exported declarations', () => {
      const sf = parseSource('test.ts', `
        const internalDecider: InstanceOf<Decider> = { decide: () => [] };
        export const publicDecider: InstanceOf<Decider> = { decide: () => [] };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ exportName: 'publicDecider', kindTypeName: 'Decider' });
      expect(result.errors).toHaveLength(0);
    });

    it('reports error for InstanceOf with missing type argument', () => {
      const sf = parseSource('test.ts', `
        export const decider: InstanceOf = { decide: () => [] };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('missing type argument');
      expect(result.errors[0]).toContain('decider');
    });

    it('reports error for InstanceOf with non-reference type argument', () => {
      const sf = parseSource('test.ts', `
        export const decider: InstanceOf<string> = "not an object";
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('type argument must be a type reference');
      expect(result.errors[0]).toContain('decider');
    });

    it('returns empty arrays for file with no exports', () => {
      const sf = parseSource('test.ts', `
        const internalDecider: InstanceOf<Decider> = { decide: () => [] };
        function helper() { return true; }
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('handles mixed export types in same file', () => {
      const sf = parseSource('test.ts', `
        export const decider: InstanceOf<Decider> = { decide: () => [] };
        export const config = { port: 3000 };
        export function process() {}
        export const evolver: InstanceOf<Evolver> = { evolve: (s) => s };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ exportName: 'decider', kindTypeName: 'Decider' });
      expect(result.data[1]).toEqual({ exportName: 'evolver', kindTypeName: 'Evolver' });
      expect(result.errors).toHaveLength(0);
    });

    it('handles multiple variable declarations in same export statement', () => {
      const sf = parseSource('test.ts', `
        export const decider: InstanceOf<Decider> = { decide: () => [] }, evolver: InstanceOf<Evolver> = { evolve: (s) => s };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({ exportName: 'decider', kindTypeName: 'Decider' });
      expect(result.data[1]).toEqual({ exportName: 'evolver', kindTypeName: 'Evolver' });
      expect(result.errors).toHaveLength(0);
    });

    it('accumulates multiple errors', () => {
      const sf = parseSource('test.ts', `
        export const decider: InstanceOf = { decide: () => [] };
        export const evolver: InstanceOf<string> = "not valid";
        export const valid: InstanceOf<Decider> = { decide: () => [] };
      `);
      const result = adapter.getTaggedExports(sf, mockChecker);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ exportName: 'valid', kindTypeName: 'Decider' });
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('missing type argument');
      expect(result.errors[1]).toContain('type argument must be a type reference');
    });
  });
});
