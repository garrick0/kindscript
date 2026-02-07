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

describe('CLI subprocess E2E', () => {
  it('prints version with --version flag', () => {
    const result = run(['--version']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('0.8.0-m8');
  });

  it('prints help with --help flag', () => {
    const result = run(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('Usage: ksc <command>');
  });

  it('exits 1 with unknown command', () => {
    const result = run(['bogus']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unknown command: bogus');
  });

  it('exits 1 when violations are found', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('KS70001');
    expect(result.stderr).toContain('Forbidden dependency');
    expect(result.stderr).toContain('1 architectural violation');
  });

  it('exits 0 when no violations are found', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-valid');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('All architectural contracts satisfied');
  });

  it('exits 1 when no config file is found', () => {
    const result = run(['check', '/tmp/nonexistent-project']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('kindscript.json');
  });
});
