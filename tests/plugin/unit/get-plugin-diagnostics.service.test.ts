import { GetPluginDiagnosticsService } from '../../../src/apps/plugin/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service';
import { PipelineUseCase, PipelineResponse } from '../../../src/application/pipeline/pipeline.types';
import { Diagnostic } from '../../../src/domain/entities/diagnostic';

describe('GetPluginDiagnosticsService', () => {
  let mockPipeline: PipelineUseCase;
  let service: GetPluginDiagnosticsService;

  function makeDiagnostic(file: string, code: number, message: string): Diagnostic {
    return new Diagnostic(message, code, file, 1, 0);
  }

  function makeSuccessResponse(overrides?: Partial<Extract<PipelineResponse, { ok: true }>>): PipelineResponse {
    return {
      ok: true,
      diagnostics: [],
      contractsChecked: 0,
      filesAnalyzed: 0,
      classificationErrors: [],
      ...overrides,
    };
  }

  function createService(): GetPluginDiagnosticsService {
    return new GetPluginDiagnosticsService(mockPipeline);
  }

  beforeEach(() => {
    mockPipeline = {
      execute: jest.fn().mockReturnValue(makeSuccessResponse()),
    };

    service = createService();
  });

  it('returns diagnostics for a file violating noDependency contract', () => {
    const diag = makeDiagnostic('/project/src/domain/service.ts', 70001, 'Forbidden dependency');
    mockPipeline = {
      execute: jest.fn().mockReturnValue(makeSuccessResponse({
        diagnostics: [diag],
        contractsChecked: 1,
        filesAnalyzed: 2,
      })),
    };
    service = createService();

    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(70001);
    expect(typeof result.elapsedMs).toBe('number');
  });

  it('returns empty diagnostics for a file with no violations', () => {
    mockPipeline = {
      execute: jest.fn().mockReturnValue(makeSuccessResponse({
        diagnostics: [
          makeDiagnostic('/project/src/domain/service.ts', 70001, 'Forbidden dependency'),
        ],
      })),
    };
    service = createService();

    const result = service.execute({
      fileName: '/project/src/domain/entity.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty diagnostics when pipeline returns error', () => {
    mockPipeline = {
      execute: jest.fn().mockReturnValue({ ok: false, error: 'No Kind definitions found in the project.' }),
    };
    service = createService();

    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty when no contracts found', () => {
    mockPipeline = {
      execute: jest.fn().mockReturnValue(makeSuccessResponse({ diagnostics: [] })),
    };
    service = createService();

    const result = service.execute({
      fileName: '/project/src/index.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('reports elapsed time in response', () => {
    const result = service.execute({
      fileName: '/project/src/index.ts',
      projectRoot: '/project',
    });

    expect(typeof result.elapsedMs).toBe('number');
  });

  it('filters diagnostics to only those relevant to the requested file', () => {
    mockPipeline = {
      execute: jest.fn().mockReturnValue(makeSuccessResponse({
        diagnostics: [
          makeDiagnostic('/project/src/domain/service.ts', 70001, 'Forbidden dependency'),
        ],
      })),
    };
    service = createService();

    // Check entity.ts — should have no diagnostics
    const result = service.execute({
      fileName: '/project/src/domain/entity.ts',
      projectRoot: '/project',
    });
    expect(result.diagnostics).toHaveLength(0);

    // Check service.ts — should have diagnostics
    const result2 = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });
    expect(result2.diagnostics).toHaveLength(1);
  });

  it('delegates to pipeline on each call (caching is in PipelineService)', () => {
    service.execute({ fileName: '/project/src/domain/service.ts', projectRoot: '/project' });
    service.execute({ fileName: '/project/src/domain/service.ts', projectRoot: '/project' });

    // Pipeline is called every time — it handles its own caching internally
    expect(mockPipeline.execute).toHaveBeenCalledTimes(2);
  });

  it('catches errors and returns empty diagnostics', () => {
    mockPipeline = {
      execute: jest.fn().mockImplementation(() => {
        throw new Error('Internal error');
      }),
    };

    const errorService = createService();

    const result = errorService.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
    expect(typeof result.elapsedMs).toBe('number');
  });
});
