import * as nodePath from 'path';
import { FileSystemPort } from '../../application/ports/filesystem.port';

/**
 * Resolve standard library package names to definition file paths.
 *
 * Looks for each package in node_modules/<pkg>/index.ts.
 * Emits a warning to stderr if a package is not found.
 */
export function resolvePackageDefinitions(
  packages: string[],
  projectRoot: string,
  fsPort: FileSystemPort
): string[] {
  const resolved: string[] = [];
  for (const pkg of packages) {
    const candidate = nodePath.join(projectRoot, 'node_modules', pkg, 'index.ts');
    if (fsPort.fileExists(candidate)) {
      resolved.push(candidate);
    } else {
      process.stderr.write(`Warning: package '${pkg}' not found in node_modules\n`);
    }
  }
  return resolved;
}
