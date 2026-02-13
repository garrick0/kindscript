#!/usr/bin/env node

import { createRequire } from 'module';
import { CheckCommand } from './commands/check.command.js';
import { CLIDiagnosticAdapter } from './adapters/cli-diagnostic.adapter.js';
import { CLIConsoleAdapter } from './adapters/cli-console.adapter.js';
import { createEngine } from '../../infrastructure/engine-factory.js';

const require = createRequire(import.meta.url);

/**
 * KindScript CLI entry point.
 *
 * Composition root: creates the shared Engine, then wires CLI-specific adapters.
 */
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--version' || command === '-v') {
    const pkg = require('../../../package.json');
    process.stdout.write(pkg.version + '\n');
    process.exit(0);
  }

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  if (command === 'check') {
    const projectPath = args[1] || process.cwd();
    const exitCode = runCheck(projectPath);
    process.exit(exitCode);
  }

  // Composition root — intentionally uses process.stderr directly (not ConsolePort)
  process.stderr.write(`Unknown command: ${command}\n\n`);
  printUsage();
  process.exit(1);
}

function runCheck(projectPath: string): number {
  const engine = createEngine();
  const diagnostic = new CLIDiagnosticAdapter();
  const console = new CLIConsoleAdapter();

  const cmd = new CheckCommand(engine.pipeline, diagnostic, console);
  return cmd.execute(projectPath);
}

// Composition root — intentionally uses process.stderr directly (not ConsolePort)
function printUsage(): void {
  process.stderr.write(
    `KindScript - Architectural enforcement for TypeScript

Usage: ksc <command> [options]

Commands:
  check [path]                          Check architectural contracts (default: current directory)

Options:
  -h, --help      Show this help message
  -v, --version   Show version number

Examples:
  ksc check                    Check current project
  ksc check ./my-project       Check specific project
`
  );
}

main();
