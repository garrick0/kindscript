import { FileSystemPort } from '../../../application/ports/filesystem.port';

/**
 * Mock implementation of FileSystemPort for testing.
 *
 * This adapter simulates a file system in memory, allowing tests to
 * configure files and directories without touching the real file system.
 *
 * Uses a fluent API for easy test setup:
 * ```typescript
 * mockFS
 *   .withFile('src/domain/entity.ts', 'export class Entity {}')
 *   .withDirectory('src/infrastructure', ['database.ts', 'cache.ts']);
 * ```
 */
export class MockFileSystemAdapter implements FileSystemPort {
  private files = new Map<string, string>();
  private directories = new Set<string>();

  // Fluent configuration API for tests

  /**
   * Add a file with content to the mock file system.
   */
  withFile(path: string, content: string): this {
    this.files.set(path, content);

    // Auto-create parent directories
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      const dirPath = parts.slice(0, i).join('/');
      if (dirPath) {
        this.directories.add(dirPath);
      }
    }

    return this;
  }

  /**
   * Add a directory with optional files.
   */
  withDirectory(path: string, files?: string[]): this {
    this.directories.add(path);

    if (files) {
      files.forEach((file) => {
        const filePath = `${path}/${file}`;
        this.files.set(filePath, '');
      });
    }

    return this;
  }

  /**
   * Reset all mock data (for test isolation).
   */
  reset(): void {
    this.files.clear();
    this.directories.clear();
  }

  // Implement FileSystemPort interface

  fileExists(path: string): boolean {
    return this.files.has(path);
  }

  directoryExists(path: string): boolean {
    return this.directories.has(path);
  }

  readFile(path: string): string | undefined {
    return this.files.get(path);
  }

  listSubdirectories(dirPath: string): string[] {
    const prefix = dirPath + '/';
    const subdirs = new Set<string>();

    for (const dir of this.directories) {
      if (dir.startsWith(prefix)) {
        const rest = dir.substring(prefix.length);
        const firstSegment = rest.split('/')[0];
        if (firstSegment && firstSegment !== 'node_modules') {
          subdirs.add(firstSegment);
        }
      }
    }

    return Array.from(subdirs).sort();
  }

  readDirectory(path: string, recursive: boolean): string[] {
    const results: string[] = [];

    for (const [filePath] of this.files) {
      if (filePath.startsWith(path + '/')) {
        if (!recursive) {
          // Only immediate children
          const relativePath = filePath.substring(path.length + 1);
          if (!relativePath.includes('/')) {
            results.push(filePath);
          }
        } else {
          // All descendants
          results.push(filePath);
        }
      }
    }

    return results.sort();
  }

  writeFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  createDirectory(path: string): void {
    this.directories.add(path);
  }

  resolvePath(...segments: string[]): string {
    return segments.join('/').replace(/\/+/g, '/');
  }

  relativePath(from: string, to: string): string {
    // Simplified implementation
    if (to.startsWith(from)) {
      return to.substring(from.length + 1);
    }
    return to;
  }

  dirname(path: string): string {
    const parts = path.split('/');
    return parts.slice(0, -1).join('/') || '/';
  }

  basename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }
}
