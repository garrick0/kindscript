import { noCyclesPlugin } from '../../src/application/pipeline/plugins/no-cycles/no-cycles.plugin';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { makeSymbol, noCycles } from '../helpers/factories';
import { setupPluginTestEnv } from '../helpers/plugin-test-helpers';

describe('noCyclesPlugin.check', () => {
  const { getMock, makeContext } = setupPluginTestEnv();

  it('detects 2-node cycle (A -> B -> A)', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infra');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/infra/b.ts', '')
      .withImport('src/domain/a.ts', 'src/infra/b.ts', '../infra/b', 1)
      .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

    domain.files = ['src/domain/a.ts'];
    infra.files = ['src/infra/b.ts'];

    const result = noCyclesPlugin.check(noCycles([domain, infra]), makeContext());
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70004);
    expect(result.diagnostics[0].message).toContain('Circular dependency');
  });

  it('detects 3-node cycle (A -> B -> C -> A)', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');
    const c = makeSymbol('c');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/a/x.ts', '')
      .withSourceFile('src/b/y.ts', '')
      .withSourceFile('src/c/z.ts', '')
      .withImport('src/a/x.ts', 'src/b/y.ts', '../b/y', 1)
      .withImport('src/b/y.ts', 'src/c/z.ts', '../c/z', 1)
      .withImport('src/c/z.ts', 'src/a/x.ts', '../a/x', 1);

    a.files = ['src/a/x.ts'];
    b.files = ['src/b/y.ts'];
    c.files = ['src/c/z.ts'];

    const result = noCyclesPlugin.check(noCycles([a, b, c]), makeContext());
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70004);
  });

  it('passes with no cycle', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infra');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/infra/b.ts', '')
      .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

    domain.files = ['src/domain/a.ts'];
    infra.files = ['src/infra/b.ts'];

    const result = noCyclesPlugin.check(noCycles([domain, infra]), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles missing locations', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);
    const infra = makeSymbol('infra');

    domain.files = [];

    const result = noCyclesPlugin.check(noCycles([domain, infra]), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles getSourceFile returning undefined', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infra');

    domain.files = ['src/domain/a.ts'];
    infra.files = ['src/infra/b.ts'];

    const result = noCyclesPlugin.check(noCycles([domain, infra]), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles symbols with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);
    const withLoc = makeSymbol('withLoc');

    const result = noCyclesPlugin.check(noCycles([noLoc, withLoc]), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles 3 nodes with only partial connections (no full cycle)', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');
    const c = makeSymbol('c');

    const mockTS = getMock();
    mockTS
      .withSourceFile('src/a/x.ts', '')
      .withSourceFile('src/b/y.ts', '')
      .withSourceFile('src/c/z.ts', '')
      .withImport('src/a/x.ts', 'src/b/y.ts', '../b/y', 1)
      .withImport('src/b/y.ts', 'src/c/z.ts', '../c/z', 1);

    a.files = ['src/a/x.ts'];
    b.files = ['src/b/y.ts'];
    c.files = ['src/c/z.ts'];

    const result = noCyclesPlugin.check(noCycles([a, b, c]), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('noCyclesPlugin.generate', () => {
  it('returns empty for wrong shape', () => {
    const instance = makeSymbol('inst');
    const result = noCyclesPlugin.generate!(
      { kind: 'tuplePairs', values: [['a', 'b']] }, instance, 'K', 'loc'
    );
    expect(result.contracts).toHaveLength(0);
  });

  it('reports error for missing member', () => {
    const instance = makeSymbol('inst');
    const result = noCyclesPlugin.generate!(
      { kind: 'stringList', values: ['missing'] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.contracts).toHaveLength(0);
  });
});

describe('noCyclesPlugin.validate', () => {
  it('accepts 1+ args', () => {
    const s = makeSymbol('a');
    expect(noCyclesPlugin.validate([s])).toBeNull();
  });

  it('rejects 0 args', () => {
    expect(noCyclesPlugin.validate([])).toContain('requires at least 1 argument');
  });
});
