import { ClassifyASTService } from '../../src/application/classification/classify-ast/classify-ast.service';
import { CheckContractsService } from '../../src/application/enforcement/check-contracts/check-contracts.service';
import { createAllPlugins } from '../../src/application/enforcement/check-contracts/plugin-registry';
import { TypeScriptAdapter } from '../../src/infrastructure/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/ast/ast.adapter';
import { ConfigAdapter } from '../../src/infrastructure/config/config.adapter';
import { ClassifyASTResponse } from '../../src/application/classification/classify-ast/classify-ast.types';
import { CheckContractsResponse } from '../../src/application/enforcement/check-contracts/check-contracts.response';
import { resolveSymbolFiles } from '../../src/application/services/resolve-symbol-files';

/**
 * Standard integration test services
 */
export interface TestPipeline {
  tsAdapter: TypeScriptAdapter;
  fsAdapter: FileSystemAdapter;
  astAdapter: ASTAdapter;
  configAdapter: ConfigAdapter;
  classifyService: ClassifyASTService;
  checkService: CheckContractsService;
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
  const classifyService = new ClassifyASTService(astAdapter, plugins);
  const checkService = new CheckContractsService(plugins, tsAdapter);

  return {
    tsAdapter,
    fsAdapter,
    astAdapter,
    configAdapter,
    classifyService,
    checkService,
  };
}

/**
 * Run the full classify + check pipeline on a fixture
 */
export function runFullPipeline(
  pipeline: TestPipeline,
  fixturePath: string
): { classifyResult: ClassifyASTResponse; checkResult: CheckContractsResponse } {
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

  const classifyResult = pipeline.classifyService.execute({
    definitionFiles: sourceFiles,
    checker,
    projectRoot: fixturePath,
  });

  const resolvedFiles = resolveSymbolFiles(classifyResult.symbols, pipeline.fsAdapter);

  const checkResult = pipeline.checkService.execute({
    symbols: classifyResult.symbols,
    contracts: classifyResult.contracts,
    config: {},
    program,
    resolvedFiles,
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
