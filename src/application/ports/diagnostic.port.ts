import { Diagnostic } from '../../domain/entities/diagnostic';

/**
 * Port defining how KindScript outputs diagnostics to the user.
 *
 * This interface is defined in the application layer and implemented
 * in the infrastructure layer (e.g., CLI adapter, plugin adapter).
 */
export interface DiagnosticPort {
  /**
   * Report diagnostics to the output (console, editor, etc.).
   *
   * @param diagnostics - Array of diagnostics to report
   */
  reportDiagnostics(diagnostics: Diagnostic[]): void;
}
