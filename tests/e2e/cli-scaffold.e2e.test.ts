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

function copyFixtureToTemp(fixtureName: string): string {
  const src = path.join(FIXTURES_DIR, fixtureName);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-scaffold-e2e-'));
  copyDirSync(src, tmpDir);
  return tmpDir;
}

describe('CLI scaffold E2E', () => {
  it('ksc scaffold on clean-arch fixture exits 0 with plan output', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'scaffold-clean-arch');
    const result = run(['scaffold', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Scaffold plan');
    expect(result.stdout).toContain('createDirectory');
    expect(result.stdout).toContain('createFile');
    expect(result.stdout).toContain('domain');
    expect(result.stdout).toContain('application');
    expect(result.stdout).toContain('infrastructure');
    expect(result.stdout).toContain('Dry run');
  });

  describe('--write mode', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = copyFixtureToTemp('scaffold-clean-arch');
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('ksc scaffold --write creates directories and files', () => {
      const result = run(['scaffold', '--write', tmpDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Scaffold complete');
      expect(result.stdout).toContain('created');

      // Verify directories exist
      expect(fs.existsSync(path.join(tmpDir, 'src'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/domain'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/application'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/infrastructure'))).toBe(true);

      // Verify index.ts files exist
      expect(fs.existsSync(path.join(tmpDir, 'src/domain/index.ts'))).toBe(true);
      const content = fs.readFileSync(path.join(tmpDir, 'src/domain/index.ts'), 'utf-8');
      expect(content).toContain('// domain layer');
      expect(content).toContain('export {};');
    });

    it('ksc scaffold --write skips existing directories', () => {
      // Pre-create a directory
      fs.mkdirSync(path.join(tmpDir, 'src/domain'), { recursive: true });

      const result = run(['scaffold', '--write', tmpDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('skipped');
      expect(result.stdout).toContain('created');
    });
  });

  it('ksc scaffold with no kindscript.json exits 1', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-scaffold-empty-'));
    try {
      const result = run(['scaffold', tmpDir]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('kindscript.json');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('ksc scaffold with no definitions in config exits 1', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-scaffold-nodef-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'kindscript.json'), '{}');
      const result = run(['scaffold', tmpDir]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('definitions');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('ksc scaffold --instance ordering on multi-instance fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'scaffold-multi-instance');
    const result = run(['scaffold', '--instance', 'ordering', fixturePath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('ordering');
    expect(result.stdout).toContain('domain');
    expect(result.stdout).toContain('infrastructure');
    // Should NOT contain billing's layers
    expect(result.stdout).not.toContain('billing');
    expect(result.stdout).not.toContain('adapters');
  });

  it('ksc scaffold on multi-instance fixture without --instance exits 1', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'scaffold-multi-instance');
    const result = run(['scaffold', fixturePath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Multiple instances');
    expect(result.stderr).toContain('--instance');
  });

  it('ksc --version outputs 0.8.0-m8', () => {
    const result = run(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('0.8.0-m8');
  });
});
