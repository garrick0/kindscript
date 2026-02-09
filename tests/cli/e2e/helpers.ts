import { spawnSync } from 'child_process';
import * as path from 'path';

/**
 * Path to the compiled CLI entry point
 */
export const CLI_PATH = path.resolve(__dirname, '../../../dist/apps/cli/main.js');

/**
 * Path to the integration test fixtures directory
 */
export const FIXTURES_DIR = path.resolve(__dirname, '../../integration/fixtures');

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
