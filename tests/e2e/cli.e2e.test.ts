import * as path from 'path';
import * as fs from 'fs';
import { run, copyFixtureToTemp, FIXTURES_DIR } from './helpers';

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

      it('exits 1 when no config file is found', () => {
        const result = run(['check', '/tmp/nonexistent-project']);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('kindscript.json');
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

    describe('stdlib package integration', () => {
      it('exits 0 with @kindscript/clean-architecture on compliant project', () => {
        const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch');
        const result = run(['check', fixturePath]);

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toContain('contracts satisfied');
      });

      it('exits 1 with @kindscript/clean-architecture on violation', () => {
        const fixturePath = path.join(FIXTURES_DIR, 'stdlib-clean-arch-violation');
        const result = run(['check', fixturePath]);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('domain');
        expect(result.stderr).toContain('infrastructure');
      });
    });
  });

  describe('ksc infer', () => {
    it('on clean-arch fixture exits 0 with correct output', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');
      const result = run(['infer', fixturePath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('clean-architecture');
      expect(result.stdout).toContain('domain');
      expect(result.stdout).toContain('application');
      expect(result.stdout).toContain('infrastructure');
      expect(result.stdout).toContain('noDependency');
      expect(result.stdout).toContain('architecture.ts');
    });

    it('on unknown fixture exits 1', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-unknown');
      const result = run(['infer', fixturePath]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No architectural layers');
    });

    it('generates import-based output when stdlib package installed', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'infer-with-stdlib');
      const result = run(['infer', fixturePath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('import { CleanContext, locate }');
      expect(result.stdout).toContain('@kindscript/clean-architecture');
      expect(result.stdout).not.toContain('interface Kind<N');
    });

    it('generates inline stubs when no stdlib package installed', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');
      const result = run(['infer', fixturePath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('interface Kind<N');
      expect(result.stdout).not.toContain("from '@kindscript/clean-architecture'");
    });

    describe('--write mode', () => {
      let tmpDir: string;

      beforeEach(() => {
        tmpDir = copyFixtureToTemp('detect-clean-arch');
      });

      afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      });

      it('writes architecture.ts and kindscript.json to project root', () => {
        const result = run(['infer', '--write', tmpDir]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Files written');

        // Verify architecture.ts was created
        const archPath = path.join(tmpDir, 'architecture.ts');
        expect(fs.existsSync(archPath)).toBe(true);
        const archContent = fs.readFileSync(archPath, 'utf-8');
        expect(archContent).toContain('interface Kind<N');
        expect(archContent).toContain('CleanArchitectureContext');
        expect(archContent).toContain('export const app');
        expect(archContent).toContain('defineContracts');

        // Verify kindscript.json was created
        const configPath = path.join(tmpDir, 'kindscript.json');
        expect(fs.existsSync(configPath)).toBe(true);
        const configContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        expect(configContent.definitions).toContain('architecture.ts');
      });

      it('with stdlib package generates import-based architecture.ts and adds packages to config', () => {
        // Clean up the default tmpDir and use one with stdlib
        fs.rmSync(tmpDir, { recursive: true, force: true });
        tmpDir = copyFixtureToTemp('infer-with-stdlib');

        const result = run(['infer', '--write', tmpDir]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Files written');

        // Verify architecture.ts uses imports, not inline stubs
        const archPath = path.join(tmpDir, 'architecture.ts');
        const archContent = fs.readFileSync(archPath, 'utf-8');
        expect(archContent).toContain("import { CleanContext, locate } from '@kindscript/clean-architecture'");
        expect(archContent).not.toContain('interface Kind<N');

        // Verify kindscript.json includes packages
        const configPath = path.join(tmpDir, 'kindscript.json');
        const configContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        expect(configContent.definitions).toContain('architecture.ts');
        expect(configContent.packages).toContain('@kindscript/clean-architecture');
      });

      it('merges into existing kindscript.json without overwriting', () => {
        // Pre-create a kindscript.json with existing config
        const configPath = path.join(tmpDir, 'kindscript.json');
        fs.writeFileSync(configPath, JSON.stringify({ contracts: { noDependency: [] } }, null, 2) + '\n');

        const result = run(['infer', '--write', tmpDir]);

        expect(result.exitCode).toBe(0);

        const configContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        // Original key preserved
        expect(configContent.contracts).toBeDefined();
        // definitions added
        expect(configContent.definitions).toContain('architecture.ts');
      });
    });

    describe('init --detect (legacy)', () => {
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
    });
  });

});
