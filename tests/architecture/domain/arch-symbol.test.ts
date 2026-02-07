import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { ContractReference } from '../../../src/domain/value-objects/contract-reference';
import { ContractType } from '../../../src/domain/types/contract-type';

describe('ArchSymbol', () => {
  describe('construction', () => {
    it('creates a symbol with name and kind', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      expect(symbol.name).toBe('domain');
      expect(symbol.kind).toBe(ArchSymbolKind.Layer);
      expect(symbol.members.size).toBe(0);
      expect(symbol.contracts.length).toBe(0);
      expect(symbol.declaredLocation).toBeUndefined();
    });

    it('creates a symbol with location', () => {
      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Layer,
        'src/domain'
      );

      expect(symbol.declaredLocation).toBe('src/domain');
    });

    it('creates a symbol with members and contracts', () => {
      const members = new Map([
        ['entity', new ArchSymbol('entity', ArchSymbolKind.Module)],
      ]);

      const contracts: ContractReference[] = [
        {
          contractName: 'no-infra-deps',
          contractType: ContractType.NoDependency,
        },
      ];

      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Layer,
        'src/domain',
        members,
        contracts
      );

      expect(symbol.members.size).toBe(1);
      expect(symbol.contracts.length).toBe(1);
    });
  });

  describe('hasContract', () => {
    it('returns true when contract type exists', () => {
      const contract: ContractReference = {
        contractName: 'no-infra-deps',
        contractType: ContractType.NoDependency,
      };

      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Layer,
        'src/domain',
        new Map(),
        [contract]
      );

      expect(symbol.hasContract(ContractType.NoDependency)).toBe(true);
    });

    it('returns false when contract type does not exist', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      expect(symbol.hasContract(ContractType.NoDependency)).toBe(false);
    });

    it('returns false for different contract type', () => {
      const contract: ContractReference = {
        contractName: 'purity',
        contractType: ContractType.Purity,
      };

      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Layer,
        undefined,
        new Map(),
        [contract]
      );

      expect(symbol.hasContract(ContractType.NoDependency)).toBe(false);
      expect(symbol.hasContract(ContractType.Purity)).toBe(true);
    });
  });

  describe('member management', () => {
    it('creates symbol with members via constructor and retrieves them', () => {
      const child = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const parent = new ArchSymbol(
        'ordering', ArchSymbolKind.Context, undefined,
        new Map([['domain', child]])
      );

      expect(parent.findMember('domain')).toBe(child);
      expect(parent.members.size).toBe(1);
    });

    it('returns undefined for non-existent member', () => {
      const symbol = new ArchSymbol('ordering', ArchSymbolKind.Context);

      expect(symbol.findMember('nonexistent')).toBeUndefined();
    });

    it('getAllMembers returns all members', () => {
      const child1 = new ArchSymbol('domain', ArchSymbolKind.Layer);
      const child2 = new ArchSymbol('application', ArchSymbolKind.Layer);
      const parent = new ArchSymbol(
        'ordering', ArchSymbolKind.Context, undefined,
        new Map([['domain', child1], ['application', child2]])
      );

      const members = parent.getAllMembers();
      expect(members).toHaveLength(2);
      expect(members).toContain(child1);
      expect(members).toContain(child2);
    });
  });

  describe('descendants traversal', () => {
    it('yields all descendants recursively', () => {
      const module1 = new ArchSymbol('module1', ArchSymbolKind.Module);
      const layer1 = new ArchSymbol(
        'layer1', ArchSymbolKind.Layer, undefined,
        new Map([['module1', module1]])
      );
      const layer2 = new ArchSymbol('layer2', ArchSymbolKind.Layer);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Context, undefined,
        new Map([['layer1', layer1], ['layer2', layer2]])
      );

      const descendants = Array.from(root.descendants());

      expect(descendants).toHaveLength(3);
      expect(descendants).toContain(layer1);
      expect(descendants).toContain(layer2);
      expect(descendants).toContain(module1);
    });

    it('yields in depth-first order', () => {
      const grandchild = new ArchSymbol('grandchild', ArchSymbolKind.Module);
      const child1 = new ArchSymbol(
        'child1', ArchSymbolKind.Layer, undefined,
        new Map([['grandchild', grandchild]])
      );
      const child2 = new ArchSymbol('child2', ArchSymbolKind.Layer);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Context, undefined,
        new Map([['child1', child1], ['child2', child2]])
      );

      const descendants = Array.from(root.descendants());

      // child1 should come before its children
      const child1Index = descendants.indexOf(child1);
      const grandchildIndex = descendants.indexOf(grandchild);
      expect(child1Index).toBeLessThan(grandchildIndex);
    });

    it('yields nothing for leaf symbols', () => {
      const leaf = new ArchSymbol('leaf', ArchSymbolKind.Module);

      const descendants = Array.from(leaf.descendants());

      expect(descendants).toHaveLength(0);
    });
  });

  describe('findByPath', () => {
    it('finds direct child', () => {
      const child = new ArchSymbol('child', ArchSymbolKind.Layer);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Context, undefined,
        new Map([['child', child]])
      );

      expect(root.findByPath('child')).toBe(child);
    });

    it('finds nested descendant', () => {
      const entities = new ArchSymbol('entities', ArchSymbolKind.Module);
      const domain = new ArchSymbol(
        'domain', ArchSymbolKind.Layer, undefined,
        new Map([['entities', entities]])
      );
      const root = new ArchSymbol(
        'ordering', ArchSymbolKind.Context, undefined,
        new Map([['domain', domain]])
      );

      expect(root.findByPath('domain.entities')).toBe(entities);
    });

    it('returns undefined for non-existent path', () => {
      const root = new ArchSymbol('root', ArchSymbolKind.Context);

      expect(root.findByPath('nonexistent')).toBeUndefined();
    });

    it('returns undefined for partial path', () => {
      const child = new ArchSymbol('child', ArchSymbolKind.Layer);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Context, undefined,
        new Map([['child', child]])
      );

      expect(root.findByPath('child.nonexistent')).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('formats symbol without location', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer);

      expect(symbol.toString()).toBe('layer:domain');
    });

    it('formats symbol with location', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/domain');

      expect(symbol.toString()).toBe('layer:domain @ src/domain');
    });
  });
});
