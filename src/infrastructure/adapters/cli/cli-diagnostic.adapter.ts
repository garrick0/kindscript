import { DiagnosticPort } from '../../../application/ports/diagnostic.port';
import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Real implementation of DiagnosticPort for CLI terminal output.
 *
 * Formats diagnostics in TypeScript-style output and writes to stderr.
 */
export class CLIDiagnosticAdapter implements DiagnosticPort {
  private readonly writer: (msg: string) => void;

  constructor(writer?: (msg: string) => void) {
    this.writer = writer ?? ((msg: string) => process.stderr.write(msg + '\n'));
  }

  reportDiagnostics(diagnostics: Diagnostic[]): void {
    for (const diag of diagnostics) {
      this.writer(this.formatDiagnostic(diag));
    }

    if (diagnostics.length > 0) {
      this.writer('');
      this.writer(`Found ${diagnostics.length} architectural violation(s).`);
    }
  }

  formatDiagnostic(diagnostic: Diagnostic): string {
    const parts = [
      `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}`,
      ' - ',
      `error KS${diagnostic.code}: `,
      diagnostic.message,
    ];

    let result = parts.join('');

    if (diagnostic.relatedContract) {
      result += `\n  Contract '${diagnostic.relatedContract.contractName}' (${diagnostic.relatedContract.contractType})`;
      if (diagnostic.relatedContract.location) {
        result += ` defined at ${diagnostic.relatedContract.location}`;
      }
    }

    return result;
  }

  formatWithContext(diagnostic: Diagnostic, sourceText: string): string {
    const lines = sourceText.split('\n');
    const lineIndex = diagnostic.line - 1;
    const lineText = lines[lineIndex] || '';
    const lineNumber = String(diagnostic.line);
    const padding = ' '.repeat(lineNumber.length);

    return [
      this.formatDiagnostic(diagnostic),
      '',
      `  ${lineNumber} | ${lineText}`,
      `  ${padding} | ${' '.repeat(diagnostic.column)}^`,
    ].join('\n');
  }
}
