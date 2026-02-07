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

  it('falls back to Tier 1 when no definitions key in config', () => {
    // Tier 1 fixtures only have "contracts" key, no "definitions"
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-valid');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('All architectural contracts satisfied');
  });

  it('Tier 1 violations still detected after Tier 2 changes', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
    const result = run(['check', fixturePath]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('KS70001');
  });
});
