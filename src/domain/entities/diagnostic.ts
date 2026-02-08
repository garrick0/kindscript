import { ImportEdge } from '../value-objects/import-edge';
import { Contract } from './contract';
import { ContractReference } from '../value-objects/contract-reference';
import { DiagnosticCode } from '../constants/diagnostic-codes';

/**
 * Domain entity representing an architectural violation diagnostic.
 *
 * Diagnostics are created when contracts are violated. They follow
 * TypeScript's diagnostic format for compatibility.
 *
 * This is a pure domain entity with factory methods for common diagnostic types.
 */
export class Diagnostic {
  constructor(
    /** Human-readable error message */
    public readonly message: string,

    /** Numeric error code (70001-70999 for KindScript) */
    public readonly code: number,

    /** File where the violation occurred */
    public readonly file: string,

    /** Line number (1-indexed) */
    public readonly line: number,

    /** Column number (0-indexed) */
    public readonly column: number,

    /** Reference to the contract that was violated */
    public readonly relatedContract?: ContractReference
  ) {}

  // Factory methods for common diagnostic types

  /**
   * Create a diagnostic for a forbidden dependency violation.
   */
  static forbiddenDependency(edge: ImportEdge, contract: Contract): Diagnostic {
    return new Diagnostic(
      `Forbidden dependency: ${edge.sourceFile} → ${edge.targetFile}`,
      DiagnosticCode.ForbiddenDependency,
      edge.sourceFile,
      edge.line,
      edge.column,
      contract.toReference()
    );
  }

  /**
   * Create a diagnostic for a missing implementation (mustImplement violation).
   */
  static missingImplementation(
    portName: string,
    expectedLocation: string,
    contract: Contract
  ): Diagnostic {
    return new Diagnostic(
      `Port '${portName}' has no corresponding adapter implementation (expected in '${expectedLocation}')`,
      DiagnosticCode.MissingImplementation,
      contract.location || '<unknown>',
      0,
      0,
      contract.toReference()
    );
  }

  /**
   * Create a diagnostic for an impure import (purity violation).
   */
  static impureImport(
    sourceFile: string,
    importedModule: string,
    line: number,
    column: number,
    contract: Contract
  ): Diagnostic {
    return new Diagnostic(
      `Impure import in pure layer: '${importedModule}'`,
      DiagnosticCode.ImpureImport,
      sourceFile,
      line,
      column,
      contract.toReference()
    );
  }

  /**
   * Create a diagnostic for a circular dependency (noCycles violation).
   */
  static circularDependency(
    cycle: string[],
    contract: Contract
  ): Diagnostic {
    const cycleStr = cycle.join(' → ') + ' → ' + cycle[0];
    return new Diagnostic(
      `Circular dependency detected: ${cycleStr}`,
      DiagnosticCode.CircularDependency,
      cycle[0],
      0,
      0,
      contract.toReference()
    );
  }

  /**
   * Create a diagnostic for a mirrors constraint violation (missing counterpart file).
   */
  static mirrorMismatch(
    primaryFile: string,
    expectedFile: string,
    contract: Contract
  ): Diagnostic {
    return new Diagnostic(
      `File '${primaryFile}' has no counterpart at '${expectedFile}'`,
      DiagnosticCode.MirrorMismatch,
      primaryFile,
      0,
      0,
      contract.toReference()
    );
  }

  /**
   * Create a diagnostic for a missing derived location (existence check).
   */
  static locationNotFound(
    derivedPath: string,
    memberName: string,
    kindTypeName: string,
    rootLocation: string,
  ): Diagnostic {
    return new Diagnostic(
      `Derived location '${derivedPath}' does not exist. ` +
      `Expected directory for member '${memberName}' of ${kindTypeName} ` +
      `(derived from root '${rootLocation}').`,
      DiagnosticCode.LocationNotFound,
      derivedPath,
      0,
      0,
    );
  }

  /**
   * Human-readable representation of this diagnostic.
   */
  toString(): string {
    return `${this.file}:${this.line}:${this.column} - error KS${this.code}: ${this.message}`;
  }
}
