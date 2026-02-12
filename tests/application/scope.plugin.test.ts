import { scopePlugin } from '../../src/application/pipeline/plugins/scope/scope.plugin';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';
import { DiagnosticCode } from '../../src/domain/constants/diagnostic-codes';
import { makeSymbol, scope } from '../helpers/factories';
import { setupPluginTestEnv } from '../helpers/plugin-test-helpers';

describe('scopePlugin.check', () => {
  const { makeContext } = setupPluginTestEnv();

  it('passes when folder scope matches a directory location', () => {
    const sym = makeSymbol('ordering', ArchSymbolKind.Instance, 'src/ordering');
    const contract = scope(sym, 'folder');
    sym.files = ['src/ordering/entity.ts'];

    const result = scopePlugin.check(contract, makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('fails when folder scope but location is a file', () => {
    const sym = makeSymbol('ordering', ArchSymbolKind.Instance, 'src/ordering.ts');
    const contract = scope(sym, 'folder');
    sym.files = ['src/ordering.ts'];

    const result = scopePlugin.check(contract, makeContext());
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.ScopeMismatch);
    expect(result.diagnostics[0].message).toContain('folder scope');
    expect(result.diagnostics[0].message).toContain('is a file');
  });

  it('fails when folder scope but directory not found', () => {
    const sym = makeSymbol('ordering', ArchSymbolKind.Instance, 'src/ordering');
    const contract = scope(sym, 'folder');
    sym.files = [];

    const result = scopePlugin.check(contract, makeContext());
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.ScopeMismatch);
    expect(result.diagnostics[0].message).toContain('was not found');
  });

  it('passes when file scope matches a file location', () => {
    const sym = makeSymbol('button', ArchSymbolKind.Instance, 'src/Button.tsx');
    const contract = scope(sym, 'file');
    sym.files = ['src/Button.tsx'];

    const result = scopePlugin.check(contract, makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });

  it('fails when file scope but location is a folder', () => {
    const sym = makeSymbol('button', ArchSymbolKind.Instance, 'src/components');
    const contract = scope(sym, 'file');
    sym.files = ['src/components/Button.tsx'];

    const result = scopePlugin.check(contract, makeContext());
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.ScopeMismatch);
    expect(result.diagnostics[0].message).toContain('file scope');
    expect(result.diagnostics[0].message).toContain('is a folder');
  });

  it('fails when file scope but file not found', () => {
    const sym = makeSymbol('button', ArchSymbolKind.Instance, 'src/Button.tsx');
    const contract = scope(sym, 'file');
    sym.files = [];

    const result = scopePlugin.check(contract, makeContext());
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.ScopeMismatch);
    expect(result.diagnostics[0].message).toContain('was not found');
  });

  it('handles symbol with no id', () => {
    const sym = new ArchSymbol('noLoc', ArchSymbolKind.Instance);
    const contract = scope(sym, 'folder');
    const result = scopePlugin.check(contract, makeContext());
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('scopePlugin.validate', () => {
  it('accepts 1 arg', () => {
    const s = makeSymbol('ordering');
    expect(scopePlugin.validate([s])).toBeNull();
  });

  it('rejects wrong arg count', () => {
    const s1 = makeSymbol('a');
    const s2 = makeSymbol('b');
    expect(scopePlugin.validate([s1, s2])).toContain('requires exactly 1 argument');
  });
});

describe('scopePlugin metadata', () => {
  it('has correct type', () => {
    expect(scopePlugin.type).toBe(ContractType.Scope);
  });

  it('has correct diagnostic code', () => {
    expect(scopePlugin.diagnosticCode).toBe(DiagnosticCode.ScopeMismatch);
  });

  it('has correct constraint name', () => {
    expect(scopePlugin.constraintName).toBe('scope');
  });
});
