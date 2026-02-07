import { DetectedArchitecture } from '../../../domain/entities/detected-architecture';
import { GeneratedTSConfig } from '../../../domain/value-objects/generated-tsconfig';

/**
 * Request DTO for the GenerateProjectRefs use case.
 */
export interface GenerateProjectRefsRequest {
  /** The detected architecture to generate configs for */
  detected: DetectedArchitecture;

  /** The root path of the project */
  projectRoot: string;
}

/**
 * Response DTO for the GenerateProjectRefs use case.
 */
export interface GenerateProjectRefsResponse {
  /** Per-layer tsconfig files */
  configs: GeneratedTSConfig[];

  /** Root tsconfig.build.json (references all layers) */
  rootConfig?: GeneratedTSConfig;

  /** Any warnings generated during generation */
  warnings: string[];
}
