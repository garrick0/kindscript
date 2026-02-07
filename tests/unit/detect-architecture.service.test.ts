import { DetectArchitectureService } from '../../src/application/use-cases/detect-architecture/detect-architecture.service';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { ArchitecturePattern } from '../../src/domain/types/architecture-pattern';
import { LayerRole } from '../../src/domain/types/layer-role';

describe('DetectArchitectureService', () => {
  let mockFS: MockFileSystemAdapter;
  let mockTS: MockTypeScriptAdapter;
  let service: DetectArchitectureService;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
    mockTS = new MockTypeScriptAdapter();
    service = new DetectArchitectureService(mockFS, mockTS);
  });

  afterEach(() => {
    mockFS.reset();
    mockTS.reset();
  });

  describe('Clean Architecture detection', () => {
    it('detects Clean Architecture with domain + application + infrastructure', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/application')
        .withDirectory('/project/src/infrastructure')
        .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withFile('/project/src/application/handler.ts', 'import { Entity } from "../domain/entity";')
        .withFile('/project/src/infrastructure/repository.ts', 'import { Entity } from "../domain/entity";');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withSourceFile('/project/src/application/handler.ts', 'import { Entity } from "../domain/entity";')
        .withSourceFile('/project/src/infrastructure/repository.ts', 'import { Entity } from "../domain/entity";')
        .withImport('/project/src/application/handler.ts', '/project/src/domain/entity.ts', '../domain/entity')
        .withImport('/project/src/infrastructure/repository.ts', '/project/src/domain/entity.ts', '../domain/entity');

      const result = service.execute({ projectRoot: '/project' });

      expect(result.detected.pattern).toBe(ArchitecturePattern.CleanArchitecture);
      expect(result.detected.layers).toHaveLength(3);
      expect(result.warnings).toHaveLength(0);

      const roles = result.detected.layers.map(l => l.role);
      expect(roles).toContain(LayerRole.Domain);
      expect(roles).toContain(LayerRole.Application);
      expect(roles).toContain(LayerRole.Infrastructure);
    });

    it('domain has zero outward dependencies in Clean Architecture', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/application')
        .withDirectory('/project/src/infrastructure')
        .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withFile('/project/src/application/handler.ts', '')
        .withFile('/project/src/infrastructure/repository.ts', '');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withSourceFile('/project/src/application/handler.ts', '')
        .withSourceFile('/project/src/infrastructure/repository.ts', '')
        .withImport('/project/src/application/handler.ts', '/project/src/domain/entity.ts', '../domain/entity');

      const result = service.execute({ projectRoot: '/project' });

      expect(result.detected.pattern).toBe(ArchitecturePattern.CleanArchitecture);
      const domainDeps = result.detected.getDependenciesOf('domain');
      expect(domainDeps).toHaveLength(0);
    });

    it('does not detect Clean Architecture when domain imports infrastructure', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/application')
        .withDirectory('/project/src/infrastructure')
        .withFile('/project/src/domain/entity.ts', '')
        .withFile('/project/src/application/handler.ts', '')
        .withFile('/project/src/infrastructure/repository.ts', '');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', '')
        .withSourceFile('/project/src/application/handler.ts', '')
        .withSourceFile('/project/src/infrastructure/repository.ts', '')
        .withImport('/project/src/domain/entity.ts', '/project/src/infrastructure/repository.ts', '../infrastructure/repository')
        .withImport('/project/src/application/handler.ts', '/project/src/domain/entity.ts', '../domain/entity');

      const result = service.execute({ projectRoot: '/project' });

      // Should still detect layers but NOT Clean Architecture pattern
      expect(result.detected.layers).toHaveLength(3);
      expect(result.detected.pattern).not.toBe(ArchitecturePattern.CleanArchitecture);
      // Falls through to Layered since there are deps
      expect(result.detected.pattern).toBe(ArchitecturePattern.Layered);
    });
  });

  describe('Hexagonal detection', () => {
    it('detects Hexagonal with domain + ports + adapters', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/ports')
        .withDirectory('/project/src/adapters')
        .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withFile('/project/src/ports/repository.port.ts', 'export interface RepositoryPort {}')
        .withFile('/project/src/adapters/repository.adapter.ts', '');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withSourceFile('/project/src/ports/repository.port.ts', 'export interface RepositoryPort {}')
        .withSourceFile('/project/src/adapters/repository.adapter.ts', '')
        .withImport('/project/src/adapters/repository.adapter.ts', '/project/src/ports/repository.port.ts', '../ports/repository.port');

      const result = service.execute({ projectRoot: '/project' });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Hexagonal);
      expect(result.detected.layers).toHaveLength(3);

      const roles = result.detected.layers.map(l => l.role);
      expect(roles).toContain(LayerRole.Domain);
      expect(roles).toContain(LayerRole.Ports);
      expect(roles).toContain(LayerRole.Adapters);
    });
  });

  describe('Layered detection', () => {
    it('detects Layered with 2+ recognized layers and directional deps', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/presentation')
        .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withFile('/project/src/presentation/view.ts', '');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withSourceFile('/project/src/presentation/view.ts', '')
        .withImport('/project/src/presentation/view.ts', '/project/src/domain/entity.ts', '../domain/entity');

      const result = service.execute({ projectRoot: '/project' });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Layered);
      expect(result.detected.layers).toHaveLength(2);
    });
  });

  describe('Unknown detection', () => {
    it('returns Unknown when no recognized layers found', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/utils')
        .withDirectory('/project/src/config')
        .withFile('/project/src/utils/helper.ts', 'export function helper() {}')
        .withFile('/project/src/config/settings.ts', 'export const settings = {};');

      const result = service.execute({ projectRoot: '/project' });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Unknown);
      expect(result.detected.layers).toHaveLength(0);
      expect(result.warnings).toContain('No architectural layers detected');
    });
  });

  describe('source directory detection', () => {
    it('finds src/ subdirectory automatically', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/application')
        .withDirectory('/project/src/infrastructure')
        .withFile('/project/src/domain/entity.ts', '')
        .withFile('/project/src/application/handler.ts', '')
        .withFile('/project/src/infrastructure/repo.ts', '');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', '')
        .withSourceFile('/project/src/application/handler.ts', '')
        .withSourceFile('/project/src/infrastructure/repo.ts', '');

      const result = service.execute({ projectRoot: '/project' });

      expect(result.detected.layers).toHaveLength(3);
      expect(result.warnings).toHaveLength(0);
    });

    it('returns warning when no source directory found', () => {
      // Empty project root with no subdirectories
      const result = service.execute({ projectRoot: '/empty-project' });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Unknown);
      expect(result.warnings).toContain('No source directory found (checked src/, lib/, project root)');
    });

    it('ignores node_modules directories', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/node_modules')
        .withFile('/project/src/domain/entity.ts', '');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', '');

      const result = service.execute({ projectRoot: '/project' });

      // node_modules should not appear as a layer
      const layerNames = result.detected.layers.map(l => l.name);
      expect(layerNames).not.toContain('node_modules');
    });
  });

  describe('import aggregation', () => {
    it('aggregates file-level imports to layer-level dependency edges', () => {
      mockFS
        .withDirectory('/project/src')
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/application')
        .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withFile('/project/src/domain/value.ts', 'export class Value {}')
        .withFile('/project/src/application/handler.ts', '')
        .withFile('/project/src/application/service.ts', '');

      mockTS
        .withSourceFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withSourceFile('/project/src/domain/value.ts', 'export class Value {}')
        .withSourceFile('/project/src/application/handler.ts', '')
        .withSourceFile('/project/src/application/service.ts', '')
        .withImport('/project/src/application/handler.ts', '/project/src/domain/entity.ts', '../domain/entity')
        .withImport('/project/src/application/service.ts', '/project/src/domain/entity.ts', '../domain/entity')
        .withImport('/project/src/application/service.ts', '/project/src/domain/value.ts', '../domain/value');

      const result = service.execute({ projectRoot: '/project' });

      const appToDomain = result.detected.dependencies.find(
        e => e.from === 'application' && e.to === 'domain'
      );
      expect(appToDomain).toBeDefined();
      expect(appToDomain!.weight).toBe(3); // 3 total imports from app to domain
    });
  });
});
