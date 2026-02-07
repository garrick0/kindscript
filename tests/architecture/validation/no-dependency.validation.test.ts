import { MockTypeScriptAdapter } from '../../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';

describe('Architecture Validation: noDependency Contract', () => {
  let mockTS: MockTypeScriptAdapter;
  let mockFS: MockFileSystemAdapter;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    mockFS = new MockFileSystemAdapter();
  });

  afterEach(() => {
    mockTS.reset();
    mockFS.reset();
  });

  it('models forbidden domain → infrastructure dependency', () => {
    // Arrange: Set up filesystem structure
    mockFS
      .withDirectory('src/domain', ['entity.ts', 'service.ts'])
      .withDirectory('src/infrastructure', ['database.ts']);

    // Arrange: Set up import relationship
    mockTS
      .withSourceFile('src/domain/service.ts', 'export class Service {}')
      .withSourceFile('src/infrastructure/database.ts', 'export class Database {}')
      .withImport(
        'src/domain/service.ts',
        'src/infrastructure/database.ts',
        '../infrastructure/database',
        5
      );

    // Arrange: Define architectural symbols
    const domainSymbol = new ArchSymbol(
      'domain',
      ArchSymbolKind.Layer,
      'src/domain'
    );

    const infraSymbol = new ArchSymbol(
      'infrastructure',
      ArchSymbolKind.Layer,
      'src/infrastructure'
    );

    const contract = new Contract(
      ContractType.NoDependency,
      'domain-must-not-depend-on-infrastructure',
      [domainSymbol, infraSymbol],
      'architecture.ts:10'
    );

    // Act: Validate that our domain model can represent this scenario
    const program = mockTS.createProgram(['src/domain/service.ts'], {});
    const sourceFile = mockTS.getSourceFile(program, 'src/domain/service.ts');
    const checker = mockTS.getTypeChecker(program);

    expect(sourceFile).toBeDefined();
    const imports = mockTS.getImports(sourceFile!, checker);

    // Assert: Import relationship is correctly modeled
    expect(imports).toHaveLength(1);
    expect(imports[0].sourceFile).toBe('src/domain/service.ts');
    expect(imports[0].targetFile).toBe('src/infrastructure/database.ts');
    expect(imports[0].line).toBe(5);

    // Assert: Contract structure is correct
    expect(contract.type).toBe(ContractType.NoDependency);
    expect(contract.args).toHaveLength(2);
    expect(contract.args[0]).toBe(domainSymbol);
    expect(contract.args[1]).toBe(infraSymbol);
    expect(contract.validate()).toBeNull(); // Contract is valid
  });

  it('models permitted infrastructure → domain dependency', () => {
    // Arrange: Reverse dependency (infrastructure CAN depend on domain)
    mockFS
      .withDirectory('src/domain', ['entity.ts'])
      .withDirectory('src/infrastructure', ['repository.ts']);

    mockTS
      .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
      .withSourceFile('src/infrastructure/repository.ts', 'export class Repository {}')
      .withImport(
        'src/infrastructure/repository.ts',
        'src/domain/entity.ts',
        '../domain/entity',
        3
      );

    const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
    const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

    // Contract forbids domain → infrastructure, NOT infrastructure → domain
    const contract = new Contract(
      ContractType.NoDependency,
      'domain-must-not-depend-on-infrastructure',
      [domainSymbol, infraSymbol]
    );

    // Act
    const program = mockTS.createProgram(['src/infrastructure/repository.ts'], {});
    const sourceFile = mockTS.getSourceFile(program, 'src/infrastructure/repository.ts');
    const checker = mockTS.getTypeChecker(program);
    const imports = mockTS.getImports(sourceFile!, checker);

    // Assert: Import exists and is in the allowed direction
    expect(imports[0].sourceFile).toBe('src/infrastructure/repository.ts');
    expect(imports[0].targetFile).toBe('src/domain/entity.ts');

    // This import should NOT violate the contract
    // (The actual checking logic will be implemented in M1)
    expect(contract.validate()).toBeNull();
  });

  it('handles multiple contracts on same symbol', () => {
    // Arrange: Domain layer with multiple constraints
    const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
    const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');
    const applicationSymbol = new ArchSymbol('application', ArchSymbolKind.Layer, 'src/application');

    const noDepsOnInfra = new Contract(
      ContractType.NoDependency,
      'no-infra',
      [domainSymbol, infraSymbol]
    );

    const noDepsOnApplication = new Contract(
      ContractType.NoDependency,
      'no-application',
      [domainSymbol, applicationSymbol]
    );

    // Assert: Both contracts reference the same symbol
    expect(noDepsOnInfra.args[0]).toBe(domainSymbol);
    expect(noDepsOnApplication.args[0]).toBe(domainSymbol);

    // Assert: Both contracts are valid
    expect(noDepsOnInfra.validate()).toBeNull();
    expect(noDepsOnApplication.validate()).toBeNull();

    // Domain model correctly represents multiple constraints
  });

  it('resolves symbol locations to files', () => {
    // Arrange: Symbol with declared location
    const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

    mockFS
      .withFile('src/domain/entity.ts', 'export class Entity {}')
      .withFile('src/domain/value-object.ts', 'export class ValueObject {}')
      .withFile('src/domain/service.ts', 'export class Service {}');

    // Act: Resolve files for the domain symbol
    const files = mockFS.readDirectory('src/domain', true);

    // Assert: All domain files are found
    expect(files).toHaveLength(3);
    expect(files).toContain('src/domain/entity.ts');
    expect(files).toContain('src/domain/value-object.ts');
    expect(files).toContain('src/domain/service.ts');

    // Assert: Symbol location matches
    expect(domainSymbol.declaredLocation).toBe('src/domain');
  });

  it('models transitive dependency chains', () => {
    // Arrange: A → B → C dependency chain
    mockFS
      .withFile('src/domain/a.ts', '')
      .withFile('src/application/b.ts', '')
      .withFile('src/infrastructure/c.ts', '');

    mockTS
      .withSourceFile('src/domain/a.ts', '')
      .withSourceFile('src/application/b.ts', '')
      .withSourceFile('src/infrastructure/c.ts', '')
      .withImport('src/domain/a.ts', 'src/application/b.ts', '../application/b', 1)
      .withImport('src/application/b.ts', 'src/infrastructure/c.ts', '../infrastructure/c', 1);

    // Act: Get import edges
    const program = mockTS.createProgram(['src/domain/a.ts', 'src/application/b.ts'], {});
    const checker = mockTS.getTypeChecker(program);

    const aFile = mockTS.getSourceFile(program, 'src/domain/a.ts')!;
    const bFile = mockTS.getSourceFile(program, 'src/application/b.ts')!;

    const aImports = mockTS.getImports(aFile, checker);
    const bImports = mockTS.getImports(bFile, checker);

    // Assert: Dependency chain is modeled
    expect(aImports).toHaveLength(1);
    expect(aImports[0].targetFile).toBe('src/application/b.ts');

    expect(bImports).toHaveLength(1);
    expect(bImports[0].targetFile).toBe('src/infrastructure/c.ts');

    // This demonstrates that transitive dependencies can be detected
    // by following the import chain
  });
});
