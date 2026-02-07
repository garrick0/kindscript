import { ArchSymbol } from '../../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../src/domain/types/arch-symbol-kind';
import { Contract } from '../../../src/domain/entities/contract';
import { ContractType } from '../../../src/domain/types/contract-type';

describe('Architecture Validation: Layer Structure', () => {
  it('models Clean Architecture three-layer structure', () => {
    // Arrange: Create the three-layer architecture
    const domain = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/ordering/domain');
    const application = new ArchSymbol('application', ArchSymbolKind.Layer, 'src/ordering/application');
    const infrastructure = new ArchSymbol('infrastructure', ArchSymbolKind.Layer, 'src/ordering/infrastructure');

    const root = new ArchSymbol(
      'ordering', ArchSymbolKind.Context, undefined,
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

    // Assert: All contracts are valid
    expect(domainIsolated.validate()).toBeNull();
    expect(domainNoApp.validate()).toBeNull();
  });

  it('models nested layer structure', () => {
    // Arrange: Domain layer with sub-layers
    const entities = new ArchSymbol('entities', ArchSymbolKind.Module, 'src/domain/entities');
    const valueObjects = new ArchSymbol('valueObjects', ArchSymbolKind.Module, 'src/domain/value-objects');
    const ports = new ArchSymbol('ports', ArchSymbolKind.Module, 'src/domain/ports');

    const domain = new ArchSymbol(
      'domain', ArchSymbolKind.Layer, 'src/domain',
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
    const orderingDomain = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/ordering/domain');
    const billingDomain = new ArchSymbol('domain', ArchSymbolKind.Layer, 'src/billing/domain');

    const orderingContext = new ArchSymbol(
      'ordering', ArchSymbolKind.Context, 'src/ordering',
      new Map([['domain', orderingDomain]])
    );
    const billingContext = new ArchSymbol(
      'billing', ArchSymbolKind.Context, 'src/billing',
      new Map([['domain', billingDomain]])
    );

    const root = new ArchSymbol(
      'system', ArchSymbolKind.Kind, undefined,
      new Map([
        ['ordering', orderingContext],
        ['billing', billingContext],
      ])
    );

    // Arrange: Contract preventing cross-context dependencies
    const noContextCrossing = new Contract(
      ContractType.NoDependency,
      'contexts-isolated',
      [orderingContext, billingContext]
    );

    // Assert: Structure is correctly modeled
    expect(root.getAllMembers()).toHaveLength(2);
    expect(orderingContext.findMember('domain')).toBe(orderingDomain);
    expect(billingContext.findMember('domain')).toBe(billingDomain);

    // Assert: Can find nested symbols by path
    expect(root.findByPath('ordering.domain')).toBe(orderingDomain);
    expect(root.findByPath('billing.domain')).toBe(billingDomain);

    // Assert: Contract is valid
    expect(noContextCrossing.validate()).toBeNull();
  });

  it('models hexagonal architecture (ports and adapters)', () => {
    // Arrange: Hexagonal architecture structure
    const core = new ArchSymbol('core', ArchSymbolKind.Layer, 'src/core');
    const ports = new ArchSymbol('ports', ArchSymbolKind.Module, 'src/ports');
    const adapters = new ArchSymbol('adapters', ArchSymbolKind.Module, 'src/adapters');

    const app = new ArchSymbol(
      'application', ArchSymbolKind.Context, undefined,
      new Map([
        ['core', core],
        ['ports', ports],
        ['adapters', adapters],
      ])
    );

    // Arrange: Contracts
    const coreIsolated = new Contract(
      ContractType.NoDependency,
      'core-isolated',
      [core, adapters]
    );

    const portsImplemented = new Contract(
      ContractType.MustImplement,
      'ports-have-adapters',
      [ports, adapters]
    );

    // Assert: Structure is correct
    expect(app.getAllMembers()).toHaveLength(3);

    // Assert: Contracts are valid
    expect(coreIsolated.validate()).toBeNull();
    expect(portsImplemented.validate()).toBeNull();
  });

  it('models layered monolith with shared kernel', () => {
    // Arrange: Shared kernel + multiple contexts
    const sharedKernel = new ArchSymbol('shared', ArchSymbolKind.Layer, 'src/shared');
    const orderingContext = new ArchSymbol('ordering', ArchSymbolKind.Context, 'src/ordering');
    const billingContext = new ArchSymbol('billing', ArchSymbolKind.Context, 'src/billing');

    const system = new ArchSymbol(
      'system', ArchSymbolKind.Kind, undefined,
      new Map([
        ['shared', sharedKernel],
        ['ordering', orderingContext],
        ['billing', billingContext],
      ])
    );

    // Arrange: Contracts - contexts can depend on shared, but not each other
    const noCrossContext = new Contract(
      ContractType.NoDependency,
      'no-cross-context',
      [orderingContext, billingContext]
    );

    // Assert: Structure is correct
    expect(system.getAllMembers()).toHaveLength(3);
    expect(noCrossContext.validate()).toBeNull();
  });
});
