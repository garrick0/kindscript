import { ArchSymbolKind } from '../types/arch-symbol-kind';

/**
 * Core domain entity representing an architectural symbol.
 *
 * An ArchSymbol represents a named architectural entity — a Kind
 * definition, an Instance of a Kind, or a Member within an instance.
 * Symbols can contain other symbols (hierarchical structure).
 *
 * This is a pure domain entity with no external dependencies.
 */
export class ArchSymbol {
  constructor(
    /** The name of this symbol */
    public readonly name: string,

    /** The kind of architectural entity this represents */
    public readonly kind: ArchSymbolKind,

    /** Opaque identifier for this symbol (used as a lookup key, not for path manipulation) */
    public readonly id?: string,

    /** Child symbols (for hierarchical structures) */
    public readonly members: Map<string, ArchSymbol> = new Map(),

    /** The Kind type name this symbol instantiates (e.g., "DomainLayer", "PortsLayer") */
    public readonly kindTypeName?: string,

    /** For sub-file instances: the named export (from hash syntax, e.g., 'validateOrder') */
    public readonly exportName?: string,
  ) {}

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
    return `${this.kind}:${this.name}${this.id ? ` @ ${this.id}` : ''}`;
  }
}
