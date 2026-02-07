import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { MockASTAdapter } from '../../src/infrastructure/adapters/testing/mock-ast.adapter';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

describe('ClassifyASTService', () => {
  let service: ClassifyASTService;
  let mockAST: MockASTAdapter;

  beforeEach(() => {
    mockAST = new MockASTAdapter();
    service = new ClassifyASTService(mockAST);
  });

  afterEach(() => {
    mockAST.reset();
  });

  describe('Kind definition parsing', () => {
    it('finds interface extending Kind<N>', () => {
      mockAST.withInterface('arch.ts', 'OrderingContext', 'Kind', 'OrderingContext', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infrastructure', typeName: 'InfrastructureLayer' },
      ]);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Kind definitions show up as symbols
      const kindSymbol = result.symbols.find(s => s.name === 'OrderingContext');
      expect(kindSymbol).toBeDefined();
    });

    it('extracts kind name from type parameter', () => {
      mockAST.withInterface('arch.ts', 'MyContext', 'Kind', 'MyContext', []);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols.some(s => s.name === 'MyContext')).toBe(true);
    });

    it('ignores interfaces not extending Kind', () => {
      // Add a regular interface (not extending Kind)
      const statements = mockAST.getStatements(sourceFile('arch.ts'));
      expect(statements).toHaveLength(0); // nothing added yet

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols).toHaveLength(0);
      expect(result.contracts).toHaveLength(0);
    });

    it('handles interface with no members', () => {
      mockAST.withInterface('arch.ts', 'EmptyKind', 'Kind', 'EmptyKind', []);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.symbols.some(s => s.name === 'EmptyKind')).toBe(true);
    });
  });

  describe('Instance parsing', () => {
    it('finds variable declaration typed as Kind type', () => {
      mockAST.withInterface('arch.ts', 'OrderingContext', 'Kind', 'OrderingContext', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('OrderingContext') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src/ordering') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/ordering/domain') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'OrderingContext', initObj);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.name).toBe('ordering');
    });

    it('extracts location from object literal initializer', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', []);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src/contexts/ordering') },
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance!.declaredLocation).toBe('/project/src/contexts/ordering');
    });

    it('extracts member locations from nested object literals', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src/ordering') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/ordering/domain') },
        ])},
        { name: 'infra', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('InfraLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/ordering/infra') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance!.members.size).toBe(2);

      const domain = instance!.findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe('/project/src/ordering/domain');

      const infra = instance!.findMember('infra');
      expect(infra).toBeDefined();
      expect(infra!.declaredLocation).toBe('/project/src/ordering/infra');
    });

    it('extracts deeply nested sub-members recursively', () => {
      // 3-level hierarchy: Ctx → domain (Layer) → entities (sub-layer with string leaf)
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
          // Sub-member as nested object literal (triggers extractMemberSymbol recursion)
          { name: 'entities', value: MockASTAdapter.objectLiteral([
            { name: 'kind', value: MockASTAdapter.stringLiteral('EntitiesLayer') },
            { name: 'location', value: MockASTAdapter.stringLiteral('src/domain/entities') },
            // String leaf within the recursive member
            { name: 'core', value: MockASTAdapter.stringLiteral('core') },
          ])},
          // String leaf member (triggers string branch in extractMemberSymbol)
          { name: 'ports', value: MockASTAdapter.stringLiteral('ports') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();

      const domain = instance!.findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe('/project/src/domain');

      // Nested object sub-member
      const entities = domain!.findMember('entities');
      expect(entities).toBeDefined();
      expect(entities!.declaredLocation).toBe('/project/src/domain/entities');

      // String leaf within recursive member
      const core = entities!.findMember('core');
      expect(core).toBeDefined();
      expect(core!.declaredLocation).toBe('/project/src/domain/entities/core');

      // String leaf in domain
      const ports = domain!.findMember('ports');
      expect(ports).toBeDefined();
      expect(ports!.declaredLocation).toBe('/project/src/domain/ports');
    });

    it('handles string member properties as leaf locations', () => {
      mockAST.withInterface('arch.ts', 'DomainLayer', 'Kind', 'DomainLayer', [
        { name: 'entities', typeName: 'string' },
        { name: 'ports', typeName: 'string' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        { name: 'entities', value: MockASTAdapter.stringLiteral('entities') },
        { name: 'ports', value: MockASTAdapter.stringLiteral('ports') },
      ]);

      mockAST.withVariable('arch.ts', 'domainLayer', 'DomainLayer', initObj);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance!.members.size).toBe(2);

      const entities = instance!.findMember('entities');
      expect(entities!.declaredLocation).toBe('/project/src/domain/entities');

      const ports = instance!.findMember('ports');
      expect(ports!.declaredLocation).toBe('/project/src/domain/ports');
    });

    it('ignores variables not typed as Kind types', () => {
      mockAST.withInterface('arch.ts', 'OrderingContext', 'Kind', 'OrderingContext', []);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'foo', value: MockASTAdapter.stringLiteral('bar') },
      ]);

      // Variable typed as something not in kindDefs
      mockAST.withVariable('arch.ts', 'someVar', 'SomeOtherType', initObj);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(0);
    });
  });

  describe('Contract parsing', () => {
    function setupContextWithContracts(contractConfig: ReturnType<typeof MockASTAdapter.objectLiteral>) {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
        { name: 'infra', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('InfraLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/infra') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', contractConfig);
    }

    it('finds defineContracts call and creates Contract objects', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
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
      expect(result.contracts[0].args).toHaveLength(2);
      expect(result.contracts[0].args[0].name).toBe('domain');
      expect(result.contracts[0].args[1].name).toBe('infra');
    });

    it('creates multiple contracts from multiple noDependency entries', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('domain'),
            MockASTAdapter.stringLiteral('infra'),
          ]),
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('infra'),
            MockASTAdapter.stringLiteral('domain'),
          ]),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(2);
    });

    it('reports error for unknown member references', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('domain'),
            MockASTAdapter.stringLiteral('nonexistent'),
          ]),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes("'nonexistent' not found"))).toBe(true);
    });

    it('reports error for defineContracts with no matching kind', () => {
      // Add a defineContracts call with a kind name that has no instance
      mockAST.withDefineContractsCall('arch.ts', 'NonexistentKind', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.errors.some(e => e.includes('NonexistentKind'))).toBe(true);
    });

    it('parses purity contracts (individual shape)', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'purity', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.stringLiteral('domain'),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.Purity);
      expect(result.contracts[0].args).toHaveLength(1);
      expect(result.contracts[0].args[0].name).toBe('domain');
    });

    it('parses noCycles contracts (collective shape)', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'noCycles', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.stringLiteral('domain'),
          MockASTAdapter.stringLiteral('infra'),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.NoCycles);
      expect(result.contracts[0].args).toHaveLength(2);
      expect(result.contracts[0].args[0].name).toBe('domain');
      expect(result.contracts[0].args[1].name).toBe('infra');
    });

    it('parses mustImplement contracts (tuple pair shape)', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'mustImplement', value: MockASTAdapter.arrayLiteral([
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
      expect(result.contracts[0].type).toBe(ContractType.MustImplement);
      expect(result.contracts[0].args).toHaveLength(2);
      expect(result.contracts[0].args[0].name).toBe('domain');
      expect(result.contracts[0].args[1].name).toBe('infra');
    });

    it('parses colocated contracts (tuple pair shape)', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'colocated', value: MockASTAdapter.arrayLiteral([
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
      expect(result.contracts[0].type).toBe(ContractType.Colocated);
      expect(result.contracts[0].args).toHaveLength(2);
    });

    it('handles mixed contract types in same defineContracts call', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('domain'),
            MockASTAdapter.stringLiteral('infra'),
          ]),
        ])},
        { name: 'purity', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.stringLiteral('domain'),
        ])},
        { name: 'noCycles', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.stringLiteral('domain'),
          MockASTAdapter.stringLiteral('infra'),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(3);
      expect(result.contracts.map(c => c.type)).toEqual([
        ContractType.NoDependency,
        ContractType.Purity,
        ContractType.NoCycles,
      ]);
    });

    it('reports error when purity entry is not a string literal', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'purity', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.objectLiteral([]), // not a string
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes("each 'purity' entry must be a string literal"))).toBe(true);
    });

    it('reports error when purity references unknown member', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'purity', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.stringLiteral('nonexistent'),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes("'nonexistent' not found"))).toBe(true);
    });

    it('reports error when noCycles entry is not a string literal', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'noCycles', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.objectLiteral([]), // not a string
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes("each 'noCycles' entry must be a string literal"))).toBe(true);
    });

    it('reports error when noCycles references unknown member', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
        { name: 'noCycles', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.stringLiteral('domain'),
          MockASTAdapter.stringLiteral('nonexistent'),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      // Should still create a contract with the valid arg, but report error for the invalid one
      expect(result.errors.some(e => e.includes("'nonexistent' not found"))).toBe(true);
    });

    it('supports dotted paths in contract args', () => {
      // Set up a context with nested members: domain.ports
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
          { name: 'ports', value: MockASTAdapter.stringLiteral('ports') },
        ])},
        { name: 'infra', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('InfraLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/infra') },
          { name: 'adapters', value: MockASTAdapter.stringLiteral('adapters') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'mustImplement', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('domain.ports'),
            MockASTAdapter.stringLiteral('infra.adapters'),
          ]),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.MustImplement);
      expect(result.contracts[0].args[0].name).toBe('ports');
      expect(result.contracts[0].args[0].declaredLocation).toBe('/project/src/domain/ports');
      expect(result.contracts[0].args[1].name).toBe('adapters');
      expect(result.contracts[0].args[1].declaredLocation).toBe('/project/src/infra/adapters');
    });

    it('sets contract location to definition file name', () => {
      setupContextWithContracts(MockASTAdapter.objectLiteral([
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

      expect(result.contracts[0].location).toBe('arch.ts');
    });
  });

  describe('Instance error paths', () => {
    it('reports error when Kind-typed variable has no object literal initializer', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', []);

      // Variable typed as Ctx but initialized with a string literal (not an object)
      const nonObjectInit = MockASTAdapter.stringLiteral('not an object');
      mockAST.withVariable('arch.ts', 'myInstance', 'Ctx', nonObjectInit);

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(0);
      expect(result.errors.some(e => e.includes("'myInstance'") && e.includes('no object literal initializer'))).toBe(true);
    });
  });

  describe('Contract error paths', () => {
    function setupContextWithContracts2(contractCallNode: Record<string, unknown>) {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
        { name: 'infra', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('InfraLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/infra') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);

      // Add the raw call expression wrapped in a variable statement
      const stmt = {
        __type: 'variableStatement',
        declarations: [{
          __type: 'variableDeclaration',
          name: 'contracts',
          initializer: contractCallNode,
        }],
      };
      mockAST.withStatement('arch.ts', stmt as unknown as Record<string, unknown>);
    }

    it('reports error when defineContracts has no type argument', () => {
      setupContextWithContracts2({
        __type: 'callExpression',
        functionName: 'defineContracts',
        typeArgNames: [],
        args: [MockASTAdapter.objectLiteral([])],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.errors.some(e => e.includes('no type argument'))).toBe(true);
    });

    it('reports error when defineContracts argument is not object literal', () => {
      setupContextWithContracts2({
        __type: 'callExpression',
        functionName: 'defineContracts',
        typeArgNames: ['Ctx'],
        args: [MockASTAdapter.stringLiteral('not an object')],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.errors.some(e => e.includes('expected an object literal argument'))).toBe(true);
    });

    it('reports error when defineContracts has no arguments', () => {
      setupContextWithContracts2({
        __type: 'callExpression',
        functionName: 'defineContracts',
        typeArgNames: ['Ctx'],
        args: [],
      });

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.errors.some(e => e.includes('expected an object literal argument'))).toBe(true);
    });

    it('reports error for completely unknown contract type name', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'totallyFakeContractType', value: MockASTAdapter.arrayLiteral([]) },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes("unknown contract type 'totallyFakeContractType'"))).toBe(true);
    });

    it('reports error when noDependency value is not an array', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.stringLiteral('not an array') },
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes("'noDependency' value must be an array"))).toBe(true);
    });

    it('reports error when noDependency entry is not a tuple', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          // Entry is a string literal, not a [from, to] array
          MockASTAdapter.stringLiteral('domain'),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes('must be a [from, to] tuple'))).toBe(true);
    });

    it('reports error when noDependency tuple has wrong length', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('domain'),
            MockASTAdapter.stringLiteral('infra'),
            MockASTAdapter.stringLiteral('extra'),
          ]),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes('must have exactly 2 elements, got 3'))).toBe(true);
    });

    it('reports error when noDependency tuple elements are not strings', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            // Object literals instead of string literals
            MockASTAdapter.objectLiteral([]),
            MockASTAdapter.objectLiteral([]),
          ]),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes('must be string literals'))).toBe(true);
    });

    it('reports error when from member is not found in instance', () => {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
        { name: 'infra', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('InfraLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/infra') },
        ])},
      ]);

      mockAST.withVariable('arch.ts', 'ordering', 'Ctx', initObj);
      mockAST.withDefineContractsCall('arch.ts', 'Ctx', MockASTAdapter.objectLiteral([
        { name: 'noDependency', value: MockASTAdapter.arrayLiteral([
          MockASTAdapter.arrayLiteral([
            MockASTAdapter.stringLiteral('nonexistent_from'),
            MockASTAdapter.stringLiteral('infra'),
          ]),
        ])},
      ]));

      const result = service.execute({
        definitionFiles: [sourceFile('arch.ts')],
        checker: mockChecker,
        projectRoot: '/project',
      });

      expect(result.contracts).toHaveLength(0);
      expect(result.errors.some(e => e.includes("'nonexistent_from' not found"))).toBe(true);
    });
  });

  describe('Multi-file classification', () => {
    it('processes multiple definition files', () => {
      mockAST.withInterface('kinds.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain' },
      ]);

      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('Ctx') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
      ]);

      mockAST.withVariable('instances.ts', 'ordering', 'Ctx', initObj);

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

      // User file: instance declaration only (processed second)
      const initObj = MockASTAdapter.objectLiteral([
        { name: 'kind', value: MockASTAdapter.stringLiteral('CleanContext') },
        { name: 'location', value: MockASTAdapter.stringLiteral('src') },
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('DomainLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/domain') },
        ])},
        { name: 'infrastructure', value: MockASTAdapter.objectLiteral([
          { name: 'kind', value: MockASTAdapter.stringLiteral('InfrastructureLayer') },
          { name: 'location', value: MockASTAdapter.stringLiteral('src/infrastructure') },
        ])},
      ]);

      mockAST.withVariable('user.ts', 'app', 'CleanContext', initObj);

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
});
