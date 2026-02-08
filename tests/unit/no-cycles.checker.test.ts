import { NoCyclesChecker } from '../../src/application/use-cases/check-contracts/no-cycles/no-cycles.checker';
import { generateNoCycles } from '../../src/application/use-cases/check-contracts/no-cycles/no-cycles.generator';
import { CheckContext } from '../../src/application/use-cases/check-contracts/contract-checker';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, noCycles } from '../helpers/factories';

describe('NoCyclesChecker', () => {
  let checker: NoCyclesChecker;
  let mockTS: MockTypeScriptAdapter;

  function makeContext(resolvedFiles?: Map<string, string[]>): CheckContext {
    const program = new Program([], {});
    return {
      tsPort: mockTS,
      program,
      checker: mockTS.getTypeChecker(program),
      resolvedFiles: resolvedFiles ?? new Map(),
    };
  }

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    checker = new NoCyclesChecker();
  });

  afterEach(() => {
    mockTS.reset();
  });

  it('detects 2-node cycle (A -> B -> A)', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infra');

    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/infra/b.ts', '')
      .withImport('src/domain/a.ts', 'src/infra/b.ts', '../infra/b', 1)
      .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/a.ts']],
      ['src/infra', ['src/infra/b.ts']],
    ]);

    const result = checker.check(noCycles([domain, infra]), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70004);
    expect(result.diagnostics[0].message).toContain('Circular dependency');
  });

  it('detects 3-node cycle (A -> B -> C -> A)', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');
    const c = makeSymbol('c');

    mockTS
      .withSourceFile('src/a/x.ts', '')
      .withSourceFile('src/b/y.ts', '')
      .withSourceFile('src/c/z.ts', '')
      .withImport('src/a/x.ts', 'src/b/y.ts', '../b/y', 1)
      .withImport('src/b/y.ts', 'src/c/z.ts', '../c/z', 1)
      .withImport('src/c/z.ts', 'src/a/x.ts', '../a/x', 1);

    const resolvedFiles = new Map([
      ['src/a', ['src/a/x.ts']],
      ['src/b', ['src/b/y.ts']],
      ['src/c', ['src/c/z.ts']],
    ]);

    const result = checker.check(noCycles([a, b, c]), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70004);
  });

  it('passes with no cycle', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infra');

    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/infra/b.ts', '')
      .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/a.ts']],
      ['src/infra', ['src/infra/b.ts']],
    ]);

    const result = checker.check(noCycles([domain, infra]), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles missing locations', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);
    const infra = makeSymbol('infra');

    const result = checker.check(noCycles([domain, infra]), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles getSourceFile returning undefined', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infra');

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/a.ts']],
      ['src/infra', ['src/infra/b.ts']],
    ]);

    const result = checker.check(noCycles([domain, infra]), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles symbols with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);
    const withLoc = makeSymbol('withLoc');

    const result = checker.check(noCycles([noLoc, withLoc]), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles 3 nodes with only partial connections (no full cycle)', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');
    const c = makeSymbol('c');

    mockTS
      .withSourceFile('src/a/x.ts', '')
      .withSourceFile('src/b/y.ts', '')
      .withSourceFile('src/c/z.ts', '')
      .withImport('src/a/x.ts', 'src/b/y.ts', '../b/y', 1)
      .withImport('src/b/y.ts', 'src/c/z.ts', '../c/z', 1);

    const resolvedFiles = new Map([
      ['src/a', ['src/a/x.ts']],
      ['src/b', ['src/b/y.ts']],
      ['src/c', ['src/c/z.ts']],
    ]);

    const result = checker.check(noCycles([a, b, c]), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('generateNoCycles', () => {
  it('returns empty for wrong shape', () => {
    const instance = makeSymbol('inst');
    const result = generateNoCycles(
      { kind: 'tuplePairs', values: [['a', 'b']] }, instance, 'K', 'loc'
    );
    expect(result.contracts).toHaveLength(0);
  });

  it('reports error for missing member', () => {
    const instance = makeSymbol('inst');
    const result = generateNoCycles(
      { kind: 'stringList', values: ['missing'] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.contracts).toHaveLength(0);
  });
});
