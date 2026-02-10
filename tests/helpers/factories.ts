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

/** Creates a NoDependency contract: `from` cannot import from `to`. */
export function noDependency(from: ArchSymbol, to: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.NoDependency,
    name ?? `no-${from.name}-to-${to.name}`,
    [from, to],
  );
}

/** Creates a MustImplement contract: every interface in `ports` must have an implementing class in `adapters`. */
export function mustImplement(ports: ArchSymbol, adapters: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.MustImplement,
    name ?? `mustImplement(${ports.name} -> ${adapters.name})`,
    [ports, adapters],
  );
}

/** Creates a Purity contract: `symbol` must not import Node.js built-in modules. */
export function purity(symbol: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.Purity,
    name ?? `purity(${symbol.name})`,
    [symbol],
  );
}

/** Creates a NoCycles contract: no circular dependencies between the given `symbols`. */
export function noCycles(symbols: ArchSymbol[], name?: string): Contract {
  return new Contract(
    ContractType.NoCycles,
    name ?? `noCycles(${symbols.map(s => s.name).join(', ')})`,
    symbols,
  );
}

/** Creates an Exists contract: each symbol's derived directory must exist on disk. */
export function exists(symbols: ArchSymbol[], name?: string): Contract {
  return new Contract(
    ContractType.Exists,
    name ?? `exists(${symbols.map(s => s.name).join(', ')})`,
    symbols,
  );
}

/** Creates a Mirrors contract: every file in `primary` must have a counterpart in `related`. */
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

/** Builds a CheckerRequest with sensible defaults. Pass `contracts` and optionally override `program` or `resolvedFiles`. */
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
