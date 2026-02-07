import { ClassifyProjectRequest, ClassifyProjectResult } from './classify-project.types';

/**
 * Use case interface for classifying an entire project.
 *
 * Encapsulates the full workflow: read config → resolve definitions →
 * create TS program → classify definitions → return symbols + contracts.
 *
 * Used by CLI commands (check, scaffold) and any context that needs
 * the full project classification pipeline.
 */
export interface ClassifyProjectUseCase {
  execute(request: ClassifyProjectRequest): ClassifyProjectResult;
}
