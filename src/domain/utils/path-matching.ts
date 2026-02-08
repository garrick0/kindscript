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

/**
 * Pure dirname — returns the directory portion of a path.
 *
 * Works with both forward and back slashes.
 * This is a domain-layer utility with no Node.js dependency.
 */
export function dirnamePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return '.';
  if (lastSlash === 0) return '/';
  return normalized.substring(0, lastSlash);
}

/**
 * Pure relative-path computation — no filesystem needed.
 *
 * Given a base directory and a file path under it, returns the
 * portion of `to` after `from`. If `to` doesn't start with `from`,
 * returns `to` unchanged.
 *
 * This is a domain-layer utility with no Node.js dependency.
 */
export function relativePath(from: string, to: string): string {
  const normalizedFrom = from.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedTo = to.replace(/\\/g, '/');

  if (normalizedTo.startsWith(normalizedFrom + '/')) {
    return normalizedTo.substring(normalizedFrom.length + 1);
  }
  return normalizedTo;
}
