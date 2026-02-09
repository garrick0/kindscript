import * as path from 'path';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';
import { DiagnosticCode } from '../../src/domain/constants/diagnostic-codes';
import { runPipeline } from '../helpers/test-pipeline';
import { FIXTURES } from '../helpers/fixtures';

describe('Tier 2 Locate Integration Tests', () => {
  describe('locate-clean-arch fixture (no violations)', () => {
    const fixturePath = FIXTURES.LOCATE_CLEAN_ARCH;

    it('classifies InstanceConfig<T> instance with derived member locations', () => {
      const { classifyResult } = runPipeline(fixturePath);

      expect(classifyResult.errors).toHaveLength(0);

      const instances = classifyResult.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(1);
      expect(instances[0].name).toBe('app');
      expect(instances[0].declaredLocation).toBe(path.join(fixturePath, 'src'));

      const domain = instances[0].findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe(path.join(fixturePath, 'src/domain'));
      expect(domain!.kind).toBe(ArchSymbolKind.Member);
      expect(domain!.locationDerived).toBe(true);
      expect(domain!.kindTypeName).toBe('DomainLayer');

      const infra = instances[0].findMember('infrastructure');
      expect(infra).toBeDefined();
      expect(infra!.declaredLocation).toBe(path.join(fixturePath, 'src/infrastructure'));
      expect(infra!.kind).toBe(ArchSymbolKind.Member);
      expect(infra!.locationDerived).toBe(true);
    });

    it('classifies contracts from Kind type constraints', () => {
      const { classifyResult } = runPipeline(fixturePath);

      expect(classifyResult.contracts).toHaveLength(1);
      expect(classifyResult.contracts[0].type).toBe(ContractType.NoDependency);
    });

    it('runs full pipeline with no violations', () => {
      const { checkResult } = runPipeline(fixturePath);

      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('locate-violation fixture', () => {
    it('detects forbidden dependency via locate-derived locations', () => {
      const fixturePath = FIXTURES.LOCATE_VIOLATION;
      const { classifyResult, checkResult } = runPipeline(fixturePath);

      expect(classifyResult.errors).toHaveLength(0);
      expect(classifyResult.contracts).toHaveLength(1);

      expect(checkResult.violationsFound).toBe(1);
      expect(checkResult.diagnostics[0].code).toBe(DiagnosticCode.ForbiddenDependency);
      expect(checkResult.diagnostics[0].message).toContain('domain');
      expect(checkResult.diagnostics[0].message).toContain('infrastructure');
    });
  });

  describe('locate-existence fixture', () => {
    it('detects missing derived location on disk', () => {
      const fixturePath = FIXTURES.LOCATE_EXISTENCE;
      const { classifyResult, checkResult } = runPipeline(fixturePath);

      expect(classifyResult.errors).toHaveLength(0);

      // The "infrastructure" directory doesn't exist, so we expect a LocationNotFound diagnostic
      const existenceDiags = checkResult.diagnostics.filter(
        d => d.code === DiagnosticCode.LocationNotFound
      );
      expect(existenceDiags).toHaveLength(1);
      expect(existenceDiags.some(d => d.message.includes('infrastructure'))).toBe(true);
    });
  });

  describe('locate-nested fixture', () => {
    it('derives multi-level paths for nested Kind tree', () => {
      const fixturePath = FIXTURES.LOCATE_NESTED;
      const { classifyResult } = runPipeline(fixturePath);

      expect(classifyResult.errors).toHaveLength(0);

      const instances = classifyResult.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(1);
      expect(instances[0].name).toBe('app');
      expect(instances[0].declaredLocation).toBe(path.join(fixturePath, 'src'));

      // First level: domain
      const domain = instances[0].findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe(path.join(fixturePath, 'src/domain'));
      expect(domain!.kind).toBe(ArchSymbolKind.Member);
      expect(domain!.locationDerived).toBe(true);
      expect(domain!.kindTypeName).toBe('DomainLayer');

      // Second level: entities, ports
      const entities = domain!.findMember('entities');
      expect(entities).toBeDefined();
      expect(entities!.declaredLocation).toBe(path.join(fixturePath, 'src/domain/entities'));
      expect(entities!.kind).toBe(ArchSymbolKind.Member);
      expect(entities!.locationDerived).toBe(true);
      expect(entities!.kindTypeName).toBe('EntitiesModule');

      const ports = domain!.findMember('ports');
      expect(ports).toBeDefined();
      expect(ports!.declaredLocation).toBe(path.join(fixturePath, 'src/domain/ports'));
      expect(ports!.kind).toBe(ArchSymbolKind.Member);
      expect(ports!.locationDerived).toBe(true);
      expect(ports!.kindTypeName).toBe('PortsModule');
    });

    it('runs full pipeline with no violations', () => {
      const fixturePath = FIXTURES.LOCATE_NESTED;
      const { checkResult } = runPipeline(fixturePath);

      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('locate-standalone-member fixture', () => {
    it('resolves standalone variable references in locate members', () => {
      const fixturePath = FIXTURES.LOCATE_STANDALONE_MEMBER;
      const { classifyResult } = runPipeline(fixturePath);

      expect(classifyResult.errors).toHaveLength(0);

      const instances = classifyResult.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(1);

      const domain = instances[0].findMember('domain');
      expect(domain).toBeDefined();
      expect(domain!.declaredLocation).toBe(path.join(fixturePath, 'src/domain'));
      expect(domain!.kind).toBe(ArchSymbolKind.Member);
      expect(domain!.locationDerived).toBe(true);
    });

    it('runs full pipeline with no violations', () => {
      const fixturePath = FIXTURES.LOCATE_STANDALONE_MEMBER;
      const { checkResult } = runPipeline(fixturePath);

      expect(checkResult.violationsFound).toBe(0);
    });
  });

  describe('locate-multi-instance fixture', () => {
    it('classifies two InstanceConfig<T> declarations across definition files', () => {
      const fixturePath = FIXTURES.LOCATE_MULTI_INSTANCE;
      const { classifyResult } = runPipeline(fixturePath);

      expect(classifyResult.errors).toHaveLength(0);

      const instances = classifyResult.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(2);

      // Ordering context
      const ordering = instances.find(s => s.name === 'ordering');
      expect(ordering).toBeDefined();
      expect(ordering!.declaredLocation).toBe(path.join(fixturePath, 'src/ordering'));

      const orderDomain = ordering!.findMember('domain');
      expect(orderDomain).toBeDefined();
      expect(orderDomain!.declaredLocation).toBe(path.join(fixturePath, 'src/ordering/domain'));

      const orderInfra = ordering!.findMember('infrastructure');
      expect(orderInfra).toBeDefined();
      expect(orderInfra!.declaredLocation).toBe(path.join(fixturePath, 'src/ordering/infrastructure'));

      // Billing context
      const billing = instances.find(s => s.name === 'billing');
      expect(billing).toBeDefined();
      expect(billing!.declaredLocation).toBe(path.join(fixturePath, 'src/billing'));

      const billingDomain = billing!.findMember('domain');
      expect(billingDomain).toBeDefined();
      expect(billingDomain!.declaredLocation).toBe(path.join(fixturePath, 'src/billing/domain'));

      const billingAdapters = billing!.findMember('adapters');
      expect(billingAdapters).toBeDefined();
      expect(billingAdapters!.declaredLocation).toBe(path.join(fixturePath, 'src/billing/adapters'));
    });

    it('classifies contracts for both instances', () => {
      const fixturePath = FIXTURES.LOCATE_MULTI_INSTANCE;
      const { classifyResult } = runPipeline(fixturePath);

      expect(classifyResult.contracts).toHaveLength(2);
      expect(classifyResult.contracts.every(c => c.type === ContractType.NoDependency)).toBe(true);
    });

    it('runs full pipeline with no violations', () => {
      const fixturePath = FIXTURES.LOCATE_MULTI_INSTANCE;
      const { checkResult } = runPipeline(fixturePath);

      expect(checkResult.violationsFound).toBe(0);
    });
  });
});
