import { Diagnostic } from '../../domain/entities/diagnostic.js';

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
 * Use case for running the full scan → parse → bind → check pipeline.
 */
export interface PipelineUseCase {
  execute(request: PipelineRequest): PipelineResponse;
}
