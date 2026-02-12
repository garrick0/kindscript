import * as os from 'os';
import * as path from 'path';
import { readFileSync } from 'fs';
import { run, FIXTURES_DIR } from './helpers';

// Read version from package.json (single source of truth)
const pkgPath = path.resolve(__dirname, '../../../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const EXPECTED_VERSION = pkg.version;

describe('CLI E2E', () => {
  describe('--version', () => {
    it('outputs current package version', () => {
      const result = run(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe(EXPECTED_VERSION);
    });
  });

  describe('usage and error handling', () => {
    it('prints usage when no arguments given', () => {
      const result = run([]);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Usage:');
    });

    it('prints usage for --help', () => {
      const result = run(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toContain('Usage:');
    });

    it('prints error for unknown command', () => {
      const result = run(['unknown-command']);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown command');
    });
  });

  describe('ksc check', () => {
    describe('basic check functionality', () => {
      it('exits 1 when violations are found', () => {
        const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
        const result = run(['check', fixturePath]);
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain('KS70001');
        expect(result.stderr).toContain('Forbidden dependency');
        expect(result.stderr).toContain('1 architectural violation');
      });

      it('exits 0 when no violations are found', () => {
        const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-valid');
        const result = run(['check', fixturePath]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('All architectural contracts satisfied');
      });

      it('exits 1 when no TypeScript files are found', () => {
        const result = run(['check', path.join(os.tmpdir(), 'nonexistent-project-ksc')]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No TypeScript files found');
      });
    });

    describe('Tier 2 (Kind-based) contracts', () => {
      it('exits 0 when kind-defined contracts are satisfied', () => {
        const fixturePath = path.join(FIXTURES_DIR, 'tier2-clean-arch');
        const result = run(['check', fixturePath]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('All architectural contracts satisfied');
      });

      it('exits 1 when kind-defined contracts are violated', () => {
        const fixturePath = path.join(FIXTURES_DIR, 'tier2-violation');
        const result = run(['check', fixturePath]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('KS70001');
        expect(result.stderr).toContain('Forbidden dependency');
      });
    });

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
        expect(result.stdout).toContain('All architectural contracts satisfied');
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

    describe('scope validation', () => {
      it('exits 0 for folder-scoped leaf Kind', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'scope-override-clean')]);
        expect(result.exitCode).toBe(0);
      });
    });

    describe('explicit location', () => {
      it('exits 0 when context file is outside target directory', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'explicit-location-external')]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('All architectural contracts satisfied');
      });
    });

    describe('scope mismatch', () => {
      it('exits 1 when folder scope but instance points at file', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'scope-mismatch-violation')]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('KS70005');
        expect(result.stderr).toContain('Scope mismatch');
      });
    });

    describe('overlap', () => {
      it('exits 1 when sibling members share files', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'overlap-violation')]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('KS70006');
        expect(result.stderr).toContain('overlap');
      });
    });

    describe('exhaustiveness', () => {
      it('exits 1 when files are unassigned with exhaustive: true', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'exhaustiveness-violation')]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('KS70007');
        expect(result.stderr).toContain('Unassigned');
      });
    });

    describe('Wrapped Kind standalone purity', () => {
      it('exits 0 when wrapped Kind with pure constraint has no impure imports', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'wrapped-kind-purity-clean')]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('All architectural contracts satisfied');
      });

      it('exits 1 when wrapped Kind with pure constraint has impure imports', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'wrapped-kind-purity-violation')]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('KS70003');
        expect(result.stderr).toContain('Impure import');
      });
    });

    describe('Wrapped Kind composability', () => {
      it('exits 0 when wrapped Kind constraints are satisfied', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'wrapped-kind-composability-clean')]);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('All architectural contracts satisfied');
      });

      it('exits 1 when Decider imports from Effector', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'wrapped-kind-composability-violation')]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('KS70001');
        expect(result.stderr).toContain('Forbidden dependency');
      });
    });

  });

});
