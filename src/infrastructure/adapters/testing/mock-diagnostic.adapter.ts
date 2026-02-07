import { DiagnosticPort } from '../../../application/ports/diagnostic.port';
import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Mock implementation of DiagnosticPort for testing.
 *
 * This adapter captures diagnostics that are reported, allowing tests
 * to assert on what diagnostics were produced.
 *
 * Provides helper methods to access the captured diagnostics:
 * ```typescript
 * const reported = mockDiagnostic.getReported();
 * expect(reported).toHaveLength(1);
 * expect(reported[0].code).toBe(70001);
 * ```
 */
export class MockDiagnosticAdapter implements DiagnosticPort {
  private reported: Diagnostic[] = [];
  private formatted: string[] = [];

  // Test helper methods

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

  // Implement DiagnosticPort interface

  reportDiagnostics(diagnostics: Diagnostic[]): void {
    this.reported.push(...diagnostics);
  }

  formatDiagnostic(diagnostic: Diagnostic): string {
    const formatted = `${diagnostic.file}:${diagnostic.line}:${diagnostic.column} - error KS${diagnostic.code}: ${diagnostic.message}`;
    this.formatted.push(formatted);
    return formatted;
  }

  formatWithContext(diagnostic: Diagnostic, sourceText: string): string {
    const lines = sourceText.split('\n');
    const lineIndex = diagnostic.line - 1; // Convert to 0-indexed
    const lineText = lines[lineIndex] || '';

    const lineNumber = String(diagnostic.line);
    const padding = ' '.repeat(lineNumber.length);

    const formatted = [
      this.formatDiagnostic(diagnostic),
      '',
      `  ${lineNumber} | ${lineText}`,
      `  ${padding} | ${' '.repeat(diagnostic.column)}^`,
    ].join('\n');

    this.formatted.push(formatted);
    return formatted;
  }
}
