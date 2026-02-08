import { GetPluginDiagnosticsService } from '../../src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { createAllCheckers } from '../../src/application/use-cases/check-contracts/create-checkers';
import { ClassifyProjectUseCase } from '../../src/application/use-cases/classify-project/classify-project.use-case';
import { ClassifyProjectResult } from '../../src/application/use-cases/classify-project/classify-project.types';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { ContractType } from '../../src/domain/types/contract-type';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../src/domain/entities/contract';
import { Program } from '../../src/domain/entities/program';

describe('GetPluginDiagnosticsService', () => {
  let mockFS: MockFileSystemAdapter;
  let mockTS: MockTypeScriptAdapter;
  let checkContracts: CheckContractsService;
  let mockClassifyProject: ClassifyProjectUseCase;
  let service: GetPluginDiagnosticsService;

  const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Member, '/project/src/domain');
  const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Member, '/project/src/infrastructure');

  const noDependencyContract = new Contract(
    ContractType.NoDependency,
    'noDependency(domain -> infrastructure)',
    [domainSymbol, infraSymbol],
    '/project/src/context.k.ts',
  );

  function makeSuccessResult(overrides?: Partial<Extract<ClassifyProjectResult, { ok: true }>>): ClassifyProjectResult {
    const rootFiles = overrides?.rootFiles ?? [
      '/project/src/domain/service.ts',
      '/project/src/infrastructure/database.ts',
    ];
    return {
      ok: true,
      symbols: [domainSymbol, infraSymbol],
      contracts: [noDependencyContract],
      classificationErrors: [],
      instanceTypeNames: new Map(),
      program: new Program(rootFiles, {}),
      rootFiles,
      config: {},
      ...overrides,
    };
  }

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
    mockTS = new MockTypeScriptAdapter();
    checkContracts = new CheckContractsService(createAllCheckers(), mockTS);

    mockClassifyProject = {
      execute: jest.fn().mockReturnValue(makeSuccessResult()),
    };

    service = new GetPluginDiagnosticsService(checkContracts, mockClassifyProject, mockFS);
  });

  it('returns diagnostics for a file violating noDependency contract', () => {
    mockFS
      .withFile('/project/src/domain/service.ts', 'import { db } from "../infrastructure/database";')
      .withFile('/project/src/infrastructure/database.ts', 'export const db = {};');

    mockTS
      .withSourceFile('/project/src/domain/service.ts', 'import { db } from "../infrastructure/database";')
      .withSourceFile('/project/src/infrastructure/database.ts', 'export const db = {};')
      .withImport(
        '/project/src/domain/service.ts',
        '/project/src/infrastructure/database.ts',
        '../infrastructure/database',
        1, 0
      );

    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics.length).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics[0].code).toBe(70001);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('returns empty diagnostics for a file with no violations', () => {
    mockFS
      .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
      .withFile('/project/src/infrastructure/database.ts', 'export const db = {};');

    mockTS
      .withSourceFile('/project/src/domain/entity.ts', 'export class Entity {}')
      .withSourceFile('/project/src/infrastructure/database.ts', 'export const db = {};');

    mockClassifyProject = {
      execute: jest.fn().mockReturnValue(makeSuccessResult({
        rootFiles: [
          '/project/src/domain/entity.ts',
          '/project/src/infrastructure/database.ts',
        ],
      })),
    };
    service = new GetPluginDiagnosticsService(checkContracts, mockClassifyProject, mockFS);

    const result = service.execute({
      fileName: '/project/src/domain/entity.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty diagnostics when classify returns error', () => {
    mockClassifyProject = {
      execute: jest.fn().mockReturnValue({ ok: false, error: 'No .k.ts definition files found in the project.' }),
    };
    service = new GetPluginDiagnosticsService(checkContracts, mockClassifyProject, mockFS);

    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty when no contracts found', () => {
    mockClassifyProject = {
      execute: jest.fn().mockReturnValue(makeSuccessResult({ contracts: [] })),
    };
    service = new GetPluginDiagnosticsService(checkContracts, mockClassifyProject, mockFS);

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
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('filters diagnostics to only those relevant to the requested file', () => {
    mockFS
      .withFile('/project/src/domain/service.ts', '')
      .withFile('/project/src/domain/entity.ts', '')
      .withFile('/project/src/infrastructure/database.ts', '');

    mockTS
      .withSourceFile('/project/src/domain/service.ts', '')
      .withSourceFile('/project/src/domain/entity.ts', '')
      .withSourceFile('/project/src/infrastructure/database.ts', '')
      .withImport(
        '/project/src/domain/service.ts',
        '/project/src/infrastructure/database.ts',
        '../infrastructure/database',
        1, 0
      );

    mockClassifyProject = {
      execute: jest.fn().mockReturnValue(makeSuccessResult({
        rootFiles: [
          '/project/src/domain/service.ts',
          '/project/src/domain/entity.ts',
          '/project/src/infrastructure/database.ts',
        ],
      })),
    };
    service = new GetPluginDiagnosticsService(checkContracts, mockClassifyProject, mockFS);

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

    expect(result2.diagnostics.length).toBeGreaterThanOrEqual(1);
  });

  it('delegates to classifyProject on each call (caching is in ClassifyProjectService)', () => {
    service.execute({ fileName: '/project/src/domain/service.ts', projectRoot: '/project' });
    service.execute({ fileName: '/project/src/domain/service.ts', projectRoot: '/project' });

    // ClassifyProject is called every time — it handles its own caching internally
    expect(mockClassifyProject.execute).toHaveBeenCalledTimes(2);
  });

  it('catches errors and returns empty diagnostics', () => {
    mockClassifyProject = {
      execute: jest.fn().mockImplementation(() => {
        throw new Error('Internal error');
      }),
    };

    const errorService = new GetPluginDiagnosticsService(
      checkContracts,
      mockClassifyProject,
      mockFS,
    );

    const result = errorService.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
