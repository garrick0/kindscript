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

describe('CLI Tier 2 Contract E2E', () => {
  describe('purity contract', () => {
    it('exits 1 when purity is violated (impure import)', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'purity-violation')]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('KS70003');
      expect(result.stderr).toContain('Impure import');
    });

    it('exits 0 when purity is satisfied', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'purity-clean')]);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('All architectural contracts satisfied');
    });
  });

  describe('noCycles contract', () => {
    it('exits 1 when circular dependency is detected', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'no-cycles-violation')]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('KS70004');
      expect(result.stderr).toContain('Circular dependency');
    });
  });

  describe('mustImplement contract', () => {
    it('exits 1 when implementation is missing', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'must-implement-violation')]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('KS70002');
      expect(result.stderr).toContain('RepositoryPort');
    });

    it('exits 0 when all implementations exist', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'must-implement-clean')]);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('All architectural contracts satisfied');
    });
  });

  describe('colocated contract', () => {
    it('exits 1 when counterpart file is missing', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'colocated-violation')]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('KS70005');
      expect(result.stderr).toContain('co-located');
    });

    it('exits 0 when all files have counterparts', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'colocated-clean')]);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('All architectural contracts satisfied');
    });
  });

  describe('regression: existing contracts still work', () => {
    it('noDependency violation still detected', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'clean-arch-violation')]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('KS70001');
    });

    it('tier2 noDependency still works', () => {
      const result = run(['check', path.join(FIXTURES_DIR, 'tier2-violation')]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('KS70001');
    });
  });
});
