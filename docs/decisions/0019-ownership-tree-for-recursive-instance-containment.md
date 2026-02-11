# 19. Ownership Tree for Recursive Instance Containment

Date: 2026-02-11
Status: Done

**Date:** 2026-02-11
**Status:** Done

### Context

With explicit instance locations (D24), instances can be nested — a parent instance's scope can contain child instances. For example:

```typescript
// src/context.ts
export const shop = {
  ordering: {} satisfies Instance<Microservice, './ordering'>,
  billing: {} satisfies Instance<Microservice, './billing'>,
} satisfies Instance<System, '.'>;

// src/ordering/context.ts
export const orderingCtx = {
  domain: {} satisfies Instance<Layer, './domain'>,
  app: {} satisfies Instance<Layer, './application'>,
} satisfies Instance<Microservice, '.'>;
```

Here, `ordering` (scope: `src/ordering/`) is contained within `shop` (scope: `src/`). This containment relationship is important for two reasons:

1. **Overlap detection** (D20) — when checking if two members overlap, we only care about sibling members, not parent-child pairs. `ordering` and `billing` are siblings (both children of `shop`); checking overlap between `shop` and `ordering` would be nonsensical (parent always "overlaps" child by definition).

2. **Exhaustiveness checking** (D21) — when checking if all files are assigned, we only check files within the instance's scope, excluding files owned by child instances.

Without a structured representation of parent-child relationships, plugins would need to recompute containment from scopes repeatedly, and the logic would be scattered.

### Decision

Introduce `OwnershipTree` and `OwnershipNode` as a new intermediate representation, computed between bind and check stages:

```typescript
interface OwnershipNode {
  instanceSymbol: ArchSymbol;
  scope: string;
  parent: OwnershipNode | null;
  children: OwnershipNode[];
  memberOf?: string;
}

interface OwnershipTree {
  roots: OwnershipNode[];
  nodeByInstanceId: Map<string, OwnershipNode>;
}
```

The tree is built by `buildOwnershipTree()` in `PipelineService`:

1. Sort all instances by scope path length (longest first)
2. For each instance, find its parent — the instance with the narrowest scope that contains this instance's scope
3. Assign parent-child relationships
4. Build a lookup map `nodeByInstanceId` for O(1) access

The checker receives `ownershipTree` via `CheckerRequest` and uses it to:
- Get siblings for overlap checking: `node.parent.children`
- Exclude child scopes for exhaustiveness: `containerFiles - union(child.scope for all children)`

### Rationale

**Why a tree structure:**

- **Natural representation** — instance containment forms a tree (each instance has at most one parent by scope containment)
- **Efficient lookup** — `nodeByInstanceId` provides O(1) access by symbol ID
- **Clear semantics** — parent/child/sibling relationships are explicit, not derived on the fly

**Why derive from scope paths:**

- **Automatic** — no need to declare parent-child relationships; they're inferred from filesystem paths
- **Consistent** — follows the same "location determines structure" principle as member resolution
- **Testable** — tree building is a pure function from instances → tree

**Why between bind and check:**

- **After bind** — requires resolved instance locations (bind output)
- **Before check** — used by multiple plugins (overlap, exhaustiveness); computing once avoids duplication

**Alternative considered:**

Add `parent` field to `ArchSymbol`. Rejected: would couple domain entities to parent-child relationships, which are pipeline-specific (not all architectural systems have nested instances).

### Impact

- Created `src/application/pipeline/ownership-tree.ts` with `buildOwnershipTree()` function
- `PipelineService.execute()` calls `buildOwnershipTree()` after bind stage
- `CheckerRequest` constructor takes `ownershipTree: OwnershipTree` parameter
- `CheckerService` passes `ownershipTree` to plugin `check()` calls
- `overlapPlugin` uses `ownershipTree` to get sibling pairs for checking
- `exhaustivenessPlugin` uses `ownershipTree` to exclude child scopes
- 7 tests in `ownership-tree.test.ts` verify tree construction
- 12 tests in overlap/exhaustiveness plugins use ownership tree
- 343 tests passing

---
