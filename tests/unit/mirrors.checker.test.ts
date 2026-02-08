import { MirrorsChecker } from '../../src/application/use-cases/check-contracts/mirrors/mirrors.checker';
import { generateMirrors } from '../../src/application/use-cases/check-contracts/mirrors/mirrors.generator';
import { CheckContext } from '../../src/application/use-cases/check-contracts/contract-checker';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, mirrors } from '../helpers/factories';

describe('MirrorsChecker', () => {
  let checker: MirrorsChecker;
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
    checker = new MirrorsChecker();
  });

  afterEach(() => {
    mockTS.reset();
  });

  it('handles mirrors with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);
    const withLoc = makeSymbol('withLoc');

    const result = checker.check(mirrors(noLoc, withLoc), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects missing counterpart', () => {
    const components = makeSymbol('components');
    const tests = makeSymbol('tests');

    const resolvedFiles = new Map([
      ['src/components', ['src/components/button.ts', 'src/components/form.ts']],
      ['src/tests', ['src/tests/button.ts']],
    ]);

    const result = checker.check(mirrors(components, tests), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70005);
    expect(result.diagnostics[0].message).toContain('form.ts');
  });

  it('handles missing locations', () => {
    const components = makeSymbol('components', ArchSymbolKind.Member, undefined);
    const tests = makeSymbol('tests');

    const result = checker.check(mirrors(components, tests), makeContext());
    expect(result.diagnostics).toHaveLength(0);
    expect(result.filesAnalyzed).toBe(0);
  });

  it('passes when all files are matched', () => {
    const components = makeSymbol('components');
    const tests = makeSymbol('tests');

    const resolvedFiles = new Map([
      ['src/components', ['src/components/button.ts']],
      ['src/tests', ['src/tests/button.ts']],
    ]);

    const result = checker.check(mirrors(components, tests), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('generateMirrors', () => {
  it('returns empty for wrong shape', () => {
    const instance = makeSymbol('inst');
    const result = generateMirrors(
      { kind: 'stringList', values: ['a'] }, instance, 'K', 'loc'
    );
    expect(result.contracts).toHaveLength(0);
  });

  it('reports error for missing first member', () => {
    const instance = makeSymbol('inst');
    const result = generateMirrors(
      { kind: 'tuplePairs', values: [['missing', 'also-missing']] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('missing');
  });

  it('reports error for missing second member', () => {
    const members = new Map([['a', makeSymbol('a')]]);
    const instance = new ArchSymbol('inst', ArchSymbolKind.Instance, 'src/inst', members);
    const result = generateMirrors(
      { kind: 'tuplePairs', values: [['a', 'missing']] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('missing');
  });
});
