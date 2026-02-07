import { CheckContractsService } from '../../src/application/use-cases/check-contracts/check-contracts.service';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';
import { Contract } from '../../src/domain/entities/contract';
import { DiagnosticCode } from '../../src/domain/constants/diagnostic-codes';
import {
  makeSymbol,
  makeCheckRequest,
  noDependency,
  purity,
} from '../helpers/factories';

describe('CheckContractsService - Purity & General', () => {
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
  describe('contract validation', () => {
    it('reports error for invalid contract', () => {
      const domain = makeSymbol('domain');

      // noDependency requires 2 args, give it 1
      const contract = new Contract(
        ContractType.NoDependency,
        'invalid',
        [domain]
      );

      const result = service.execute(makeCheckRequest([contract]));
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe(70099);
      expect(result.diagnostics[0].message).toContain('Invalid contract');
    });
  });

  describe('multiple contracts', () => {
    it('checks all contracts and aggregates results', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');
      const app = makeSymbol('application');

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

      const result = service.execute(makeCheckRequest([
        noDependency(domain, infra),
        noDependency(domain, app),
      ]));
      expect(result.contractsChecked).toBe(2);
      expect(result.violationsFound).toBe(2);
    });
  });

  describe('response metrics', () => {
    it('returns correct filesAnalyzed count', () => {
      const domain = makeSymbol('domain');
      const infra = makeSymbol('infrastructure');

      mockFS
        .withFile('src/domain/a.ts', '')
        .withFile('src/domain/b.ts', '')
        .withFile('src/domain/c.ts', '');

      mockTS
        .withSourceFile('src/domain/a.ts', '')
        .withSourceFile('src/domain/b.ts', '')
        .withSourceFile('src/domain/c.ts', '');

      const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));
      expect(result.filesAnalyzed).toBe(3);
    });
  });
  describe('purity contract', () => {
    it('detects Node.js built-in import (fs)', () => {
      const domain = makeSymbol('domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'fs', 1, 0);

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70003);
      expect(result.diagnostics[0].message).toContain('fs');
    });

    it('detects node: prefixed import (node:fs)', () => {
      const domain = makeSymbol('domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'node:fs', 2, 0);

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(1);
      expect(result.diagnostics[0].code).toBe(70003);
    });

    it('detects fs/promises subpath', () => {
      const domain = makeSymbol('domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'fs/promises', 1, 0);

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(1);
    });

    it('allows relative imports', () => {
      const domain = makeSymbol('domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', './entity', 1, 0);

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(0);
    });

    it('allows npm package imports', () => {
      const domain = makeSymbol('domain');

      mockFS.withFile('src/domain/service.ts', '');
      mockTS
        .withSourceFile('src/domain/service.ts', '')
        .withModuleSpecifier('src/domain/service.ts', 'lodash', 1, 0);

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles empty directory', () => {
      const domain = makeSymbol('domain');

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(0);
    });

    it('handles symbol with no declared location', () => {
      const domain = makeSymbol('domain', ArchSymbolKind.Member, undefined);

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(0);
    });

    it('skips files where getSourceFile returns undefined', () => {
      const domain = makeSymbol('domain');

      mockFS.withFile('src/domain/orphan.ts', '');

      const result = service.execute(makeCheckRequest([purity(domain)]));
      expect(result.violationsFound).toBe(0);
      expect(result.filesAnalyzed).toBe(1);
    });
  });

  describe('existence checking', () => {
    it('reports diagnostic for missing derived location', () => {
      const domainMembers = new Map<string, ArchSymbol>();
      const domain = new ArchSymbol(
        'domain', ArchSymbolKind.Member, '/project/src/domain',
        new Map(), 'DomainLayer', true
      );
      domainMembers.set('domain', domain);

      const instance = new ArchSymbol(
        'app', ArchSymbolKind.Instance, '/project/src',
        domainMembers, 'Ctx'
      );

      // domain directory does NOT exist
      mockFS.withDirectory('/project/src');

      const request = makeCheckRequest([]);
      request.symbols = [instance];
      const result = service.execute(request);

      expect(result.diagnostics.length).toBe(1);
      expect(result.diagnostics[0].code).toBe(DiagnosticCode.LocationNotFound);
      expect(result.diagnostics[0].message).toContain("'/project/src/domain'");
      expect(result.diagnostics[0].message).toContain('domain');
      expect(result.diagnostics[0].message).toContain('DomainLayer');
    });

    it('does not report diagnostic when derived location exists', () => {
      const domain = new ArchSymbol(
        'domain', ArchSymbolKind.Member, '/project/src/domain',
        new Map(), 'DomainLayer', true
      );
      const members = new Map<string, ArchSymbol>();
      members.set('domain', domain);

      const instance = new ArchSymbol(
        'app', ArchSymbolKind.Instance, '/project/src',
        members, 'Ctx'
      );

      // domain directory exists
      mockFS.withDirectory('/project/src');
      mockFS.withDirectory('/project/src/domain');

      const request = makeCheckRequest([]);
      request.symbols = [instance];
      const result = service.execute(request);

      expect(result.diagnostics.length).toBe(0);
    });

    it('skips members without locationDerived flag', () => {
      // Legacy member (locationDerived is undefined/false)
      const domain = new ArchSymbol(
        'domain', ArchSymbolKind.Member, '/project/src/domain'
      );
      const members = new Map<string, ArchSymbol>();
      members.set('domain', domain);

      const instance = new ArchSymbol(
        'app', ArchSymbolKind.Instance, '/project/src',
        members, 'Ctx'
      );

      // domain directory does NOT exist — but should be ignored since not locationDerived
      mockFS.withDirectory('/project/src');

      const request = makeCheckRequest([]);
      request.symbols = [instance];
      const result = service.execute(request);

      expect(result.diagnostics.length).toBe(0);
    });
  });
});
