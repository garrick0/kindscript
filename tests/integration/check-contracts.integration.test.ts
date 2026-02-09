import * as path from 'path';
import { PipelineService } from '../../src/application/pipeline/pipeline.service';
import { ProgramFactory } from '../../src/application/pipeline/program';
import { GetPluginDiagnosticsService } from '../../src/apps/plugin/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service';
import { createTestPipeline, runFullPipeline } from '../helpers/test-pipeline';
import { FIXTURES } from '../helpers/fixtures';
import { FileSystemAdapter } from '../../src/infrastructure/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../../src/infrastructure/config/config.adapter';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('Check Contracts Integration Tests', () => {
  describe('CheckerService', () => {
    it('detects violation in clean-arch-violation fixture', () => {
      const { classifyResult, checkResult } = runFullPipeline(
        createTestPipeline(),
        FIXTURES.CLEAN_ARCH_VIOLATION,
      );

      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.errors).toHaveLength(0);

      // Should detect the domain -> infrastructure violation
      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics).toHaveLength(1);
      expect(checkResult.diagnostics[0].code).toBe(70001);

      // The violation should be in domain/service.ts
      expect(checkResult.diagnostics[0].file).toContain(path.join('domain', 'service.ts'));
    });

    it('reports clean result for clean-arch-valid fixture', () => {
      const { checkResult } = runFullPipeline(
        createTestPipeline(),
        FIXTURES.CLEAN_ARCH_VALID,
      );

      // No violations
      expect(checkResult.violationsFound).toBe(0);
      expect(checkResult.diagnostics).toHaveLength(0);
      expect(checkResult.contractsChecked).toBe(1);
    });
  });

  describe('GetPluginDiagnosticsService', () => {
    let pluginService: GetPluginDiagnosticsService;

    beforeEach(() => {
      const pipeline = createTestPipeline();
      const programFactory = new ProgramFactory(
        pipeline.configAdapter, pipeline.fsAdapter, pipeline.tsAdapter,
      );
      const pipelineService = new PipelineService(
        programFactory,
        pipeline.fsAdapter,
        pipeline.scanService,
        pipeline.parseService,
        pipeline.bindService,
        pipeline.checkService,
      );
      pluginService = new GetPluginDiagnosticsService(pipelineService);
    });

    it('detects violation via plugin diagnostics service', () => {
      const fixturePath = FIXTURES.CLEAN_ARCH_VIOLATION;
      const violatingFile = path.join(fixturePath, 'src/domain/service.ts');

      const result = pluginService.execute({
        fileName: violatingFile,
        projectRoot: fixturePath,
      });

      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(70001);
      expect(result.diagnostics[0].file).toContain('service.ts');
    });

    it('reports no violations for clean fixture', () => {
      const fixturePath = FIXTURES.CLEAN_ARCH_VALID;
      const cleanFile = path.join(fixturePath, 'src/domain/entity.ts');

      const result = pluginService.execute({
        fileName: cleanFile,
        projectRoot: fixturePath,
      });

      expect(result.diagnostics).toHaveLength(0);
    });

    it('performance: completes in under 2000ms for fixture projects', () => {
      const fixturePath = FIXTURES.CLEAN_ARCH_VIOLATION;
      const violatingFile = path.join(fixturePath, 'src/domain/service.ts');

      const result = pluginService.execute({
        fileName: violatingFile,
        projectRoot: fixturePath,
      });

      // Relaxed threshold to account for coverage instrumentation overhead
      expect(result.elapsedMs).toBeLessThan(2000);
    });

    it('returns empty diagnostics when project has no Kind definitions', () => {
      const result = pluginService.execute({
        fileName: '/nonexistent/src/index.ts',
        projectRoot: '/nonexistent',
      });

      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('Adapter Integration', () => {
    it('filesystem adapter reads correctly', () => {
      const fsAdapter = new FileSystemAdapter();
      const fixturePath = path.join(FIXTURES_DIR, 'clean-arch-violation');

      expect(fsAdapter.directoryExists(path.join(fixturePath, 'src/domain'))).toBe(true);
      expect(fsAdapter.directoryExists(path.join(fixturePath, 'src/infrastructure'))).toBe(true);
      expect(fsAdapter.directoryExists(path.join(fixturePath, 'src/nonexistent'))).toBe(false);

      const domainFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src/domain'), true);
      expect(domainFiles).toHaveLength(2);
      expect(domainFiles.some(f => f.includes('entity.ts'))).toBe(true);
      expect(domainFiles.some(f => f.includes('service.ts'))).toBe(true);
    });

    it('config adapter returns undefined for missing config', () => {
      const fsAdapter = new FileSystemAdapter();
      const configAdapter = new ConfigAdapter(fsAdapter);
      const config = configAdapter.readKindScriptConfig('/nonexistent/path');
      expect(config).toBeUndefined();
    });
  });
});
