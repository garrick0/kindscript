/**
 * Represents a file system location (directory or file pattern).
 *
 * This is a value object - immutable and defined by its properties.
 */
export class Location {
  constructor(
    /** The path or pattern (e.g., "src/domain" or "src/**\/*.domain.ts") */
    public readonly path: string,

    /** Whether this location uses glob pattern matching */
    public readonly isPattern: boolean = false
  ) {}

  /**
   * Check if a file path matches this location.
   *
   * For non-patterns, checks if the file path starts with this location's path.
   * For patterns, performs glob matching (simplified for M0).
   */
  matches(filePath: string): boolean {
    if (!this.isPattern) {
      // Simple prefix matching for directories
      return filePath.startsWith(this.path) || filePath.startsWith('./' + this.path);
    }

    // Pattern matching (simplified for M0)
    // Real implementation would use minimatch or similar
    const pattern = this.path.replace(/\*/g, '.*');
    const regex = new RegExp('^' + pattern + '$');
    return regex.test(filePath);
  }

  /**
   * Value object equality.
   */
  equals(other: Location): boolean {
    return this.path === other.path && this.isPattern === other.isPattern;
  }

  /**
   * Human-readable representation.
   */
  toString(): string {
    return this.isPattern ? `pattern:${this.path}` : this.path;
  }
}
