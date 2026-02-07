import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ResolvedFiles } from '../../../domain/entities/resolved-files';

/**
 * Request DTO for the ResolveFiles use case.
 */
export interface ResolveFilesRequest {
  /** The architectural symbol to resolve */
  symbol: ArchSymbol;

  /** Root directory of the project */
  projectRoot: string;
}

/**
 * Response DTO for the ResolveFiles use case.
 */
export interface ResolveFilesResponse {
  /** The resolved files for the symbol */
  resolved: ResolvedFiles;

  /** Errors encountered during resolution */
  errors: string[];
}
