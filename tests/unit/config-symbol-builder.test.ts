import { ConfigSymbolBuilder } from '../../src/application/services/config-symbol-builder';
import { ContractType } from '../../src/domain/types/contract-type';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { KindScriptConfig } from '../../src/application/ports/config.port';

describe('ConfigSymbolBuilder', () => {
  let builder: ConfigSymbolBuilder;

  beforeEach(() => {
    builder = new ConfigSymbolBuilder();
  });

  it('builds nothing from empty config', () => {
    const result = builder.build({});
    expect(result.symbols).toHaveLength(0);
    expect(result.contracts).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('builds nothing when contracts key is present but empty', () => {
    const config: KindScriptConfig = { contracts: {} };
    const result = builder.build(config);
    expect(result.symbols).toHaveLength(0);
    expect(result.contracts).toHaveLength(0);
  });

  it('builds noDependency contract from array format', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
      },
    };

    const result = builder.build(config);

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].type).toBe(ContractType.NoDependency);
    expect(result.contracts[0].args).toHaveLength(2);
    expect(result.contracts[0].args[0].declaredLocation).toBe('src/domain');
    expect(result.contracts[0].args[1].declaredLocation).toBe('src/infrastructure');
  });

  it('builds noDependency contract from object format', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          { from: 'src/domain', to: 'src/infrastructure' },
        ],
      },
    };

    const result = builder.build(config);

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].args[0].declaredLocation).toBe('src/domain');
    expect(result.contracts[0].args[1].declaredLocation).toBe('src/infrastructure');
  });

  it('creates symbols with inferred names from path', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
      },
    };

    const result = builder.build(config);

    expect(result.symbols).toHaveLength(2);
    const names = result.symbols.map(s => s.name);
    expect(names).toContain('domain');
    expect(names).toContain('infrastructure');
  });

  it('creates symbols with Layer kind', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
      },
    };

    const result = builder.build(config);

    for (const symbol of result.symbols) {
      expect(symbol.kind).toBe(ArchSymbolKind.Layer);
    }
  });

  it('reuses symbols when they appear in multiple contracts', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
          ['src/domain', 'src/application'],
        ],
      },
    };

    const result = builder.build(config);

    // src/domain appears twice but should only create one symbol
    expect(result.symbols).toHaveLength(3);
    expect(result.contracts).toHaveLength(2);

    // Both contracts reference the same domain symbol
    expect(result.contracts[0].args[0]).toBe(result.contracts[1].args[0]);
  });

  it('generates descriptive contract names', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
      },
    };

    const result = builder.build(config);
    expect(result.contracts[0].name).toContain('src/domain');
    expect(result.contracts[0].name).toContain('src/infrastructure');
  });

  it('sets contract location to kindscript.json', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
      },
    };

    const result = builder.build(config);
    expect(result.contracts[0].location).toBe('kindscript.json');
  });

  it('reports error for invalid entry format', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          'invalid-string-entry' as unknown,
        ],
      },
    };

    const result = builder.build(config);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Invalid noDependency entry');
  });

  it('builds multiple noDependency contracts', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
          ['src/domain', 'src/application'],
          ['src/application', 'src/infrastructure'],
        ],
      },
    };

    const result = builder.build(config);
    expect(result.contracts).toHaveLength(3);
    expect(result.symbols).toHaveLength(3);
  });

  it('warns about unsupported contract types', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.MustImplement]: [
          ['src/ports', 'src/adapters'],
        ],
      },
    };

    const result = builder.build(config);
    expect(result.contracts).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('mustImplement');
    expect(result.errors[0]).toContain('not yet supported');
  });

  it('warns about multiple unsupported contract types', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
        [ContractType.Purity]: [['src/domain']],
        [ContractType.NoCycles]: [['src/modules']],
      },
    };

    const result = builder.build(config);
    // noDependency should still be built
    expect(result.contracts).toHaveLength(1);
    // purity and noCycles should produce warnings
    expect(result.errors).toHaveLength(2);
    expect(result.errors.some(e => e.includes('purity'))).toBe(true);
    expect(result.errors.some(e => e.includes('noCycles'))).toBe(true);
  });

  it('resolves paths relative to project root when provided', () => {
    const config: KindScriptConfig = {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
      },
    };

    const result = builder.build(config, '/projects/myapp');

    expect(result.symbols).toHaveLength(2);
    expect(result.symbols[0].declaredLocation).toBe('/projects/myapp/src/domain');
    expect(result.symbols[1].declaredLocation).toBe('/projects/myapp/src/infrastructure');
  });
});
