import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';
import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';

describe('Contract', () => {
  describe('construction', () => {
    it('creates a contract with type, name, and args', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

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
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.Purity,
        'pure-domain',
        [symbol],
        'architecture.ts:42'
      );

      expect(contract.location).toBe('architecture.ts:42');
    });
  });

  describe('validation', () => {
    it('validates noDependency contract with correct args', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-infra-deps',
        [from, to]
      );

      expect(contract.validate()).toBeNull();
    });

    it('rejects noDependency contract with wrong arg count', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.NoDependency,
        'invalid',
        [symbol]
      );

      const error = contract.validate();
      expect(error).toContain('requires exactly 2 arguments');
      expect(error).toContain('got 1');
    });

    it('validates mustImplement contract with correct args', () => {
      const ports = new ArchSymbol('ports', ArchSymbolKind.Module);
      const adapters = new ArchSymbol('adapters', ArchSymbolKind.Module);

      const contract = new Contract(
        ContractType.MustImplement,
        'ports-have-adapters',
        [ports, adapters]
      );

      expect(contract.validate()).toBeNull();
    });

    it('rejects mustImplement contract with wrong arg count', () => {
      const symbol = new ArchSymbol('ports', ArchSymbolKind.Module);

      const contract = new Contract(
        ContractType.MustImplement,
        'invalid',
        [symbol]
      );

      const error = contract.validate();
      expect(error).toContain('requires exactly 2 arguments');
    });

    it('validates purity contract with correct args', () => {
      const domain = new ArchSymbol('domain', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.Purity,
        'pure-domain',
        [domain]
      );

      expect(contract.validate()).toBeNull();
    });

    it('rejects purity contract with wrong arg count', () => {
      const domain = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const other = new ArchSymbol('other', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.Purity,
        'invalid',
        [domain, other]
      );

      const error = contract.validate();
      expect(error).toContain('requires exactly 1 argument');
      expect(error).toContain('got 2');
    });

    it('validates noCycles contract with multiple args', () => {
      const s1 = new ArchSymbol('s1', ArchSymbolKind.Module);
      const s2 = new ArchSymbol('s2', ArchSymbolKind.Module);
      const s3 = new ArchSymbol('s3', ArchSymbolKind.Module);

      const contract = new Contract(
        ContractType.NoCycles,
        'no-cycles',
        [s1, s2, s3]
      );

      expect(contract.validate()).toBeNull();
    });

    it('validates noCycles contract with single arg', () => {
      const symbol = new ArchSymbol('module', ArchSymbolKind.Module);

      const contract = new Contract(
        ContractType.NoCycles,
        'no-cycles',
        [symbol]
      );

      expect(contract.validate()).toBeNull();
    });

    it('rejects noCycles contract with no args', () => {
      const contract = new Contract(
        ContractType.NoCycles,
        'invalid',
        []
      );

      const error = contract.validate();
      expect(error).toContain('requires at least 1 argument');
    });

    it('validates colocated contract with correct args', () => {
      const feature = new ArchSymbol('feature', ArchSymbolKind.Module);
      const test = new ArchSymbol('test', ArchSymbolKind.Module);

      const contract = new Contract(
        ContractType.Colocated,
        'tests-with-features',
        [feature, test]
      );

      expect(contract.validate()).toBeNull();
    });

    it('rejects colocated contract with wrong arg count', () => {
      const symbol = new ArchSymbol('feature', ArchSymbolKind.Module);

      const contract = new Contract(
        ContractType.Colocated,
        'invalid',
        [symbol]
      );

      const error = contract.validate();
      expect(error).toContain('requires exactly 2 arguments');
    });
  });

  describe('equality', () => {
    it('equals another contract with same properties', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);

      expect(contract1.equals(contract2)).toBe(true);
    });

    it('does not equal contract with different type', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.MustImplement, 'rule1', [from, to]);

      expect(contract1.equals(contract2)).toBe(false);
    });

    it('does not equal contract with different name', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from, to]);
      const contract2 = new Contract(ContractType.NoDependency, 'rule2', [from, to]);

      expect(contract1.equals(contract2)).toBe(false);
    });

    it('does not equal contract with different args', () => {
      const from1 = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to1 = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);
      const from2 = new ArchSymbol('application', ArchSymbolKind.Layer);

      const contract1 = new Contract(ContractType.NoDependency, 'rule1', [from1, to1]);
      const contract2 = new Contract(ContractType.NoDependency, 'rule1', [from2, to1]);

      expect(contract1.equals(contract2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('formats contract with args', () => {
      const from = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const to = new ArchSymbol('infrastructure', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.NoDependency,
        'no-infra-deps',
        [from, to]
      );

      expect(contract.toString()).toBe('noDependency(domain, infrastructure)');
    });

    it('formats contract with single arg', () => {
      const domain = new ArchSymbol('domain', ArchSymbolKind.Layer);

      const contract = new Contract(
        ContractType.Purity,
        'pure-domain',
        [domain]
      );

      expect(contract.toString()).toBe('purity(domain)');
    });
  });
});
