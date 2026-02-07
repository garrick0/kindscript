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
 * This is part of the "symbol-to-files correlation" from
 * ANALYSIS_COMPILER_ARCHITECTURE_V4.md Part 4.2.
 *
 * In M0, this is just an interface.
 * In M2, we implement it with real file system logic.
 */
export interface ResolveFilesUseCase {
  execute(request: ResolveFilesRequest): ResolveFilesResponse;
}
