import { DetectArchitectureRequest, DetectArchitectureResponse } from './detect-architecture.types';

/**
 * Use case interface for detecting architectural patterns in a project.
 *
 * Analyzes directory structure and import graph to identify
 * architectural patterns (Clean Architecture, Hexagonal, Layered).
 */
export interface DetectArchitectureUseCase {
  execute(request: DetectArchitectureRequest): DetectArchitectureResponse;
}
