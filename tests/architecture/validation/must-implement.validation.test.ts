import { MockFileSystemAdapter } from '../../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';

describe('Architecture Validation: mustImplement Contract', () => {
  let mockFS: MockFileSystemAdapter;

  beforeEach(() => {
    mockFS = new MockFileSystemAdapter();
  });

  afterEach(() => {
    mockFS.reset();
  });

  it('models complete port-adapter implementation', () => {
    // Arrange: All ports have corresponding adapters
    mockFS
      .withDirectory('src/domain/ports', [
        'database.port.ts',
        'cache.port.ts',
        'messaging.port.ts',
      ])
      .withDirectory('src/infrastructure/adapters', [
        'database.adapter.ts',
        'cache.adapter.ts',
        'messaging.adapter.ts',
      ]);

    const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');
    const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Module, 'src/infrastructure/adapters');

    const contract = new Contract(
      ContractType.MustImplement,
      'all-ports-have-adapters',
      [portsSymbol, adaptersSymbol]
    );

    // Act: Resolve files
    const portFiles = mockFS.readDirectory('src/domain/ports', false);
    const adapterFiles = mockFS.readDirectory('src/infrastructure/adapters', false);

    // Assert: Contract structure is correct
    expect(contract.type).toBe(ContractType.MustImplement);
    expect(contract.args[0]).toBe(portsSymbol);
    expect(contract.args[1]).toBe(adaptersSymbol);
    expect(contract.validate()).toBeNull();

    // Assert: All files are present
    expect(portFiles).toHaveLength(3);
    expect(adapterFiles).toHaveLength(3);

    // In M1, we'll implement logic to verify that each port has an adapter
    // For now, we're proving the domain model can represent this scenario
  });

  it('models missing adapter implementation', () => {
    // Arrange: Port without corresponding adapter
    mockFS
      .withDirectory('src/domain/ports', [
        'database.port.ts',
        'cache.port.ts',
      ])
      .withDirectory('src/infrastructure/adapters', [
        'database.adapter.ts',
        // Missing cache.adapter.ts!
      ]);

    // Domain model can represent this scenario (validation logic comes in M1)

    // Act: Resolve files
    const portFiles = mockFS.readDirectory('src/domain/ports', false);
    const adapterFiles = mockFS.readDirectory('src/infrastructure/adapters', false);

    // Assert: We can detect the discrepancy
    expect(portFiles).toHaveLength(2);
    expect(adapterFiles).toHaveLength(1);

    const portNames = portFiles.map(f => mockFS.basename(f).replace('.port.ts', ''));
    const adapterNames = adapterFiles.map(f => mockFS.basename(f).replace('.adapter.ts', ''));

    const missingAdapters = portNames.filter(name => !adapterNames.includes(name));

    expect(missingAdapters).toEqual(['cache']);

    // This demonstrates that we can detect missing implementations
    // In M1, we'll implement this as a contract checker
  });

  it('models extra adapter without port', () => {
    // Arrange: Adapter without corresponding port (orphan adapter)
    mockFS
      .withDirectory('src/domain/ports', [
        'database.port.ts',
      ])
      .withDirectory('src/infrastructure/adapters', [
        'database.adapter.ts',
        'cache.adapter.ts', // No corresponding port!
      ]);

    // Act
    const portFiles = mockFS.readDirectory('src/domain/ports', false);
    const adapterFiles = mockFS.readDirectory('src/infrastructure/adapters', false);

    // Assert: Extra adapter is detectable
    expect(adapterFiles).toHaveLength(2);
    expect(portFiles).toHaveLength(1);

    // This is not necessarily an error - adapters can implement external ports
    // But it's a scenario our domain model can represent
  });

  it('handles hierarchical port-adapter structures', () => {
    // Arrange: Ports and adapters in subdirectories
    mockFS
      .withFile('src/domain/ports/database/read.port.ts', '')
      .withFile('src/domain/ports/database/write.port.ts', '')
      .withFile('src/infrastructure/adapters/database/read.adapter.ts', '')
      .withFile('src/infrastructure/adapters/database/write.adapter.ts', '');

    // Act: Recursive directory reading
    const portFiles = mockFS.readDirectory('src/domain/ports', true);
    const adapterFiles = mockFS.readDirectory('src/infrastructure/adapters', true);

    // Assert: All nested files are found
    expect(portFiles).toHaveLength(2);
    expect(adapterFiles).toHaveLength(2);
    expect(portFiles).toContain('src/domain/ports/database/read.port.ts');
    expect(adapterFiles).toContain('src/infrastructure/adapters/database/read.adapter.ts');
  });
});
