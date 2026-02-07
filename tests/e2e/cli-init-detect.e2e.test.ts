import { spawnSync } from 'child_process';
import * as path from 'path';

const CLI_PATH = path.resolve(__dirname, '../../dist/infrastructure/cli/main.js');
const FIXTURES_DIR = path.resolve(__dirname, '../integration/fixtures');

function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
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

describe('CLI init --detect E2E', () => {
  it('detects clean-architecture and shows dry run output', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');
    const result = run(['init', '--detect', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('clean-architecture');
    expect(result.stdout).toContain('domain');
    expect(result.stdout).toContain('application');
    expect(result.stdout).toContain('infrastructure');
    expect(result.stdout).toContain('Dry run');
  });

  it('exits 1 on unknown fixture with no layers', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'detect-unknown');
    const result = run(['init', '--detect', fixturePath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No architectural layers');
  });

  it('exits 1 when init is used without --detect', () => {
    const result = run(['init']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('only supports --detect');
  });

  it('ksc --version outputs 0.8.0-m8', () => {
    const result = run(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('0.8.0-m8');
  });
});
