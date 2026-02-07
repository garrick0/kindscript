import * as path from 'path';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { ConfigAdapter } from '../../src/infrastructure/adapters/config/config.adapter';
import { ClassifyASTResponse } from '../../src/application/use-cases/classify-ast/classify-ast.types';
import { CheckContractsResponse } from '../../src/application/use-cases/check-contracts/check-contracts.response';

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
  const checkService = new CheckContractsService(tsAdapter, fsAdapter);

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
 * Classify a fixture's architecture.ts file
 */
export function classifyFixture(
  pipeline: TestPipeline,
  fixturePath: string
): ClassifyASTResponse {
  const archFile = path.join(fixturePath, 'architecture.ts');
  const srcFiles = pipeline.fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);
  const allRootFiles = [...new Set([...srcFiles, archFile])];

  const program = pipeline.tsAdapter.createProgram(allRootFiles, {});
  const checker = pipeline.tsAdapter.getTypeChecker(program);
  const sourceFile = pipeline.tsAdapter.getSourceFile(program, archFile);

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${archFile}`);
  }

  return pipeline.classifyService.execute({
    definitionFiles: [sourceFile],
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
  const archFile = path.join(fixturePath, 'architecture.ts');
  const srcFiles = pipeline.fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);
  const allRootFiles = [...new Set([...srcFiles, archFile])];

  const program = pipeline.tsAdapter.createProgram(allRootFiles, {});
  const checker = pipeline.tsAdapter.getTypeChecker(program);
  const sourceFile = pipeline.tsAdapter.getSourceFile(program, archFile);

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${archFile}`);
  }

  const classifyResult = pipeline.classifyService.execute({
    definitionFiles: [sourceFile],
    checker,
    projectRoot: fixturePath,
  });

  const checkResult = pipeline.checkService.execute({
    symbols: classifyResult.symbols,
    contracts: classifyResult.contracts,
    config: {},
    program,
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
