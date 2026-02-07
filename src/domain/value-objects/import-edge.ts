/**
 * Represents an import relationship between two files.
 *
 * This is a value object - immutable and defined by its properties.
 */
export class ImportEdge {
  constructor(
    /** The file that contains the import statement */
    public readonly sourceFile: string,

    /** The file being imported */
    public readonly targetFile: string,

    /** Line number where the import appears */
    public readonly line: number,

    /** Column number where the import appears */
    public readonly column: number,

    /** The import path as written in source code */
    public readonly importPath: string
  ) {}

  /**
   * Value object equality - two edges are equal if all properties match.
   */
  equals(other: ImportEdge): boolean {
    return (
      this.sourceFile === other.sourceFile &&
      this.targetFile === other.targetFile &&
      this.importPath === other.importPath
    );
  }

  /**
   * Human-readable representation of the import edge.
   */
  toString(): string {
    return `${this.sourceFile}:${this.line} → ${this.targetFile}`;
  }
}
