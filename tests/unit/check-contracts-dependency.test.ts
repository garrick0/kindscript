import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import {
  makeSymbol,
  makeCheckRequest,
  noDependency,
  noCycles,
} from '../helpers/factories';

describe('CheckContractsService - Dependency Contracts', () => {
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
  describe('noDependency contract', () => {
    it('detects forbidden dependency from domain to infrastructure', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

      mockFS
        .withFile('src/domain/service.ts', 'import { Db } from "../infrastructure/database";')
        .withFile('src/infrastructure/database.ts', 'export class Db {}');

      mockTS
        .withSourceFile('src/domain/service.ts', 'import { Db } from "../infrastructure/database";')
        .withSourceFile('src/infrastructure/database.ts', 'export class Db {}')
        .withImport('src/domain/service.ts', 'src/infrastructure/database.ts', '../infrastructure/database', 1);

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));

      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(70001);
      expect(result.diagnostics[0].message).toContain('src/domain/service.ts');
      expect(result.diagnostics[0].message).toContain('src/infrastructure/database.ts');
    });

    it('allows permitted dependency direction', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

      mockFS
        .withFile('src/domain/entity.ts', 'export class Entity {}')
        .withFile('src/infrastructure/repo.ts', 'import { Entity } from "../domain/entity";');

      mockTS
        .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
        .withSourceFile('src/infrastructure/repo.ts', 'import { Entity } from "../domain/entity";')
        .withImport('src/infrastructure/repo.ts', 'src/domain/entity.ts', '../domain/entity', 1);

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));

      expect(result.violationsFound).toBe(0);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('detects multiple violations in the same file', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

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

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(2);
    });

    it('detects violations across multiple source files', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

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

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(2);
    });

    it('returns clean result when no violations exist', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

      mockFS
        .withFile('src/domain/entity.ts', '')
        .withFile('src/domain/service.ts', '');

      mockTS
        .withSourceFile('src/domain/entity.ts', '')
        .withSourceFile('src/domain/service.ts', '')
        .withImport('src/domain/service.ts', 'src/domain/entity.ts', './entity', 1);

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(0);
      expect(result.contractsChecked).toBe(1);
    });

    it('handles symbol with no declared location', () => {
      const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);
      const infra = makeSymbol('infrastructure');

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(0);
    });

    it('does not false-positive on path prefix collisions', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

      mockFS
        .withFile('src/domain/service.ts', '')
        .withFile('src/domain-extensions/helper.ts', '');

      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withSourceFile('src/domain-extensions/helper.ts', '')
        .withImport('src/domain/service.ts', 'src/domain-extensions/helper.ts', '../domain-extensions/helper', 1);

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(0);
    });

    it('skips files where getSourceFile returns undefined', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

      mockFS
        .withFile('src/domain/orphan.ts', '')
        .withFile('src/infrastructure/db.ts', '');

      mockTS
        .withSourceFile('src/infrastructure/db.ts', '');

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(1);
    });

    it('detects violation via path prefix matching with absolute paths', () => {
      const domain = makeSymbol('domain', ArchSymbolKind.Member, '/abs/src/domain');
      const infra = makeSymbol('infrastructure', ArchSymbolKind.Member, '/abs/src/infrastructure');

      mockFS
        .withFile('/abs/src/domain/service.ts', '')
        .withFile('/abs/src/infrastructure/database.ts', '');

      mockTS
        .withSourceFile('/abs/src/domain/service.ts', '')
        .withSourceFile('/abs/src/infrastructure/database.ts', '')
        .withImport('/abs/src/domain/service.ts', '/abs/src/infrastructure/database.ts', '../infrastructure/database', 1);

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(1);
    });

    it('handles empty directory', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.violationsFound).toBe(0);
    });
  });

  describe('noCycles contract', () => {
    it('detects 2-node cycle (A → B → A)', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infra');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/infra/b.ts', '');

      mockTS
        .withSourceFile('src/domain/a.ts', '')
        .withSourceFile('src/infra/b.ts', '')
        .withImport('src/domain/a.ts', 'src/infra/b.ts', '../infra/b', 1)
        .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

      const result = service.execute(makeCheckRequest([noCycles([domain, infra])]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70004);
      expect(result.diagnostics[0].message).toContain('Circular dependency');
    });

    it('detects 3-node cycle (A → B → C → A)', () => {
      const a = makeSymbol('a');
      const b = makeSymbol('b');
      const c = makeSymbol('c');

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

      const result = service.execute(makeCheckRequest([noCycles([a, b, c])]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70004);
    });

    it('passes with no cycle', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infra');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/infra/b.ts', '');

      mockTS
        .withSourceFile('src/domain/a.ts', '')
        .withSourceFile('src/infra/b.ts', '')
        .withImport('src/infra/b.ts', 'src/domain/a.ts', '../domain/a', 1);

      const result = service.execute(makeCheckRequest([noCycles([domain, infra])]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles missing locations', () => {
      const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);
      const infra = makeSymbol('infra');

      const result = service.execute(makeCheckRequest([noCycles([domain, infra])]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles getSourceFile returning undefined', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infra');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/infra/b.ts', '');

      const result = service.execute(makeCheckRequest([noCycles([domain, infra])]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles 3 nodes with only partial connections (no full cycle)', () => {
      const a = makeSymbol('a');
      const b = makeSymbol('b');
      const c = makeSymbol('c');

      mockFS
        .withFile('src/a/x.ts', '')
        .withFile('src/b/y.ts', '')
        .withFile('src/c/z.ts', '');

      mockTS
        .withSourceFile('src/a/x.ts', '')
        .withSourceFile('src/b/y.ts', '')
        .withSourceFile('src/c/z.ts', '')
        .withImport('src/a/x.ts', 'src/b/y.ts', '../b/y', 1)
        .withImport('src/b/y.ts', 'src/c/z.ts', '../c/z', 1);

      const result = service.execute(makeCheckRequest([noCycles([a, b, c])]));
      expect(result.violationsFound).toBe(0);
    });
  });
});
