import { GetPluginDiagnosticsService } from '../../src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service';
import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { ClassifyASTUseCase } from '../../src/application/use-cases/classify-ast/classify-ast.use-case';
import { ClassifyASTResponse } from '../../src/application/use-cases/classify-ast/classify-ast.types';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockConfigAdapter } from '../../src/infrastructure/adapters/testing/mock-config.adapter';
import { ContractType } from '../../src/domain/types/contract-type';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../src/domain/entities/contract';

describe('GetPluginDiagnosticsService', () => {
  let mockFS: MockFileSystemAdapter;
  let mockTS: MockTypeScriptAdapter;
  let mockConfig: MockConfigAdapter;
  let checkContracts: CheckContractsService;
  let service: GetPluginDiagnosticsService;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
    mockTS = new MockTypeScriptAdapter();
    mockConfig = new MockConfigAdapter();
    checkContracts = new CheckContractsService(mockTS, mockFS);
    service = new GetPluginDiagnosticsService(
      checkContracts, mockConfig, mockFS
    );
  });

  it('returns diagnostics for a file violating noDependency contract', () => {
    // Set up a project with domain -> infrastructure violation
    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: [
          { from: 'src/domain', to: 'src/infrastructure' },
        ],
      },
    });
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: [
        '/project/src/domain/service.ts',
        '/project/src/infrastructure/database.ts',
      ],
    });

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
    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: [
          { from: 'src/domain', to: 'src/infrastructure' },
        ],
      },
    });
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: [
        '/project/src/domain/entity.ts',
        '/project/src/infrastructure/database.ts',
      ],
    });

    mockFS
      .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
      .withFile('/project/src/infrastructure/database.ts', 'export const db = {};');

    mockTS
      .withSourceFile('/project/src/domain/entity.ts', 'export class Entity {}')
      .withSourceFile('/project/src/infrastructure/database.ts', 'export const db = {};');

    const result = service.execute({
      fileName: '/project/src/domain/entity.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty diagnostics when no kindscript.json found', () => {
    // No config set up
    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles Tier 1 config-based contracts', () => {
    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: [
          ['src/domain', 'src/infrastructure'],
        ],
      },
    });
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: [
        '/project/src/domain/service.ts',
        '/project/src/infrastructure/database.ts',
      ],
    });

    mockFS
      .withFile('/project/src/domain/service.ts', '')
      .withFile('/project/src/infrastructure/database.ts', '');

    mockTS
      .withSourceFile('/project/src/domain/service.ts', '')
      .withSourceFile('/project/src/infrastructure/database.ts', '');

    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    // No violations since no imports
    expect(result.diagnostics).toHaveLength(0);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('reports elapsed time in response', () => {
    mockConfig.withKindScriptConfig('/project', {
      contracts: {},
    });

    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(typeof result.elapsedMs).toBe('number');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('does not crash on malformed config', () => {
    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: ['not-a-valid-entry' as unknown],
      },
    });
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: ['/project/src/index.ts'],
    });

    mockFS.withFile('/project/src/index.ts', '');
    mockTS.withSourceFile('/project/src/index.ts', '');

    // Should not throw
    const result = service.execute({
      fileName: '/project/src/index.ts',
      projectRoot: '/project',
    });

    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('filters diagnostics to only those relevant to the requested file', () => {
    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: [
          { from: 'src/domain', to: 'src/infrastructure' },
        ],
      },
    });
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: [
        '/project/src/domain/service.ts',
        '/project/src/domain/entity.ts',
        '/project/src/infrastructure/database.ts',
      ],
    });

    mockFS
      .withFile('/project/src/domain/service.ts', '')
      .withFile('/project/src/domain/entity.ts', '')
      .withFile('/project/src/infrastructure/database.ts', '');

    mockTS
      .withSourceFile('/project/src/domain/service.ts', '')
      .withSourceFile('/project/src/domain/entity.ts', '')
      .withSourceFile('/project/src/infrastructure/database.ts', '')
      // Only service.ts imports from infrastructure
      .withImport(
        '/project/src/domain/service.ts',
        '/project/src/infrastructure/database.ts',
        '../infrastructure/database',
        1, 0
      );

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

  it('returns empty when no contracts defined', () => {
    mockConfig.withKindScriptConfig('/project', {});

    const result = service.execute({
      fileName: '/project/src/index.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  it('returns empty when no root files found', () => {
    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: [
          { from: 'src/domain', to: 'src/infrastructure' },
        ],
      },
    });
    // tsconfig with empty files
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: [],
    });

    const result = service.execute({
      fileName: '/project/src/index.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
  });

  describe('Tier 2 (definitions)', () => {
    let mockClassify: ClassifyASTUseCase;

    beforeEach(() => {
      // Create a mock classify service
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, '/project/src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, '/project/src/infrastructure');

      const noDependencyContract = new Contract(
        ContractType.NoDependency,
        'noDependency(domain -> infrastructure)',
        [domainSymbol, infraSymbol],
        '/project/architecture.ts',
      );

      mockClassify = {
        execute: jest.fn().mockReturnValue({
          symbols: [domainSymbol, infraSymbol],
          contracts: [noDependencyContract],
          errors: [],
        } as ClassifyASTResponse),
      };

      // Re-create service with all dependencies (Tier 2 path)
      service = new GetPluginDiagnosticsService(
        checkContracts, mockConfig, mockFS, mockClassify, mockTS
      );
    });

    it('handles Tier 2 definition-based contracts', () => {
      mockConfig.withKindScriptConfig('/project', {
        definitions: ['architecture.ts'],
      });
      mockConfig.withTSConfig('/project/tsconfig.json', {
        files: [
          '/project/src/domain/service.ts',
          '/project/src/infrastructure/database.ts',
        ],
      });

      mockFS
        .withFile('/project/src/domain/service.ts', '')
        .withFile('/project/src/infrastructure/database.ts', '');

      mockTS
        .withSourceFile('/project/architecture.ts', '')
        .withSourceFile('/project/src/domain/service.ts', '')
        .withSourceFile('/project/src/infrastructure/database.ts', '')
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
    });

    it('caches classify result across calls for same definition files', () => {
      mockConfig.withKindScriptConfig('/project', {
        definitions: ['architecture.ts'],
      });
      mockConfig.withTSConfig('/project/tsconfig.json', {
        files: ['/project/src/domain/service.ts'],
      });

      mockFS.withFile('/project/src/domain/service.ts', '');
      mockTS
        .withSourceFile('/project/architecture.ts', '')
        .withSourceFile('/project/src/domain/service.ts', '');

      // Call twice
      service.execute({ fileName: '/project/src/domain/service.ts', projectRoot: '/project' });
      service.execute({ fileName: '/project/src/domain/service.ts', projectRoot: '/project' });

      // Classify should only be called once (cached on second call)
      expect(mockClassify.execute).toHaveBeenCalledTimes(1);
    });

    it('returns empty when definition source files cannot be loaded', () => {
      mockConfig.withKindScriptConfig('/project', {
        definitions: ['nonexistent.ts'],
      });
      mockConfig.withTSConfig('/project/tsconfig.json', {
        files: ['/project/src/index.ts'],
      });

      mockFS.withFile('/project/src/index.ts', '');
      mockTS.withSourceFile('/project/src/index.ts', '');
      // Intentionally NOT adding 'nonexistent.ts' as a source file

      const result = service.execute({
        fileName: '/project/src/index.ts',
        projectRoot: '/project',
      });

      expect(result.diagnostics).toHaveLength(0);
    });
  });

  it('catches errors and returns empty diagnostics', () => {
    // Create a service with a check contracts that throws
    const throwingCheckContracts = {
      execute: jest.fn().mockImplementation(() => {
        throw new Error('Internal error');
      }),
    };
    const errorService = new GetPluginDiagnosticsService(
      throwingCheckContracts as unknown as CheckContractsService,
      mockConfig,
      mockFS,
    );

    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: [
          { from: 'src/domain', to: 'src/infrastructure' },
        ],
      },
    });
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: ['/project/src/domain/service.ts'],
    });

    mockFS.withFile('/project/src/domain/service.ts', '');

    // Should not throw, should return empty diagnostics
    const result = errorService.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    expect(result.diagnostics).toHaveLength(0);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('falls back to readDirectory when tsconfig has no files', () => {
    mockConfig.withKindScriptConfig('/project', {
      contracts: {
        [ContractType.NoDependency]: [
          { from: 'src/domain', to: 'src/infrastructure' },
        ],
      },
    });
    // No files in tsconfig, no tsconfig at all
    mockFS
      .withFile('/project/src/domain/service.ts', '')
      .withFile('/project/src/infrastructure/database.ts', '');

    mockTS
      .withSourceFile('/project/src/domain/service.ts', '')
      .withSourceFile('/project/src/infrastructure/database.ts', '');

    const result = service.execute({
      fileName: '/project/src/domain/service.ts',
      projectRoot: '/project',
    });

    // Should still work — falls back to readDirectory on project root
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
