import { DiagnosticPort } from '../../../application/ports/diagnostic.port';
import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Mock implementation of DiagnosticPort for testing.
 *
 * Captures diagnostics that are reported, allowing tests
 * to assert on what diagnostics were produced.
 */
export class MockDiagnosticAdapter implements DiagnosticPort {
  private reported: Diagnostic[] = [];
  private formatted: string[] = [];

  /**
   * Get all diagnostics that were reported.
   */
  getReported(): Diagnostic[] {
    return [...this.reported];
  }

  /**
   * Get all formatted diagnostic strings.
   */
  getFormatted(): string[] {
    return [...this.formatted];
  }

  /**
   * Reset all captured data (for test isolation).
   */
  reset(): void {
    this.reported = [];
    this.formatted = [];
  }

  reportDiagnostics(diagnostics: Diagnostic[]): void {
    this.reported.push(...diagnostics);
  }

  formatDiagnostic(diagnostic: Diagnostic): string {
    const formatted = diagnostic.toString();
    this.formatted.push(formatted);
    return formatted;
  }

  formatWithContext(diagnostic: Diagnostic, sourceText: string): string {
    const lines = sourceText.split('\n');
    const lineIndex = diagnostic.line - 1;
    const lineText = lines[lineIndex] || '';
    const lineNumber = String(diagnostic.line);
    const padding = ' '.repeat(lineNumber.length);

    const formatted = [
      diagnostic.toString(),
      '',
      `  ${lineNumber} | ${lineText}`,
      `  ${padding} | ${' '.repeat(diagnostic.column)}^`,
    ].join('\n');
    this.formatted.push(formatted);
    return formatted;
  }
}
