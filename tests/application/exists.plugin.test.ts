import { existsPlugin } from '../../src/application/enforcement/check-contracts/exists/exists.plugin';
import { CheckContext } from '../../src/application/enforcement/check-contracts/contract-plugin';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { DiagnosticCode } from '../../src/domain/constants/diagnostic-codes';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, exists } from '../helpers/factories';

describe('existsPlugin.check', () => {
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

  it('reports diagnostic for missing directory', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, '/project/src/domain');

    const resolvedFiles = new Map<string, string[]>();

    const result = existsPlugin.check(exists([domain]), makeContext(resolvedFiles));

    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.LocationNotFound);
    expect(result.diagnostics[0].message).toContain("'/project/src/domain'");
    expect(result.diagnostics[0].message).toContain('domain');
  });

  it('does not report diagnostic when directory exists', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, '/project/src/domain');

    const resolvedFiles = new Map([
      ['/project/src/domain', ['/project/src/domain/entity.ts']],
    ]);

    const result = existsPlugin.check(exists([domain]), makeContext(resolvedFiles));
    expect(result.diagnostics.length).toBe(0);
  });

  it('checks multiple members in a single exists contract', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, '/project/src/domain');
    const infra = makeSymbol('infra', ArchSymbolKind.Member, '/project/src/infra');

    const resolvedFiles = new Map([
      ['/project/src/domain', ['/project/src/domain/entity.ts']],
    ]);

    const result = existsPlugin.check(exists([domain, infra]), makeContext(resolvedFiles));

    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].message).toContain("'/project/src/infra'");
  });

  it('skips symbols with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);

    const result = existsPlugin.check(exists([noLoc]), makeContext());
    expect(result.diagnostics.length).toBe(0);
  });
});

describe('existsPlugin.generate', () => {
  it('returns empty for wrong shape', () => {
    const instance = makeSymbol('inst');
    const result = existsPlugin.generate!(
      { kind: 'tuplePairs', values: [['a', 'b']] }, instance, 'K', 'loc'
    );
    expect(result.contracts).toHaveLength(0);
  });

  it('reports error for missing member', () => {
    const instance = makeSymbol('inst');
    const result = existsPlugin.generate!(
      { kind: 'stringList', values: ['missing'] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.contracts).toHaveLength(0);
  });
});

describe('existsPlugin.validate', () => {
  it('accepts 1+ args', () => {
    const s = makeSymbol('domain');
    expect(existsPlugin.validate([s])).toBeNull();
  });

  it('rejects 0 args', () => {
    expect(existsPlugin.validate([])).toContain('requires at least 1 argument');
  });
});
