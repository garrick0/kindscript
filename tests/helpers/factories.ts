import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../src/domain/entities/contract';
import { ContractType } from '../../src/domain/types/contract-type';
import { Program } from '../../src/domain/entities/program';

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

export function exists(symbols: ArchSymbol[], name?: string): Contract {
  return new Contract(
    ContractType.Exists,
    name ?? `exists(${symbols.map(s => s.name).join(', ')})`,
    symbols,
  );
}

export function mirrors(primary: ArchSymbol, related: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.Mirrors,
    name ?? `mirrors(${primary.name} -> ${related.name})`,
    [primary, related],
  );
}

// ---------------------------------------------------------------------------
// CheckContractsRequest builder
// ---------------------------------------------------------------------------

export function makeCheckRequest(
  contracts: Contract[],
  program?: Program,
  resolvedFiles?: Map<string, string[]>,
) {
  return {
    symbols: [] as ArchSymbol[],
    contracts,
    config: {},
    program: program ?? new Program([], {}),
    resolvedFiles: resolvedFiles ?? new Map<string, string[]>(),
  };
}
