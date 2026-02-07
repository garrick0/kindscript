import { MockTypeScriptAdapter } from '../../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { CheckContractsService } from '../../../src/application/use-cases/check-contracts/check-contracts.service';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { DiagnosticCode } from '../../../src/domain/constants/diagnostic-codes';
import { makeSymbol, makeCheckRequest, mustImplement } from '../../helpers/factories';

describe('Architecture Validation: mustImplement Contract', () => {
  let mockTS: MockTypeScriptAdapter;
  let mockFS: MockFileSystemAdapter;
  let service: CheckContractsService;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    mockFS = new MockFileSystemAdapter();
    service = new CheckContractsService(mockTS, mockFS);
  });

  afterEach(() => {
    mockTS.reset();
    mockFS.reset();
  });

  it('passes when all ports have adapter implementations', () => {
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

    mockTS
      .withSourceFile('src/domain/ports/database.port.ts', '')
      .withSourceFile('src/domain/ports/cache.port.ts', '')
      .withSourceFile('src/domain/ports/messaging.port.ts', '')
      .withSourceFile('src/infrastructure/adapters/database.adapter.ts', '')
      .withSourceFile('src/infrastructure/adapters/cache.adapter.ts', '')
      .withSourceFile('src/infrastructure/adapters/messaging.adapter.ts', '')
      .withExportedInterface('src/domain/ports/database.port.ts', 'DatabasePort')
      .withExportedInterface('src/domain/ports/cache.port.ts', 'CachePort')
      .withExportedInterface('src/domain/ports/messaging.port.ts', 'MessagingPort')
      .withClassImplementing('src/infrastructure/adapters/database.adapter.ts', 'DatabasePort')
      .withClassImplementing('src/infrastructure/adapters/cache.adapter.ts', 'CachePort')
      .withClassImplementing('src/infrastructure/adapters/messaging.adapter.ts', 'MessagingPort');

    const ports = makeSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Module, 'src/infrastructure/adapters');

    const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));

    expect(result.contractsChecked).toBe(1);
    expect(result.violationsFound).toBe(0);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('detects missing adapter implementation', () => {
    mockFS
      .withDirectory('src/domain/ports', [
        'database.port.ts',
        'cache.port.ts',
      ])
      .withDirectory('src/infrastructure/adapters', [
        'database.adapter.ts',
      ]);

    mockTS
      .withSourceFile('src/domain/ports/database.port.ts', '')
      .withSourceFile('src/domain/ports/cache.port.ts', '')
      .withSourceFile('src/infrastructure/adapters/database.adapter.ts', '')
      .withExportedInterface('src/domain/ports/database.port.ts', 'DatabasePort')
      .withExportedInterface('src/domain/ports/cache.port.ts', 'CachePort')
      .withClassImplementing('src/infrastructure/adapters/database.adapter.ts', 'DatabasePort');

    const ports = makeSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Module, 'src/infrastructure/adapters');

    const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));

    expect(result.violationsFound).toBe(1);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe(DiagnosticCode.MissingImplementation);
    expect(result.diagnostics[0].message).toContain('CachePort');
  });

  it('allows extra adapters without ports', () => {
    mockFS
      .withDirectory('src/domain/ports', [
        'database.port.ts',
      ])
      .withDirectory('src/infrastructure/adapters', [
        'database.adapter.ts',
        'cache.adapter.ts',
      ]);

    mockTS
      .withSourceFile('src/domain/ports/database.port.ts', '')
      .withSourceFile('src/infrastructure/adapters/database.adapter.ts', '')
      .withSourceFile('src/infrastructure/adapters/cache.adapter.ts', '')
      .withExportedInterface('src/domain/ports/database.port.ts', 'DatabasePort')
      .withClassImplementing('src/infrastructure/adapters/database.adapter.ts', 'DatabasePort');

    const ports = makeSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Module, 'src/infrastructure/adapters');

    const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));

    expect(result.violationsFound).toBe(0);
    expect(result.diagnostics).toHaveLength(0);
  });

  it('handles hierarchical port-adapter structures', () => {
    mockFS
      .withFile('src/domain/ports/database/read.port.ts', '')
      .withFile('src/domain/ports/database/write.port.ts', '')
      .withFile('src/infrastructure/adapters/database/read.adapter.ts', '')
      .withFile('src/infrastructure/adapters/database/write.adapter.ts', '');

    mockTS
      .withSourceFile('src/domain/ports/database/read.port.ts', '')
      .withSourceFile('src/domain/ports/database/write.port.ts', '')
      .withSourceFile('src/infrastructure/adapters/database/read.adapter.ts', '')
      .withSourceFile('src/infrastructure/adapters/database/write.adapter.ts', '')
      .withExportedInterface('src/domain/ports/database/read.port.ts', 'ReadPort')
      .withExportedInterface('src/domain/ports/database/write.port.ts', 'WritePort')
      .withClassImplementing('src/infrastructure/adapters/database/read.adapter.ts', 'ReadPort')
      .withClassImplementing('src/infrastructure/adapters/database/write.adapter.ts', 'WritePort');

    const ports = makeSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');
    const adapters = makeSymbol('adapters', ArchSymbolKind.Module, 'src/infrastructure/adapters');

    const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));

    expect(result.violationsFound).toBe(0);
    expect(result.filesAnalyzed).toBe(4);
  });
});
