import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../src/domain/entities/contract';
import { ContractType } from '../../src/domain/types/contract-type';

describe('CheckContractsService', () => {
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

  const makeRequest = (contracts: Contract[]) => ({
    symbols: [],
    contracts,
    config: {},
    programRootFiles: ['src/domain/service.ts'],
  });

  describe('noDependency contract', () => {
    it('detects forbidden dependency from domain to infrastructure', () => {
      // Arrange
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      mockFS
        .withFile('src/domain/service.ts', 'import { Db } from "../infrastructure/database";')
        .withFile('src/infrastructure/database.ts', 'export class Db {}');

      mockTS
        .withSourceFile('src/domain/service.ts', 'import { Db } from "../infrastructure/database";')
        .withSourceFile('src/infrastructure/database.ts', 'export class Db {}')
        .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 1);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      // Act
      const result = service.execute(makeRequest([contract]));

      // Assert
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(70001);
      expect(result.diagnostics[0].message).toContain('src/domain/service.ts');
      expect(result.diagnostics[0].message).toContain('src/infrastructure/database.ts');
    });

    it('allows permitted dependency direction', () => {
      // Infrastructure -> domain is allowed
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      mockFS
        .withFile('src/domain/entity.ts', 'export class Entity {}')
        .withFile('src/infrastructure/repo.ts', 'import { Entity } from "../domain/entity";');

      mockTS
        .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
        .withSourceFile('src/infrastructure/repo.ts', 'import { Entity } from "../domain/entity";')
        .withImport('src/infrastructure/repo.ts', 'src/domain/entity.ts', '../domain/entity', 1);

      // Contract forbids domain -> infra, NOT infra -> domain
      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));

      expect(result.violationsFound).toBe(0);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('detects multiple violations in the same file', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      mockFS
        .withFile('src/domain/service.ts', '')
        .withFile('src/infrastructure/database.ts', '')
        .withFile('src/infrastructure/cache.ts', '');

      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withSourceFile('src/infrastructure/database.ts', '')
        .withSourceFile('src/infrastructure/cache.ts', '')
        .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 1)
        .withImport('src/domain/service.ts', 'src/infrastructure/cache.ts', '../infrastructure/cache', 2);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(2);
    });

    it('detects violations across multiple source files', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/domain/b.ts', '')
        .withFile('src/infrastructure/db.ts', '');

      mockTS
        .withSourceFile('src/domain/a.ts', '')
        .withSourceFile('src/domain/b.ts', '')
        .withSourceFile('src/infrastructure/db.ts', '')
        .withImport('src/domain/a.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1)
        .withImport('src/domain/b.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(2);
    });

    it('returns clean result when no violations exist', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      mockFS
        .withFile('src/domain/entity.ts', '')
        .withFile('src/domain/service.ts', '');

      mockTS
        .withSourceFile('src/domain/entity.ts', '')
        .withSourceFile('src/domain/service.ts', '')
        .withImport('src/domain/service.ts', 'src/domain/entity.ts', './entity', 1);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
      expect(result.contractsChecked).toBe(1);
    });

    it('handles symbol with no declared location', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('does not false-positive on path prefix collisions', () => {
      // "src/domain-extensions" should NOT be matched by symbol "src/domain"
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      mockFS
        .withFile('src/domain/service.ts', '')
        .withFile('src/domain-extensions/helper.ts', '');

      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withSourceFile('src/domain-extensions/helper.ts', '')
        // domain/service.ts imports from domain-extensions (allowed, not infra)
        .withImport('src/domain/service.ts', 'src/domain-extensions/helper.ts', '../domain-extensions/helper', 1);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      // domain-extensions is NOT infrastructure, so no violation
      expect(result.violationsFound).toBe(0);
    });

    it('skips files where getSourceFile returns undefined', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      // File exists in filesystem but NOT registered as a source file in TS mock
      mockFS
        .withFile('src/domain/orphan.ts', '')
        .withFile('src/infrastructure/db.ts', '');

      // Don't add 'src/domain/orphan.ts' as a source file in mockTS
      // so getSourceFile returns undefined for it
      mockTS
        .withSourceFile('src/infrastructure/db.ts', '');

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(1);
    });

    it('detects violation via path prefix matching with absolute paths', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, '/abs/src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, '/abs/src/infrastructure');

      mockFS
        .withFile('/abs/src/domain/service.ts', '')
        .withFile('/abs/src/infrastructure/database.ts', '');

      mockTS
        .withSourceFile('/abs/src/domain/service.ts', '')
        .withSourceFile('/abs/src/infrastructure/database.ts', '')
        .withImport('/abs/src/domain/service.ts', '/abs/src/infrastructure/database.ts', '../infrastructure/database', 1);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
    });

    it('handles empty directory', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      // Don't add any files
      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });
  });

  describe('contract validation', () => {
    it('reports error for invalid contract', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      // noDependency requires 2 args, give it 1
      const contract = new Contract(
        ContractType.NoDependency,
        'invalid',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(70099);
      expect(result.diagnostics[0].message).toContain('Invalid contract');
    });
  });

  describe('multiple contracts', () => {
    it('checks all contracts and aggregates results', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');
      const appSymbol = new ArchSymbol('application', ArchSymbolKind.Layer, 'src/application');

      mockFS
        .withFile('src/domain/service.ts', '')
        .withFile('src/infrastructure/db.ts', '')
        .withFile('src/application/handler.ts', '');

      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withSourceFile('src/infrastructure/db.ts', '')
        .withSourceFile('src/application/handler.ts', '')
        .withImport('src/domain/service.ts', 'src/infrastructure/db.ts', '../infrastructure/db', 1)
        .withImport('src/domain/service.ts', 'src/application/handler.ts', '../application/handler', 2);

      const contracts = [
        new Contract(ContractType.NoDependency, 'no-domain-infra', [domainSymbol, infraSymbol]),
        new Contract(ContractType.NoDependency, 'no-domain-app', [domainSymbol, appSymbol]),
      ];

      const result = service.execute(makeRequest(contracts));
      expect(result.contractsChecked).toBe(2);
      expect(result.violationsFound).toBe(2);
    });
  });

  describe('response metrics', () => {
    it('returns correct filesAnalyzed count', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/infrastructure');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/domain/b.ts', '')
        .withFile('src/domain/c.ts', '');

      mockTS
        .withSourceFile('src/domain/a.ts', '')
        .withSourceFile('src/domain/b.ts', '')
        .withSourceFile('src/domain/c.ts', '');

      const contract = new Contract(
        ContractType.NoDependency,
        'no-domain-to-infra',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.filesAnalyzed).toBe(3);
    });
  });

  describe('purity contract', () => {
    it('detects Node.js built-in import (fs)', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'fs', 1, 0);

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70003);
      expect(result.diagnostics[0].message).toContain('fs');
    });

    it('detects node: prefixed import (node:fs)', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'node:fs', 2, 0);

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70003);
    });

    it('detects fs/promises subpath', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'fs/promises', 1, 0);

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
    });

    it('allows relative imports', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', './entity', 1, 0);

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('allows npm package imports', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'lodash', 1, 0);

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles empty directory', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles symbol with no declared location', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(0);
    });

    it('skips files where getSourceFile returns undefined', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      mockFS.withFile('src/domain/orphan.ts', '');
      // Don't register source file in mockTS

      const contract = new Contract(
        ContractType.Purity,
        'purity(domain)',
        [domainSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(1);
    });
  });

  describe('noCycles contract', () => {
    it('detects 2-node cycle (A → B → A)', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infra', ArchSymbolKind.Layer, 'src/infra');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/infra/b.ts', '');

      mockTS
        .withSourceFile('src/domain/a.ts', '')
        .withSourceFile('src/infra/b.ts', '')
        .withImport('src/domain/a.ts', 'src/infra/b.ts', '../infra/b', 1)
        .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

      const contract = new Contract(
        ContractType.NoCycles,
        'noCycles(domain, infra)',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70004);
      expect(result.diagnostics[0].message).toContain('Circular dependency');
    });

    it('detects 3-node cycle (A → B → C → A)', () => {
      const aSymbol = new ArchSymbol('a', ArchSymbolKind.Layer, 'src/a');
      const bSymbol = new ArchSymbol('b', ArchSymbolKind.Layer, 'src/b');
      const cSymbol = new ArchSymbol('c', ArchSymbolKind.Layer, 'src/c');

      mockFS
        .withFile('src/a/x.ts', '')
        .withFile('src/b/y.ts', '')
        .withFile('src/c/z.ts', '');

      mockTS
        .withSourceFile('src/a/x.ts', '')
        .withSourceFile('src/b/y.ts', '')
        .withSourceFile('src/c/z.ts', '')
        .withImport('src/a/x.ts', 'src/b/y.ts', '../b/y', 1)
        .withImport('src/b/y.ts', 'src/c/z.ts', '../c/z', 1)
        .withImport('src/c/z.ts', 'src/a/x.ts', '../a/x', 1);

      const contract = new Contract(
        ContractType.NoCycles,
        'noCycles(a, b, c)',
        [aSymbol, bSymbol, cSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70004);
    });

    it('passes with no cycle', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infra', ArchSymbolKind.Layer, 'src/infra');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/infra/b.ts', '');

      mockTS
        .withSourceFile('src/domain/a.ts', '')
        .withSourceFile('src/infra/b.ts', '')
        // Only infra → domain (one direction, no cycle)
        .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

      const contract = new Contract(
        ContractType.NoCycles,
        'noCycles(domain, infra)',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles missing locations', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const infraSymbol = new ArchSymbol('infra', ArchSymbolKind.Layer, 'src/infra');

      const contract = new Contract(
        ContractType.NoCycles,
        'noCycles(domain, infra)',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles getSourceFile returning undefined', () => {
      const domainSymbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');
      const infraSymbol = new ArchSymbol('infra', ArchSymbolKind.Layer, 'src/infra');

      // File exists on FS but not in TS program
      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/infra/b.ts', '');

      // Don't register source files in mockTS

      const contract = new Contract(
        ContractType.NoCycles,
        'noCycles(domain, infra)',
        [domainSymbol, infraSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles 3 nodes with only partial connections (no full cycle)', () => {
      const aSymbol = new ArchSymbol('a', ArchSymbolKind.Layer, 'src/a');
      const bSymbol = new ArchSymbol('b', ArchSymbolKind.Layer, 'src/b');
      const cSymbol = new ArchSymbol('c', ArchSymbolKind.Layer, 'src/c');

      mockFS
        .withFile('src/a/x.ts', '')
        .withFile('src/b/y.ts', '')
        .withFile('src/c/z.ts', '');

      mockTS
        .withSourceFile('src/a/x.ts', '')
        .withSourceFile('src/b/y.ts', '')
        .withSourceFile('src/c/z.ts', '')
        // a→b and b→c but no c→a (chain, not cycle)
        .withImport('src/a/x.ts', 'src/b/y.ts', '../b/y', 1)
        .withImport('src/b/y.ts', 'src/c/z.ts', '../c/z', 1);

      const contract = new Contract(
        ContractType.NoCycles,
        'noCycles(a, b, c)',
        [aSymbol, bSymbol, cSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });
  });

  describe('mustImplement contract', () => {
    it('detects missing implementation', () => {
      const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Layer, 'src/ports');
      const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Layer, 'src/adapters');

      mockFS
        .withFile('src/ports/repository.port.ts', '')
        .withFile('src/adapters/empty.ts', '');

      mockTS
        .withSourceFile('src/ports/repository.port.ts', '')
        .withSourceFile('src/adapters/empty.ts', '')
        .withExportedInterface('src/ports/repository.port.ts', 'RepositoryPort');
      // No class implementing RepositoryPort in adapters

      const contract = new Contract(
        ContractType.MustImplement,
        'mustImplement(ports -> adapters)',
        [portsSymbol, adaptersSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70002);
      expect(result.diagnostics[0].message).toContain('RepositoryPort');
    });

    it('passes when all interfaces are implemented', () => {
      const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Layer, 'src/ports');
      const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Layer, 'src/adapters');

      mockFS
        .withFile('src/ports/repository.port.ts', '')
        .withFile('src/adapters/repository.adapter.ts', '');

      mockTS
        .withSourceFile('src/ports/repository.port.ts', '')
        .withSourceFile('src/adapters/repository.adapter.ts', '')
        .withExportedInterface('src/ports/repository.port.ts', 'RepositoryPort')
        .withClassImplementing('src/adapters/repository.adapter.ts', 'RepositoryPort');

      const contract = new Contract(
        ContractType.MustImplement,
        'mustImplement(ports -> adapters)',
        [portsSymbol, adaptersSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles multiple interfaces', () => {
      const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Layer, 'src/ports');
      const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Layer, 'src/adapters');

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
      // CachePort has no implementation

      const contract = new Contract(
        ContractType.MustImplement,
        'mustImplement(ports -> adapters)',
        [portsSymbol, adaptersSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].message).toContain('CachePort');
    });

    it('handles missing locations', () => {
      const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Layer);
      const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Layer, 'src/adapters');

      const contract = new Contract(
        ContractType.MustImplement,
        'mustImplement(ports -> adapters)',
        [portsSymbol, adaptersSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(0);
    });

    it('handles empty adapter directory', () => {
      const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Layer, 'src/ports');
      const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Layer, 'src/adapters');

      mockFS
        .withFile('src/ports/repo.port.ts', '');

      mockTS
        .withSourceFile('src/ports/repo.port.ts', '')
        .withExportedInterface('src/ports/repo.port.ts', 'RepositoryPort');

      const contract = new Contract(
        ContractType.MustImplement,
        'mustImplement(ports -> adapters)',
        [portsSymbol, adaptersSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
    });

    it('skips port files where getSourceFile returns undefined', () => {
      const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Layer, 'src/ports');
      const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Layer, 'src/adapters');

      // Port file exists on FS but not registered as source file
      mockFS
        .withFile('src/ports/orphan.port.ts', '')
        .withFile('src/adapters/adapter.ts', '');

      mockTS
        .withSourceFile('src/adapters/adapter.ts', '');
      // Don't register orphan.port.ts as source file

      const contract = new Contract(
        ContractType.MustImplement,
        'mustImplement(ports -> adapters)',
        [portsSymbol, adaptersSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      // No interfaces found (source file is undefined), so no violations
      expect(result.violationsFound).toBe(0);
    });

    it('skips adapter files where getSourceFile returns undefined', () => {
      const portsSymbol = new ArchSymbol('ports', ArchSymbolKind.Layer, 'src/ports');
      const adaptersSymbol = new ArchSymbol('adapters', ArchSymbolKind.Layer, 'src/adapters');

      mockFS
        .withFile('src/ports/repo.port.ts', '')
        .withFile('src/adapters/orphan.ts', '');

      mockTS
        .withSourceFile('src/ports/repo.port.ts', '')
        .withExportedInterface('src/ports/repo.port.ts', 'RepoPort');
      // Don't register orphan.ts as source file

      const contract = new Contract(
        ContractType.MustImplement,
        'mustImplement(ports -> adapters)',
        [portsSymbol, adaptersSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      // Interface found but no adapter source file could be loaded → violation
      expect(result.violationsFound).toBe(1);
    });
  });

  describe('colocated contract', () => {
    it('detects missing counterpart', () => {
      const primarySymbol = new ArchSymbol('components', ArchSymbolKind.Layer, 'src/components');
      const relatedSymbol = new ArchSymbol('tests', ArchSymbolKind.Layer, 'src/tests');

      mockFS
        .withFile('src/components/button.ts', '')
        .withFile('src/components/form.ts', '')
        .withFile('src/tests/button.ts', '');
      // form.ts has no counterpart in tests

      const contract = new Contract(
        ContractType.Colocated,
        'colocated(components -> tests)',
        [primarySymbol, relatedSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70005);
      expect(result.diagnostics[0].message).toContain('form.ts');
    });

    it('handles missing locations', () => {
      const primarySymbol = new ArchSymbol('components', ArchSymbolKind.Layer);
      const relatedSymbol = new ArchSymbol('tests', ArchSymbolKind.Layer, 'src/tests');

      const contract = new Contract(
        ContractType.Colocated,
        'colocated(components -> tests)',
        [primarySymbol, relatedSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(0);
    });

    it('passes when all files are matched', () => {
      const primarySymbol = new ArchSymbol('components', ArchSymbolKind.Layer, 'src/components');
      const relatedSymbol = new ArchSymbol('tests', ArchSymbolKind.Layer, 'src/tests');

      mockFS
        .withFile('src/components/button.ts', '')
        .withFile('src/tests/button.ts', '');

      const contract = new Contract(
        ContractType.Colocated,
        'colocated(components -> tests)',
        [primarySymbol, relatedSymbol]
      );

      const result = service.execute(makeRequest([contract]));
      expect(result.violationsFound).toBe(0);
    });
  });
});
