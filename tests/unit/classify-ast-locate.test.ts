import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { MockASTAdapter } from '../../src/infrastructure/adapters/testing/mock-ast.adapter';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';
import { ASTNode } from '../../src/application/ports/ast.port';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

describe('ClassifyASTService - locate<T>() and Multi-file', () => {
  let service: ClassifyASTService;
  let mockAST: MockASTAdapter;

  beforeEach(() => {
    mockAST = new MockASTAdapter();
    service = new ClassifyASTService(mockAST);
  });

  afterEach(() => {
    mockAST.reset();
  });

  describe('Multi-file classification', () => {
    it('processes multiple definition files', () => {
      mockAST.withInterface('kinds.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      mockAST.withLocateCall('instances.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('kinds.ts'), sourceFile('instances.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Kind def from kinds.ts + instance from instances.ts
      expect(result.symbols.length).toBeGreaterThanOrEqual(1);
      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
    });

    it('binds contracts from package file to instances in user file', () => {
      // Package file: Kind defs + contracts (processed first)
      mockAST.withInterface('package.ts', 'CleanContext', 'Kind', 'CleanContext', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infrastructure', typeName: 'InfrastructureLayer' },
      ]);

      mockAST.withDefineContractsCall('package.ts', 'CleanContext', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('domain'),
            MockASTAdapter.stringLiteral('infrastructure'),
          ]),
        ])},
      ]));

      // User file: locate instance declaration (processed second)
      mockAST.withLocateCall('user.ts', 'app', 'CleanContext', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
        { name: 'infrastructure', value: MockASTAdapter.objectLiteral([]) },
      ]));

      // Package file first, user file second — contracts come before instances
      const result = service.execute({
        definitionFiles: [sourceFile('package.ts'), sourceFile('user.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Contracts from package should bind to instance from user file
      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.NoDependency);
      expect(result.contracts[0].args[0].name).toBe('domain');
      expect(result.contracts[0].args[1].name).toBe('infrastructure');
      expect(result.errors).toHaveLength(0);
    });

    it('handles empty definition files', () => {
      const result = service.execute({
        definitionFiles: [sourceFile('empty.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols).toHaveLength(0);
      expect(result.contracts).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('locate<T>() recognition', () => {
    it('recognizes locate<T>(root, members) and creates an instance symbol', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.name).toBe('app');
      expect(instance!.declaredLocation).toBe('/project/src');
      expect(instance!.kindTypeName).toBe('Ctx');
    });

    it('derives member paths from root + member name', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const domain = instance!.findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe('/project/src/domain');
      expect(domain!.kindTypeName).toBe('DomainLayer');
      expect(domain!.locationDerived).toBe(true);

      const infra = instance!.findMember('infra');
      expect(infra).toBeDefined();
      expect(infra!.declaredLocation).toBe('/project/src/infra');
      expect(infra!.kindTypeName).toBe('InfraLayer');
      expect(infra!.locationDerived).toBe(true);
    });

    it('derives nested member paths recursively', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);
      mockAST.withInterface('arch.ts', 'DomainLayer', 'Kind', 'DomainLayer', [
        { name: 'entities', typeName: 'EntitiesModule' },
        { name: 'ports', typeName: 'PortsModule' },
      ]);

      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'entities', value: MockASTAdapter.objectLiteral([]) },
          { name: 'ports', value: MockASTAdapter.objectLiteral([]) },
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const domain = instance!.findMember('domain');
      expect(domain!.declaredLocation).toBe('/project/src/domain');

      const entities = domain!.findMember('entities');
      expect(entities).toBeDefined();
      expect(entities!.declaredLocation).toBe('/project/src/domain/entities');
      expect(entities!.kindTypeName).toBe('EntitiesModule');
      expect(entities!.locationDerived).toBe(true);

      const ports = domain!.findMember('ports');
      expect(ports).toBeDefined();
      expect(ports!.declaredLocation).toBe('/project/src/domain/ports');
      expect(ports!.kindTypeName).toBe('PortsModule');
    });

    it('uses Member kind for locate-derived symbols', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const domain = instance!.findMember('domain');
      expect(domain!.kind).toBe(ArchSymbolKind.Member);
    });

    it('works with defineContracts referencing locate-based instance', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('domain'),
            MockASTAdapter.stringLiteral('infra'),
          ]),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.NoDependency);
      expect(result.contracts[0].args[0].name).toBe('domain');
      expect(result.contracts[0].args[1].name).toBe('infra');
      expect(result.errors).toHaveLength(0);
    });

    it('reports error for locate with no type argument', () => {
      // Use withStatement to create a raw locate call with no type args
      const call = {
        __type: 'callExpression' as const,
        functionName: 'locate',
        typeArgNames: [] as string[],
        args: [MockASTAdapter.stringLiteral('src'), MockASTAdapter.objectLiteral([])],
      };
      const decl = {
        __type: 'variableDeclaration' as const,
        name: 'app',
        initializer: call as unknown as ASTNode,
      };
      const stmt = {
        __type: 'variableStatement' as const,
        declarations: [decl],
      };
      mockAST.withStatement('arch.ts', stmt as unknown as ASTNode);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.errors.some(e => e.includes('no type argument'))).toBe(true);
    });

    it('resolves standalone variable references in locate members', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);
      mockAST.withInterface('arch.ts', 'DomainLayer', 'Kind', 'DomainLayer', [
        { name: 'entities', typeName: 'EntitiesModule' },
        { name: 'ports', typeName: 'PortsModule' },
      ]);

      // Standalone variable: const domain: DomainLayer = { entities: {}, ports: {} }
      mockAST.withVariable('arch.ts', 'domain', 'DomainLayer', MockASTAdapter.objectLiteral([
        { name: 'entities', value: MockASTAdapter.objectLiteral([]) },
        { name: 'ports', value: MockASTAdapter.objectLiteral([]) },
      ]));

      // locate call referencing the standalone variable via identifier
      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.identifier('domain') },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Find the locate-based instance (named 'app'), not the standalone 'domain'
      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance && s.name === 'app');
      expect(instance).toBeDefined();

      // domain member should have sub-members resolved from the standalone variable
      const domain = instance!.findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe('/project/src/domain');
      expect(domain!.kindTypeName).toBe('DomainLayer');

      const entities = domain!.findMember('entities');
      expect(entities).toBeDefined();
      expect(entities!.declaredLocation).toBe('/project/src/domain/entities');
      expect(entities!.kindTypeName).toBe('EntitiesModule');

      const ports = domain!.findMember('ports');
      expect(ports).toBeDefined();
      expect(ports!.declaredLocation).toBe('/project/src/domain/ports');
      expect(ports!.kindTypeName).toBe('PortsModule');
    });

    it('handles mixed standalone and inline members', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);
      mockAST.withInterface('arch.ts', 'DomainLayer', 'Kind', 'DomainLayer', [
        { name: 'entities', typeName: 'EntitiesModule' },
      ]);

      // Standalone domain
      mockAST.withVariable('arch.ts', 'domain', 'DomainLayer', MockASTAdapter.objectLiteral([
        { name: 'entities', value: MockASTAdapter.objectLiteral([]) },
      ]));

      // locate: domain is identifier reference, infra is inline
      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.identifier('domain') },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Find the locate-based instance (named 'app')
      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance && s.name === 'app');
      const domain = instance!.findMember('domain');
      expect(domain!.findMember('entities')).toBeDefined();

      const infra = instance!.findMember('infra');
      expect(infra).toBeDefined();
      expect(infra!.declaredLocation).toBe('/project/src/infra');
    });

    it('supports path override via { path: "..." } in member object', () => {
      mockAST.withInterface('arch.ts', 'DomainLayer', 'Kind', 'DomainLayer', [
        { name: 'valueObjects', typeName: 'ValueObjectsModule' },
        { name: 'entities', typeName: 'EntitiesModule' },
      ]);
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      mockAST.withLocateCall('arch.ts', 'app', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'valueObjects', value: MockASTAdapter.objectLiteral([
            { name: 'path', value: MockASTAdapter.stringLiteral('value-objects') },
          ])},
          { name: 'entities', value: MockASTAdapter.objectLiteral([]) },
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance && s.name === 'app');
      const domain = instance!.findMember('domain');
      expect(domain!.declaredLocation).toBe('/project/src/domain');

      // valueObjects uses path override
      const valueObjects = domain!.findMember('valueObjects');
      expect(valueObjects).toBeDefined();
      expect(valueObjects!.declaredLocation).toBe('/project/src/domain/value-objects');

      // entities uses default convention
      const entities = domain!.findMember('entities');
      expect(entities).toBeDefined();
      expect(entities!.declaredLocation).toBe('/project/src/domain/entities');
    });
  });
});
