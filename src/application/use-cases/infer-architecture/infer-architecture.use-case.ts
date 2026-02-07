import { InferArchitectureRequest, InferArchitectureResponse } from './infer-architecture.types';

/**
 * Use case interface for inferring architecture and generating Kind definitions.
 *
 * Wraps DetectArchitectureUseCase with code generation — produces a complete
 * architecture.ts file from detected layers and dependency graph.
 */
export interface InferArchitectureUseCase {
  execute(request: InferArchitectureRequest): InferArchitectureResponse;
}
