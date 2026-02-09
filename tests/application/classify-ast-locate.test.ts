import { ScanService } from '../../src/application/pipeline/scan/scan.service';
import { ParseService } from '../../src/application/pipeline/parse/parse.service';
import { BindService } from '../../src/application/pipeline/bind/bind.service';
import { MockASTAdapter } from '../helpers/mocks/mock-ast.adapter';
import { MockFileSystemAdapter } from '../helpers/mocks/mock-filesystem.adapter';
import { createAllPlugins } from '../../src/application/pipeline/plugins/plugin-registry';
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
      expect(instance!.declaredLocation).toBe('/project/src');
      expect(instance!.kindTypeName).toBe('Ctx');
    });

    it('infers root from source file directory', () => {
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
      expect(instance!.declaredLocation).toBe('/my-app/modules/ordering');

      const domain = instance!.findMember('domain');
      expect(domain!.declaredLocation).toBe('/my-app/modules/ordering/domain');
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
      expect(infra!.declaredLocation).toBe('/project/src/infra');
    });

  });

  describe('File-scoped leaf instances', () => {
    it('leaf Kind instance location is the file path, not the directory', () => {
      mockAST.withKindDefinition('/project/src/components/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],  // leaf Kind — no members
      });

      mockAST.withInstanceDeclaration('/project/src/components/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/components/Button.tsx')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.name).toBe('_');
      expect(instance!.declaredLocation).toBe('/project/src/components/Button.tsx');
    });

    it('composite Kind instance location is the directory (unchanged)', () => {
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
      expect(instance!.declaredLocation).toBe('/project/src');
    });

    it('leaf instance has no members', () => {
      mockAST.withKindDefinition('/project/src/atoms/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/atoms/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        members: [],
      });

      const result = classify(mockAST, [sourceFile('/project/src/atoms/Button.tsx')]);

      const instance = result.symbols.find(s => s.kind === ArchSymbolKind.Instance);
      expect(instance).toBeDefined();
      expect(instance!.members.size).toBe(0);
      expect(instance!.declaredLocation).toBe('/project/src/atoms/Button.tsx');
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
        members: [],
      });

      const scanner = new ScanService(mockAST);
      const parser = new ParseService(mockFS);

      const scanResult = scanner.execute({ sourceFiles: [sourceFile('/project/src/atoms/Button.tsx')], checker: mockChecker });
      const parseResult = parser.execute(scanResult);

      // resolvedFiles should map the file path to itself
      expect(parseResult.resolvedFiles.has('/project/src/atoms/Button.tsx')).toBe(true);
      expect(parseResult.resolvedFiles.get('/project/src/atoms/Button.tsx')).toEqual(['/project/src/atoms/Button.tsx']);
    });

    it('file and composite instances can coexist', () => {
      // Composite Kind
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

      // Leaf Kind
      mockAST.withKindDefinition('/project/src/atoms/Button.tsx', {
        typeName: 'AtomSource',
        kindNameLiteral: 'AtomSource',
        members: [],
      });

      mockAST.withInstanceDeclaration('/project/src/atoms/Button.tsx', {
        variableName: '_',
        kindTypeName: 'AtomSource',
        members: [],
      });

      const result = classify(mockAST, [
        sourceFile('/project/src/context.ts'),
        sourceFile('/project/src/atoms/Button.tsx'),
      ]);

      const instances = result.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(2);

      const composite = instances.find(s => s.name === 'app');
      expect(composite!.declaredLocation).toBe('/project/src');

      const leaf = instances.find(s => s.name === '_');
      expect(leaf!.declaredLocation).toBe('/project/src/atoms/Button.tsx');
    });
  });
});
