import { ArchSymbol } from './arch-symbol';

/**
 * Domain entity representing the result of resolving an architectural symbol
 * to its corresponding file system files.
 *
 * For example, resolving the "domain" layer symbol might return all .ts files
 * in the src/domain directory.
 *
 * This is a pure domain entity with no external dependencies.
 */
export class ResolvedFiles {
  constructor(
    /** The symbol that was resolved */
    public readonly symbol: ArchSymbol,

    /** The files that belong to this symbol */
    public readonly files: string[]
  ) {}

  /**
   * Check if a specific file is part of this symbol.
   */
  contains(filePath: string): boolean {
    return this.files.includes(filePath);
  }

  /**
   * Get the number of files in this symbol.
   */
  get count(): number {
    return this.files.length;
  }

  /**
   * Check if this symbol has no files.
   */
  get isEmpty(): boolean {
    return this.files.length === 0;
  }

  /**
   * Human-readable representation.
   */
  toString(): string {
    return `ResolvedFiles(${this.symbol.name}: ${this.count} files)`;
  }
}
