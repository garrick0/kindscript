import * as nodePath from 'path';
import { CheckContractsUseCase } from '../../../application/use-cases/check-contracts/check-contracts.use-case';
import { ClassifyASTUseCase } from '../../../application/use-cases/classify-ast/classify-ast.use-case';
import { ConfigPort, KindScriptConfig } from '../../../application/ports/config.port';
import { DiagnosticPort } from '../../../application/ports/diagnostic.port';
import { FileSystemPort } from '../../../application/ports/filesystem.port';
import { TypeScriptPort } from '../../../application/ports/typescript.port';
import { ConfigSymbolBuilder } from '../../../application/services/config-symbol-builder';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { CompilerOptions } from '../../../domain/types/compiler-options';
import { resolvePackageDefinitions } from '../resolve-package-definitions';

/**
 * CLI command: ksc check
 *
 * Reads kindscript.json, builds symbols from config or definition files,
 * creates a TS program, checks contracts, and reports violations.
 *
 * Supports two tiers:
 * - Tier 1: Config-based contracts (kindscript.json "contracts" key)
 * - Tier 2: Kind definitions (kindscript.json "definitions" key)
 */
export class CheckCommand {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly configPort: ConfigPort,
    private readonly diagnosticPort: DiagnosticPort,
    private readonly fsPort: FileSystemPort,
    private readonly classifyService?: ClassifyASTUseCase,
    private readonly tsPort?: TypeScriptPort,
  ) {}

  execute(projectPath: string): number {
    const resolvedPath = nodePath.resolve(projectPath);

    // Read kindscript.json
    const ksConfig = this.configPort.readKindScriptConfig(resolvedPath);
    if (!ksConfig) {
      this.diagnosticPort.reportDiagnostics([]);
      process.stderr.write(`Error: No kindscript.json found in ${resolvedPath}\n`);
      return 1;
    }

    // Read tsconfig.json for compiler options and root files
    const tsconfigPath = nodePath.join(resolvedPath, 'tsconfig.json');
    const tsConfig = this.configPort.readTSConfig(tsconfigPath);

    // Merge compiler options
    const compilerOptions = {
      ...(tsConfig?.compilerOptions ?? {}),
      ...(ksConfig.compilerOptions ?? {}),
    };

    // Determine root files
    let rootFiles: string[];
    if (tsConfig?.files && tsConfig.files.length > 0) {
      rootFiles = tsConfig.files;
    } else {
      const rootDir = compilerOptions.rootDir
        ? nodePath.resolve(resolvedPath, compilerOptions.rootDir)
        : resolvedPath;
      rootFiles = this.fsPort.readDirectory(rootDir, true);
    }

    if (rootFiles.length === 0) {
      process.stderr.write('Error: No TypeScript files found.\n');
      return 1;
    }

    // Dispatch to Tier 2 (kind definitions) or Tier 1 (config contracts)
    if (ksConfig.definitions && ksConfig.definitions.length > 0 && this.classifyService && this.tsPort) {
      return this.executeTier2(ksConfig, resolvedPath, compilerOptions, rootFiles);
    }

    return this.executeTier1(ksConfig, resolvedPath, rootFiles);
  }

  /**
   * Tier 1: Config-based contracts (M1 path).
   */
  private executeTier1(
    ksConfig: KindScriptConfig,
    resolvedPath: string,
    rootFiles: string[],
  ): number {
    const builder = new ConfigSymbolBuilder();
    const buildResult = builder.build(ksConfig, resolvedPath);

    for (const error of buildResult.errors) {
      process.stderr.write(`Config error: ${error}\n`);
    }

    if (buildResult.contracts.length === 0) {
      process.stderr.write('No contracts defined in kindscript.json.\n');
      return 0;
    }

    return this.runCheck(buildResult.symbols, buildResult.contracts, ksConfig, rootFiles);
  }

  /**
   * Tier 2: Kind definitions parsed from TypeScript files.
   */
  private executeTier2(
    ksConfig: KindScriptConfig,
    resolvedPath: string,
    compilerOptions: CompilerOptions,
    rootFiles: string[],
  ): number {
    // Resolve package definition files (standard library packages)
    const packagePaths = resolvePackageDefinitions(ksConfig.packages ?? [], resolvedPath, this.fsPort);

    // Resolve definition file paths (package defs first, then user defs)
    const definitionPaths = [
      ...packagePaths,
      ...ksConfig.definitions!.map(d => nodePath.resolve(resolvedPath, d)),
    ];

    // Include definition files in the program
    const allRootFiles = [...new Set([...rootFiles, ...definitionPaths])];

    // Create TS program
    const program = this.tsPort!.createProgram(allRootFiles, compilerOptions);
    const checker = this.tsPort!.getTypeChecker(program);

    // Get source files for definitions
    const definitionSourceFiles = definitionPaths
      .map(path => this.tsPort!.getSourceFile(program, path))
      .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

    if (definitionSourceFiles.length === 0) {
      process.stderr.write('Error: Could not load any definition files.\n');
      return 1;
    }

    // Classify: extract symbols and contracts from definitions
    const classifyResult = this.classifyService!.execute({
      definitionFiles: definitionSourceFiles,
      checker,
      projectRoot: resolvedPath,
    });

    for (const error of classifyResult.errors) {
      process.stderr.write(`Classification error: ${error}\n`);
    }

    if (classifyResult.contracts.length === 0) {
      process.stderr.write('No contracts found in definition files.\n');
      return 0;
    }

    return this.runCheck(classifyResult.symbols, classifyResult.contracts, ksConfig, rootFiles);
  }

  private runCheck(
    symbols: ArchSymbol[],
    contracts: Contract[],
    config: KindScriptConfig,
    rootFiles: string[],
  ): number {
    const result = this.checkContracts.execute({
      symbols,
      contracts,
      config,
      programRootFiles: rootFiles,
    });

    if (result.diagnostics.length > 0) {
      this.diagnosticPort.reportDiagnostics(result.diagnostics);
      return 1;
    }

    process.stderr.write(
      `All architectural contracts satisfied. (${result.contractsChecked} contracts, ${result.filesAnalyzed} files)\n`
    );
    return 0;
  }
}
