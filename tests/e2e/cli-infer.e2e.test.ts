import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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

/**
 * Copy a fixture directory to a temporary location so --write tests
 * don't pollute the real fixture.
 */
function copyFixtureToTemp(fixtureName: string): string {
  const src = path.join(FIXTURES_DIR, fixtureName);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-infer-'));
  copyDirSync(src, tmpDir);
  return tmpDir;
}

function copyDirSync(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

describe('CLI infer E2E', () => {
  it('ksc infer on clean-arch fixture exits 0 with correct output', () => {
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

  it('ksc infer on unknown fixture exits 1', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'detect-unknown');
    const result = run(['infer', fixturePath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No architectural layers');
  });

  it('ksc --version outputs 0.8.0-m8', () => {
    const result = run(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('0.8.0-m8');
  });

  it('ksc infer generates import-based output when stdlib package installed', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'infer-with-stdlib');
    const result = run(['infer', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('import { CleanContext }');
    expect(result.stdout).toContain('@kindscript/clean-architecture');
    expect(result.stdout).not.toContain('interface Kind<N');
  });

  it('ksc infer generates inline stubs when no stdlib package installed', () => {
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

    it('--write with stdlib package generates import-based architecture.ts and adds packages to config', () => {
      // Clean up the default tmpDir and use one with stdlib
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = copyFixtureToTemp('infer-with-stdlib');

      const result = run(['infer', '--write', tmpDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Files written');

      // Verify architecture.ts uses imports, not inline stubs
      const archPath = path.join(tmpDir, 'architecture.ts');
      const archContent = fs.readFileSync(archPath, 'utf-8');
      expect(archContent).toContain("import { CleanContext } from '@kindscript/clean-architecture'");
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
});
