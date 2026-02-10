import { ContractReference } from '../value-objects/contract-reference';
import { SourceRef } from '../value-objects/source-ref';

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

    /** Source location of the violation */
    public readonly source: SourceRef,

    /** Reference to the contract that was violated */
    public readonly relatedContract?: ContractReference,
  ) {}

  /** File where the violation occurred (empty string for structural violations). */
  get file(): string { return this.source.file; }

  /** Line number (1-indexed, 0 for structural violations). */
  get line(): number { return this.source.line; }

  /** Column number (0-indexed). */
  get column(): number { return this.source.column; }

  /** Scope label for structural violations. */
  get scope(): string | undefined { return this.source.scope; }

  /**
   * Human-readable representation of this diagnostic.
   */
  toString(): string {
    if (this.source.scope && !this.source.file) {
      return `[${this.source.scope}] - error KS${this.code}: ${this.message}`;
    }
    return `${this.source.file}:${this.source.line}:${this.source.column} - error KS${this.code}: ${this.message}`;
  }
}
