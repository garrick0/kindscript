import { DetectedArchitecture } from '../../../domain/entities/detected-architecture';
import { InferredDefinitions } from '../../../domain/value-objects/inferred-definitions';

/**
 * Request DTO for the InferArchitecture use case.
 */
export interface InferArchitectureRequest {
  /** The root path of the project to analyze */
  projectRoot: string;

  /** Optional subdirectory to use as the source root (e.g., 'src') */
  srcDir?: string;
}

/**
 * Response DTO for the InferArchitecture use case.
 */
export interface InferArchitectureResponse {
  /** The generated Kind definitions */
  definitions: InferredDefinitions;

  /** The detected architecture (from DetectArchitectureService) */
  detected: DetectedArchitecture;

  /** Any warnings generated during inference */
  warnings: string[];
}
