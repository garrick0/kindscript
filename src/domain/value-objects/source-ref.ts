/**
 * Value object representing the source location of a diagnostic.
 *
 * Replaces raw file/line/column fields with a single semantic type.
 * Two kinds:
 * - File-scoped: points to a specific file:line:column
 * - Structural: project-wide or scope-wide (no specific file)
 */
export class SourceRef {
  private constructor(
    public readonly file: string,
    public readonly line: number,
    public readonly column: number,
    public readonly scope?: string,
  ) {}

  /** Create a file-scoped source reference. */
  static at(file: string, line: number, column: number): SourceRef {
    return new SourceRef(file, line, column);
  }

  /** Create a structural (project-wide or scope-wide) source reference. */
  static structural(scope?: string): SourceRef {
    return new SourceRef('', 0, 0, scope);
  }

  /** True when this reference points to a specific file location. */
  get isFileScoped(): boolean {
    return this.file !== '';
  }

  toString(): string {
    if (this.scope && !this.file) {
      return `[${this.scope}]`;
    }
    return `${this.file}:${this.line}:${this.column}`;
  }
}
