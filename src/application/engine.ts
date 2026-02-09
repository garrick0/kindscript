import { PipelineUseCase } from './pipeline/pipeline.types';
import { ContractPlugin } from './pipeline/plugins/contract-plugin';

/**
 * Engine bundles the shared core services that both CLI and plugin need.
 *
 * Each app (CLI, plugin) creates an Engine via the factory in infrastructure,
 * then wires its own app-specific adapters on top.
 */
export interface Engine {
  readonly pipeline: PipelineUseCase;
  readonly plugins: ContractPlugin[];
}
