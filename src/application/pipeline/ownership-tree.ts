import { ArchSymbol } from '../../domain/entities/arch-symbol.js';
import { ArchSymbolKind } from '../../domain/types/arch-symbol-kind.js';

/**
 * Node in the ownership tree. Each node represents an instance
 * and tracks its parent, children, and which member in the parent
 * this instance falls under.
 */
export interface OwnershipNode {
  instanceSymbol: ArchSymbol;
  /** Carrier key (path string for path-based instances) */
  scope: string;
  parent: OwnershipNode | null;
  children: OwnershipNode[];
  /** Which member in the parent's instance contains this node's scope */
  memberOf?: {
    parentNode: OwnershipNode;
    memberName: string;
  };
}

/**
 * The ownership tree — all instances organized by containment.
 */
export interface OwnershipTree {
  /** Top-level instances (no parent) */
  roots: OwnershipNode[];
  /** Lookup by instance id */
  nodeByInstanceId: Map<string, OwnershipNode>;
}

/**
 * Build the ownership tree from instance symbols.
 *
 * Instances are related by scope containment: if instance A's scope
 * contains instance B's scope, A is B's parent (choosing the narrowest
 * containing instance as the direct parent).
 */
export function buildOwnershipTree(symbols: ArchSymbol[]): OwnershipTree {
  // Collect all path-based instance symbols
  const instances = symbols.filter(
    s => s.kind === ArchSymbolKind.Instance && s.carrier?.type === 'path'
  );

  // Create nodes
  const nodes: OwnershipNode[] = instances.map(s => ({
    instanceSymbol: s,
    scope: (s.carrier as { type: 'path'; path: string }).path,
    parent: null,
    children: [],
  }));

  const nodeByInstanceId = new Map<string, OwnershipNode>();
  for (const node of nodes) {
    nodeByInstanceId.set(node.scope, node);
  }

  // Sort by scope breadth (broadest/shortest path first)
  // This ensures parents are processed before children
  const sorted = [...nodes].sort((a, b) => a.scope.length - b.scope.length);

  // For each instance, find the narrowest containing instance → that's the parent
  for (const node of sorted) {
    let bestParent: OwnershipNode | null = null;

    for (const candidate of sorted) {
      if (candidate === node) continue;
      // candidate's scope must be a proper prefix of node's scope
      if (!isProperScopePrefix(candidate.scope, node.scope)) continue;

      // Pick the narrowest (longest scope path) parent
      if (!bestParent || candidate.scope.length > bestParent.scope.length) {
        bestParent = candidate;
      }
    }

    if (bestParent) {
      node.parent = bestParent;
      bestParent.children.push(node);

      // Determine which member in the parent this node falls under
      const memberName = findContainingMember(bestParent.instanceSymbol, node.scope);
      if (memberName) {
        node.memberOf = { parentNode: bestParent, memberName };
      }
    }
  }

  const roots = nodes.filter(n => n.parent === null);

  return { roots, nodeByInstanceId };
}

/**
 * Check if `parent` scope is a proper prefix of `child` scope.
 * Uses path-segment boundary to avoid false matches like
 * '/src/domain' being a prefix of '/src/domain-extensions'.
 */
function isProperScopePrefix(parent: string, child: string): boolean {
  if (parent === child) return false;
  if (!child.startsWith(parent)) return false;
  // Ensure it's at a path segment boundary
  return child[parent.length] === '/';
}

/**
 * Find which member in the parent instance contains the given child scope.
 */
function findContainingMember(
  parentInstance: ArchSymbol,
  childScope: string,
): string | undefined {
  for (const [name, member] of parentInstance.members) {
    // Skip wrapped Kind members — they don't define filesystem containment boundaries
    if (!member.carrier || member.carrier.type !== 'path') continue;
    const memberPath = member.carrier.path;
    if (childScope === memberPath || childScope.startsWith(memberPath + '/')) {
      return name;
    }
  }
  return undefined;
}

