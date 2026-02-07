import { DetectedArchitecture } from '../../../domain/entities/detected-architecture';

/**
 * Request DTO for the DetectArchitecture use case.
 */
export interface DetectArchitectureRequest {
  /** The root path of the project to analyze */
  projectRoot: string;

  /** Optional subdirectory to use as the source root (e.g., 'src') */
  srcDir?: string;
}

/**
 * Response DTO for the DetectArchitecture use case.
 */
export interface DetectArchitectureResponse {
  /** The detected architecture */
  detected: DetectedArchitecture;

  /** Any warnings generated during detection */
  warnings: string[];
}
