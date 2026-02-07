import * as path from 'path';
import { DetectArchitectureService } from '../../src/application/use-cases/detect-architecture/detect-architecture.service';
import { GenerateProjectRefsService } from '../../src/application/use-cases/generate-project-refs/generate-project-refs.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ArchitecturePattern } from '../../src/domain/types/architecture-pattern';
import { LayerRole } from '../../src/domain/types/layer-role';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('DetectArchitecture Integration Tests', () => {
  let tsAdapter: TypeScriptAdapter;
  let fsAdapter: FileSystemAdapter;
  let detectService: DetectArchitectureService;
  let generateService: GenerateProjectRefsService;

  beforeEach(() => {
    tsAdapter = new TypeScriptAdapter();
    fsAdapter = new FileSystemAdapter();
    detectService = new DetectArchitectureService(fsAdapter, tsAdapter);
    generateService = new GenerateProjectRefsService(fsAdapter);
  });

  it('detects Clean Architecture from detect-clean-arch fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');

    const result = detectService.execute({ projectRoot: fixturePath });

    expect(result.detected.pattern).toBe(ArchitecturePattern.CleanArchitecture);
    expect(result.detected.layers).toHaveLength(3);
    expect(result.warnings).toHaveLength(0);

    const roles = result.detected.layers.map(l => l.role);
    expect(roles).toContain(LayerRole.Domain);
    expect(roles).toContain(LayerRole.Application);
    expect(roles).toContain(LayerRole.Infrastructure);

    // Verify dependency edges
    const appToDomain = result.detected.dependencies.find(
      e => e.from === 'application' && e.to === 'domain'
    );
    expect(appToDomain).toBeDefined();
    expect(appToDomain!.weight).toBeGreaterThanOrEqual(1);

    const infraToDomain = result.detected.dependencies.find(
      e => e.from === 'infrastructure' && e.to === 'domain'
    );
    expect(infraToDomain).toBeDefined();
    expect(infraToDomain!.weight).toBeGreaterThanOrEqual(1);

    // Domain should have no outward deps
    const domainOutward = result.detected.getDependenciesOf('domain');
    expect(domainOutward).toHaveLength(0);
  });

  it('detects Hexagonal from detect-hexagonal fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'detect-hexagonal');

    const result = detectService.execute({ projectRoot: fixturePath });

    expect(result.detected.pattern).toBe(ArchitecturePattern.Hexagonal);
    expect(result.detected.layers).toHaveLength(3);

    const roles = result.detected.layers.map(l => l.role);
    expect(roles).toContain(LayerRole.Domain);
    expect(roles).toContain(LayerRole.Ports);
    expect(roles).toContain(LayerRole.Adapters);
  });

  it('returns Unknown from detect-unknown fixture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'detect-unknown');

    const result = detectService.execute({ projectRoot: fixturePath });

    expect(result.detected.pattern).toBe(ArchitecturePattern.Unknown);
    expect(result.detected.layers).toHaveLength(0);
    expect(result.warnings).toContain('No architectural layers detected');
  });

  it('generates project refs for detected Clean Architecture', () => {
    const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');

    const detectResult = detectService.execute({ projectRoot: fixturePath });
    const genResult = generateService.execute({
      detected: detectResult.detected,
      projectRoot: fixturePath,
    });

    expect(genResult.configs).toHaveLength(3);
    expect(genResult.rootConfig).toBeDefined();
    expect(genResult.warnings).toHaveLength(0);

    // Verify domain has no references
    const domainConfig = genResult.configs.find(c =>
      c.outputPath.includes('domain')
    );
    expect(domainConfig).toBeDefined();
    expect(domainConfig!.content.references).toBeUndefined();

    // Verify application references domain
    const appConfig = genResult.configs.find(c =>
      c.outputPath.includes('application')
    );
    expect(appConfig).toBeDefined();
    const appRefs = appConfig!.content.references as Array<{ path: string }>;
    expect(appRefs).toHaveLength(1);
    expect(appRefs[0].path).toContain('domain');

    // Verify root config
    const rootRefs = genResult.rootConfig!.content.references as Array<{ path: string }>;
    expect(rootRefs).toHaveLength(3);

    // Verify composite and declaration flags
    for (const config of genResult.configs) {
      const opts = config.content.compilerOptions as Record<string, unknown>;
      expect(opts.composite).toBe(true);
      expect(opts.declaration).toBe(true);
    }
  });
});
