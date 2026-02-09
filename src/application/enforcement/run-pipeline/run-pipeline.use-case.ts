import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Request DTO for the pipeline.
 */
export interface PipelineRequest {
  projectRoot: string;
}

/**
 * Successful pipeline result.
 */
export interface PipelineSuccess {
  ok: true;
  diagnostics: Diagnostic[];
  contractsChecked: number;
  filesAnalyzed: number;
  classificationErrors: string[];
}

/**
 * Pipeline error result.
 */
export interface PipelineError {
  ok: false;
  error: string;
}

/**
 * Discriminated union result type.
 */
export type PipelineResponse = PipelineSuccess | PipelineError;

/**
 * Use case for running the full classify → resolve → check pipeline.
 *
 * Encapsulates the 3-step orchestration that was previously duplicated
 * between CLI and plugin. Both apps now delegate to this.
 */
export interface RunPipelineUseCase {
  execute(request: PipelineRequest): PipelineResponse;
}
