#!/usr/bin/env node

import { CheckCommand } from './commands/check.command';
import { CheckContractsService } from '../../application/use-cases/check-contracts/check-contracts.service';
import { createAllCheckers } from '../../application/use-cases/check-contracts/create-checkers';
import { ClassifyASTService } from '../../application/use-cases/classify-ast/classify-ast.service';
import { ClassifyProjectService } from '../../application/use-cases/classify-project/classify-project.service';
import { TypeScriptAdapter } from '../adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../adapters/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../adapters/config/config.adapter';
import { CLIDiagnosticAdapter } from '../adapters/cli/cli-diagnostic.adapter';
import { ASTAdapter } from '../adapters/ast/ast.adapter';

/**
 * Shared adapter instances created once per CLI invocation.
 */
interface Adapters {
  ts: TypeScriptAdapter;
  fs: FileSystemAdapter;
  config: ConfigAdapter;
  diagnostic: CLIDiagnosticAdapter;
  ast: ASTAdapter;
}

function createAdapters(): Adapters {
  return {
    ts: new TypeScriptAdapter(),
    fs: new FileSystemAdapter(),
    config: new ConfigAdapter(),
    diagnostic: new CLIDiagnosticAdapter(),
    ast: new ASTAdapter(),
  };
}

/**
 * KindScript CLI entry point.
 *
 * Composition root: wires up all real adapters and dispatches commands.
 */
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--version' || command === '-v') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../../../package.json');
    process.stdout.write(pkg.version + '\n');
    process.exit(0);
  }

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  const adapters = createAdapters();

  if (command === 'check') {
    const projectPath = args[1] || process.cwd();
    const exitCode = runCheck(projectPath, adapters);
    process.exit(exitCode);
  }

  process.stderr.write(`Unknown command: ${command}\n\n`);
  printUsage();
  process.exit(1);
}

function runCheck(projectPath: string, a: Adapters): number {
  const classifyAST = new ClassifyASTService(a.ast);
  const classifyProject = new ClassifyProjectService(a.config, a.fs, a.ts, classifyAST);
  const checkContracts = new CheckContractsService(createAllCheckers(), a.ts);

  const cmd = new CheckCommand(checkContracts, classifyProject, a.diagnostic, a.fs);
  return cmd.execute(projectPath);
}

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
