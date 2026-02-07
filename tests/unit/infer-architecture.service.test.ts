import { InferArchitectureService } from '../../src/application/use-cases/infer-architecture/infer-architecture.service';
import { DetectArchitectureUseCase } from '../../src/application/use-cases/detect-architecture/detect-architecture.use-case';
import { DetectArchitectureResponse } from '../../src/application/use-cases/detect-architecture/detect-architecture.types';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { DetectedArchitecture } from '../../src/domain/entities/detected-architecture';
import { DetectedLayer } from '../../src/domain/value-objects/detected-layer';
import { LayerDependencyEdge } from '../../src/domain/value-objects/layer-dependency-edge';
import { ArchitecturePattern } from '../../src/domain/types/architecture-pattern';
import { LayerRole } from '../../src/domain/types/layer-role';

function makeDetectMock(response: DetectArchitectureResponse): DetectArchitectureUseCase {
  return {
    execute: jest.fn().mockReturnValue(response),
  };
}

function cleanArchResponse(): DetectArchitectureResponse {
  return {
    detected: new DetectedArchitecture(
      ArchitecturePattern.CleanArchitecture,
      [
        new DetectedLayer('domain', '/project/src/domain', LayerRole.Domain),
        new DetectedLayer('application', '/project/src/application', LayerRole.Application),
        new DetectedLayer('infrastructure', '/project/src/infrastructure', LayerRole.Infrastructure),
      ],
      [
        new LayerDependencyEdge('application', 'domain', 2),
        new LayerDependencyEdge('infrastructure', 'domain', 1),
      ]
    ),
    warnings: [],
  };
}

function hexagonalResponse(): DetectArchitectureResponse {
  return {
    detected: new DetectedArchitecture(
      ArchitecturePattern.Hexagonal,
      [
        new DetectedLayer('domain', '/project/src/domain', LayerRole.Domain),
        new DetectedLayer('ports', '/project/src/ports', LayerRole.Ports),
        new DetectedLayer('adapters', '/project/src/adapters', LayerRole.Adapters),
      ],
      [
        new LayerDependencyEdge('adapters', 'ports', 1),
      ]
    ),
    warnings: [],
  };
}

function layeredResponse(): DetectArchitectureResponse {
  return {
    detected: new DetectedArchitecture(
      ArchitecturePattern.Layered,
      [
        new DetectedLayer('domain', '/project/src/domain', LayerRole.Domain),
        new DetectedLayer('presentation', '/project/src/presentation', LayerRole.Presentation),
      ],
      [
        new LayerDependencyEdge('presentation', 'domain', 1),
      ]
    ),
    warnings: [],
  };
}

function unknownResponse(): DetectArchitectureResponse {
  return {
    detected: new DetectedArchitecture(ArchitecturePattern.Unknown, [], []),
    warnings: ['No architectural layers detected'],
  };
}

