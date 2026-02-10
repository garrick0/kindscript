import { ScanService } from '../../src/application/pipeline/scan/scan.service';
import { ParseService } from '../../src/application/pipeline/parse/parse.service';
import { BindService } from '../../src/application/pipeline/bind/bind.service';
import { MockASTAdapter } from '../helpers/mocks/mock-ast.adapter';
import { MockFileSystemAdapter } from '../helpers/mocks/mock-filesystem.adapter';
import { createAllPlugins } from '../../src/application/pipeline/plugins/plugin-registry';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';
import { TypeChecker, SourceFile } from '../../src/application/ports/typescript.port';

const mockChecker = {} as TypeChecker;
const sourceFile = (fileName: string): SourceFile => ({ fileName, text: '' });

/** Helper: run scan → parse → bind and return combined result */
function classify(mockAST: MockASTAdapter, files: SourceFile[], mockFS?: MockFileSystemAdapter) {
  const fs = mockFS ?? new MockFileSystemAdapter();
  const scanner = new ScanService(mockAST);
  const parser = new ParseService();
  const binder = new BindService(createAllPlugins(), fs);

  const scanResult = scanner.execute({ sourceFiles: files, checker: mockChecker });
  const parseResult = parser.execute(scanResult);
  const bindResult = binder.execute(parseResult, scanResult);

  return {
    symbols: parseResult.symbols,
    contracts: bindResult.contracts,
    resolvedFiles: bindResult.resolvedFiles,
    instanceTypeNames: parseResult.instanceTypeNames,
    errors: [...scanResult.errors, ...parseResult.errors, ...bindResult.errors],
  };
}

