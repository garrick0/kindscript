import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../src/domain/entities/contract';
import { ContractType } from '../../src/domain/types/contract-type';
import { carrierKey } from '../../src/domain/types/carrier';

describe('ArchSymbol', () => {
  describe('construction', () => {
    it('creates a symbol with name and kind', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Member);

      expect(symbol.name).toBe('domain');
      expect(symbol.kind).toBe(ArchSymbolKind.Member);
      expect(symbol.members.size).toBe(0);
      expect(symbol.carrier).toBeUndefined();
    });

    it('creates a symbol with carrier', () => {
      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Member,
        { type: 'path', path: 'src/domain' }
      );

      expect(symbol.carrier).toEqual({ type: 'path', path: 'src/domain' });
      expect(carrierKey(symbol.carrier!)).toBe('src/domain');
    });

    it('creates a symbol with members', () => {
      const members = new Map([
        ['entity', new ArchSymbol('entity', ArchSymbolKind.Member)],
      ]);

      const symbol = new ArchSymbol(
        'domain',
        ArchSymbolKind.Member,
        { type: 'path', path: 'src/domain' },
        members,
      );

      expect(symbol.members.size).toBe(1);
    });
  });

  describe('member management', () => {
    it('creates symbol with members via constructor and retrieves them', () => {
      const child = new ArchSymbol('domain', ArchSymbolKind.Member);
      const parent = new ArchSymbol(
        'ordering', ArchSymbolKind.Member, undefined,
        new Map([['domain', child]])
      );

      expect(parent.findMember('domain')).toBe(child);
      expect(parent.members.size).toBe(1);
    });

    it('returns undefined for non-existent member', () => {
      const symbol = new ArchSymbol('ordering', ArchSymbolKind.Member);

      expect(symbol.findMember('nonexistent')).toBeUndefined();
    });

    it('getAllMembers returns all members', () => {
      const child1 = new ArchSymbol('domain', ArchSymbolKind.Member);
      const child2 = new ArchSymbol('application', ArchSymbolKind.Member);
      const parent = new ArchSymbol(
        'ordering', ArchSymbolKind.Member, undefined,
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
      const module1 = new ArchSymbol('module1', ArchSymbolKind.Member);
      const layer1 = new ArchSymbol(
        'layer1', ArchSymbolKind.Member, undefined,
        new Map([['module1', module1]])
      );
      const layer2 = new ArchSymbol('layer2', ArchSymbolKind.Member);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Member, undefined,
        new Map([['layer1', layer1], ['layer2', layer2]])
      );

      const descendants = Array.from(root.descendants());

      expect(descendants).toHaveLength(3);
      expect(descendants).toContain(layer1);
      expect(descendants).toContain(layer2);
      expect(descendants).toContain(module1);
    });

    it('yields in depth-first order', () => {
      const grandchild = new ArchSymbol('grandchild', ArchSymbolKind.Member);
      const child1 = new ArchSymbol(
        'child1', ArchSymbolKind.Member, undefined,
        new Map([['grandchild', grandchild]])
      );
      const child2 = new ArchSymbol('child2', ArchSymbolKind.Member);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Member, undefined,
        new Map([['child1', child1], ['child2', child2]])
      );

      const descendants = Array.from(root.descendants());

      // child1 should come before its children
      const child1Index = descendants.indexOf(child1);
      const grandchildIndex = descendants.indexOf(grandchild);
      expect(child1Index).toBeLessThan(grandchildIndex);
    });

    it('yields nothing for leaf symbols', () => {
      const leaf = new ArchSymbol('leaf', ArchSymbolKind.Member);

      const descendants = Array.from(leaf.descendants());

      expect(descendants).toHaveLength(0);
    });
  });

  describe('findByPath', () => {
    it('finds direct child', () => {
      const child = new ArchSymbol('child', ArchSymbolKind.Member);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Member, undefined,
        new Map([['child', child]])
      );

      expect(root.findByPath('child')).toBe(child);
    });

    it('finds nested descendant', () => {
      const entities = new ArchSymbol('entities', ArchSymbolKind.Member);
      const domain = new ArchSymbol(
        'domain', ArchSymbolKind.Member, undefined,
        new Map([['entities', entities]])
      );
      const root = new ArchSymbol(
        'ordering', ArchSymbolKind.Member, undefined,
        new Map([['domain', domain]])
      );

      expect(root.findByPath('domain.entities')).toBe(entities);
    });

    it('returns undefined for non-existent path', () => {
      const root = new ArchSymbol('root', ArchSymbolKind.Member);

      expect(root.findByPath('nonexistent')).toBeUndefined();
    });

    it('returns undefined for partial path', () => {
      const child = new ArchSymbol('child', ArchSymbolKind.Member);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Member, undefined,
        new Map([['child', child]])
      );

      expect(root.findByPath('child.nonexistent')).toBeUndefined();
    });

    it('returns undefined early when intermediate segment is missing in multi-part path', () => {
      const child = new ArchSymbol('child', ArchSymbolKind.Member);
      const root = new ArchSymbol(
        'root', ArchSymbolKind.Member, undefined,
        new Map([['child', child]])
      );

      // 3-part path where the second part doesn't exist, so the
      // third iteration sees current=undefined and returns early
      expect(root.findByPath('child.missing.deep')).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('formats symbol without location', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Member);

      expect(symbol.toString()).toBe('member:domain');
    });

    it('formats symbol with location', () => {
      const symbol = new ArchSymbol('domain', ArchSymbolKind.Member, { type: 'path', path: 'src/domain' });

      expect(symbol.toString()).toBe('member:domain @ src/domain');
    });
  });

  describe('layer structure modeling', () => {
    it('models Clean Architecture three-layer structure', () => {
      // Arrange: Create the three-layer architecture
      const domain = new ArchSymbol('domain', ArchSymbolKind.Member, { type: 'path', path: 'src/ordering/domain' });
      const application = new ArchSymbol('application', ArchSymbolKind.Member, { type: 'path', path: 'src/ordering/application' });
      const infrastructure = new ArchSymbol('infrastructure', ArchSymbolKind.Member, { type: 'path', path: 'src/ordering/infrastructure' });

      const root = new ArchSymbol(
        'ordering', ArchSymbolKind.Member, undefined,
        new Map([
          ['domain', domain],
          ['application', application],
          ['infrastructure', infrastructure],
        ])
      );

      // Arrange: Define contracts
      const domainIsolated = new Contract(
        ContractType.NoDependency,
        'domain-isolated-from-infrastructure',
        [domain, infrastructure]
      );

      const domainNoApp = new Contract(
        ContractType.NoDependency,
        'domain-isolated-from-application',
        [domain, application]
      );

      // Assert: Structure is correctly modeled
      expect(root.getAllMembers()).toHaveLength(3);
      expect(root.findMember('domain')).toBe(domain);
      expect(root.findMember('application')).toBe(application);
      expect(root.findMember('infrastructure')).toBe(infrastructure);

      // Assert: Contracts reference the correct symbols
      expect(domainIsolated.args[0]).toBe(domain);
      expect(domainIsolated.args[1]).toBe(infrastructure);
      expect(domainNoApp.args[0]).toBe(domain);
      expect(domainNoApp.args[1]).toBe(application);


    });

    it('models nested layer structure', () => {
      // Arrange: Domain layer with sub-layers
      const entities = new ArchSymbol('entities', ArchSymbolKind.Member, { type: 'path', path: 'src/domain/entities' });
      const valueObjects = new ArchSymbol('valueObjects', ArchSymbolKind.Member, { type: 'path', path: 'src/domain/value-objects' });
      const ports = new ArchSymbol('ports', ArchSymbolKind.Member, { type: 'path', path: 'src/domain/ports' });

      const domain = new ArchSymbol(
        'domain', ArchSymbolKind.Member, { type: 'path', path: 'src/domain' },
        new Map([
          ['entities', entities],
          ['valueObjects', valueObjects],
          ['ports', ports],
        ])
      );

      // Assert: Nested structure is correctly modeled
      expect(domain.getAllMembers()).toHaveLength(3);
      expect(domain.findMember('entities')).toBe(entities);

      // Assert: Can traverse hierarchy
      const descendants = Array.from(domain.descendants());
      expect(descendants).toHaveLength(3);
      expect(descendants).toContain(entities);
    });

    it('models multiple bounded contexts', () => {
      // Arrange: Multiple contexts, each with layers
      const orderingDomain = new ArchSymbol('domain', ArchSymbolKind.Member, { type: 'path', path: 'src/ordering/domain' });
      const billingDomain = new ArchSymbol('domain', ArchSymbolKind.Member, { type: 'path', path: 'src/billing/domain' });

      const orderingContext = new ArchSymbol(
        'ordering', ArchSymbolKind.Member, { type: 'path', path: 'src/ordering' },
        new Map([['domain', orderingDomain]])
      );
      const billingContext = new ArchSymbol(
        'billing', ArchSymbolKind.Member, { type: 'path', path: 'src/billing' },
        new Map([['domain', billingDomain]])
      );

      const root = new ArchSymbol(
        'system', ArchSymbolKind.Kind, undefined,
        new Map([
          ['ordering', orderingContext],
          ['billing', billingContext],
        ])
      );

      // Assert: Structure is correctly modeled
      expect(root.getAllMembers()).toHaveLength(2);
      expect(orderingContext.findMember('domain')).toBe(orderingDomain);
      expect(billingContext.findMember('domain')).toBe(billingDomain);

      // Assert: Can find nested symbols by path
      expect(root.findByPath('ordering.domain')).toBe(orderingDomain);
      expect(root.findByPath('billing.domain')).toBe(billingDomain);

    });

    it('models hexagonal architecture (ports and adapters)', () => {
      // Arrange: Hexagonal architecture structure
      const core = new ArchSymbol('core', ArchSymbolKind.Member, { type: 'path', path: 'src/core' });
      const ports = new ArchSymbol('ports', ArchSymbolKind.Member, { type: 'path', path: 'src/ports' });
      const adapters = new ArchSymbol('adapters', ArchSymbolKind.Member, { type: 'path', path: 'src/adapters' });

      const app = new ArchSymbol(
        'application', ArchSymbolKind.Member, undefined,
        new Map([
          ['core', core],
          ['ports', ports],
          ['adapters', adapters],
        ])
      );

      // Assert: Structure is correct
      expect(app.getAllMembers()).toHaveLength(3);

    });

    it('models layered monolith with shared kernel', () => {
      // Arrange: Shared kernel + multiple contexts
      const sharedKernel = new ArchSymbol('shared', ArchSymbolKind.Member, { type: 'path', path: 'src/shared' });
      const orderingContext = new ArchSymbol('ordering', ArchSymbolKind.Member, { type: 'path', path: 'src/ordering' });
      const billingContext = new ArchSymbol('billing', ArchSymbolKind.Member, { type: 'path', path: 'src/billing' });

      const system = new ArchSymbol(
        'system', ArchSymbolKind.Kind, undefined,
        new Map([
          ['shared', sharedKernel],
          ['ordering', orderingContext],
          ['billing', billingContext],
        ])
      );

      // Assert: Structure is correct
      expect(system.getAllMembers()).toHaveLength(3);
    });
  });
});
