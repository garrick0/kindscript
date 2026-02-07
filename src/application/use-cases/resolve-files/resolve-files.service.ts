import { ResolveFilesUseCase } from './resolve-files.use-case';
import { ResolveFilesRequest, ResolveFilesResponse } from './resolve-files.types';
import { FileSystemPort } from '../../ports/filesystem.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ResolvedFiles } from '../../../domain/entities/resolved-files';

/**
 * Real implementation of ResolveFilesUseCase.
 *
 * Resolves an ArchSymbol with a declaredLocation to the actual files
 * on disk that belong to it. Handles:
 * - Directory-based resolution (recursive .ts file discovery)
 * - Child symbol exclusion (prevents double-counting)
 * - Relative path resolution against project root
 *
 * This is part of the "symbol-to-files correlation" from
 * ANALYSIS_COMPILER_ARCHITECTURE_V4.md Part 4.2.
 */
export class ResolveFilesService implements ResolveFilesUseCase {
  constructor(
    private readonly fsPort: FileSystemPort
  ) {}

  execute(request: ResolveFilesRequest): ResolveFilesResponse {
    const { symbol, projectRoot } = request;
    const errors: string[] = [];

    if (!symbol.declaredLocation) {
      return {
        resolved: new ResolvedFiles(symbol, []),
        errors: ['Symbol has no declared location'],
      };
    }

    // Resolve location relative to project root
    const absoluteLocation = this.resolvePath(symbol.declaredLocation, projectRoot);

    if (!this.fsPort.directoryExists(absoluteLocation)) {
      return {
        resolved: new ResolvedFiles(symbol, []),
        errors: [`Directory not found: ${absoluteLocation}`],
      };
    }

    // Get all .ts files recursively
    const allFiles = this.fsPort.readDirectory(absoluteLocation, true);

    // Subtract files claimed by child symbols
    const childFiles = this.collectChildFiles(symbol, projectRoot);
    const ownFiles = allFiles.filter(f => !childFiles.has(f));

    return {
      resolved: new ResolvedFiles(symbol, ownFiles),
      errors,
    };
  }

  /**
   * Recursively collect all files claimed by child symbols.
   * These files are excluded from the parent symbol's resolved files.
   */
  private collectChildFiles(symbol: ArchSymbol, projectRoot: string): Set<string> {
    const childFiles = new Set<string>();

    for (const child of symbol.members.values()) {
      if (!child.declaredLocation) continue;

      const childLocation = this.resolvePath(child.declaredLocation, projectRoot);
      if (this.fsPort.directoryExists(childLocation)) {
        for (const file of this.fsPort.readDirectory(childLocation, true)) {
          childFiles.add(file);
        }
      }

      // Recurse into grandchildren
      const grandchildFiles = this.collectChildFiles(child, projectRoot);
      for (const f of grandchildFiles) {
        childFiles.add(f);
      }
    }

    return childFiles;
  }

  /**
   * Resolve a potentially relative path against the project root.
   */
  private resolvePath(location: string, projectRoot: string): string {
    if (location.startsWith('/')) return location;
    return this.fsPort.resolvePath(projectRoot, location);
  }
}
