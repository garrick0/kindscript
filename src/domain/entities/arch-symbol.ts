import { ArchSymbolKind } from '../types/arch-symbol-kind';
import { ContractReference } from '../value-objects/contract-reference';

/**
 * Core domain entity representing an architectural symbol.
 *
 * An ArchSymbol represents a named architectural entity like a layer,
 * module, context, port, or adapter. Symbols can contain other symbols
 * (hierarchical structure) and have contracts attached to them.
 *
 * This is a pure domain entity with no external dependencies.
 */
export class ArchSymbol {
  constructor(
    /** The name of this symbol */
    public readonly name: string,

    /** The kind of architectural entity this represents */
    public readonly kind: ArchSymbolKind,

    /** Optional file system location where this symbol is declared */
    public readonly declaredLocation?: string,

    /** Child symbols (for hierarchical structures) */
    public readonly members: Map<string, ArchSymbol> = new Map(),

    /** Contracts attached to this symbol */
    public readonly contracts: ContractReference[] = []
  ) {}

  /**
   * Value equality - two symbols are equal if name, kind, and location match.
   */
  equals(other: ArchSymbol): boolean {
    return (
      this.name === other.name &&
      this.kind === other.kind &&
      this.declaredLocation === other.declaredLocation
    );
  }

  /**
   * Check if this symbol has a contract of a specific type.
   */
  hasContract(contractType: string): boolean {
    return this.contracts.some(c => c.contractType === contractType);
  }

  /**
   * Find a direct child member by name.
   */
  findMember(name: string): ArchSymbol | undefined {
    return this.members.get(name);
  }

  /**
   * Get all direct child members as an array.
   */
  getAllMembers(): ArchSymbol[] {
    return Array.from(this.members.values());
  }

  /**
   * Recursively traverse all descendants of this symbol.
   */
  *descendants(): Generator<ArchSymbol> {
    for (const member of this.members.values()) {
      yield member;
      yield* member.descendants();
    }
  }

  /**
   * Find a descendant symbol by path (e.g., "ordering.domain").
   */
  findByPath(path: string): ArchSymbol | undefined {
    const parts = path.split('.');
    let current: ArchSymbol | undefined = this;

    for (const part of parts) {
      if (!current) return undefined;
      current = current.findMember(part);
    }

    return current;
  }

  /**
   * Human-readable representation of this symbol.
   */
  toString(): string {
    return `${this.kind}:${this.name}${this.declaredLocation ? ` @ ${this.declaredLocation}` : ''}`;
  }
}
