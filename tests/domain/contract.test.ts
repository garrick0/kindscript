import { Contract } from '../../src/domain/entities/contract';
import { ContractType } from '../../src/domain/types/contract-type';
import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';

describe('Contract', () => {
  describe('construction', () => {
    it('creates a contract with type, name, and args', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Member);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Member);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-infra-deps',
        [from, to]
      );

      expect(contract.type).toBe(ContractType.NoDependency);
      expect(contract.name).toBe('no-infra-deps');
      expect(contract.args).toEqual([from, to]);
      expect(contract.location).toBeUndefined();
    });

    it('creates a contract with location', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Member);

      const contract = new Contract(
        ContractType.Purity,
        'pure-domain',
        [symbol],
        'architecture.ts:42'
      );

      expect(contract.location).toBe('architecture.ts:42');
    });
  });

  describe('toReference', () => {
    it('creates a ContractReference', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Member);
      const contract = new Contract(
        ContractType.Purity,
        'pure-domain',
        [symbol],
        'arch.ts'
      );

      const ref = contract.toReference();
      expect(ref.contractName).toBe('pure-domain');
      expect(ref.contractType).toBe(ContractType.Purity);
      expect(ref.location).toBe('arch.ts');
    });
  });

  describe('equality', () => {
    it('equals another contract with same properties', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Member);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Member);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);

      expect(contract1.equals(contract2)).toBe(true);
    });

    it('does not equal contract with different type', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Member);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Member);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.MustImplement, 'rule1', [from, to]);

      expect(contract1.equals(contract2)).toBe(false);
    });

    it('does not equal contract with different name', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Member);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Member);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.NoDependency, 'rule2', [from, to]);

      expect(contract1.equals(contract2)).toBe(false);
    });

    it('does not equal contract with different arg count', () => {
      const s1 = new ArchSymbol('s1', ArchSymbolKind.Member);
      const s2 = new ArchSymbol('s2', ArchSymbolKind.Member);

      const contract1 = new Contract(ContractType.NoCycles, 'rule1', [s1, s2]);
      const contract2 = new Contract(ContractType.NoCycles, 'rule1', [s1]);

      expect(contract1.equals(contract2)).toBe(false);
    });

    it('does not equal contract with different args', () => {
      const from1 = new ArchSymbol('domain', ArchSymbolKind.Member);
      const to1 = new ArchSymbol('infrastructure', ArchSymbolKind.Member);
      const from2 = new ArchSymbol('application', ArchSymbolKind.Member);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from1, to1]);
      const contract2 = new Contract(ContractType.NoDependency, 'rule1', [from2, to1]);

      expect(contract1.equals(contract2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('formats contract with args', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Member);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Member);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-infra-deps',
        [from, to]
      );

      expect(contract.toString()).toBe('noDependency(domain, infrastructure)');
    });

    it('formats contract with single arg', () => {
      const domain = new ArchSymbol('domain', ArchSymbolKind.Member);

      const contract = new Contract(
        ContractType.Purity,
        'pure-domain',
        [domain]
      );

      expect(contract.toString()).toBe('purity(domain)');
    });
  });
});
