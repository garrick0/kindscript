# 27. Scope Plugin and KindConfig.scope for Declared Instance Scope

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

With `Instance<T, Path>` (D24), instance locations are explicitly declared. A path like `'./ordering'` could resolve to either:
- A directory: `src/ordering/`
- A file: `src/ordering.ts`

Both are valid instance locations, but some Kind authors want to enforce granularity. For example, a `Microservice` Kind should always be a directory (containing multiple files), never a single file. Conversely, a `ConfigFile` Kind should always be a file, never a directory.

Without declarative scope constraints, the only way to enforce this is runtime validation in application logic — checking resolved paths against filesystem queries. This scatters architectural rules across the codebase.

### Decision

Add `scope?: 'folder' | 'file'` to `KindConfig` and create a new `scopePlugin`:

```typescript
type KindConfig = {
  wraps?: unknown;
  scope?: 'folder' | 'file';
};

type Kind<N, M, C, _Config extends KindConfig = {}> = ...;
```

When a Kind declares a scope, the binder generates scope contracts for each instance. The checker validates that the instance's resolved location matches the expected granularity:

- `scope: 'folder'` — resolved location must be a directory
- `scope: 'file'` — resolved location must end in `.ts`/`.tsx`

This is the first constraint generated from Kind metadata (`KindConfig`) rather than from the `Constraints` type parameter.

### Rationale

**Why a new constraint category:**

Scope is fundamentally different from the three core constraints (noDependency, purity, noCycles):
- **Structural vs. behavioral** — scope validates location granularity, not code relationships
- **Single instance, not members** — checks the instance root, not relationships between members
- **Metadata-driven** — comes from Kind config, not from Constraints type parameter

**Why in KindConfig:**

Scope is a property of the Kind's structure, not a relationship constraint. It describes what a valid instance looks like, similar to how `wraps` describes the declaration type. Putting it in `KindConfig` makes this clear.

**Alternative considered:**

Add `scope` to `Constraints` type parameter. Rejected: would conflate structural validation with behavioral constraints, and scope doesn't take arguments like the other constraints do.

### Impact

- `KindConfig` type gains optional `scope` field
- `Kind` type's 4th parameter uses `KindConfig` (already true since D15)
- Created `scopePlugin` (ContractType.Scope, DiagnosticCode.ScopeMismatch KS70005)
- `BindService` generates scope contracts from Kind metadata (new code path)
- `ScanService` extracts scope from Kind definition's 4th type parameter
- Public API: `scope` field added to `Constraints` type (JSDoc: "Enforce that instances of this Kind are folders or files")
- 10 new tests in `scope.plugin.test.ts`
- 2 new integration fixtures (scope-folder-clean, scope-file-violation)
- 298 tests passing

---
