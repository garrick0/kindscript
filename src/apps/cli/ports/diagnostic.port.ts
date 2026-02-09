import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Port defining how the CLI outputs diagnostics to the user.
 *
 * This interface is defined in the apps/cli layer and implemented
 * by CLIDiagnosticAdapter.
 */
export interface DiagnosticPort {
  /**
   * Report diagnostics to the output (console, editor, etc.).
   *
   * @param diagnostics - Array of diagnostics to report
   */
  reportDiagnostics(diagnostics: Diagnostic[]): void;
}
