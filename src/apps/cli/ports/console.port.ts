/**
 * Port for console output in the CLI application.
 *
 * Abstracts process.stderr.write so CheckCommand can be tested
 * without capturing global process streams.
 */
export interface ConsolePort {
  info(message: string): void;
  error(message: string): void;
}
