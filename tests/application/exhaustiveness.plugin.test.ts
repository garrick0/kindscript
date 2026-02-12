import { exhaustivenessPlugin } from '../../src/application/pipeline/plugins/exhaustiveness/exhaustiveness.plugin';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { makeSymbol, exhaustiveness } from '../helpers/factories';
import { setupPluginTestEnv } from '../helpers/plugin-test-helpers';

describe('exhaustivenessPlugin.check', () => {
  const { makeContext } = setupPluginTestEnv();

  function makeInstanceWithMembers(
    name: string,
    memberDefs: Array<{ name: string; files: string[] }>,
    containerFiles: string[],
  ): ArchSymbol {
    const instance = new ArchSymbol(name, ArchSymbolKind.Instance, { type: 'path', path: `src/${name}` });
    instance.files = containerFiles;
    for (const m of memberDefs) {
      const member = new ArchSymbol(m.name, ArchSymbolKind.Member, { type: 'path', path: `src/${name}/${m.name}` });
      member.files = m.files;
      instance.members.set(m.name, member);
    }
    return instance;
  }

  it('detects unassigned files in instance container', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: ['src/app/domain/entity.ts'] },
      { name: 'infra', files: ['src/app/infra/db.ts'] },
    ], [
      'src/app/domain/entity.ts',
      'src/app/infra/db.ts',
      'src/app/orphan.ts',
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70007);
    expect(result.diagnostics[0].message).toContain('orphan.ts');
  });

  it('returns clean result when all files are assigned', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: ['src/app/domain/entity.ts'] },
      { name: 'infra', files: ['src/app/infra/db.ts'] },
    ], [
      'src/app/domain/entity.ts',
      'src/app/infra/db.ts',
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('excludes test files from exhaustiveness check', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: ['src/app/domain/entity.ts'] },
    ], [
      'src/app/domain/entity.ts',
      'src/app/domain/entity.test.ts',
      'src/app/domain/entity.spec.ts',
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('excludes context.ts files', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: ['src/app/domain/entity.ts'] },
    ], [
      'src/app/domain/entity.ts',
      'src/app/context.ts',
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('excludes __tests__ directory files', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: ['src/app/domain/entity.ts'] },
    ], [
      'src/app/domain/entity.ts',
      'src/app/__tests__/integration.ts',
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty when container has no files', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: [] },
    ], []);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty when no container files registered', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: [] },
    ], []);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it('reports multiple unassigned files', () => {
    const instance = makeInstanceWithMembers('app', [
      { name: 'domain', files: ['src/app/domain/entity.ts'] },
    ], [
      'src/app/domain/entity.ts',
      'src/app/orphan1.ts',
      'src/app/orphan2.ts',
    ]);

    const result = exhaustivenessPlugin.check(
      exhaustiveness(instance),
      makeContext(),
    );

    expect(result.diagnostics).toHaveLength(2);
    expect(result.diagnostics.every(d => d.code === 70007)).toBe(true);
  });
});

describe('exhaustivenessPlugin.generate', () => {
  it('generates contract for boolean true value', () => {
    const instance = new ArchSymbol('app', ArchSymbolKind.Instance, { type: 'path', path: 'src/app' });
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
    const instance = new ArchSymbol('app', ArchSymbolKind.Instance, { type: 'path', path: 'src/app' });
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
    const s = new ArchSymbol('app', ArchSymbolKind.Instance, { type: 'path', path: 'src/app' });
    expect(exhaustivenessPlugin.validate([s])).toBeNull();
  });

  it('rejects wrong arg count', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');
    expect(exhaustivenessPlugin.validate([a, b])).toContain('requires exactly 1 argument');
  });
});
