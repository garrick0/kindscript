import * as fs from 'fs';
import * as nodePath from 'path';
import { FileSystemPort } from '../../application/ports/filesystem.port.js';

/**
 * Real implementation of FileSystemPort using Node's fs and path modules.
 */
export class FileSystemAdapter implements FileSystemPort {
  directoryExists(path: string): boolean {
    try {
      return fs.statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  fileExists(path: string): boolean {
    try {
      return fs.statSync(path).isFile();
    } catch {
      return false;
    }
  }

  readFile(path: string): string | undefined {
    try {
      return fs.readFileSync(path, 'utf-8');
    } catch {
      return undefined;
    }
  }

  readDirectory(dirPath: string, recursive: boolean): string[] {
    if (!this.directoryExists(dirPath)) return [];

    const files: string[] = [];

    const walk = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = nodePath.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (recursive && entry.name !== 'node_modules') {
            walk(fullPath);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    };

    walk(dirPath);
    return files.sort();
  }

  resolvePath(...segments: string[]): string {
    return nodePath.resolve(...segments);
  }

  dirname(path: string): string {
    return nodePath.dirname(path);
  }

  joinPath(...segments: string[]): string {
    return nodePath.join(...segments);
  }

  getModifiedTime(path: string): number {
    try {
      return fs.statSync(path).mtimeMs;
    } catch {
      return 0;
    }
  }
}
