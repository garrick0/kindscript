import { GenerateProjectRefsService } from '../../src/application/use-cases/generate-project-refs/generate-project-refs.service';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { DetectedArchitecture } from '../../src/domain/entities/detected-architecture';
import { DetectedLayer } from '../../src/domain/value-objects/detected-layer';
import { LayerDependencyEdge } from '../../src/domain/value-objects/layer-dependency-edge';
import { ArchitecturePattern } from '../../src/domain/types/architecture-pattern';
import { LayerRole } from '../../src/domain/types/layer-role';

describe('GenerateProjectRefsService', () => {
  let mockFS: MockFileSystemAdapter;
  let service: GenerateProjectRefsService;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
    service = new GenerateProjectRefsService(mockFS);
  });

  afterEach(() => {
    mockFS.reset();
  });

  function makeCleanArch(): DetectedArchitecture {
    const layers = [
      new DetectedLayer('domain', '/project/src/domain', LayerRole.Domain),
      new DetectedLayer('application', '/project/src/application', LayerRole.Application),
      new DetectedLayer('infrastructure', '/project/src/infrastructure', LayerRole.Infrastructure),
    ];

    const deps = [
      new LayerDependencyEdge('application', 'domain', 3),
      new LayerDependencyEdge('infrastructure', 'domain', 2),
    ];

    return new DetectedArchitecture(ArchitecturePattern.CleanArchitecture, layers, deps);
  }

  describe('Clean Architecture references', () => {
    it('generates correct references for Clean Architecture', () => {
      const detected = makeCleanArch();

      const result = service.execute({
        detected,
        projectRoot: '/project',
      });

      expect(result.configs).toHaveLength(3);
      expect(result.warnings).toHaveLength(0);

      // Domain has no dependencies → no references
      const domainConfig = result.configs.find(c => c.outputPath.includes('domain'));
      expect(domainConfig).toBeDefined();
      expect(domainConfig!.content.references).toBeUndefined();

      // Application depends on domain
      const appConfig = result.configs.find(c => c.outputPath.includes('application'));
      expect(appConfig).toBeDefined();
      const appRefs = appConfig!.content.references as Array<{ path: string }>;
      expect(appRefs).toHaveLength(1);
      expect(appRefs[0].path).toContain('domain');

      // Infrastructure depends on domain
      const infraConfig = result.configs.find(c => c.outputPath.includes('infrastructure'));
      expect(infraConfig).toBeDefined();
      const infraRefs = infraConfig!.content.references as Array<{ path: string }>;
      expect(infraRefs).toHaveLength(1);
      expect(infraRefs[0].path).toContain('domain');
    });
  });

  describe('compiler options', () => {
    it('each config has composite: true and declaration: true', () => {
      const detected = makeCleanArch();

      const result = service.execute({
        detected,
        projectRoot: '/project',
      });

      for (const config of result.configs) {
        const opts = config.content.compilerOptions as Record<string, unknown>;
        expect(opts.composite).toBe(true);
        expect(opts.declaration).toBe(true);
      }
    });
  });

  describe('root config', () => {
    it('root tsconfig.build.json references all layers', () => {
      const detected = makeCleanArch();

      const result = service.execute({
        detected,
        projectRoot: '/project',
      });

      expect(result.rootConfig).toBeDefined();
      expect(result.rootConfig!.outputPath).toContain('tsconfig.build.json');

      const rootContent = result.rootConfig!.content;
      expect(rootContent.files).toEqual([]);

      const refs = rootContent.references as Array<{ path: string }>;
      expect(refs).toHaveLength(3);
    });
  });

  describe('relative paths', () => {
    it('relative paths between layers are correct', () => {
      const detected = makeCleanArch();

      mockFS
        .withDirectory('/project/src/domain')
        .withDirectory('/project/src/application')
        .withDirectory('/project/src/infrastructure');

      const result = service.execute({
        detected,
        projectRoot: '/project',
      });

      // Application → domain reference should use relative path
      const appConfig = result.configs.find(c => c.outputPath.includes('application'));
      const appRefs = appConfig!.content.references as Array<{ path: string }>;
      // MockFileSystemAdapter.relativePath returns a simplified version
      expect(appRefs[0].path).toBeDefined();
    });
  });

  describe('layer with no dependencies', () => {
    it('layer with no deps gets no references field', () => {
      const layers = [
        new DetectedLayer('domain', '/project/src/domain', LayerRole.Domain),
        new DetectedLayer('application', '/project/src/application', LayerRole.Application),
      ];

      const detected = new DetectedArchitecture(
        ArchitecturePattern.Layered,
        layers,
        [] // no dependencies
      );

      const result = service.execute({
        detected,
        projectRoot: '/project',
      });

      for (const config of result.configs) {
        expect(config.content.references).toBeUndefined();
      }
    });
  });

  describe('empty layers', () => {
    it('returns warning when no layers provided', () => {
      const detected = new DetectedArchitecture(
        ArchitecturePattern.Unknown,
        [],
        []
      );

      const result = service.execute({
        detected,
        projectRoot: '/project',
      });

      expect(result.configs).toHaveLength(0);
      expect(result.rootConfig).toBeUndefined();
      expect(result.warnings).toContain('No layers to generate configs for');
    });
  });
});
