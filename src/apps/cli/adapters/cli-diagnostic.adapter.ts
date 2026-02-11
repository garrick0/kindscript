import { DiagnosticPort } from '../ports/diagnostic.port';
import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Real implementation of DiagnosticPort for CLI terminal output.
 *
 * Handles diagnostic formatting and I/O. Formatting logic lives here
 * (infrastructure layer) rather than on the Diagnostic entity (domain layer)
 * because formatting is a presentation concern.
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
    let result = diagnostic.toString();

    if (diagnostic.relatedContract) {
      result += `\n  Contract '${diagnostic.relatedContract.contractName}' (${diagnostic.relatedContract.contractType})`;
      if (diagnostic.relatedContract.location) {
        result += ` defined at ${diagnostic.relatedContract.location}`;
      }
    }

    return result;
  }

}
