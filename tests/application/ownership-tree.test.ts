import { ArchSymbol } from '../../src/domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { buildOwnershipTree } from '../../src/application/pipeline/ownership-tree';

function makeInstance(name: string, id: string, members?: [string, string][]): ArchSymbol {
  const symbol = new ArchSymbol(name, ArchSymbolKind.Instance, { type: 'path', path: id });
  if (members) {
    for (const [mName, mId] of members) {
      symbol.members.set(mName, new ArchSymbol(mName, ArchSymbolKind.Member, { type: 'path', path: mId }));
    }
  }
  return symbol;
}

describe('buildOwnershipTree', () => {
  it('builds tree with single root instance', () => {
    const app = makeInstance('app', '/project/src', [
      ['domain', '/project/src/domain'],
      ['infra', '/project/src/infrastructure'],
    ]);

    const tree = buildOwnershipTree([app]);

    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0].instanceSymbol.name).toBe('app');
    expect(tree.roots[0].children).toHaveLength(0);
    expect(tree.roots[0].parent).toBeNull();
  });

  it('builds parent-child tree from nested instances', () => {
    const app = makeInstance('app', '/project/src', [
      ['domain', '/project/src/domain'],
      ['infra', '/project/src/infrastructure'],
    ]);
    const domain = makeInstance('domainCtx', '/project/src/domain', [
      ['ordering', '/project/src/domain/ordering'],
      ['billing', '/project/src/domain/billing'],
    ]);

    const tree = buildOwnershipTree([app, domain]);

    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0].instanceSymbol.name).toBe('app');
    expect(tree.roots[0].children).toHaveLength(1);

    const child = tree.roots[0].children[0];
    expect(child.instanceSymbol.name).toBe('domainCtx');
    expect(child.parent).toBe(tree.roots[0]);
    expect(child.memberOf).toBeDefined();
    expect(child.memberOf!.memberName).toBe('domain');
  });

  it('builds three-level deep tree', () => {
    const app = makeInstance('app', '/project/src', [
      ['domain', '/project/src/domain'],
    ]);
    const domain = makeInstance('domainCtx', '/project/src/domain', [
      ['ordering', '/project/src/domain/ordering'],
    ]);
    const ordering = makeInstance('orderingCtx', '/project/src/domain/ordering', [
      ['aggregates', '/project/src/domain/ordering/aggregates'],
    ]);

    const tree = buildOwnershipTree([app, domain, ordering]);

    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0].children).toHaveLength(1);
    expect(tree.roots[0].children[0].children).toHaveLength(1);

    const leaf = tree.roots[0].children[0].children[0];
    expect(leaf.instanceSymbol.name).toBe('orderingCtx');
    expect(leaf.parent!.instanceSymbol.name).toBe('domainCtx');
    expect(leaf.parent!.parent!.instanceSymbol.name).toBe('app');
  });

  it('handles multiple sibling instances under same parent', () => {
    const app = makeInstance('app', '/project/src', [
      ['ordering', '/project/src/ordering'],
      ['billing', '/project/src/billing'],
    ]);
    const ordering = makeInstance('orderingCtx', '/project/src/ordering');
    const billing = makeInstance('billingCtx', '/project/src/billing');

    const tree = buildOwnershipTree([app, ordering, billing]);

    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0].children).toHaveLength(2);

    const childNames = tree.roots[0].children.map(c => c.instanceSymbol.name).sort();
    expect(childNames).toEqual(['billingCtx', 'orderingCtx']);
  });

  it('handles multiple independent root instances', () => {
    const frontend = makeInstance('frontend', '/project/frontend');
    const backend = makeInstance('backend', '/project/backend');

    const tree = buildOwnershipTree([frontend, backend]);

    expect(tree.roots).toHaveLength(2);
    expect(tree.roots.every(r => r.parent === null)).toBe(true);
  });

  it('ignores non-instance symbols', () => {
    const kind = new ArchSymbol('MyKind', ArchSymbolKind.Kind);
    const member = new ArchSymbol('domain', ArchSymbolKind.Member, { type: 'path', path: '/project/src/domain' });

    const tree = buildOwnershipTree([kind, member]);

    expect(tree.roots).toHaveLength(0);
  });

  it('ignores instances without ids', () => {
    const noId = new ArchSymbol('app', ArchSymbolKind.Instance);

    const tree = buildOwnershipTree([noId]);

    expect(tree.roots).toHaveLength(0);
  });

  it('avoids false prefix matches on path boundaries', () => {
    const domain = makeInstance('domain', '/project/src/domain');
    const domainExt = makeInstance('domainExt', '/project/src/domain-extensions');

    const tree = buildOwnershipTree([domain, domainExt]);

    // domain-extensions is NOT a child of domain
    expect(tree.roots).toHaveLength(2);
    expect(domain.name).not.toBe(domainExt.name);
  });

  it('populates nodeByInstanceId lookup', () => {
    const app = makeInstance('app', '/project/src');
    const domain = makeInstance('domainCtx', '/project/src/domain');

    const tree = buildOwnershipTree([app, domain]);

    expect(tree.nodeByInstanceId.get('/project/src')).toBeDefined();
    expect(tree.nodeByInstanceId.get('/project/src/domain')).toBeDefined();
    expect(tree.nodeByInstanceId.get('/project/src')!.instanceSymbol.name).toBe('app');
  });

  it('picks narrowest containing instance as parent', () => {
    const app = makeInstance('app', '/project/src', [
      ['domain', '/project/src/domain'],
    ]);
    const domain = makeInstance('domainCtx', '/project/src/domain', [
      ['ordering', '/project/src/domain/ordering'],
    ]);
    const ordering = makeInstance('orderingCtx', '/project/src/domain/ordering');

    const tree = buildOwnershipTree([app, domain, ordering]);

    const orderingNode = tree.nodeByInstanceId.get('/project/src/domain/ordering')!;
    // ordering's parent should be domain (narrowest), not app (broadest)
    expect(orderingNode.parent!.instanceSymbol.name).toBe('domainCtx');
  });
});

