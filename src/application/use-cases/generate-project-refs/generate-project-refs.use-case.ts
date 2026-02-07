import { GenerateProjectRefsRequest, GenerateProjectRefsResponse } from './generate-project-refs.types';

/**
 * Use case interface for generating TypeScript project reference configs.
 *
 * Takes a detected architecture and generates per-layer tsconfig.json files
 * with project references for boundary enforcement.
 */
export interface GenerateProjectRefsUseCase {
  execute(request: GenerateProjectRefsRequest): GenerateProjectRefsResponse;
}
