import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { spawnSync } from 'child_process';
import { ScaffoldService } from '../../src/application/use-cases/scaffold/scaffold.service';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { OperationType } from '../../src/domain/value-objects/scaffold-operation';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const CLI_PATH = path.resolve(__dirname, '../../dist/infrastructure/cli/main.js');

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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-scaffold-'));
  copyDirSync(src, tmpDir);
  return tmpDir;
}

function classifyFixture(fixturePath: string, tsAdapter: TypeScriptAdapter, classifyService: ClassifyASTService) {
  const archFile = path.join(fixturePath, 'architecture.ts');
  const rootFiles = [archFile];
  const program = tsAdapter.createProgram(rootFiles, {});
  const checker = tsAdapter.getTypeChecker(program);
  const sourceFile = tsAdapter.getSourceFile(program, archFile);
  if (!sourceFile) throw new Error(`Could not load ${archFile}`);

  return classifyService.execute({
    definitionFiles: [sourceFile],
    checker,
    projectRoot: fixturePath,
  });
}

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

describe('Scaffold Integration Tests', () => {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const astAdapter = new ASTAdapter();
  const classifyService = new ClassifyASTService(astAdapter);
  let scaffoldService: ScaffoldService;

  beforeEach(() => {
    scaffoldService = new ScaffoldService(fsAdapter);
  });

  it('plans correct operations from clean-arch fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'scaffold-clean-arch');
    const result = classifyFixture(fixturePath, tsAdapter, classifyService);

    expect(result.errors).toHaveLength(0);

    const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
    expect(instances).toHaveLength(1);
    expect(instances[0].name).toBe('app');

    const { plan, warnings } = scaffoldService.plan({
      instanceSymbol: instances[0],
      kindName: 'CleanContext',
      projectRoot: fixturePath,
    });

    expect(warnings).toHaveLength(0);

    // 1 root dir (src) + 3 layer dirs + 3 index.ts = 7 operations
    expect(plan.directoryCount).toBe(4);
    expect(plan.fileCount).toBe(3);
    expect(plan.kindName).toBe('CleanContext');

    const dirPaths = plan.operations
      .filter(o => o.type === OperationType.CreateDirectory)
      .map(o => o.path);
    expect(dirPaths.some(p => p.endsWith('src'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/domain'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/application'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/infrastructure'))).toBe(true);
  });

  it('apply creates directories and files on disk', () => {
    const tmpDir = copyFixtureToTemp('scaffold-clean-arch');

    try {
      const result = classifyFixture(tmpDir, tsAdapter, classifyService);
      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      const { plan } = scaffoldService.plan({
        instanceSymbol: instances[0],
        kindName: 'CleanContext',
        projectRoot: tmpDir,
      });

      const applyResult = scaffoldService.apply(plan);

      expect(applyResult.allSucceeded).toBe(true);
      expect(applyResult.failureCount).toBe(0);

      // Verify directories exist on disk
      expect(fs.existsSync(path.join(tmpDir, 'src'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/domain'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/application'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/infrastructure'))).toBe(true);

      // Verify index.ts files exist with correct content
      const domainIndex = fs.readFileSync(path.join(tmpDir, 'src/domain/index.ts'), 'utf-8');
      expect(domainIndex).toContain('// domain layer');
      expect(domainIndex).toContain('export {};');

      const appIndex = fs.readFileSync(path.join(tmpDir, 'src/application/index.ts'), 'utf-8');
      expect(appIndex).toContain('// application layer');

      const infraIndex = fs.readFileSync(path.join(tmpDir, 'src/infrastructure/index.ts'), 'utf-8');
      expect(infraIndex).toContain('// infrastructure layer');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('apply skips existing directories', () => {
    const tmpDir = copyFixtureToTemp('scaffold-clean-arch');

    try {
      // Pre-create a directory
      fs.mkdirSync(path.join(tmpDir, 'src/domain'), { recursive: true });

      const result = classifyFixture(tmpDir, tsAdapter, classifyService);
      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      const { plan } = scaffoldService.plan({
        instanceSymbol: instances[0],
        kindName: 'CleanContext',
        projectRoot: tmpDir,
      });

      const applyResult = scaffoldService.apply(plan);

      expect(applyResult.allSucceeded).toBe(true);
      expect(applyResult.skippedCount).toBeGreaterThanOrEqual(1);

      // The skipped operation should be the domain directory
      const skipped = applyResult.results.filter(r => r.skipped);
      expect(skipped.some(r => r.operation.path.endsWith('src/domain'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('plans correct operations for multi-instance fixture (specific instance)', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'scaffold-multi-instance');
    const result = classifyFixture(fixturePath, tsAdapter, classifyService);

    const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
    expect(instances.length).toBe(2);

    // Select the 'ordering' instance
    const ordering = instances.find(s => s.name === 'ordering');
    expect(ordering).toBeDefined();

    const { plan } = scaffoldService.plan({
      instanceSymbol: ordering!,
      kindName: 'OrderingContext',
      projectRoot: fixturePath,
    });

    // ordering: root + domain + infra dirs + 2 index.ts = 5 operations
    expect(plan.directoryCount).toBe(3);
    expect(plan.fileCount).toBe(2);

    const dirPaths = plan.operations
      .filter(o => o.type === OperationType.CreateDirectory)
      .map(o => o.path);
    expect(dirPaths.some(p => p.endsWith('src/ordering'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/ordering/domain'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/ordering/infrastructure'))).toBe(true);
  });

  it('plans handle nested members from real ClassifyAST', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'scaffold-nested');
    const result = classifyFixture(fixturePath, tsAdapter, classifyService);

    expect(result.errors).toHaveLength(0);

    const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
    expect(instances).toHaveLength(1);
    expect(instances[0].name).toBe('app');

    // Verify ClassifyAST parsed nested members
    const domain = instances[0].findMember('domain');
    expect(domain).toBeDefined();
    expect(domain!.findMember('entities')).toBeDefined();
    expect(domain!.findMember('ports')).toBeDefined();

    const { plan, warnings } = scaffoldService.plan({
      instanceSymbol: instances[0],
      kindName: 'NestedContext',
      projectRoot: fixturePath,
    });

    expect(warnings).toHaveLength(0);

    const dirPaths = plan.operations
      .filter(o => o.type === OperationType.CreateDirectory)
      .map(o => o.path);
    const filePaths = plan.operations
      .filter(o => o.type === OperationType.CreateFile)
      .map(o => o.path);

    // Root + domain + entities + ports = 4 directories
    expect(dirPaths.some(p => p.endsWith('src'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/domain'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/domain/entities'))).toBe(true);
    expect(dirPaths.some(p => p.endsWith('src/domain/ports'))).toBe(true);

    // domain/index.ts + entities/index.ts + ports/index.ts = 3 files
    expect(filePaths.some(p => p.endsWith('src/domain/index.ts'))).toBe(true);
    expect(filePaths.some(p => p.endsWith('src/domain/entities/index.ts'))).toBe(true);
    expect(filePaths.some(p => p.endsWith('src/domain/ports/index.ts'))).toBe(true);
  });

  it('round-trip: infer --write then scaffold --write then check', () => {
    // Start with a real project that has source code but no architecture.ts
    const tmpDir = copyFixtureToTemp('detect-clean-arch');

    try {
      // Step 1: ksc infer --write — generates architecture.ts + kindscript.json
      const inferResult = runCli(['infer', '--write', tmpDir]);
      expect(inferResult.exitCode).toBe(0);
      expect(fs.existsSync(path.join(tmpDir, 'architecture.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'kindscript.json'))).toBe(true);

      // Step 2: ksc scaffold --write — creates directories (they already exist in this fixture,
      // so all dirs will be skipped, but index.ts files will be created)
      const scaffoldResult = runCli(['scaffold', '--write', tmpDir]);
      expect(scaffoldResult.exitCode).toBe(0);
      expect(scaffoldResult.stdout).toContain('Scaffold complete');

      // Step 3: ksc check — validates contracts against the scaffolded structure
      const checkResult = runCli(['check', tmpDir]);
      expect(checkResult.exitCode).toBe(0);
      expect(checkResult.stderr).toContain('contracts satisfied');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
