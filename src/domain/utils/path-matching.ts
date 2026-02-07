/**
 * Check if a file belongs to a symbol location using boundary-safe prefix matching.
 *
 * Uses '/' boundary delimiters to avoid false positives like
 * "src/domain-extensions/foo.ts" matching location "src/domain".
 *
 * @param filePath - The file path to check
 * @param symbolLocation - The directory path of the symbol
 * @param resolvedFiles - Optional pre-resolved file set for exact matching
 */
export function isFileInSymbol(
  filePath: string,
  symbolLocation: string,
  resolvedFiles?: Set<string>
): boolean {
  if (resolvedFiles?.has(filePath)) return true;

  // Normalize paths: backslashes to forward slashes, strip trailing slashes
  const normalizedFile = filePath.replace(/\\/g, '/');
  const normalizedLocation = symbolLocation.replace(/\\/g, '/').replace(/\/$/, '');

  // Exact path match
  if (normalizedFile === normalizedLocation) return true;

  // Strict boundary check: the location must be followed by '/'
  const prefix = normalizedLocation + '/';
  if (normalizedFile.startsWith(prefix)) return true;

  // Also check when the location appears as a segment in an absolute path
  if (normalizedFile.includes('/' + prefix)) return true;

  return false;
}

/**
 * Pure path join — concatenates segments with '/' normalization.
 *
 * Does not resolve against CWD or make paths absolute.
 * This is a domain-layer utility with no Node.js dependency.
 */
export function joinPath(base: string, relative: string): string {
  const normalizedBase = base.replace(/\/$/, '');
  const normalizedRelative = relative.replace(/^\//, '');
  return `${normalizedBase}/${normalizedRelative}`;
}
