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
  const path = location ?? `src/${name}`;
  return new ArchSymbol(name, kind, { type: 'path', path });
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

/** Creates a Scope contract: `symbol` must match the expected scope (folder or file). */
export function scope(symbol: ArchSymbol, expectedScope: 'folder' | 'file', name?: string): Contract {
  return new Contract(
    ContractType.Scope,
    name ?? `scope:${expectedScope}(${symbol.name})`,
    [symbol],
  );
}

/** Creates an Overlap contract: `a` and `b` must not share files. */
export function overlap(a: ArchSymbol, b: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.Overlap,
    name ?? `overlap:${a.name}/${b.name}`,
    [a, b],
  );
}

/** Creates an Exhaustiveness contract: all files in the instance's container must be assigned. */
export function exhaustiveness(instanceSymbol: ArchSymbol, name?: string): Contract {
  return new Contract(
    ContractType.Exhaustiveness,
    name ?? `exhaustive:${instanceSymbol.name}`,
    [instanceSymbol],
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
