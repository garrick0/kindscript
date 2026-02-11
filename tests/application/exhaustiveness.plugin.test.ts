import { exhaustivenessPlugin } from '../../src/application/pipeline/plugins/exhaustiveness/exhaustiveness.plugin';
import { CheckContext } from '../../src/application/pipeline/plugins/contract-plugin';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, exhaustiveness } from '../helpers/factories';

describe('exhaustivenessPlugin.check', () => {
  let mockTS: MockTypeScriptAdapter;

  function makeContext(
    resolvedFiles?: Map<string, string[]>,
    containerFiles?: Map<string, string[]>,
  ): CheckContext {
    const program = new Program([], {});
    return {
      tsPort: mockTS,
      program,
      checker: mockTS.getTypeChecker(program),
      resolvedFiles: resolvedFiles ?? new Map(),
      containerFiles,
    };
  }

  function makeInstanceWithMembers(name: string, memberNames: string[]): ArchSymbol {
    const instance = new ArchSymbol(name, ArchSymbolKind.Instance, `src/${name}`);
    for (const m of memberNames) {
      instance.members.set(m, new ArchSymbol(m, ArchSymbolKind.Member, `src/${name}/${m}`));
    }
    return instance;
  }

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
  });

  afterEach(() => {
    mockTS.reset();
  });

  it('detects unassigned files in instance container', () => {
    const instance = makeInstanceWithMembers('app', ['domain', 'infra']);

    const resolvedFiles = new Map([
      ['src/app/domain', ['src/app/domain/entity.ts']],
      ['src/app/infra', ['src/app/infra/db.ts']],
    ]);
    const containerFiles = new Map([
      ['src/app', [
        'src/app/domain/entity.ts',
        'src/app/infra/db.ts',
        'src/app/orphan.ts',
      ]],
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(resolvedFiles, containerFiles),
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70007);
    expect(result.diagnostics[0].message).toContain('orphan.ts');
  });

  it('returns clean result when all files are assigned', () => {
    const instance = makeInstanceWithMembers('app', ['domain', 'infra']);

    const resolvedFiles = new Map([
      ['src/app/domain', ['src/app/domain/entity.ts']],
      ['src/app/infra', ['src/app/infra/db.ts']],
    ]);
    const containerFiles = new Map([
      ['src/app', [
        'src/app/domain/entity.ts',
        'src/app/infra/db.ts',
      ]],
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(resolvedFiles, containerFiles),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('excludes test files from exhaustiveness check', () => {
    const instance = makeInstanceWithMembers('app', ['domain']);

    const resolvedFiles = new Map([
      ['src/app/domain', ['src/app/domain/entity.ts']],
    ]);
    const containerFiles = new Map([
      ['src/app', [
        'src/app/domain/entity.ts',
        'src/app/domain/entity.test.ts',
        'src/app/domain/entity.spec.ts',
      ]],
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(resolvedFiles, containerFiles),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('excludes context.ts files', () => {
    const instance = makeInstanceWithMembers('app', ['domain']);

    const resolvedFiles = new Map([
      ['src/app/domain', ['src/app/domain/entity.ts']],
    ]);
    const containerFiles = new Map([
      ['src/app', [
        'src/app/domain/entity.ts',
        'src/app/context.ts',
      ]],
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(resolvedFiles, containerFiles),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('excludes __tests__ directory files', () => {
    const instance = makeInstanceWithMembers('app', ['domain']);

    const resolvedFiles = new Map([
      ['src/app/domain', ['src/app/domain/entity.ts']],
    ]);
    const containerFiles = new Map([
      ['src/app', [
        'src/app/domain/entity.ts',
        'src/app/__tests__/integration.ts',
      ]],
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(resolvedFiles, containerFiles),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty when container has no files', () => {
    const instance = makeInstanceWithMembers('app', ['domain']);

    const containerFiles = new Map([
      ['src/app', []],
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(new Map(), containerFiles),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty when no container files registered', () => {
    const instance = makeInstanceWithMembers('app', ['domain']);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('reports multiple unassigned files', () => {
    const instance = makeInstanceWithMembers('app', ['domain']);

    const resolvedFiles = new Map([
      ['src/app/domain', ['src/app/domain/entity.ts']],
    ]);
    const containerFiles = new Map([
      ['src/app', [
        'src/app/domain/entity.ts',
        'src/app/orphan1.ts',
        'src/app/orphan2.ts',
      ]],
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(resolvedFiles, containerFiles),
    );

    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics.every(d => d.code === 70007)).toBe(true);
  });
});

describe('exhaustivenessPlugin.generate', () => {
  it('generates contract for boolean true value', () => {
    const instance = new ArchSymbol('app', ArchSymbolKind.Instance, 'src/app');
    const result = exhaustivenessPlugin.generate!(
      { kind: 'boolean' },
      instance,
      'MyKind',
      'type:MyKind',
    );

    expect(result.contracts).toHaveLength(1);
    expect(result.contracts[0].type).toBe('exhaustiveness');
    expect(result.errors).toHaveLength(0);
  });

  it('returns error for non-boolean value', () => {
    const instance = new ArchSymbol('app', ArchSymbolKind.Instance, 'src/app');
    const result = exhaustivenessPlugin.generate!(
      { kind: 'stringList', values: ['yes'] },
      instance,
      'MyKind',
      'type:MyKind',
    );

    expect(result.contracts).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('must be true');
  });
});

describe('exhaustivenessPlugin.validate', () => {
  it('accepts 1 arg', () => {
    const s = new ArchSymbol('app', ArchSymbolKind.Instance, 'src/app');
    expect(exhaustivenessPlugin.validate([s])).toBeNull();
  });

  it('rejects wrong arg count', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');
    expect(exhaustivenessPlugin.validate([a, b])).toContain('requires exactly 1 argument');
  });
});
