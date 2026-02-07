import * as fs from 'fs';
import * as nodePath from 'path';
import { FileSystemPort } from '../../../application/ports/filesystem.port';

/**
 * Real implementation of FileSystemPort using Node's fs and path modules.
 */
export class FileSystemAdapter implements FileSystemPort {
  fileExists(path: string): boolean {
    try {
      return fs.statSync(path).isFile();
    } catch {
      return false;
    }
  }

  directoryExists(path: string): boolean {
    try {
      return fs.statSync(path).isDirectory();
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

  listSubdirectories(dirPath: string): string[] {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory() && entry.name !== 'node_modules')
        .map(entry => entry.name)
        .sort();
    } catch {
      return [];
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
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    };

    walk(dirPath);
    return files.sort();
  }

  writeFile(path: string, content: string): void {
    const dir = nodePath.dirname(path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path, content, 'utf-8');
  }

  createDirectory(path: string): void {
    fs.mkdirSync(path, { recursive: true });
  }

  resolvePath(...segments: string[]): string {
    return nodePath.resolve(...segments);
  }

  relativePath(from: string, to: string): string {
    return nodePath.relative(from, to);
  }

  dirname(path: string): string {
    return nodePath.dirname(path);
  }

  basename(path: string): string {
    return nodePath.basename(path);
  }
}
