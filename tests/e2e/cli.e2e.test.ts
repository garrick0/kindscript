import * as path from 'path';
import { run, FIXTURES_DIR } from './helpers';

describe('CLI E2E', () => {
  describe('--version', () => {
    it('outputs 0.8.0-m8', () => {
      const result = run(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('0.8.0-m8');
    });
  });

  describe('ksc check', () => {
    describe('basic check functionality', () => {
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

      it('exits 1 when no TypeScript files are found', () => {
        const result = run(['check', '/tmp/nonexistent-project']);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('No TypeScript files found');
      });
    });

    describe('Tier 2 (Kind-based) contracts', () => {
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

    describe('mirrors contract', () => {
      it('exits 1 when counterpart file is missing', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'mirrors-violation')]);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('KS70005');
        expect(result.stderr).toContain('no counterpart');
      });

      it('exits 0 when all files have counterparts', () => {
        const result = run(['check', path.join(FIXTURES_DIR, 'mirrors-clean')]);
        expect(result.exitCode).toBe(0);
        expect(result.stderr).toContain('All architectural contracts satisfied');
      });
    });

  });

});
