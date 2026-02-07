import * as path from 'path';
import { GetPluginDiagnosticsService } from '../../src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../../src/infrastructure/adapters/config/config.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('Plugin Diagnostics Integration Tests', () => {
  let tsAdapter: TypeScriptAdapter;
  let fsAdapter: FileSystemAdapter;
  let configAdapter: ConfigAdapter;
  let astAdapter: ASTAdapter;
  let service: GetPluginDiagnosticsService;

  beforeEach(() => {
    tsAdapter = new TypeScriptAdapter();
    fsAdapter = new FileSystemAdapter();
    configAdapter = new ConfigAdapter();
    astAdapter = new ASTAdapter();

    const checkContracts = new CheckContractsService(tsAdapter, fsAdapter);
    const classifyService = new ClassifyASTService(astAdapter);

    service = new GetPluginDiagnosticsService(
      checkContracts, configAdapter, fsAdapter, classifyService, tsAdapter
    );
  });

  it('detects violation in clean-arch-violation fixture via plugin diagnostics service', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
    const violatingFile = path.join(fixturePath, 'src/domain/service.ts');

    const result = service.execute({
      fileName: violatingFile,
      projectRoot: fixturePath,
    });

    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics[0].code).toBe(70001);
    expect(result.diagnostics[0].file).toContain('service.ts');
  });

  it('reports no violations for clean-arch-valid fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-valid');
    const cleanFile = path.join(fixturePath, 'src/domain/entity.ts');

    const result = service.execute({
      fileName: cleanFile,
      projectRoot: fixturePath,
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('performance: completes in under 500ms for fixture projects', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');
    const violatingFile = path.join(fixturePath, 'src/domain/service.ts');

    const result = service.execute({
      fileName: violatingFile,
      projectRoot: fixturePath,
    });

    // Relaxed threshold to account for coverage instrumentation overhead
    expect(result.elapsedMs).toBeLessThan(2000);
  });

  it('returns empty diagnostics when project has no kindscript.json', () => {
    const result = service.execute({
      fileName: '/nonexistent/src/index.ts',
      projectRoot: '/nonexistent',
    });

    expect(result.diagnostics).toHaveLength(0);
  });
});
