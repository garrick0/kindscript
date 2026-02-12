import { overlapPlugin } from '../../src/application/pipeline/plugins/overlap/overlap.plugin';
import { CheckContext } from '../../src/application/pipeline/plugins/contract-plugin';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, overlap } from '../helpers/factories';

describe('overlapPlugin.check', () => {
  let mockTS: MockTypeScriptAdapter;

  function makeContext(): CheckContext {
    const program = new Program([], {});
    return {
      tsPort: mockTS,
      program,
      checker: mockTS.getTypeChecker(program),
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

    domain.files = ['src/shared/utils.ts', 'src/domain/entity.ts'];
    infra.files = ['src/shared/utils.ts', 'src/infrastructure/db.ts'];

    const result = overlapPlugin.check(overlap(domain, infra), makeContext());

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70006);
    expect(result.diagnostics[0].message).toContain('domain');
    expect(result.diagnostics[0].message).toContain('infrastructure');
    expect(result.diagnostics[0].message).toContain('1 file(s)');
  });

  it('returns clean result when no overlap exists', () => {
    const domain = makeSymbol('domain');
    const infra = makeSymbol('infrastructure');

    domain.files = ['src/domain/entity.ts'];
    infra.files = ['src/infrastructure/db.ts'];

    const result = overlapPlugin.check(overlap(domain, infra), makeContext());

    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects multiple overlapping files', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');

    a.files = ['src/shared/x.ts', 'src/shared/y.ts', 'src/a/own.ts'];
    b.files = ['src/shared/x.ts', 'src/shared/y.ts', 'src/b/own.ts'];

    const result = overlapPlugin.check(overlap(a, b), makeContext());

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain('2 file(s)');
  });

  it('handles symbols with no resolved files', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');

    a.files = [];
    b.files = [];

    const result = overlapPlugin.check(overlap(a, b), makeContext());

    expect(result.diagnostics).toHaveLength(0);
  });

  it('truncates file list when more than 3 overlapping files', () => {
    const a = makeSymbol('a');
    const b = makeSymbol('b');

    const shared = ['f1.ts', 'f2.ts', 'f3.ts', 'f4.ts'];
    a.files = shared;
    b.files = shared;

    const result = overlapPlugin.check(overlap(a, b), makeContext());

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
