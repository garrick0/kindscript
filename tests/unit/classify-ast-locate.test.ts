import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { MockASTAdapter } from '../../src/infrastructure/adapters/testing/mock-ast.adapter';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

describe('ClassifyASTService - satisfies InstanceConfig<T> and Multi-file', () => {
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
      mockAST.withKindDefinition('/project/src/kinds.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/instances.k.ts', {
        variableName: 'ordering',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/kinds.k.ts'), sourceFile('/project/src/instances.k.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Kind def from kinds.k.ts + instance from instances.k.ts
      expect(result.symbols.length).toBeGreaterThanOrEqual(1);
      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
    });

    it('handles empty definition files', () => {
      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/empty.k.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols).toHaveLength(0);
      expect(result.contracts).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('satisfies InstanceConfig<T> recognition', () => {
    it('recognizes satisfies InstanceConfig<T> and creates an instance symbol', () => {
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/arch.k.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.name).toBe('app');
      expect(instance!.declaredLocation).toBe('/project/src');
      expect(instance!.kindTypeName).toBe('Ctx');
    });

    it('infers root from source file directory', () => {
      mockAST.withKindDefinition('/my-app/modules/ordering/ordering.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/my-app/modules/ordering/ordering.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/my-app/modules/ordering/ordering.k.ts')],
        checker: mockChecker,
        projectRoot: '/my-app',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.declaredLocation).toBe('/my-app/modules/ordering');

      const domain = instance!.findMember('domain');
      expect(domain!.declaredLocation).toBe('/my-app/modules/ordering/domain');
    });

    it('derives member paths from file directory + member name', () => {
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/arch.k.ts')],
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
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [
          { name: 'entities', typeName: 'EntitiesModule' },
          { name: 'ports', typeName: 'PortsModule' },
        ],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{
          name: 'domain',
          children: [
            { name: 'entities' },
            { name: 'ports' },
          ],
        }],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/arch.k.ts')],
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

    it('uses Member kind for instance-derived symbols', () => {
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/arch.k.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const domain = instance!.findMember('domain');
      expect(domain!.kind).toBe(ArchSymbolKind.Member);
    });

    it('resolves standalone variable references in instance members', () => {
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [
          { name: 'entities', typeName: 'EntitiesModule' },
          { name: 'ports', typeName: 'PortsModule' },
        ],
      });

      // Instance referencing standalone variable — adapter resolves this,
      // so in the view the children are already provided
      mockAST.withInstanceDeclaration('/project/src/arch.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [
          {
            name: 'domain',
            children: [
              { name: 'entities' },
              { name: 'ports' },
            ],
          },
          { name: 'infra' },
        ],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/arch.k.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Find the instance (named 'app')
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
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [{ name: 'entities', typeName: 'EntitiesModule' }],
      });

      // domain has children (from resolved variable), infra is inline (no children)
      mockAST.withInstanceDeclaration('/project/src/arch.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [
          {
            name: 'domain',
            children: [{ name: 'entities' }],
          },
          { name: 'infra' },
        ],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/arch.k.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Find the instance (named 'app')
      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance && s.name === 'app');
      const domain = instance!.findMember('domain');
      expect(domain!.findMember('entities')).toBeDefined();

      const infra = instance!.findMember('infra');
      expect(infra).toBeDefined();
      expect(infra!.declaredLocation).toBe('/project/src/infra');
    });

    it('supports path override via pathOverride in member view', () => {
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [
          { name: 'valueObjects', typeName: 'ValueObjectsModule' },
          { name: 'entities', typeName: 'EntitiesModule' },
        ],
      });
      mockAST.withKindDefinition('/project/src/arch.k.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.k.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{
          name: 'domain',
          children: [
            { name: 'valueObjects', pathOverride: 'value-objects' },
            { name: 'entities' },
          ],
        }],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('/project/src/arch.k.ts')],
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
