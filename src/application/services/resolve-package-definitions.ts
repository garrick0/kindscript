import { FileSystemPort } from '../ports/filesystem.port';

/**
 * Result of resolving package definition files.
 */
export interface ResolvePackageResult {
  /** Resolved absolute paths to package definition files */
  paths: string[];

  /** Warnings for packages that could not be found */
  warnings: string[];
}

/**
 * Resolve standard library package names to definition file paths.
 *
 * Looks for each package in node_modules/<pkg>/index.ts.
 * Returns warnings for packages that are not found (instead of writing to stderr).
 */
export function resolvePackageDefinitions(
  packages: string[],
  projectRoot: string,
  fsPort: FileSystemPort
): ResolvePackageResult {
  const paths: string[] = [];
  const warnings: string[] = [];

  for (const pkg of packages) {
    const candidate = fsPort.joinPath(projectRoot, 'node_modules', pkg, 'index.ts');
    if (fsPort.fileExists(candidate)) {
      paths.push(candidate);
    } else {
      warnings.push(`Package '${pkg}' not found in node_modules`);
    }
  }

  return { paths, warnings };
}
