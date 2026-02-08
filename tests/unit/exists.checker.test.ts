import { ExistsChecker } from '../../src/application/use-cases/check-contracts/exists/exists.checker';
import { generateExists } from '../../src/application/use-cases/check-contracts/exists/exists.generator';
import { CheckContext } from '../../src/application/use-cases/check-contracts/contract-checker';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { DiagnosticCode } from '../../src/domain/constants/diagnostic-codes';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, exists } from '../helpers/factories';

describe('ExistsChecker', () => {
  let checker: ExistsChecker;
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
    checker = new ExistsChecker();
  });

  afterEach(() => {
    mockTS.reset();
  });

  it('reports diagnostic for missing directory', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, '/project/src/domain');

    const resolvedFiles = new Map<string, string[]>();

    const result = checker.check(exists([domain]), makeContext(resolvedFiles));

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

    const result = checker.check(exists([domain]), makeContext(resolvedFiles));
    expect(result.diagnostics.length).toBe(0);
  });

  it('checks multiple members in a single exists contract', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, '/project/src/domain');
    const infra = makeSymbol('infra', ArchSymbolKind.Member, '/project/src/infra');

    const resolvedFiles = new Map([
      ['/project/src/domain', ['/project/src/domain/entity.ts']],
    ]);

    const result = checker.check(exists([domain, infra]), makeContext(resolvedFiles));

    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0].message).toContain("'/project/src/infra'");
  });

  it('skips symbols with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);

    const result = checker.check(exists([noLoc]), makeContext());
    expect(result.diagnostics.length).toBe(0);
  });
});

describe('generateExists', () => {
  it('returns empty for wrong shape', () => {
    const instance = makeSymbol('inst');
    const result = generateExists(
      { kind: 'tuplePairs', values: [['a', 'b']] }, instance, 'K', 'loc'
    );
    expect(result.contracts).toHaveLength(0);
  });

  it('reports error for missing member', () => {
    const instance = makeSymbol('inst');
    const result = generateExists(
      { kind: 'stringList', values: ['missing'] }, instance, 'K', 'loc'
    );
    expect(result.errors).toHaveLength(1);
    expect(result.contracts).toHaveLength(0);
  });
});
