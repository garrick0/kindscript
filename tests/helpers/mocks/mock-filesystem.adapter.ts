import { FileSystemPort } from '../../../src/application/ports/filesystem.port';

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
  private modifiedTimes = new Map<string, number>();

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
   * Set the modification time for a file.
   */
  withModifiedTime(path: string, time: number): this {
    this.modifiedTimes.set(path, time);
    return this;
  }

  /**
   * Reset all mock data (for test isolation).
   */
  reset(): void {
    this.files.clear();
    this.directories.clear();
    this.modifiedTimes.clear();
  }

  // Implement FileSystemPort interface

  directoryExists(path: string): boolean {
    return this.directories.has(path);
  }

  readFile(path: string): string | undefined {
    return this.files.get(path);
  }

  readDirectory(path: string, recursive: boolean): string[] {
    const results: string[] = [];

    for (const [filePath] of this.files) {
      if (filePath.startsWith(path + '/')) {
        // Match real FileSystemAdapter: only .ts/.tsx files, excluding .d.ts
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) continue;
        if (filePath.endsWith('.d.ts')) continue;

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

  resolvePath(...segments: string[]): string {
    return segments.join('/').replace(/\/+/g, '/');
  }

  dirname(path: string): string {
    const parts = path.split('/');
    return parts.slice(0, -1).join('/') || '/';
  }

  joinPath(...segments: string[]): string {
    return segments
      .map((s, i) => {
        if (i === 0) return s.replace(/\/$/, '');
        return s.replace(/^\//, '').replace(/\/$/, '');
      })
      .filter(Boolean)
      .join('/');
  }

  getModifiedTime(path: string): number {
    return this.modifiedTimes.get(path) ?? 0;
  }
}
