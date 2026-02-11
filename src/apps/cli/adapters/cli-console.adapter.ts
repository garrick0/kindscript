import { ConsolePort } from '../ports/console.port';

/**
 * Console adapter that writes info to stdout and errors to stderr.
 *
 * Follows Unix convention: informational output goes to stdout,
 * error output goes to stderr.
 */
export class CLIConsoleAdapter implements ConsolePort {
  info(message: string): void {
    process.stdout.write(message + '\n');
  }

  error(message: string): void {
    process.stderr.write(message + '\n');
  }
}
