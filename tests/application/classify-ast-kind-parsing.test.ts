import { ScanService } from '../../src/application/pipeline/scan/scan.service';
import { ParseService } from '../../src/application/pipeline/parse/parse.service';
import { BindService } from '../../src/application/pipeline/bind/bind.service';
import { MockASTAdapter } from '../helpers/mocks/mock-ast.adapter';
import { MockFileSystemAdapter } from '../helpers/mocks/mock-filesystem.adapter';
import { createAllPlugins } from '../../src/application/pipeline/plugins/plugin-registry';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';
import { ContractType } from '../../src/domain/types/contract-type';
import { CarrierResolver } from '../../src/application/pipeline/carrier/carrier-resolver';
import { carrierKey } from '../../src/domain/types/carrier';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

/** Helper: run scan → parse → bind and return combined result */
function classify(mockAST: MockASTAdapter, files: SourceFile[]) {
  const scanner = new ScanService(mockAST);
  const parser = new ParseService();
  const binder = new BindService(createAllPlugins(), new CarrierResolver(new MockFileSystemAdapter()));

  const scanResult = scanner.execute({ sourceFiles: files, checker: mockChecker });
  const parseResult = parser.execute(scanResult);
  const bindResult = binder.execute(parseResult, scanResult);

  return {
    symbols: parseResult.symbols,
    contracts: bindResult.contracts,
    instanceTypeNames: parseResult.instanceTypeNames,
    errors: [...scanResult.errors, ...parseResult.errors, ...bindResult.errors],
  };
}

describe('Pipeline - Kind Definition Parsing', () => {
  let mockAST: MockASTAdapter;

  beforeEach(() => {
    mockAST = new MockASTAdapter();
  });

  afterEach(() => {
    mockAST.reset();
  });

  describe('Kind definition parsing', () => {
    it('finds type alias referencing Kind<N>', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'OrderingContext',
        kindNameLiteral: 'OrderingContext',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infrastructure', typeName: 'InfrastructureLayer' },
        ],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      // Kind definitions show up as symbols
      const kindSymbol = result.symbols.find(s => s.name === 'OrderingContext');
      expect(kindSymbol).toBeDefined();
    });

    it('extracts kind name from type parameter', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'MyContext',
        kindNameLiteral: 'MyContext',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.symbols.some(s => s.name === 'MyContext')).toBe(true);
    });

    it('ignores type aliases not referencing Kind', () => {
      // No kind definition added
      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.symbols).toHaveLength(0);
      expect(result.contracts).toHaveLength(0);
    });

    it('handles type alias with no members', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'EmptyKind',
        kindNameLiteral: 'EmptyKind',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.symbols.some(s => s.name === 'EmptyKind')).toBe(true);
    });
  });

  describe('Constraint config extraction', () => {
    it('extracts constraint config from Kind third type parameter', () => {
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
        members: [
          { name: 'domain' },
          { name: 'infra' },
        ],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.contracts).toHaveLength(2);
      expect(result.contracts[0].type).toBe(ContractType.NoDependency);
      expect(result.contracts[0].args[0].name).toBe('domain');
      expect(result.contracts[0].args[1].name).toBe('infra');
    });

    it('returns no constraints when Kind has no third parameter', () => {
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

      expect(result.contracts).toHaveLength(0);
    });

    it('extracts pure: true from member Kind and propagates to parent', () => {
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

      // Purity contract should be auto-generated from DomainLayer's { pure: true }
      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.Purity);
      expect(result.contracts[0].args[0].name).toBe('domain');
    });

    it('reports error when Instance references unknown Kind', () => {
      // No Kind definition — only the instance declaration
      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'UnknownKind',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('UnknownKind');
    });

    it('reports error when constraint references nonexistent member', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
        constraints: MockASTAdapter.constraintView({
          noDependency: [['domain', 'nonexistent']],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.errors.some(e => e.includes('nonexistent'))).toBe(true);
    });

    it('reports error when noCycles constraint references nonexistent member', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
        constraints: MockASTAdapter.constraintView({
          noCycles: ['domain', 'nonexistent'],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.errors.some(e => e.includes('nonexistent'))).toBe(true);
    });

    it('reports error when first member of type-level noDependency is nonexistent', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
        constraints: MockASTAdapter.constraintView({
          noDependency: [['nonexistent_first', 'domain']],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.errors.some(e => e.includes('nonexistent_first'))).toBe(true);
    });

    it('purity propagation deduplication runs when other contracts exist', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [],
        constraints: MockASTAdapter.constraintView({ pure: true }),
      });
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

      // Should have: noDependency + purity propagation + overlap
      expect(result.contracts).toHaveLength(3);
      expect(result.contracts.some(c => c.type === ContractType.NoDependency)).toBe(true);
      expect(result.contracts.some(c => c.type === ContractType.Purity)).toBe(true);
    });

    it('scope field on Kind does not affect path resolution', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'PureModule',
        kindNameLiteral: 'PureModule',
        members: [],
        scope: 'folder',
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'utils',
        kindTypeName: 'PureModule',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      // Resolution is from declaredPath (default '.'), not from scope
      const instance = result.symbols.find(s => s.name === 'utils');
      expect(instance).toBeDefined();
      expect(carrierKey(instance!.carrier!)).toBe('/project/src');
    });

    it('extracts mixed constraints from Kind type', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
        constraints: MockASTAdapter.constraintView({
          noDependency: [['domain', 'infra']],
          noCycles: ['domain', 'infra'],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      expect(result.contracts).toHaveLength(3);
    });
  });
});
