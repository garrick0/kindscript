import { ConsolePort } from '../ports/console.port';

/**
 * Console adapter that writes to process.stderr.
 *
 * KindScript CLI writes all non-diagnostic output to stderr,
 * keeping stdout clean for potential machine-readable output.
 */
export class CLIConsoleAdapter implements ConsolePort {
  info(message: string): void {
    process.stderr.write(message + '\n');
  }

  error(message: string): void {
    process.stderr.write(message + '\n');
  }
}
