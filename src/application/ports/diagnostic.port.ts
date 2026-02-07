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

  /**
   * Format a single diagnostic for display.
   *
   * @param diagnostic - The diagnostic to format
   * @returns Formatted string
   */
  formatDiagnostic(diagnostic: Diagnostic): string;

  /**
   * Format a diagnostic with source code context.
   *
   * This shows the relevant line of code with a pointer to the error.
   *
   * @param diagnostic - The diagnostic to format
   * @param sourceText - The source code text
   * @returns Formatted string with context
   */
  formatWithContext(diagnostic: Diagnostic, sourceText: string): string;
}