describe('Pipeline - satisfies Instance<T> and Multi-file', () => {
  let mockAST: MockASTAdapter;

  beforeEach(() => {
    mockAST = new MockASTAdapter();
  });

  afterEach(() => {
    mockAST.reset();
  });

  describe('Multi-file classification', () => {
    it('processes multiple definition files', () => {
      mockAST.withKindDefinition('/project/src/kinds.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/instances.ts', {
        variableName: 'ordering',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/kinds.ts'), sourceFile('/project/src/instances.ts')]);

      // Kind symbol + instance symbol
      expect(result.symbols).toHaveLength(2);
      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
    });

    it('handles empty definition files', () => {
      const result = classify(mockAST, [sourceFile('/project/src/empty.ts')]);

      expect(result.symbols).toHaveLength(0);
      expect(result.contracts).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('satisfies Instance<T> recognition', () => {
    it('recognizes satisfies Instance<T> and creates an instance symbol', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.name).toBe('app');
      expect(instance!.id).toBe('/project/src');
      expect(instance!.kindTypeName).toBe('Ctx');
    });

    it('resolves "." to dirname of source file', () => {
      mockAST.withKindDefinition('/my-app/modules/ordering/ordering.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/my-app/modules/ordering/ordering.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/my-app/modules/ordering/ordering.ts')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('/my-app/modules/ordering');

      const domain = instance!.findMember('domain');
      expect(domain!.id).toBe('/my-app/modules/ordering/domain');
    });

    it('derives member paths from file directory + member name', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }, { name: 'infra' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const domain = instance!.findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.id).toBe('/project/src/domain');
      expect(domain!.kindTypeName).toBe('DomainLayer');

      const infra = instance!.findMember('infra');
      expect(infra).toBeDefined();
      expect(infra!.id).toBe('/project/src/infra');
      expect(infra!.kindTypeName).toBe('InfraLayer');
    });

    it('derives nested member paths recursively', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [
          { name: 'entities', typeName: 'EntitiesModule' },
          { name: 'ports', typeName: 'PortsModule' },
        ],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
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

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const domain = instance!.findMember('domain');
      expect(domain!.id).toBe('/project/src/domain');

      const entities = domain!.findMember('entities');
      expect(entities).toBeDefined();
      expect(entities!.id).toBe('/project/src/domain/entities');
      expect(entities!.kindTypeName).toBe('EntitiesModule');

      const ports = domain!.findMember('ports');
      expect(ports).toBeDefined();
      expect(ports!.id).toBe('/project/src/domain/ports');
      expect(ports!.kindTypeName).toBe('PortsModule');
    });

    it('uses Member kind for instance-derived symbols', () => {
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

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const domain = instance!.findMember('domain');
      expect(domain!.kind).toBe(ArchSymbolKind.Member);
    });

    it('resolves standalone variable references in instance members', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [
          { name: 'entities', typeName: 'EntitiesModule' },
          { name: 'ports', typeName: 'PortsModule' },
        ],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
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

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance && s.name === 'app');
      expect(instance).toBeDefined();

      const domain = instance!.findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.id).toBe('/project/src/domain');
      expect(domain!.kindTypeName).toBe('DomainLayer');

      const entities = domain!.findMember('entities');
      expect(entities).toBeDefined();
      expect(entities!.id).toBe('/project/src/domain/entities');
      expect(entities!.kindTypeName).toBe('EntitiesModule');

      const ports = domain!.findMember('ports');
      expect(ports).toBeDefined();
      expect(ports!.id).toBe('/project/src/domain/ports');
      expect(ports!.kindTypeName).toBe('PortsModule');
    });

    it('handles mixed standalone and inline members', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [
          { name: 'domain', typeName: 'DomainLayer' },
          { name: 'infra', typeName: 'InfraLayer' },
        ],
      });
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'DomainLayer',
        kindNameLiteral: 'DomainLayer',
        members: [{ name: 'entities', typeName: 'EntitiesModule' }],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
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

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance && s.name === 'app');
      const domain = instance!.findMember('domain');
      expect(domain!.findMember('entities')).toBeDefined();

      const infra = instance!.findMember('infra');
      expect(infra).toBeDefined();
      expect(infra!.id).toBe('/project/src/infra');
    });

  });

  describe('Explicit path resolution', () => {
    it('declaredPath "." resolves to dirname of source file', () => {
      mockAST.withKindDefinition('/project/src/utils/index.ts', {
        typeName: 'PureModule',
        kindNameLiteral: 'PureModule',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/utils/index.ts', {
        variableName: '_',
        kindTypeName: 'PureModule',
        declaredPath: '.',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/utils/index.ts')]);

      const instance = result.symbols.find(s => s.name === '_');
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('/project/src/utils');
    });

    it('declaredPath "./subdir" resolves relative to declaration file', () => {
      mockAST.withKindDefinition('/project/src/arch.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/arch.ts', {
        variableName: 'ordering',
        kindTypeName: 'Ctx',
        declaredPath: './ordering',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/arch.ts')]);

      const instance = result.symbols.find(s => s.name === 'ordering');
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('/project/src/ordering');

      const domain = instance!.findMember('domain');
      expect(domain!.id).toBe('/project/src/ordering/domain');
    });

    it('declaredPath "../sibling" navigates up and resolves', () => {
      mockAST.withKindDefinition('/project/src/ordering/context.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/ordering/context.ts', {
        variableName: 'shared',
        kindTypeName: 'Ctx',
        declaredPath: '../shared',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/ordering/context.ts')]);

      const instance = result.symbols.find(s => s.name === 'shared');
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('/project/src/shared');
    });

    it('declaredPath with .ts extension resolves to file', () => {
      mockAST.withKindDefinition('/project/src/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        declaredPath: './Button.tsx',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/Button.tsx')]);

      const instance = result.symbols.find(s => s.name === '_');
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('/project/src/Button.tsx');
    });

    it('declaredPath with hash syntax resolves to file with exportName', () => {
      mockAST.withKindDefinition('/project/src/context.ts', {
        typeName: 'Decider',
        kindNameLiteral: 'Decider',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/context.ts', {
        variableName: 'validate',
        kindTypeName: 'Decider',
        declaredPath: './handlers.ts#validateOrder',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/context.ts')]);

      const instance = result.symbols.find(s => s.name === 'validate');
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('/project/src/handlers.ts');
      expect(instance!.exportName).toBe('validateOrder');
    });

    it('multiple instances from one file resolve to different locations', () => {
      mockAST.withKindDefinition('/project/src/architecture.ts', {
        typeName: 'BoundedContext',
        kindNameLiteral: 'BoundedContext',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/architecture.ts', {
        variableName: 'ordering',
        kindTypeName: 'BoundedContext',
        declaredPath: './ordering',
        members: [{ name: 'domain' }],
      });

      mockAST.withInstanceDeclaration('/project/src/architecture.ts', {
        variableName: 'shipping',
        kindTypeName: 'BoundedContext',
        declaredPath: './shipping',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/architecture.ts')]);

      const ordering = result.symbols.find(s => s.name === 'ordering');
      expect(ordering!.id).toBe('/project/src/ordering');

      const shipping = result.symbols.find(s => s.name === 'shipping');
      expect(shipping!.id).toBe('/project/src/shipping');
    });

    it('folder-level instance resolves files from directory', () => {
      const mockFS = new MockFileSystemAdapter();
      mockFS.withDirectory('/project/src/utils', ['helpers.ts', 'math.ts']);

      mockAST.withKindDefinition('/project/src/utils/index.ts', {
        typeName: 'PureModule',
        kindNameLiteral: 'PureModule',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/utils/index.ts', {
        variableName: '_',
        kindTypeName: 'PureModule',
        declaredPath: '.',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/utils/index.ts')], mockFS);

      expect(result.resolvedFiles.has('/project/src/utils')).toBe(true);
      expect(result.resolvedFiles.get('/project/src/utils')).toEqual([
        '/project/src/utils/helpers.ts',
        '/project/src/utils/math.ts',
      ]);
    });
  });

  describe('File-scoped instances', () => {
    it('file-level instance with .tsx extension resolves to file path', () => {
      mockAST.withKindDefinition('/project/src/components/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/components/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        declaredPath: './Button.tsx',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/components/Button.tsx')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.name).toBe('_');
      expect(instance!.id).toBe('/project/src/components/Button.tsx');
    });

    it('folder-level instance with "." resolves to directory', () => {
      mockAST.withKindDefinition('/project/src/context.ts', {
        typeName: 'Ctx',
        kindNameLiteral: 'Ctx',
        members: [{ name: 'domain', typeName: 'DomainLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/context.ts', {
        variableName: 'app',
        kindTypeName: 'Ctx',
        members: [{ name: 'domain' }],
      });

      const result = classify(mockAST, [sourceFile('/project/src/context.ts')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.id).toBe('/project/src');
    });

    it('file-level instance has no members', () => {
      mockAST.withKindDefinition('/project/src/atoms/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/atoms/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        declaredPath: './Button.tsx',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/atoms/Button.tsx')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.members.size).toBe(0);
      expect(instance!.id).toBe('/project/src/atoms/Button.tsx');
    });

    it('file-scoped instance resolves to single file in resolvedFiles', () => {
      const mockFS = new MockFileSystemAdapter();
      mockFS.withFile('/project/src/atoms/Button.tsx', 'export default function Button() {}');

      mockAST.withKindDefinition('/project/src/atoms/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/atoms/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        declaredPath: './Button.tsx',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/atoms/Button.tsx')], mockFS);

      // resolvedFiles should map the file path to itself
      expect(result.resolvedFiles.has('/project/src/atoms/Button.tsx')).toBe(true);
      expect(result.resolvedFiles.get('/project/src/atoms/Button.tsx')).toEqual(['/project/src/atoms/Button.tsx']);
    });

    it('file and folder instances can coexist', () => {
      // Folder-level Kind
      mockAST.withKindDefinition('/project/src/context.ts', {
        typeName: 'DesignSystem',
        kindNameLiteral: 'DesignSystem',
        members: [{ name: 'atoms', typeName: 'AtomLayer' }],
      });

      mockAST.withInstanceDeclaration('/project/src/context.ts', {
        variableName: 'app',
        kindTypeName: 'DesignSystem',
        members: [{ name: 'atoms' }],
      });

      // File-level Kind
      mockAST.withKindDefinition('/project/src/atoms/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/atoms/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        declaredPath: './Button.tsx',
        members: [],
      });

      const result = classify(mockAST, [
        sourceFile('/project/src/context.ts'),
        sourceFile('/project/src/atoms/Button.tsx'),
      ]);

      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(2);

      const composite = instances.find(s => s.name === 'app');
      expect(composite!.id).toBe('/project/src');

      const leaf = instances.find(s => s.name === '_');
      expect(leaf!.id).toBe('/project/src/atoms/Button.tsx');
    });
  });

  describe('TypeKind composability', () => {
    it('TypeKind definition is detected by scanner', () => {
      mockAST.withTypeKindDefinition('/project/src/context.ts', {
        typeName: 'Decider',
        kindNameLiteral: 'Decider',
        wrappedTypeName: 'DeciderFn',
      });

      const scanner = new ScanService(mockAST);
      const scanResult = scanner.execute({
        sourceFiles: [sourceFile('/project/src/context.ts')],
        checker: mockChecker,
      });

      expect(scanResult.typeKindDefs.has('Decider')).toBe(true);
      expect(scanResult.typeKindDefs.get('Decider')!.wrappedTypeName).toBe('DeciderFn');
    });

    it('TypeKind instances are detected in pass 2', () => {
      mockAST.withTypeKindDefinition('/project/src/context.ts', {
        typeName: 'Decider',
        kindNameLiteral: 'Decider',
      });

      mockAST.withTypeKindInstance('/project/src/validate.ts', {
        exportName: 'validateOrder',
        kindTypeName: 'Decider',
      });

      const scanner = new ScanService(mockAST);
      const scanResult = scanner.execute({
        sourceFiles: [
          sourceFile('/project/src/context.ts'),
          sourceFile('/project/src/validate.ts'),
        ],
        checker: mockChecker,
      });

      expect(scanResult.typeKindInstances).toHaveLength(1);
      expect(scanResult.typeKindInstances[0].view.exportName).toBe('validateOrder');
      expect(scanResult.typeKindInstances[0].sourceFileName).toBe('/project/src/validate.ts');
    });

    it('TypeKind members inside Kind resolve to matching typed exports', () => {
      // Kind definition with TypeKind members
      mockAST.withKindDefinition('/project/src/context.ts', {
        typeName: 'OrderModule',
        kindNameLiteral: 'OrderModule',
        members: [
          { name: 'deciders', typeName: 'Decider' },
          { name: 'effectors', typeName: 'Effector' },
        ],
        constraints: MockASTAdapter.constraintView({
          noDependency: [['deciders', 'effectors']],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/context.ts', {
        variableName: 'order',
        kindTypeName: 'OrderModule',
        members: [{ name: 'deciders' }, { name: 'effectors' }],
      });

      // TypeKind definitions
      mockAST.withTypeKindDefinition('/project/src/context.ts', {
        typeName: 'Decider',
        kindNameLiteral: 'Decider',
      });
      mockAST.withTypeKindDefinition('/project/src/context.ts', {
        typeName: 'Effector',
        kindNameLiteral: 'Effector',
      });

      // Typed exports within scope
      mockAST.withTypeKindInstance('/project/src/validate.ts', {
        exportName: 'validateOrder',
        kindTypeName: 'Decider',
      });
      mockAST.withTypeKindInstance('/project/src/apply.ts', {
        exportName: 'applyDiscount',
        kindTypeName: 'Decider',
      });
      mockAST.withTypeKindInstance('/project/src/notify.ts', {
        exportName: 'notifyOrder',
        kindTypeName: 'Effector',
      });

      const result = classify(mockAST, [
        sourceFile('/project/src/context.ts'),
        sourceFile('/project/src/validate.ts'),
        sourceFile('/project/src/apply.ts'),
        sourceFile('/project/src/notify.ts'),
      ]);

      // deciders member should resolve to files containing Decider-typed exports
      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const deciders = instance!.findMember('deciders');
      expect(deciders).toBeDefined();

      const deciderFiles = result.resolvedFiles.get(deciders!.id!);
      expect(deciderFiles).toBeDefined();
      expect(deciderFiles!.sort()).toEqual([
        '/project/src/apply.ts',
        '/project/src/validate.ts',
      ]);

      // effectors member should resolve to Effector-typed exports
      const effectors = instance!.findMember('effectors');
      const effectorFiles = result.resolvedFiles.get(effectors!.id!);
      expect(effectorFiles).toBeDefined();
      expect(effectorFiles).toEqual(['/project/src/notify.ts']);
    });

    it('TypeKind members generate contracts via binder', () => {
      mockAST.withKindDefinition('/project/src/context.ts', {
        typeName: 'OrderModule',
        kindNameLiteral: 'OrderModule',
        members: [
          { name: 'deciders', typeName: 'Decider' },
          { name: 'effectors', typeName: 'Effector' },
        ],
        constraints: MockASTAdapter.constraintView({
          noDependency: [['deciders', 'effectors']],
        }),
      });

      mockAST.withInstanceDeclaration('/project/src/context.ts', {
        variableName: 'order',
        kindTypeName: 'OrderModule',
        members: [{ name: 'deciders' }, { name: 'effectors' }],
      });

      mockAST.withTypeKindDefinition('/project/src/context.ts', {
        typeName: 'Decider',
        kindNameLiteral: 'Decider',
      });
      mockAST.withTypeKindDefinition('/project/src/context.ts', {
        typeName: 'Effector',
        kindNameLiteral: 'Effector',
      });

      const result = classify(mockAST, [sourceFile('/project/src/context.ts')]);

      expect(result.contracts).toHaveLength(1);
      expect(result.contracts[0].type).toBe(ContractType.NoDependency);
      expect(result.contracts[0].args[0].name).toBe('deciders');
      expect(result.contracts[0].args[1].name).toBe('effectors');
    });

    it('TypeKind instances outside parent scope are excluded', () => {
      mockAST.withKindDefinition('/project/src/orders/context.ts', {
        typeName: 'OrderModule',
        kindNameLiteral: 'OrderModule',
        members: [{ name: 'deciders', typeName: 'Decider' }],
      });

      mockAST.withInstanceDeclaration('/project/src/orders/context.ts', {
        variableName: 'order',
        kindTypeName: 'OrderModule',
        members: [{ name: 'deciders' }],
      });

      mockAST.withTypeKindDefinition('/project/src/orders/context.ts', {
        typeName: 'Decider',
        kindNameLiteral: 'Decider',
      });

      // This export is within scope
      mockAST.withTypeKindInstance('/project/src/orders/validate.ts', {
        exportName: 'validateOrder',
        kindTypeName: 'Decider',
      });
      // This export is OUTSIDE scope (different directory)
      mockAST.withTypeKindInstance('/project/src/billing/charge.ts', {
        exportName: 'chargeBilling',
        kindTypeName: 'Decider',
      });

      const result = classify(mockAST, [
        sourceFile('/project/src/orders/context.ts'),
        sourceFile('/project/src/orders/validate.ts'),
        sourceFile('/project/src/billing/charge.ts'),
      ]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      const deciders = instance!.findMember('deciders');
      const deciderFiles = result.resolvedFiles.get(deciders!.id!);

      // Only the in-scope file should be included
      expect(deciderFiles).toEqual(['/project/src/orders/validate.ts']);
    });
  });
});
