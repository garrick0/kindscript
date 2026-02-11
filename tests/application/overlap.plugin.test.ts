import { overlapPlugin } from '../../src/application/pipeline/plugins/overlap/overlap.plugin';
import { CheckContext } from '../../src/application/pipeline/plugins/contract-plugin';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, overlap } from '../helpers/factories';

describe('overlapPlugin.check', () => {
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
  });

  afterEach(() => {
    mockTS.reset();
  });

  it('detects overlapping files between two siblings', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const resolvedFiles = new Map([
      ['src/domain', ['src/shared/utils.ts', 'src/domain/entity.ts']],
      ['src/infrastructure', ['src/shared/utils.ts', 'src/infrastructure/db.ts']],
    ]);

    const result = overlapPlugin.check(overlap(domain, infra), makeContext(resolvedFiles));

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70006);
    expect(result.diagnostics[0].message).toContain('domain');
    expect(result.diagnostics[0].message).toContain('infrastructure');
    expect(result.diagnostics[0].message).toContain('1 file(s)');
  });

  it('returns clean result when no overlap exists', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/entity.ts']],
      ['src/infrastructure', ['src/infrastructure/db.ts']],
    ]);

    const result = overlapPlugin.check(overlap(domain, infra), makeContext(resolvedFiles));

    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects multiple overlapping files', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');

    const resolvedFiles = new Map([
      ['src/a', ['src/shared/x.ts', 'src/shared/y.ts', 'src/a/own.ts']],
      ['src/b', ['src/shared/x.ts', 'src/shared/y.ts', 'src/b/own.ts']],
    ]);

    const result = overlapPlugin.check(overlap(a, b), makeContext(resolvedFiles));

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain('2 file(s)');
  });

  it('handles symbols with no resolved files', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');

    const result = overlapPlugin.check(overlap(a, b), makeContext());

    expect(result.diagnostics).toHaveLength(0);
  });

  it('truncates file list when more than 3 overlapping files', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');

    const shared = ['f1.ts', 'f2.ts', 'f3.ts', 'f4.ts'];
    const resolvedFiles = new Map([
      ['src/a', shared],
      ['src/b', shared],
    ]);

    const result = overlapPlugin.check(overlap(a, b), makeContext(resolvedFiles));

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain('...');
  });
});

describe('overlapPlugin.validate', () => {
  it('accepts 2 args', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');
    expect(overlapPlugin.validate([a, b])).toBeNull();
  });

  it('rejects wrong arg count', () => {
    const s = makeSymbol('a');
    expect(overlapPlugin.validate([s])).toContain('requires exactly 2 arguments');
  });
});
