import { ScanService } from '../../src/application/pipeline/scan/scan.service';
import { ParseService } from '../../src/application/pipeline/parse/parse.service';
import { BindService } from '../../src/application/pipeline/bind/bind.service';
import { CheckerService } from '../../src/application/pipeline/check/checker.service';
import { CheckerResponse } from '../../src/application/pipeline/check/checker.response';
import { createAllPlugins } from '../../src/application/pipeline/plugins/plugin-registry';
import { TypeScriptAdapter } from '../../src/infrastructure/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/ast/ast.adapter';
import { ConfigAdapter } from '../../src/infrastructure/config/config.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { Contract } from '../../src/domain/entities/contract';

/**
 * Standard integration test services
 */
export interface TestPipeline {
  tsAdapter: TypeScriptAdapter;
  fsAdapter: FileSystemAdapter;
  astAdapter: ASTAdapter;
  configAdapter: ConfigAdapter;
  scanService: ScanService;
  parseService: ParseService;
  bindService: BindService;
  checkService: CheckerService;
}

/**
 * Create a new test pipeline with fresh service instances
 */
export function createTestPipeline(): TestPipeline {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const astAdapter = new ASTAdapter();
  const configAdapter = new ConfigAdapter(fsAdapter);
  const plugins = createAllPlugins();
  const scanService = new ScanService(astAdapter);
  const parseService = new ParseService();
  const bindService = new BindService(plugins, fsAdapter);
  const checkService = new CheckerService(plugins, tsAdapter);

  return {
    tsAdapter,
    fsAdapter,
    astAdapter,
    configAdapter,
    scanService,
    parseService,
    bindService,
    checkService,
  };
}

/**
 * Result of running the full pipeline on a fixture.
 */
export interface FullPipelineResult {
  symbols: ArchSymbol[];
  contracts: Contract[];
  instanceTypeNames: Map<string, string>;
  classificationErrors: string[];
  checkResult: CheckerResponse;
}

/**
 * Run the full scan → parse → bind → check pipeline on a fixture.
 */
export function runFullPipeline(
  pipeline: TestPipeline,
  fixturePath: string
): { classifyResult: { symbols: ArchSymbol[]; contracts: Contract[]; instanceTypeNames: Map<string, string>; errors: string[] }; checkResult: CheckerResponse } {
  const allFiles = pipeline.fsAdapter.readDirectory(fixturePath, true);

  if (allFiles.length === 0) {
    throw new Error(`No source files found in: ${fixturePath}`);
  }

  const program = pipeline.tsAdapter.createProgram(allFiles, {});
  const checker = pipeline.tsAdapter.getTypeChecker(program);

  const sourceFiles = allFiles
    .map(f => pipeline.tsAdapter.getSourceFile(program, f))
    .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

  if (sourceFiles.length === 0) {
    throw new Error(`Could not load any source files in: ${fixturePath}`);
  }

  // Stage 1: Scan
  const scanResult = pipeline.scanService.execute({ sourceFiles, checker });

  // Stage 2: Parse
  const parseResult = pipeline.parseService.execute(scanResult);

  // Stage 3: Bind (includes name resolution + contract generation)
  const bindResult = pipeline.bindService.execute(parseResult, scanResult);

  // Combined classify result (convenience shape for test assertions)
  const classifyResult = {
    symbols: parseResult.symbols,
    contracts: bindResult.contracts,
    instanceTypeNames: parseResult.instanceTypeNames,
    errors: [...scanResult.errors, ...parseResult.errors, ...bindResult.errors],
  };

  // Stage 4: Check
  const checkResult = pipeline.checkService.execute({
    symbols: parseResult.symbols,
    contracts: bindResult.contracts,
    config: {},
    program,
    resolvedFiles: bindResult.resolvedFiles,
    containerFiles: bindResult.containerFiles,
    declarationOwnership: bindResult.declarationOwnership,
  });

  return { classifyResult, checkResult };
}

/**
 * Create a simpler pipeline (without check service) for classification-only tests
 */
export function runPipeline(fixturePath: string) {
  const pipeline = createTestPipeline();
  return runFullPipeline(pipeline, fixturePath);
}
