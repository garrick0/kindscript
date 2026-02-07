import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../src/domain/entities/contract';
import { ContractType } from '../../src/domain/types/contract-type';
import { Diagnostic } from '../../src/domain/entities/diagnostic';
import { Program } from '../../src/domain/entities/program';
import { DiagnosticCode } from '../../src/domain/constants/diagnostic-codes';

// ---------------------------------------------------------------------------
// Symbols
// ---------------------------------------------------------------------------

/**
 * Shorthand for creating an ArchSymbol. Defaults to ArchSymbolKind.Member
 * and infers location as `src/${name}` when not provided.
 */
export function makeSymbol(
  name: string,
  kind: ArchSymbolKind = ArchSymbolKind.Member,
  location?: string,
): ArchSymbol {
  return new ArchSymbol(name, kind, location ?? `src/${name}`);
}

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export function noDependency(from: ArchSymbol, to: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.NoDependency,
    name ?? `no-${from.name}-to-${to.name}`,
    [from, to],
  );
}

export function mustImplement(ports: ArchSymbol, adapters: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.MustImplement,
    name ?? `mustImplement(${ports.name} -> ${adapters.name})`,
    [ports, adapters],
  );
}

export function purity(symbol: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.Purity,
    name ?? `purity(${symbol.name})`,
    [symbol],
  );
}

export function noCycles(symbols: ArchSymbol[], name?: string): Contract {
  return new Contract(
    ContractType.NoCycles,
    name ?? `noCycles(${symbols.map(s => s.name).join(', ')})`,
    symbols,
  );
}

export function colocated(primary: ArchSymbol, related: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.Colocated,
    name ?? `colocated(${primary.name} -> ${related.name})`,
    [primary, related],
  );
}

// ---------------------------------------------------------------------------
// CheckContractsRequest builder
// ---------------------------------------------------------------------------

export function makeCheckRequest(contracts: Contract[], program?: Program) {
  return {
    symbols: [] as ArchSymbol[],
    contracts,
    config: {},
    program: program ?? new Program([], {}),
  };
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

export function makeDiagnostic(overrides?: {
  message?: string;
  code?: number;
  file?: string;
  line?: number;
  column?: number;
}): Diagnostic {
  return new Diagnostic(
    overrides?.message ?? 'Test diagnostic',
    overrides?.code ?? DiagnosticCode.ForbiddenDependency,
    overrides?.file ?? 'test.ts',
    overrides?.line ?? 1,
    overrides?.column ?? 0,
  );
}
