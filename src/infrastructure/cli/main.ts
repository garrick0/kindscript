#!/usr/bin/env node

import { CheckCommand } from './commands/check.command';
import { InitCommand } from './commands/init.command';
import { InferCommand } from './commands/infer.command';
import { CheckContractsService } from '../../application/use-cases/check-contracts/check-contracts.service';
import { ClassifyASTService } from '../../application/use-cases/classify-ast/classify-ast.service';
import { ClassifyProjectService } from '../../application/use-cases/classify-project/classify-project.service';
import { DetectArchitectureService } from '../../application/use-cases/detect-architecture/detect-architecture.service';
import { GenerateProjectRefsService } from '../../application/use-cases/generate-project-refs/generate-project-refs.service';
import { InferArchitectureService } from '../../application/use-cases/infer-architecture/infer-architecture.service';
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

  if (command === 'init') {
    const restArgs = args.slice(1);
    const detect = restArgs.includes('--detect');
    const write = restArgs.includes('--write');
    // Project path is the first non-flag argument after 'init'
    const projectPath = restArgs.find(a => !a.startsWith('--')) || process.cwd();
    const exitCode = runInit(projectPath, { detect, write }, adapters);
    process.exit(exitCode);
  }

  if (command === 'infer') {
    const restArgs = args.slice(1);
    const write = restArgs.includes('--write');
    const projectPath = restArgs.find(a => !a.startsWith('--')) || process.cwd();
    const exitCode = runInfer(projectPath, { write }, adapters);
    process.exit(exitCode);
  }

  process.stderr.write(`Unknown command: ${command}\n\n`);
  printUsage();
  process.exit(1);
}

function runCheck(projectPath: string, a: Adapters): number {
  const classifyAST = new ClassifyASTService(a.ast);
  const classifyProject = new ClassifyProjectService(a.config, a.fs, a.ts, classifyAST);
  const checkContracts = new CheckContractsService(a.ts, a.fs);

  const cmd = new CheckCommand(checkContracts, classifyProject, a.diagnostic);
  return cmd.execute(projectPath);
}

function runInit(projectPath: string, options: { detect: boolean; write: boolean }, a: Adapters): number {
  const detectService = new DetectArchitectureService(a.fs, a.ts);
  const generateService = new GenerateProjectRefsService(a.fs);

  const initCommand = new InitCommand(
    detectService,
    generateService,
    a.fs
  );

  return initCommand.execute(projectPath, options);
}

function runInfer(projectPath: string, options: { write: boolean }, a: Adapters): number {
  const detectService = new DetectArchitectureService(a.fs, a.ts);
  const inferService = new InferArchitectureService(detectService, a.fs);

  const cmd = new InferCommand(inferService, a.fs, a.config);
  return cmd.execute(projectPath, options);
}

function printUsage(): void {
  process.stderr.write(
    `KindScript - Architectural enforcement for TypeScript

Usage: ksc <command> [options]

Commands:
  check [path]                          Check architectural contracts (default: current directory)
  init --detect [--write]               Detect architecture and generate project references
  infer [path] [--write]                Infer architecture and generate Kind definitions

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
`
  );
}

main();
