import { ArchSymbol } from '../entities/arch-symbol';
import { isFileInSymbol } from '../utils/path-matching';

/**
 * Represents a dependency constraint between two architectural symbols.
 *
 * This is a value object that encapsulates the logic for checking
 * whether a specific file-to-file dependency is allowed.
 */
export class DependencyRule {
  constructor(
    /** The symbol that imports */
    public readonly from: ArchSymbol,

    /** The symbol being imported */
    public readonly to: ArchSymbol,

    /** Whether this dependency is allowed */
    public readonly allowed: boolean
  ) {}

  /**
   * Check if a specific file-to-file import violates this rule.
   *
   * @returns true if the import is allowed, false if it violates the rule
   */
  check(sourceFile: string, targetFile: string): boolean {
    // Check if the source file belongs to the 'from' symbol
    const fromMatches = this.from.declaredLocation
      ? isFileInSymbol(sourceFile, this.from.declaredLocation)
      : false;

    // Check if the target file belongs to the 'to' symbol
    const toMatches = this.to.declaredLocation
      ? isFileInSymbol(targetFile, this.to.declaredLocation)
      : false;

    // If both match, apply the rule
    if (fromMatches && toMatches) {
      return this.allowed;
    }

    // Rule doesn't apply to this import
    return true;
  }

  /**
   * Human-readable representation of this rule.
   */
  toString(): string {
    const arrow = this.allowed ? '→' : '↛';
    return `${this.from.name} ${arrow} ${this.to.name}`;
  }
}
