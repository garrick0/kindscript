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
