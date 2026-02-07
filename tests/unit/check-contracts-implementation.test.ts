import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import {
  makeSymbol,
  makeCheckRequest,
  mustImplement,
  colocated,
} from '../helpers/factories';

describe('CheckContractsService - Implementation Contracts', () => {
  let service: CheckContractsService;
  let mockTS: MockTypeScriptAdapter;
  let mockFS: MockFileSystemAdapter;

  beforeEach(() => {
    mockTS = new MockTypeScriptAdapter();
    mockFS = new MockFileSystemAdapter();
    service = new CheckContractsService(mockTS, mockFS);
  });

  afterEach(() => {
    mockTS.reset();
    mockFS.reset();
  });
  describe('mustImplement contract', () => {
    it('detects missing implementation', () => {
      const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
      const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

      mockFS
        .withFile('src/ports/repository.port.ts', '')
        .withFile('src/adapters/empty.ts', '');

      mockTS
        .withSourceFile('src/ports/repository.port.ts', '')
        .withSourceFile('src/adapters/empty.ts', '')
        .withExportedInterface('src/ports/repository.port.ts', 'RepositoryPort');

      const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70002);
      expect(result.diagnostics[0].message).toContain('RepositoryPort');
    });

    it('passes when all interfaces are implemented', () => {
      const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
      const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

      mockFS
        .withFile('src/ports/repository.port.ts', '')
        .withFile('src/adapters/repository.adapter.ts', '');

      mockTS
        .withSourceFile('src/ports/repository.port.ts', '')
        .withSourceFile('src/adapters/repository.adapter.ts', '')
        .withExportedInterface('src/ports/repository.port.ts', 'RepositoryPort')
        .withClassImplementing('src/adapters/repository.adapter.ts', 'RepositoryPort');

      const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles multiple interfaces', () => {
      const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
      const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

      mockFS
        .withFile('src/ports/repo.port.ts', '')
        .withFile('src/ports/cache.port.ts', '')
        .withFile('src/adapters/repo.adapter.ts', '');

      mockTS
        .withSourceFile('src/ports/repo.port.ts', '')
        .withSourceFile('src/ports/cache.port.ts', '')
        .withSourceFile('src/adapters/repo.adapter.ts', '')
        .withExportedInterface('src/ports/repo.port.ts', 'RepositoryPort')
        .withExportedInterface('src/ports/cache.port.ts', 'CachePort')
        .withClassImplementing('src/adapters/repo.adapter.ts', 'RepositoryPort');

      const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].message).toContain('CachePort');
    });

    it('handles missing locations', () => {
      const ports = makeSymbol('ports', ArchSymbolKind.Member, undefined);
      const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

      const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(0);
    });

    it('handles empty adapter directory', () => {
      const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
      const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

      mockFS.withFile('src/ports/repo.port.ts', '');
      mockTS
        .withSourceFile('src/ports/repo.port.ts', '')
        .withExportedInterface('src/ports/repo.port.ts', 'RepositoryPort');

      const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));
      expect(result.violationsFound).toBe(1);
    });

    it('skips port files where getSourceFile returns undefined', () => {
      const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
      const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

      mockFS
        .withFile('src/ports/orphan.port.ts', '')
        .withFile('src/adapters/adapter.ts', '');

      mockTS.withSourceFile('src/adapters/adapter.ts', '');

      const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));
      expect(result.violationsFound).toBe(0);
    });

    it('skips adapter files where getSourceFile returns undefined', () => {
      const ports = makeSymbol('ports', ArchSymbolKind.Member, 'src/ports');
      const adapters = makeSymbol('adapters', ArchSymbolKind.Member, 'src/adapters');

      mockFS
        .withFile('src/ports/repo.port.ts', '')
        .withFile('src/adapters/orphan.ts', '');

      mockTS
        .withSourceFile('src/ports/repo.port.ts', '')
        .withExportedInterface('src/ports/repo.port.ts', 'RepoPort');

      const result = service.execute(makeCheckRequest([mustImplement(ports, adapters)]));
      expect(result.violationsFound).toBe(1);
    });
  });

  describe('colocated contract', () => {
    it('detects missing counterpart', () => {
      const components = makeSymbol('components');
      const tests = makeSymbol('tests');

      mockFS
        .withFile('src/components/button.ts', '')
        .withFile('src/components/form.ts', '')
        .withFile('src/tests/button.ts', '');

      const result = service.execute(makeCheckRequest([colocated(components, tests)]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70005);
      expect(result.diagnostics[0].message).toContain('form.ts');
    });

    it('handles missing locations', () => {
      const components = makeSymbol('components', ArchSymbolKind.Member, undefined);
      const tests = makeSymbol('tests');

      const result = service.execute(makeCheckRequest([colocated(components, tests)]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(0);
    });

    it('passes when all files are matched', () => {
      const components = makeSymbol('components');
      const tests = makeSymbol('tests');

      mockFS
        .withFile('src/components/button.ts', '')
        .withFile('src/tests/button.ts', '');

      const result = service.execute(makeCheckRequest([colocated(components, tests)]));
      expect(result.violationsFound).toBe(0);
    });
  });
});