describe('InferArchitectureService', () => {
  let mockFS: MockFileSystemAdapter;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
  });

  afterEach(() => {
    mockFS.reset();
  });

  describe('Kind definition generation', () => {
    it('generates correct Kind definition for Clean Architecture', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.kindDefinition).toContain('export interface CleanArchitectureContext extends Kind<"CleanArchitectureContext">');
      expect(result.definitions.kindDefinition).toContain('domain: DomainLayer;');
      expect(result.definitions.kindDefinition).toContain('application: ApplicationLayer;');
      expect(result.definitions.kindDefinition).toContain('infrastructure: InfrastructureLayer;');
      expect(result.definitions.kindDefinition).toContain('export interface DomainLayer extends Kind<"DomainLayer">');
      expect(result.definitions.kindDefinition).toContain('export interface ApplicationLayer extends Kind<"ApplicationLayer">');
      expect(result.definitions.kindDefinition).toContain('export interface InfrastructureLayer extends Kind<"InfrastructureLayer">');
    });

    it('generates correct Kind definition for Hexagonal', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(hexagonalResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.kindDefinition).toContain('export interface HexagonalContext extends Kind<"HexagonalContext">');
      expect(result.definitions.kindDefinition).toContain('domain: DomainLayer;');
      expect(result.definitions.kindDefinition).toContain('ports: PortsLayer;');
      expect(result.definitions.kindDefinition).toContain('adapters: AdaptersLayer;');
    });

    it('generates correct Kind definition for Layered', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(layeredResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.kindDefinition).toContain('export interface LayeredContext extends Kind<"LayeredContext">');
      expect(result.definitions.kindDefinition).toContain('domain: DomainLayer;');
      expect(result.definitions.kindDefinition).toContain('presentation: PresentationLayer;');
    });
  });

  describe('Instance declaration generation', () => {
    it('generates correct instance declaration mapping layers to relative locations', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.instanceDeclaration).toContain('export const app = locate<CleanArchitectureContext>("src"');
      expect(result.definitions.instanceDeclaration).toContain('domain: {},');
      expect(result.definitions.instanceDeclaration).toContain('application: {},');
      expect(result.definitions.instanceDeclaration).toContain('infrastructure: {},');
    });

    it('uses relative paths for locations, not absolute paths', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.instanceDeclaration).not.toContain('/project');
    });
  });

  describe('Boilerplate generation', () => {
    it('includes Kind<N> interface, ContractConfig, and defineContracts', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.boilerplate).toContain('interface Kind<N extends string = string>');
      expect(result.definitions.boilerplate).toContain('readonly kind: N');
      expect(result.definitions.boilerplate).toContain('readonly location: string');
      expect(result.definitions.boilerplate).toContain('interface ContractConfig');
      expect(result.definitions.boilerplate).toContain('noDependency?: [string, string][]');
      expect(result.definitions.boilerplate).toContain('function defineContracts');
    });
  });

  describe('noDependency contract inference', () => {
    it('infers noDependency for Clean Architecture: domain -> app, domain -> infra, app -> infra', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.contracts).toContain('noDependency');
      expect(result.definitions.contracts).toContain('["domain", "application"]');
      expect(result.definitions.contracts).toContain('["domain", "infrastructure"]');
      expect(result.definitions.contracts).toContain('["application", "infrastructure"]');
    });

    it('infers noDependency for Hexagonal: domain -> adapters', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(hexagonalResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.contracts).toContain('["domain", "adapters"]');
    });
  });

  describe('purity contract inference', () => {
    it('infers purity for domain layer with no impure imports', () => {
      mockFS
        .withDirectory('/project/src/domain')
        .withFile('/project/src/domain/entity.ts', 'export class Entity { id: string = ""; }');

      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.contracts).toContain('purity');
      expect(result.definitions.contracts).toContain('"domain"');
    });

    it('does not infer purity for domain that imports fs', () => {
      mockFS
        .withDirectory('/project/src/domain')
        .withFile('/project/src/domain/entity.ts', 'import * as fs from "fs";\nexport class Entity {}');

      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      // purity section should not include domain
      const contracts = result.definitions.contracts;
      if (contracts.includes('purity')) {
        expect(contracts).not.toMatch(/purity:.*"domain"/);
      }
    });

    it('does not infer purity for domain that imports path', () => {
      mockFS
        .withDirectory('/project/src/domain')
        .withFile('/project/src/domain/entity.ts', 'import { join } from "path";\nexport class Entity {}');

      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      const contracts = result.definitions.contracts;
      if (contracts.includes('purity')) {
        expect(contracts).not.toMatch(/purity:.*"domain"/);
      }
    });
  });

  describe('mustImplement contract inference', () => {
    it('infers mustImplement for Hexagonal: ports -> adapters', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(hexagonalResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.contracts).toContain('mustImplement');
      expect(result.definitions.contracts).toContain('["ports", "adapters"]');
    });

    it('does not infer mustImplement for Clean Architecture', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.contracts).not.toContain('mustImplement');
    });
  });

  describe('Unknown pattern handling', () => {
    it('returns empty definitions with warning when pattern is Unknown', () => {
      const detectMock = makeDetectMock(unknownResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Unknown);
      expect(result.definitions.toFileContent()).toBe('\n\n\n');
      expect(result.warnings).toContain('No architectural layers detected');
    });
  });

  describe('Output format', () => {
    it('output is valid TypeScript (no syntax errors in structure)', () => {
      setupPureDomain(mockFS);
      const detectMock = makeDetectMock(cleanArchResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });
      const content = result.definitions.toFileContent();

      // Verify structural correctness: balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Verify key structural elements exist
      expect(content).toContain('interface Kind<N');
      expect(content).toContain('export interface CleanArchitectureContext');
      expect(content).toContain('export const app');
      expect(content).toContain('defineContracts');
    });

    it('handles Layered pattern with 2 layers and deps', () => {
      mockFS
        .withDirectory('/project/src/domain')
        .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withDirectory('/project/src/presentation')
        .withFile('/project/src/presentation/view.ts', 'export class View {}');

      const detectMock = makeDetectMock(layeredResponse());
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.kindDefinition).toContain('LayeredContext');
      expect(result.definitions.kindDefinition).toContain('DomainLayer');
      expect(result.definitions.kindDefinition).toContain('PresentationLayer');
      expect(result.definitions.instanceDeclaration).toContain('domain: {},');
      expect(result.definitions.instanceDeclaration).toContain('presentation: {},');
    });

    it('generates hyphenated layer names as PascalCase types', () => {
      const response: DetectArchitectureResponse = {
        detected: new DetectedArchitecture(
          ArchitecturePattern.Layered,
          [
            new DetectedLayer('domain', '/project/src/domain', LayerRole.Domain),
            new DetectedLayer('use-cases', '/project/src/use-cases', LayerRole.Application),
          ],
          [new LayerDependencyEdge('use-cases', 'domain', 1)]
        ),
        warnings: [],
      };

      mockFS
        .withDirectory('/project/src/domain')
        .withFile('/project/src/domain/entity.ts', 'export class Entity {}')
        .withDirectory('/project/src/use-cases')
        .withFile('/project/src/use-cases/handler.ts', 'export class Handler {}');

      const detectMock = makeDetectMock(response);
      const service = new InferArchitectureService(detectMock, mockFS);

      const result = service.execute({ projectRoot: '/project' });

      expect(result.definitions.kindDefinition).toContain('UseCasesLayer');
    });
  });
});

/** Set up a pure domain layer (no impure imports) for standard tests. */
function setupPureDomain(mockFS: MockFileSystemAdapter): void {
  mockFS
    .withDirectory('/project/src/domain')
    .withFile('/project/src/domain/entity.ts', 'export class Entity { id: string = ""; }')
    .withDirectory('/project/src/application')
    .withFile('/project/src/application/handler.ts', 'import { Entity } from "../domain/entity";')
    .withDirectory('/project/src/infrastructure')
    .withFile('/project/src/infrastructure/repository.ts', 'import { Entity } from "../domain/entity";')
    .withDirectory('/project/src/ports')
    .withFile('/project/src/ports/repository.port.ts', 'export interface RepositoryPort {}')
    .withDirectory('/project/src/adapters')
    .withFile('/project/src/adapters/repository.adapter.ts', 'import { RepositoryPort } from "../ports/repository.port";')
    .withDirectory('/project/src/presentation')
    .withFile('/project/src/presentation/view.ts', 'export class View {}');
}
