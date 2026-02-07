import { CompilerOptions } from '../types/compiler-options';

/**
 * Domain entity representing a TypeScript program.
 *
 * This is a domain abstraction over TypeScript's ts.Program concept.
 * The `handle` field allows infrastructure adapters to associate a real
 * ts.Program without the domain layer importing TypeScript.
 *
 * This keeps the domain layer pure - no dependency on TypeScript API.
 */
export class Program {
  constructor(
    /** The root files included in this program */
    public readonly rootFiles: string[],

    /** Compiler options for this program */
    public readonly options: CompilerOptions,

    /**
     * Opaque handle to the underlying compiler program.
     * Infrastructure adapters use this to store a reference to the real ts.Program.
     * Domain/application layers should never inspect this value.
     */
    public readonly handle: unknown = null
  ) {}

  /**
   * Human-readable representation of this program.
   */
  toString(): string {
    return `Program(${this.rootFiles.length} files)`;
  }
}
