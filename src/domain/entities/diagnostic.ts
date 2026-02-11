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
