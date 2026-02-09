import { ContractReference } from '../value-objects/contract-reference';

/**
 * Domain entity representing an architectural violation diagnostic.
 *
 * Diagnostics are created when contracts are violated. They follow
 * TypeScript's diagnostic format for compatibility.
 */
export class Diagnostic {
  constructor(
    /** Human-readable error message */
    public readonly message: string,

    /** Numeric error code (70001-70999 for KindScript) */
    public readonly code: number,

    /** File where the violation occurred (empty string for structural/project-wide violations) */
    public readonly file: string,

    /** Line number (1-indexed, 0 for structural violations) */
    public readonly line: number,

    /** Column number (0-indexed) */
    public readonly column: number,

    /** Reference to the contract that was violated */
    public readonly relatedContract?: ContractReference,

    /** Scope label for structural violations (e.g., symbol name, directory) when file is empty */
    public readonly scope?: string,
  ) {}

  /**
   * Human-readable representation of this diagnostic.
   */
  toString(): string {
    if (this.scope && !this.file) {
      return `[${this.scope}] - error KS${this.code}: ${this.message}`;
    }
    return `${this.file}:${this.line}:${this.column} - error KS${this.code}: ${this.message}`;
  }
}
