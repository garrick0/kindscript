import { purityPlugin } from '../../src/application/enforcement/check-contracts/purity/purity.plugin';
import { CheckContext } from '../../src/application/enforcement/check-contracts/contract-plugin';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';
import { Program } from '../../src/domain/entities/program';
import { makeSymbol, purity } from '../helpers/factories';

describe('purityPlugin.check', () => {
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

  it('handles purity symbol with no declared location', () => {
    const noLoc = new ArchSymbol('noLoc', ArchSymbolKind.Member);
    const result = purityPlugin.check(purity(noLoc), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects Node.js built-in import (fs)', () => {
    const domain = makeSymbol('domain');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withModuleSpecifier('src/domain/service.ts', 'fs', 1, 0);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
    ]);

    const result = purityPlugin.check(purity(domain), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70003);
    expect(result.diagnostics[0].message).toContain('fs');
  });

  it('detects node: prefixed import (node:fs)', () => {
    const domain = makeSymbol('domain');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withModuleSpecifier('src/domain/service.ts', 'node:fs', 2, 0);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
    ]);

    const result = purityPlugin.check(purity(domain), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70003);
  });

  it('detects fs/promises subpath', () => {
    const domain = makeSymbol('domain');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withModuleSpecifier('src/domain/service.ts', 'fs/promises', 1, 0);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
    ]);

    const result = purityPlugin.check(purity(domain), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(1);
  });

  it('allows relative imports', () => {
    const domain = makeSymbol('domain');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withModuleSpecifier('src/domain/service.ts', './entity', 1, 0);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
    ]);

    const result = purityPlugin.check(purity(domain), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('allows npm package imports', () => {
    const domain = makeSymbol('domain');

    mockTS
      .withSourceFile('src/domain/service.ts', '')
      .withModuleSpecifier('src/domain/service.ts', 'lodash', 1, 0);

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/service.ts']],
    ]);

    const result = purityPlugin.check(purity(domain), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles empty directory', () => {
    const domain = makeSymbol('domain');

    const result = purityPlugin.check(purity(domain), makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles symbol with no declared location', () => {
    const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);

    const result = purityPlugin.check(purity(domain), makeContext());
    expect(result.diagnostics).toHaveLength(0);
    expect(result.filesAnalyzed).toBe(0);
  });

  it('skips files where getSourceFile returns undefined', () => {
    const domain = makeSymbol('domain');

    const resolvedFiles = new Map([
      ['src/domain', ['src/domain/orphan.ts']],
    ]);

    const result = purityPlugin.check(purity(domain), makeContext(resolvedFiles));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.filesAnalyzed).toBe(1);
  });
});

describe('purityPlugin.intrinsic', () => {
  it('detects { pure: true }', () => {
    const view = {
      kind: 'object' as const,
      properties: [{ name: 'pure', value: { kind: 'boolean' as const } }],
    };
    expect(purityPlugin.intrinsic!.detect(view)).toBe(true);
  });

  it('returns false for non-object', () => {
    expect(purityPlugin.intrinsic!.detect({ kind: 'stringList', values: [] })).toBe(false);
  });

  it('returns false when pure is not present', () => {
    const view = {
      kind: 'object' as const,
      properties: [{ name: 'other', value: { kind: 'boolean' as const } }],
    };
    expect(purityPlugin.intrinsic!.detect(view)).toBe(false);
  });

  it('creates a purity contract via propagate', () => {
    const memberSymbol = makeSymbol('domain');
    const contract = purityPlugin.intrinsic!.propagate(memberSymbol, 'domain', 'type:MyKind');
    expect(contract.type).toBe(ContractType.Purity);
    expect(contract.args).toEqual([memberSymbol]);
    expect(contract.name).toBe('purity(domain)');
  });
});

describe('purityPlugin.validate', () => {
  it('accepts 1 arg', () => {
    const s = makeSymbol('domain');
    expect(purityPlugin.validate([s])).toBeNull();
  });

  it('rejects wrong arg count', () => {
    const s1 = makeSymbol('domain');
    const s2 = makeSymbol('infra');
    expect(purityPlugin.validate([s1, s2])).toContain('requires exactly 1 argument');
  });
});
