/**
 * Represents a reference between two declarations within the same file.
 *
 * Unlike ImportEdge (cross-file), IntraFileEdge tracks when one
 * top-level declaration references another in the same source file.
 */
export interface IntraFileEdge {
  /** Name of the declaration containing the reference */
  fromDeclaration: string;
  /** Name of the declaration being referenced */
  toDeclaration: string;
  /** Line number of the reference */
  line: number;
  /** Column number of the reference */
  column: number;
}
