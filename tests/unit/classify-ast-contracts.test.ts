import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { MockASTAdapter } from '../../src/infrastructure/adapters/testing/mock-ast.adapter';
import { ContractType } from '../../src/domain/types/contract-type';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

describe('ClassifyASTService - Contract Parsing', () => {
  let service: ClassifyASTService;
  let mockAST: MockASTAdapter;

  beforeEach(() => {
    mockAST = new MockASTAdapter();
    service = new ClassifyASTService(mockAST);
  });

  afterEach(() => {
    mockAST.reset();
  });

  describe('Contract parsing', () => {
    function setupContextWithContracts(contractConfig: ReturnType<typeof MockASTAdapter.objectLiteral>) {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

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
      // Set up a context with nested members: domain.ports, infra.adapters
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);
      mockAST.withInterface('arch.ts', 'DomainLayer', 'Kind', 'DomainLayer', [
        { name: 'ports', typeName: 'PortsModule' },
      ]);
      mockAST.withInterface('arch.ts', 'InfraLayer', 'Kind', 'InfraLayer', [
        { name: 'adapters', typeName: 'AdaptersModule' },
      ]);

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([
          { name: 'ports', value: MockASTAdapter.objectLiteral([]) },
        ])},
        { name: 'infra', value: MockASTAdapter.objectLiteral([
          { name: 'adapters', value: MockASTAdapter.objectLiteral([]) },
        ])},
      ]));

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

  describe('Contract error paths', () => {
    function setupContextWithContracts2(contractCallNode: Record<string, unknown>) {
      mockAST.withInterface('arch.ts', 'Ctx', 'Kind', 'Ctx', [
        { name: 'domain', typeName: 'DomainLayer' },
        { name: 'infra', typeName: 'InfraLayer' },
      ]);

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

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

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
      ]));

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

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
      ]));

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

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
      ]));

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

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
      ]));

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

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
      ]));

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

      mockAST.withLocateCall('arch.ts', 'ordering', 'Ctx', 'src', MockASTAdapter.objectLiteral([
        { name: 'domain', value: MockASTAdapter.objectLiteral([]) },
        { name: 'infra', value: MockASTAdapter.objectLiteral([]) },
      ]));

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
});
