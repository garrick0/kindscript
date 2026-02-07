import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Request DTO for the GetPluginDiagnostics use case.
 */
export interface GetPluginDiagnosticsRequest {
  /** The file being checked */
  fileName: string;

  /** The project root path */
  projectRoot: string;
}

/**
 * Response DTO for the GetPluginDiagnostics use case.
 */
export interface GetPluginDiagnosticsResponse {
  /** KindScript diagnostics for this file */
  diagnostics: Diagnostic[];

  /** Processing time in milliseconds (for performance monitoring) */
  elapsedMs: number;
}
