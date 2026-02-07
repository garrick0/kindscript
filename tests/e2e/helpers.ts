import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Path to the compiled CLI entry point
 */
export const CLI_PATH = path.resolve(__dirname, '../../dist/infrastructure/cli/main.js');

/**
 * Path to the integration test fixtures directory
 */
export const FIXTURES_DIR = path.resolve(__dirname, '../integration/fixtures');

/**
 * Execute a CLI command and return the result
 */
export function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
}

/**
 * Copy a fixture directory to a temporary location so --write tests
 * don't pollute the real fixture.
 */
export function copyFixtureToTemp(fixtureName: string): string {
  const src = path.join(FIXTURES_DIR, fixtureName);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-test-'));
  copyDirSync(src, tmpDir);
  return tmpDir;
}

/**
 * Recursively copy a directory and all its contents
 */
export function copyDirSync(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
