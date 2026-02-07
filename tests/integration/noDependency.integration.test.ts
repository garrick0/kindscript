import * as path from 'path';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { ConfigSymbolBuilder } from '../../src/application/services/config-symbol-builder';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../../src/infrastructure/adapters/config/config.adapter';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('noDependency Integration Tests', () => {
  let tsAdapter: TypeScriptAdapter;
  let fsAdapter: FileSystemAdapter;
  let configAdapter: ConfigAdapter;
  let service: CheckContractsService;
  let symbolBuilder: ConfigSymbolBuilder;

  beforeEach(() => {
    tsAdapter = new TypeScriptAdapter();
    fsAdapter = new FileSystemAdapter();
    configAdapter = new ConfigAdapter();
    service = new CheckContractsService(tsAdapter, fsAdapter);
    symbolBuilder = new ConfigSymbolBuilder();
  });

  it('detects violation in clean-arch-violation fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');

    // Read config
    const ksConfig = configAdapter.readKindScriptConfig(fixturePath);
    expect(ksConfig).toBeDefined();

    const tsconfigPath = path.join(fixturePath, 'tsconfig.json');
    const tsConfig = configAdapter.readTSConfig(tsconfigPath);
    expect(tsConfig).toBeDefined();

    // Build symbols from config with project root for path resolution
    const buildResult = symbolBuilder.build(ksConfig!, fixturePath);
    expect(buildResult.contracts).toHaveLength(1);
    expect(buildResult.errors).toHaveLength(0);

    // Get root files
    const rootFiles = tsConfig!.files!;
    expect(rootFiles.length).toBeGreaterThan(0);

    // Execute check
    const result = service.execute({
      symbols: buildResult.symbols,
      contracts: buildResult.contracts,
      config: ksConfig!,
      programRootFiles: rootFiles,
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

    const tsconfigPath = path.join(fixturePath, 'tsconfig.json');
    const tsConfig = configAdapter.readTSConfig(tsconfigPath);
    expect(tsConfig).toBeDefined();

    const buildResult = symbolBuilder.build(ksConfig!, fixturePath);
    const rootFiles = tsConfig!.files!;

    const result = service.execute({
      symbols: buildResult.symbols,
      contracts: buildResult.contracts,
      config: ksConfig!,
      programRootFiles: rootFiles,
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
    expect(config!.contracts).toBeDefined();
    expect(config!.contracts!.noDependency).toBeDefined();
    expect(config!.contracts!.noDependency).toHaveLength(1);
  });

  it('config adapter reads tsconfig.json correctly', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
    const tsConfig = configAdapter.readTSConfig(path.join(fixturePath, 'tsconfig.json'));

    expect(tsConfig).toBeDefined();
    expect(tsConfig!.files).toBeDefined();
    expect(tsConfig!.files!.length).toBeGreaterThan(0);
  });

  it('config adapter returns undefined for missing config', () => {
    const config = configAdapter.readKindScriptConfig('/nonexistent/path');
    expect(config).toBeUndefined();
  });
});
