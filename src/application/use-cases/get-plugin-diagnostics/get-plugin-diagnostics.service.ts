import * as nodePath from 'path';
import { GetPluginDiagnosticsUseCase } from './get-plugin-diagnostics.use-case';
import { GetPluginDiagnosticsRequest, GetPluginDiagnosticsResponse } from './get-plugin-diagnostics.types';
import { CheckContractsUseCase } from '../check-contracts/check-contracts.use-case';
import { ClassifyASTUseCase } from '../classify-ast/classify-ast.use-case';
import { ConfigPort } from '../../ports/config.port';
import { TypeScriptPort } from '../../ports/typescript.port';
import { FileSystemPort } from '../../ports/filesystem.port';
import { ConfigSymbolBuilder } from '../../services/config-symbol-builder';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Cached classification result to avoid re-classifying on every keystroke.
 */
interface ClassifyCache {
  /** Hash of definition file paths for cache invalidation */
  definitionKey: string;
  /** Symbols extracted from classification */
  symbols: ArchSymbol[];
  /** Contracts extracted from classification */
  contracts: Contract[];
}

/**
 * Implementation of GetPluginDiagnosticsUseCase.
 *
 * Checks architectural contracts for a single file, with caching
 * to ensure responsive performance in the editor.
 *
 * Supports both Tier 1 (config-based) and Tier 2 (definition-based) contracts.
 */
export class GetPluginDiagnosticsService implements GetPluginDiagnosticsUseCase {
  private classifyCache: ClassifyCache | undefined;

  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly configPort: ConfigPort,
    private readonly fsPort: FileSystemPort,
    private readonly classifyService?: ClassifyASTUseCase,
    private readonly tsPort?: TypeScriptPort,
  ) {}

  execute(request: GetPluginDiagnosticsRequest): GetPluginDiagnosticsResponse {
    const startTime = Date.now();

    try {
      const diagnostics = this.getDiagnostics(request);
      return {
        diagnostics,
        elapsedMs: Date.now() - startTime,
      };
    } catch {
      // Never crash — return empty diagnostics on error
      return {
        diagnostics: [],
        elapsedMs: Date.now() - startTime,
      };
    }
  }

  private getDiagnostics(request: GetPluginDiagnosticsRequest): Diagnostic[] {
    // Read kindscript.json
    const ksConfig = this.configPort.readKindScriptConfig(request.projectRoot);
    if (!ksConfig) {
      return [];
    }

    // Read tsconfig.json for compiler options and root files
    const tsconfigPath = nodePath.join(request.projectRoot, 'tsconfig.json');
    const tsConfig = this.configPort.readTSConfig(tsconfigPath);

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
        ? nodePath.resolve(request.projectRoot, compilerOptions.rootDir)
        : request.projectRoot;
      rootFiles = this.fsPort.readDirectory(rootDir, true);
    }

    if (rootFiles.length === 0) {
      return [];
    }

    // Get symbols and contracts (Tier 2 or Tier 1)
    let symbols: ArchSymbol[];
    let contracts: Contract[];

    if (ksConfig.definitions && ksConfig.definitions.length > 0 && this.classifyService && this.tsPort) {
      const result = this.getFromTier2(ksConfig.definitions, request.projectRoot, compilerOptions, rootFiles);
      symbols = result.symbols;
      contracts = result.contracts;
    } else {
      const builder = new ConfigSymbolBuilder();
      const buildResult = builder.build(ksConfig, request.projectRoot);
      symbols = buildResult.symbols;
      contracts = buildResult.contracts;
    }

    if (contracts.length === 0) {
      return [];
    }

    // Run the check
    const result = this.checkContracts.execute({
      symbols,
      contracts,
      config: ksConfig,
      programRootFiles: rootFiles,
    });

    // Filter diagnostics to only those relevant to the requested file
    return result.diagnostics.filter(d => this.isRelevantToFile(d, request.fileName));
  }

  private getFromTier2(
    definitions: string[],
    projectRoot: string,
    compilerOptions: Record<string, unknown>,
    rootFiles: string[]
  ): { symbols: ArchSymbol[]; contracts: Contract[] } {
    const definitionPaths = definitions.map(d => nodePath.resolve(projectRoot, d));
    const definitionKey = definitionPaths.sort().join('|');

    // Use cached result if definition files haven't changed
    if (this.classifyCache && this.classifyCache.definitionKey === definitionKey) {
      return {
        symbols: this.classifyCache.symbols,
        contracts: this.classifyCache.contracts,
      };
    }

    const allRootFiles = [...new Set([...rootFiles, ...definitionPaths])];
    const program = this.tsPort!.createProgram(allRootFiles, compilerOptions);
    const checker = this.tsPort!.getTypeChecker(program);

    const definitionSourceFiles = definitionPaths
      .map(path => this.tsPort!.getSourceFile(program, path))
      .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

    if (definitionSourceFiles.length === 0) {
      return { symbols: [], contracts: [] };
    }

    const classifyResult = this.classifyService!.execute({
      definitionFiles: definitionSourceFiles,
      checker,
      projectRoot,
    });

    // Cache the result
    this.classifyCache = {
      definitionKey,
      symbols: classifyResult.symbols,
      contracts: classifyResult.contracts,
    };

    return {
      symbols: classifyResult.symbols,
      contracts: classifyResult.contracts,
    };
  }

  /**
   * Check if a diagnostic is relevant to a specific file.
   *
   * A diagnostic is relevant if it was reported for the requested file.
   */
  private isRelevantToFile(diagnostic: Diagnostic, fileName: string): boolean {
    const normalizedDiagFile = diagnostic.file.replace(/\\/g, '/');
    const normalizedFileName = fileName.replace(/\\/g, '/');
    return normalizedDiagFile === normalizedFileName;
  }
}
