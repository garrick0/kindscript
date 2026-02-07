import * as path from 'path';
import { spawnSync } from 'child_process';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const CLI_PATH = path.resolve(__dirname, '../../dist/infrastructure/cli/main.js');

function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number } {
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

describe('Standard Library Packages Integration', () => {
  it('check passes on compliant project using @kindscript/clean-architecture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
    const result = runCli(['check', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('contracts satisfied');
  });

  it('check detects violations using contracts from package', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch-violation');
    const result = runCli(['check', fixturePath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('domain');
    expect(result.stderr).toContain('infrastructure');
    expect(result.stderr).toContain('noDependency');
  });

  it('contracts trace back to package definition file', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch-violation');
    const result = runCli(['check', fixturePath]);

    expect(result.exitCode).toBe(1);
    // The diagnostic should reference the package file, not user's architecture.ts
    expect(result.stderr).toContain('@kindscript/clean-architecture/index.ts');
  });

  it('scaffold works with package-provided Kind definitions', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
    const result = runCli(['scaffold', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('domain');
    expect(result.stdout).toContain('application');
    expect(result.stdout).toContain('infrastructure');
    expect(result.stdout).toContain('createDirectory');
  });

  it('warns when package not found and degrades gracefully', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-missing-pkg');
    const result = runCli(['check', fixturePath]);

    // Should still run (graceful degradation) — no contracts defined in the
    // user's architecture.ts so it exits 0 with "No contracts found"
    expect(result.stderr).toContain("Warning: package '@kindscript/nonexistent' not found in node_modules");
    expect(result.exitCode).toBe(0);
  });

  it('check enforces multiple contracts from package (noDependency + purity)', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
    const result = runCli(['check', fixturePath]);

    expect(result.exitCode).toBe(0);
    // 3 noDependency + 1 purity = 4 contracts
    expect(result.stderr).toContain('4 contracts');
  });
});
