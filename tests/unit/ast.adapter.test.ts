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

  describe('getKindDefinitions', () => {
    it('extracts a simple Kind definition', () => {
      const sf = parseSource('test.ts', `type Ctx = Kind<"Ctx">;`);
      const defs = adapter.getKindDefinitions(sf);
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
      const defs = adapter.getKindDefinitions(sf);
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
      const defs = adapter.getKindDefinitions(sf);
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
      const defs = adapter.getKindDefinitions(sf);
      expect(defs).toHaveLength(3);
      expect(defs.map(d => d.typeName)).toEqual(['DomainLayer', 'InfraLayer', 'Ctx']);
    });

    it('ignores non-Kind type aliases', () => {
      const sf = parseSource('test.ts', `
        type Foo = string;
        type Bar = Kind<"Bar">;
        interface Baz {}
      `);
      const defs = adapter.getKindDefinitions(sf);
      expect(defs).toHaveLength(1);
      expect(defs[0].typeName).toBe('Bar');
    });

    it('extracts string keyword member type', () => {
      const sf = parseSource('test.ts', `
        type Ctx = Kind<"Ctx", { name: string }>;
      `);
      const defs = adapter.getKindDefinitions(sf);
      expect(defs[0].members).toEqual([{ name: 'name', typeName: 'string' }]);
    });
  });

  describe('getInstanceDeclarations', () => {
    it('extracts a simple instance declaration', () => {
      const sf = parseSource('test.ts', `
        const app = {
          domain: {},
          infra: {},
        } satisfies InstanceConfig<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
      expect(decls).toHaveLength(1);
      expect(decls[0].variableName).toBe('app');
      expect(decls[0].kindTypeName).toBe('Ctx');
      expect(decls[0].members).toHaveLength(2);
      expect(decls[0].members[0].name).toBe('domain');
      expect(decls[0].members[1].name).toBe('infra');
    });

    it('extracts path override from member', () => {
      const sf = parseSource('test.ts', `
        const app = {
          valueObjects: { path: "value-objects" },
        } satisfies InstanceConfig<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
      expect(decls).toHaveLength(1);
      expect(decls[0].members[0].name).toBe('valueObjects');
      expect(decls[0].members[0].pathOverride).toBe('value-objects');
    });

    it('resolves identifier references via variable map', () => {
      const sf = parseSource('test.ts', `
        const domain = { entities: {}, ports: {} };
        const app = {
          domain: domain,
        } satisfies InstanceConfig<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
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
        } satisfies InstanceConfig<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
      expect(decls[0].members[0].children).toHaveLength(2);
      expect(decls[0].members[0].children![0].name).toBe('entities');
      expect(decls[0].members[0].children![1].name).toBe('ports');
    });

    it('ignores non-InstanceConfig satisfies expressions', () => {
      const sf = parseSource('test.ts', `
        const app = { domain: {} } satisfies SomeOtherType<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
      expect(decls).toHaveLength(0);
    });

    it('handles multiple instance declarations', () => {
      const sf = parseSource('test.ts', `
        const ordering = { domain: {} } satisfies InstanceConfig<Ctx>;
        const billing = { domain: {} } satisfies InstanceConfig<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
      expect(decls).toHaveLength(2);
      expect(decls[0].variableName).toBe('ordering');
      expect(decls[1].variableName).toBe('billing');
    });

    it('handles path override alongside children', () => {
      const sf = parseSource('test.ts', `
        const app = {
          valueObjects: {
            path: "value-objects",
            entities: {},
          },
        } satisfies InstanceConfig<Ctx>;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
      expect(decls[0].members[0].pathOverride).toBe('value-objects');
      expect(decls[0].members[0].children).toHaveLength(1);
      expect(decls[0].members[0].children![0].name).toBe('entities');
    });

    it('skips instance with no type argument', () => {
      const sf = parseSource('test.ts', `
        const app = { domain: {} } satisfies InstanceConfig;
      `);
      const decls = adapter.getInstanceDeclarations(sf);
      expect(decls).toHaveLength(0);
    });
  });
});
