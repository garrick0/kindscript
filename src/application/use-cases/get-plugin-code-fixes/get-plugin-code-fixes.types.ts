/**
 * Request DTO for the GetPluginCodeFixes use case.
 */
export interface GetPluginCodeFixesRequest {
  /** The file being checked */
  fileName: string;

  /** Start position in the file */
  start: number;

  /** End position in the file */
  end: number;

  /** Error codes at the position */
  errorCodes: readonly number[];

  /** The project root path */
  projectRoot: string;
}

/**
 * Response DTO for the GetPluginCodeFixes use case.
 */
export interface GetPluginCodeFixesResponse {
  /** Code fix suggestions */
  fixes: PluginCodeFix[];
}

/**
 * A code fix suggestion for a KindScript diagnostic.
 */
export interface PluginCodeFix {
  /** Unique identifier for this fix type */
  fixName: string;

  /** Human-readable description shown in the IDE quick fix menu */
  description: string;

  /** The diagnostic code this fix addresses */
  diagnosticCode: number;
}
