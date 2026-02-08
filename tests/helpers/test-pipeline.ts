import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { createAllCheckers } from '../../src/application/use-cases/check-contracts/create-checkers';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { ConfigAdapter } from '../../src/infrastructure/adapters/config/config.adapter';
import { ClassifyASTResponse } from '../../src/application/use-cases/classify-ast/classify-ast.types';
import { CheckContractsResponse } from '../../src/application/use-cases/check-contracts/check-contracts.response';
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
  const configAdapter = new ConfigAdapter();
  const classifyService = new ClassifyASTService(astAdapter);
  const checkService = new CheckContractsService(createAllCheckers(), tsAdapter);

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
 * Discover .k.ts definition files within a fixture directory.
 */
function discoverDefinitionFiles(pipeline: TestPipeline, fixturePath: string): string[] {
  const allFiles = pipeline.fsAdapter.readDirectory(fixturePath, true);
  return allFiles.filter(f => f.endsWith('.k.ts'));
}

/**
 * Classify a fixture's .k.ts definition files
 */
export function classifyFixture(
  pipeline: TestPipeline,
  fixturePath: string
): ClassifyASTResponse {
  const allFiles = pipeline.fsAdapter.readDirectory(fixturePath, true);
  const definitionFiles = discoverDefinitionFiles(pipeline, fixturePath);

  if (definitionFiles.length === 0) {
    throw new Error(`No .k.ts definition files found in: ${fixturePath}`);
  }

  const allRootFiles = [...new Set([...allFiles])];
  const program = pipeline.tsAdapter.createProgram(allRootFiles, {});
  const checker = pipeline.tsAdapter.getTypeChecker(program);

  const sourceFiles = definitionFiles
    .map(f => pipeline.tsAdapter.getSourceFile(program, f))
    .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

  if (sourceFiles.length === 0) {
    throw new Error(`Could not load any .k.ts source files in: ${fixturePath}`);
  }

  return pipeline.classifyService.execute({
    definitionFiles: sourceFiles,
    checker,
    projectRoot: fixturePath,
  });
}

/**
 * Run the full classify + check pipeline on a fixture
 */
export function runFullPipeline(
  pipeline: TestPipeline,
  fixturePath: string
): { classifyResult: ClassifyASTResponse; checkResult: CheckContractsResponse } {
  const allFiles = pipeline.fsAdapter.readDirectory(fixturePath, true);
  const definitionFiles = discoverDefinitionFiles(pipeline, fixturePath);

  if (definitionFiles.length === 0) {
    throw new Error(`No .k.ts definition files found in: ${fixturePath}`);
  }

  const allRootFiles = [...new Set([...allFiles])];
  const program = pipeline.tsAdapter.createProgram(allRootFiles, {});
  const checker = pipeline.tsAdapter.getTypeChecker(program);

  const sourceFiles = definitionFiles
    .map(f => pipeline.tsAdapter.getSourceFile(program, f))
    .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

  if (sourceFiles.length === 0) {
    throw new Error(`Could not load any .k.ts source files in: ${fixturePath}`);
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
