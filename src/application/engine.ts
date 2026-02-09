import { CheckContractsUseCase } from './enforcement/check-contracts/check-contracts.use-case';
import { ContractPlugin } from './enforcement/check-contracts/contract-plugin';
import { ClassifyProjectUseCase } from './classification/classify-project/classify-project.use-case';
import { RunPipelineUseCase } from './enforcement/run-pipeline/run-pipeline.use-case';
import { FileSystemPort } from './ports/filesystem.port';
import { TypeScriptPort } from './ports/typescript.port';

/**
 * Engine bundles the shared core services that both CLI and plugin need.
 *
 * Each app (CLI, plugin) creates an Engine via the factory in infrastructure,
 * then wires its own app-specific adapters on top.
 */
export interface Engine {
  readonly classifyProject: ClassifyProjectUseCase;
  readonly checkContracts: CheckContractsUseCase;
  readonly runPipeline: RunPipelineUseCase;
  readonly plugins: ContractPlugin[];
  readonly fs: FileSystemPort;
  readonly ts: TypeScriptPort;
}
