#!/usr/bin/env node

import { CheckCommand } from './commands/check.command';
import { InitCommand } from './commands/init.command';
import { InferCommand } from './commands/infer.command';
import { ScaffoldCommand } from './commands/scaffold.command';
import { CheckContractsService } from '../../application/use-cases/check-contracts/check-contracts.service';
import { ClassifyASTService } from '../../application/use-cases/classify-ast/classify-ast.service';
import { DetectArchitectureService } from '../../application/use-cases/detect-architecture/detect-architecture.service';
import { GenerateProjectRefsService } from '../../application/use-cases/generate-project-refs/generate-project-refs.service';
import { InferArchitectureService } from '../../application/use-cases/infer-architecture/infer-architecture.service';
import { ScaffoldService } from '../../application/use-cases/scaffold/scaffold.service';
import { TypeScriptAdapter } from '../adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../adapters/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../adapters/config/config.adapter';
import { CLIDiagnosticAdapter } from '../adapters/cli/cli-diagnostic.adapter';
import { ASTAdapter } from '../adapters/ast/ast.adapter';

/**
 * KindScript CLI entry point.
 *
 * Composition root: wires up all real adapters and dispatches commands.
 */
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--version' || command === '-v') {
    process.stdout.write('0.8.0-m8\n');
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

  if (command === 'init') {
    const restArgs = args.slice(1);
    const detect = restArgs.includes('--detect');
    const write = restArgs.includes('--write');
    // Project path is the first non-flag argument after 'init'
    const projectPath = restArgs.find(a => !a.startsWith('--')) || process.cwd();
    const exitCode = runInit(projectPath, { detect, write });
    process.exit(exitCode);
  }

  if (command === 'infer') {
    const restArgs = args.slice(1);
    const write = restArgs.includes('--write');
    const projectPath = restArgs.find(a => !a.startsWith('--')) || process.cwd();
    const exitCode = runInfer(projectPath, { write });
    process.exit(exitCode);
  }

  if (command === 'scaffold') {
    const restArgs = args.slice(1);
    const write = restArgs.includes('--write');
    const instanceIdx = restArgs.indexOf('--instance');
    const instance = instanceIdx >= 0 ? restArgs[instanceIdx + 1] : undefined;
    const projectPath = restArgs.find(a =>
      !a.startsWith('--') && (instanceIdx < 0 || a !== restArgs[instanceIdx + 1])
    ) || process.cwd();
    const exitCode = runScaffold(projectPath, { write, instance });
    process.exit(exitCode);
  }

  process.stderr.write(`Unknown command: ${command}\n\n`);
  printUsage();
  process.exit(1);
}

function runCheck(projectPath: string): number {
  // Wire up real adapters (composition root)
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const configAdapter = new ConfigAdapter();
  const diagnosticAdapter = new CLIDiagnosticAdapter();
  const astAdapter = new ASTAdapter();

  const checkContractsService = new CheckContractsService(tsAdapter, fsAdapter);
  const classifyService = new ClassifyASTService(astAdapter);

  const checkCommand = new CheckCommand(
    checkContractsService,
    configAdapter,
    diagnosticAdapter,
    fsAdapter,
    classifyService,
    tsAdapter,
  );

  return checkCommand.execute(projectPath);
}

function runInit(projectPath: string, options: { detect: boolean; write: boolean }): number {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();

  const detectService = new DetectArchitectureService(fsAdapter, tsAdapter);
  const generateService = new GenerateProjectRefsService(fsAdapter);

  const initCommand = new InitCommand(
    detectService,
    generateService,
    fsAdapter
  );

  return initCommand.execute(projectPath, options);
}

function runInfer(projectPath: string, options: { write: boolean }): number {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();

  const detectService = new DetectArchitectureService(fsAdapter, tsAdapter);
  const inferService = new InferArchitectureService(detectService, fsAdapter);

  const inferCommand = new InferCommand(inferService, fsAdapter);
  return inferCommand.execute(projectPath, options);
}

function runScaffold(projectPath: string, options: { write: boolean; instance?: string }): number {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const configAdapter = new ConfigAdapter();
  const astAdapter = new ASTAdapter();

  const classifyService = new ClassifyASTService(astAdapter);
  const scaffoldService = new ScaffoldService(fsAdapter);

  const scaffoldCommand = new ScaffoldCommand(
    scaffoldService, classifyService, tsAdapter, configAdapter, fsAdapter
  );
  return scaffoldCommand.execute(projectPath, options);
}

function printUsage(): void {
  process.stderr.write(
    `KindScript - Architectural enforcement for TypeScript

Usage: ksc <command> [options]

Commands:
  check [path]                          Check architectural contracts (default: current directory)
  init --detect [--write]               Detect architecture and generate project references
  infer [path] [--write]                Infer architecture and generate Kind definitions
  scaffold [path] [--write] [--instance name]  Scaffold directories from Kind definitions

Options:
  -h, --help      Show this help message
  -v, --version   Show version number

Examples:
  ksc check                    Check current project
  ksc check ./my-project       Check specific project
  ksc init --detect            Detect architecture (dry run)
  ksc init --detect --write    Detect and write tsconfig files
  ksc infer                    Infer architecture (dry run)
  ksc infer --write            Infer and write architecture.ts
  ksc scaffold                 Show scaffold plan (dry run)
  ksc scaffold --write         Scaffold directories and stub files
`
  );
}

main();
