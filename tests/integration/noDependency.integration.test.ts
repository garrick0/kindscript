import * as path from 'path';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../../src/infrastructure/adapters/config/config.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('noDependency Integration Tests', () => {
  let tsAdapter: TypeScriptAdapter;
  let fsAdapter: FileSystemAdapter;
  let configAdapter: ConfigAdapter;
  let astAdapter: ASTAdapter;
  let service: CheckContractsService;
  let classifyService: ClassifyASTService;

  beforeEach(() => {
    tsAdapter = new TypeScriptAdapter();
    fsAdapter = new FileSystemAdapter();
    configAdapter = new ConfigAdapter();
    astAdapter = new ASTAdapter();
    service = new CheckContractsService(tsAdapter, fsAdapter);
    classifyService = new ClassifyASTService(astAdapter);
  });

  function classifyFixture(fixturePath: string) {
    const ksConfig = configAdapter.readKindScriptConfig(fixturePath);
    expect(ksConfig).toBeDefined();
    expect(ksConfig!.definitions).toBeDefined();

    const definitionPaths = ksConfig!.definitions!.map(d => path.resolve(fixturePath, d));
    const program = tsAdapter.createProgram(definitionPaths, {});
    const checker = tsAdapter.getTypeChecker(program);

    const definitionSourceFiles = definitionPaths
      .map(p => tsAdapter.getSourceFile(program, p))
      .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

    return classifyService.execute({
      definitionFiles: definitionSourceFiles,
      checker,
      projectRoot: fixturePath,
    });
  }

  it('detects violation in clean-arch-violation fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');

    const ksConfig = configAdapter.readKindScriptConfig(fixturePath);
    expect(ksConfig).toBeDefined();

    const tsconfigPath = path.join(fixturePath, 'tsconfig.json');
    const tsConfig = configAdapter.readTSConfig(tsconfigPath);
    expect(tsConfig).toBeDefined();

    const classifyResult = classifyFixture(fixturePath);
    expect(classifyResult.contracts).toHaveLength(1);
    expect(classifyResult.errors).toHaveLength(0);

    // Get root files
    const rootFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);
    expect(rootFiles.length).toBeGreaterThan(0);

    // Execute check
    const result = service.execute({
      symbols: classifyResult.symbols,
      contracts: classifyResult.contracts,
      config: ksConfig!,
      program: tsAdapter.createProgram(rootFiles, {}),
    });

    // Should detect the domain -> infrastructure violation
    expect(result.violationsFound).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics[0].code).toBe(70001);

    // The violation should be in domain/service.ts
    const violationFiles = result.diagnostics.map(d => d.file);
    const hasServiceViolation = violationFiles.some(f => f.includes('domain') && f.includes('service'));
    expect(hasServiceViolation).toBe(true);
  });

  it('reports clean result for clean-arch-valid fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-valid');

    const ksConfig = configAdapter.readKindScriptConfig(fixturePath);
    expect(ksConfig).toBeDefined();

    const classifyResult = classifyFixture(fixturePath);
    const rootFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);

    const result = service.execute({
      symbols: classifyResult.symbols,
      contracts: classifyResult.contracts,
      config: ksConfig!,
      program: tsAdapter.createProgram(rootFiles, {}),
    });

    // No violations
    expect(result.violationsFound).toBe(0);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.contractsChecked).toBe(1);
  });

  it('reads real filesystem adapter correctly', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');

    expect(fsAdapter.directoryExists(path.join(fixturePath, 'src/domain'))).toBe(true);
    expect(fsAdapter.directoryExists(path.join(fixturePath, 'src/infrastructure'))).toBe(true);
    expect(fsAdapter.directoryExists(path.join(fixturePath, 'src/nonexistent'))).toBe(false);

    const domainFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src/domain'), true);
    expect(domainFiles.length).toBeGreaterThanOrEqual(2);
    expect(domainFiles.some(f => f.includes('entity.ts'))).toBe(true);
    expect(domainFiles.some(f => f.includes('service.ts'))).toBe(true);
  });

  it('config adapter reads kindscript.json correctly', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
    const config = configAdapter.readKindScriptConfig(fixturePath);

    expect(config).toBeDefined();
    expect(config!.definitions).toBeDefined();
    expect(config!.definitions).toHaveLength(1);
  });

  it('config adapter returns undefined for missing config', () => {
    const config = configAdapter.readKindScriptConfig('/nonexistent/path');
    expect(config).toBeUndefined();
  });
});
