import { ArchSymbol } from '../../domain/entities/arch-symbol';
import { FileSystemPort } from '../ports/filesystem.port';

/**
 * Pre-resolve all symbol locations to their file listings.
 *
 * Walks the symbol tree and builds a map from each symbol's
 * declaredLocation to the files it contains. Only locations that
 * exist on disk are included — missing locations are omitted so
 * that `resolvedFiles.has(location)` serves as an existence check.
 *
 * This map is passed to the checker so it can evaluate contracts
 * without live filesystem queries.
 */
export function resolveSymbolFiles(
  symbols: ArchSymbol[],
  fsPort: FileSystemPort,
): Map<string, string[]> {
  const resolved = new Map<string, string[]>();
  for (const symbol of symbols) {
    for (const s of [symbol, ...symbol.descendants()]) {
      if (s.declaredLocation && !resolved.has(s.declaredLocation)) {
        if (fsPort.directoryExists(s.declaredLocation)) {
          resolved.set(
            s.declaredLocation,
            fsPort.readDirectory(s.declaredLocation, true),
          );
        }
      }
    }
  }
  return resolved;
}
