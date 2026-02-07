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

describe('CLI stdlib E2E', () => {
  it('ksc check with @kindscript/clean-architecture exits 0 on compliant project', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
    const result = run(['check', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('contracts satisfied');
  });

  it('ksc check with @kindscript/clean-architecture exits 1 on violation', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch-violation');
    const result = run(['check', fixturePath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('domain');
    expect(result.stderr).toContain('infrastructure');
  });

  it('ksc scaffold with stdlib package plans correct operations', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
    const result = run(['scaffold', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('domain');
    expect(result.stdout).toContain('application');
    expect(result.stdout).toContain('infrastructure');
  });

  it('ksc --version outputs 0.8.0-m8', () => {
    const result = run(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('0.8.0-m8');
  });
});
