import { ScanService } from '../../src/application/pipeline/scan/scan.service';
import { ParseService } from '../../src/application/pipeline/parse/parse.service';
import { BindService } from '../../src/application/pipeline/bind/bind.service';
import { MockASTAdapter } from '../helpers/mocks/mock-ast.adapter';
import { MockFileSystemAdapter } from '../helpers/mocks/mock-filesystem.adapter';
import { createAllPlugins } from '../../src/application/pipeline/plugins/plugin-registry';
import { ContractType } from '../../src/domain/types/contract-type';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

/** Helper: run scan → parse → bind and return combined result */
function classify(mockAST: MockASTAdapter, files: SourceFile[]) {
  const scanner = new ScanService(mockAST);
  const parser = new ParseService(new MockFileSystemAdapter());
  const binder = new BindService(createAllPlugins());

  const scanResult = scanner.execute({ sourceFiles: files, checker: mockChecker });
  const parseResult = parser.execute(scanResult);
  const bindResult = binder.execute(parseResult);

  return {
    symbols: parseResult.symbols,
    contracts: bindResult.contracts,
    instanceTypeNames: parseResult.instanceTypeNames,
    errors: [...scanResult.errors, ...parseResult.errors, ...bindResult.errors],
  };
}

describe('Pipeline - Contract Parsing', () => {
  let mockAST: MockASTAdapter;

  beforeEach(() => {
    mockAST = new MockASTAdapter();
  });

  afterEach(() => {
    mockAST.reset();
  });

  describe('Type-level contracts (from Kind third parameter)', () => {
    it('generates noDependency contract from Kind constraints', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          noDependency: [['domain', 'infra']],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.NoDependency);
    });

    it('generates mustImplement contract from Kind constraints', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'ports', typeName: 'PortsLayer' },
          { name: 'adapters', typeName: 'AdaptersLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          mustImplement: [['ports', 'adapters']],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'ports' }, { name: 'adapters' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.MustImplement);
    });

    it('generates noCycles contract from Kind constraints', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          noCycles: ['domain', 'infra'],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.NoCycles);
    });

    it('propagates purity from member Kind with { pure: true }', () => {
      // DomainLayer has { pure: true } intrinsic constraint
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [],
        constraints: MockASTAdapter.constraintView({ pure: true }),
      });
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const purityContracts = result.contracts.filter(c => c.type === ContractType.Purity);
      expect(purityContracts).toHaveLength(1);
      expect(purityContracts[0].args[0].name).toBe('domain');
    });

    it('generates exists contract from filesystem.exists', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          filesystem: { exists: ['domain', 'infra'] },
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const existsContracts = result.contracts.filter(c => c.type === ContractType.Exists);
      expect(existsContracts).toHaveLength(1);
      expect(existsContracts[0].args).toHaveLength(2);
      expect(existsContracts[0].args[0].name).toBe('domain');
      expect(existsContracts[0].args[1].name).toBe('infra');
    });

    it('generates mirrors contract from filesystem.mirrors', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'components', typeName: 'ComponentsLayer' },
          { name: 'tests', typeName: 'TestsLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          filesystem: { mirrors: [['components', 'tests']] },
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'components' }, { name: 'tests' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const mirrorsContracts = result.contracts.filter(c => c.type === ContractType.Mirrors);
      expect(mirrorsContracts).toHaveLength(1);
      expect(mirrorsContracts[0].args[0].name).toBe('components');
      expect(mirrorsContracts[0].args[1].name).toBe('tests');
    });
  });

  describe('Multi-instance contract binding (shared Kind type)', () => {
    it('generates contracts for all instances sharing the same Kind type', () => {
      // Both "ordering" and "billing" use the same Kind type "BoundedContext"
      mockAST.withKindDefinition('/project/src/ordering/ordering.ts', {
        typeName: 'BoundedContext',
        kindNameLiteral: 'BoundedContext',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          noDependency: [['domain', 'infra']],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/ordering/ordering.ts', {
        variableName: 'ordering',
        kindTypeName: 'BoundedContext',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      mockAST.withInstanceDeclaration('/project/src/billing/billing.ts', {
        variableName: 'billing',
        kindTypeName: 'BoundedContext',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [
        sourceFile('/project/src/ordering/ordering.ts'),
        sourceFile('/project/src/billing/billing.ts'),
      ]);

      // Both instances should be classified
      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(2);
      expect(instances.map(s => s.name).sort()).toEqual(['billing', 'ordering']);

      // Both should get noDependency contracts (one per instance)
      const noDeps = result.contracts.filter(c => c.type === ContractType.NoDependency);
      expect(noDeps).toHaveLength(2);

      // Verify contracts reference different instances' members
      const contractLocations = noDeps.map(c => c.args[0].declaredLocation).sort();
      expect(contractLocations).toEqual([
        '/project/src/billing/domain',
        '/project/src/ordering/domain',
      ]);
    });

    it('generates purity contracts for all instances sharing the same Kind type', () => {
      mockAST.withKindDefinition('/project/src/ordering/ordering.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [],
        constraints: MockASTAdapter.constraintView({ pure: true }),
      });
      mockAST.withKindDefinition('/project/src/ordering/ordering.ts', {
        typeName: 'BoundedContext',
        kindNameLiteral: 'BoundedContext',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/ordering/ordering.ts', {
        variableName: 'ordering',
        kindTypeName: 'BoundedContext',
        members: [{ name: 'domain' }],
      });

      mockAST.withInstanceDeclaration('/project/src/billing/billing.ts', {
        variableName: 'billing',
        kindTypeName: 'BoundedContext',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [
        sourceFile('/project/src/ordering/ordering.ts'),
        sourceFile('/project/src/billing/billing.ts'),
      ]);

      // Both instances should get purity contracts for their domain member
      const purityContracts = result.contracts.filter(c => c.type === ContractType.Purity);
      expect(purityContracts).toHaveLength(2);

      const purityLocations = purityContracts.map(c => c.args[0].declaredLocation).sort();
      expect(purityLocations).toEqual([
        '/project/src/billing/domain',
        '/project/src/ordering/domain',
      ]);
    });

    it('generates noCycles contracts for all instances sharing the same Kind type', () => {
      mockAST.withKindDefinition('/project/src/a/a.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          noCycles: ['domain', 'infra'],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/a/a.ts', {
        variableName: 'ctxA',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      mockAST.withInstanceDeclaration('/project/src/b/b.ts', {
        variableName: 'ctxB',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [
        sourceFile('/project/src/a/a.ts'),
        sourceFile('/project/src/b/b.ts'),
      ]);

      const noCyclesContracts = result.contracts.filter(c => c.type === ContractType.NoCycles);
      expect(noCyclesContracts).toHaveLength(2);
    });
  });
});
