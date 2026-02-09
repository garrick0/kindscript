import { GetPluginCodeFixesService } from '../../../src/apps/plugin/use-cases/get-plugin-code-fixes/get-plugin-code-fixes.service';
import { createAllPlugins } from '../../../src/application/pipeline/plugins/plugin-registry';

describe('GetPluginCodeFixesService', () => {
  let service: GetPluginCodeFixesService;

  beforeEach(() => {
    service = new GetPluginCodeFixesService(createAllPlugins());
  });

  it('returns fix for KS70001 (forbidden dependency) error code', () => {
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      start: 0,
      end: 50,
      errorCodes: [70001],
      projectRoot: '/project',
    });

    expect(result.fixes).toHaveLength(1);
    expect(result.fixes[0].fixName).toBe('kindscript-remove-forbidden-import');
    expect(result.fixes[0].description).toContain('forbidden dependency');
    expect(result.fixes[0].diagnosticCode).toBe(70001);
  });

  it('returns fix for KS70003 (impure import) error code', () => {
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      start: 0,
      end: 50,
      errorCodes: [70003],
      projectRoot: '/project',
    });

    expect(result.fixes).toHaveLength(1);
    expect(result.fixes[0].fixName).toBe('kindscript-remove-impure-import');
    expect(result.fixes[0].description).toContain('impure import');
    expect(result.fixes[0].diagnosticCode).toBe(70003);
  });

  it('returns empty for non-KindScript error codes', () => {
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      start: 0,
      end: 50,
      errorCodes: [2304, 2339, 1005],
      projectRoot: '/project',
    });

    expect(result.fixes).toHaveLength(0);
  });

  it('returns empty when no KindScript codes in error list', () => {
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      start: 0,
      end: 50,
      errorCodes: [],
      projectRoot: '/project',
    });

    expect(result.fixes).toHaveLength(0);
  });

  it('ignores unknown KindScript error codes gracefully', () => {
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      start: 0,
      end: 50,
      errorCodes: [70050, 70099],
      projectRoot: '/project',
    });

    expect(result.fixes).toHaveLength(0);
  });

  it('returns multiple fixes for multiple KindScript error codes', () => {
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      start: 0,
      end: 50,
      errorCodes: [70001, 70003],
      projectRoot: '/project',
    });

    expect(result.fixes).toHaveLength(2);
    expect(result.fixes[0].diagnosticCode).toBe(70001);
    expect(result.fixes[1].diagnosticCode).toBe(70003);
  });

  it('filters out non-KS codes while keeping KS codes', () => {
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      start: 0,
      end: 50,
      errorCodes: [2304, 70001, 1005],
      projectRoot: '/project',
    });

    expect(result.fixes).toHaveLength(1);
    expect(result.fixes[0].diagnosticCode).toBe(70001);
  });
});
