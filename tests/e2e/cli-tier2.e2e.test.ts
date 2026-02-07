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

describe('CLI Tier 2 E2E', () => {
  it('exits 0 when kind-defined contracts are satisfied', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'tier2-clean-arch');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('All architectural contracts satisfied');
  });

  it('exits 1 when kind-defined contracts are violated', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'tier2-violation');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('KS70001');
    expect(result.stderr).toContain('Forbidden dependency');
  });

  it('exits 0 for clean-arch-valid fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-valid');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('All architectural contracts satisfied');
  });

  it('detects violations in clean-arch-violation fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('KS70001');
  });
});
