import { ResolveFilesRequest, ResolveFilesResponse } from './resolve-files.types';

/**
 * Use case interface for resolving an architectural symbol to its files.
 *
 * This use case takes a symbol (e.g., "domain" layer) and resolves it
 * to the actual files in the file system that belong to that symbol.
 *
 * Resolution logic depends on the symbol's declared location:
 * - Directory path: "src/domain" → all .ts files in that directory
 * - Glob pattern: "src/**\/*.domain.ts" → files matching the pattern
 * - Package pattern: "@myorg/domain-*" → files in matching packages
 *
 * Implemented in ResolveFilesService.
 */
export interface ResolveFilesUseCase {
  execute(request: ResolveFilesRequest): ResolveFilesResponse;
}
