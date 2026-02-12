# 33. Carrier-Based Resolution

Date: 2026-02-11
Status: Done

## Context

KindScript's binder resolved each `ArchSymbol` to files using `symbol.id` — an opaque string that was either a filesystem path or (for wrapped Kind members) a synthetic identifier. The binder probed the filesystem to determine what kind of resolution to apply:

```
For each symbol:
  1. Is it a wrapped Kind member? → Declaration resolution (scan typed exports)
  2. Directory exists at id? → Folder resolution (recursive listing)
  3. File exists at id? → File resolution (single file)
  4. None → Unresolved
```

This had several problems:

- **Ad-hoc dispatch** — the binder used runtime `isWrappedKind()` checks and `isFileInSymbol()` path-prefix matching, mixing concerns
- **No composability** — wrapped Kind members scoped to a parent directory required special-case logic in the binder (`intersect` a tagged set with a path scope), but this wasn't expressible in the data model
- **Opaque identifiers** — `symbol.id` was a string that could mean different things depending on context; consumers had to know which case they were in
- **Path-prefix fallback** — `isFileInSymbol()` used string prefix matching (`file.startsWith(symbolPath + '/')`) rather than operating on resolved file sets, leading to edge cases

## Decision

Replace `symbol.id: string` with `symbol.carrier: CarrierExpr` — an algebraic expression describing what code a symbol operates over.

### Carrier Algebra

`CarrierExpr` is a discriminated union in the domain layer (`src/domain/types/carrier.ts`):

**Atoms:**
- `{ type: 'path', path: string }` — code at a filesystem path (directory or file)
- `{ type: 'tagged', kindTypeName: string }` — all declarations annotated with `InstanceOf<K>`

**Operations:**
- `{ type: 'union', children: CarrierExpr[] }` — files from any child
- `{ type: 'exclude', base: CarrierExpr, excluded: CarrierExpr }` — base minus excluded
- `{ type: 'intersect', children: CarrierExpr[] }` — files common to all children

### Key Functions

- `carrierKey(carrier): string` — deterministic serialization usable as a Map key. For path carriers, returns the raw path string (backward-compatible with old `symbol.id` lookups).
- `hasTaggedAtom(carrier): boolean` — checks if a carrier contains a tagged atom, replacing `isWrappedKind()`.

### CarrierResolver Service

`CarrierResolver` (`src/application/pipeline/carrier/carrier-resolver.ts`) is an application-layer service that translates `CarrierExpr` values into concrete file lists:

- **Path atoms** → filesystem probing (directory listing or single file)
- **Tagged atoms** → filtering tagged exports from scan results (`ScanContext`)
- **Operations** → recursive set algebra on child results

The resolver includes an optimization for `intersect(tagged, path)` — the common "scoped tagged carrier" pattern — which filters tagged results by path prefix rather than resolving both independently.

### Parser Produces Carriers

The parser now computes `CarrierExpr` values from user-facing syntax:

- `Instance<T, './src/domain'>` → `{ type: 'path', path: '/abs/src/domain' }`
- Wrapped Kind member (scopeless) → `{ type: 'tagged', kindTypeName: 'Decider' }`
- Wrapped Kind member within a parent scope → `intersect(tagged('Decider'), path('/abs/src/ordering'))`

## Rationale

**Alternatives considered:**

1. **Keep `symbol.id` with a type tag** — add `symbol.idKind: 'path' | 'tagged'` alongside the string. Rejected because it doesn't compose (how would you express `intersect(tagged, path)`?).
2. **Resolve eagerly in the parser** — have the parser produce file lists directly. Rejected because resolution requires I/O (filesystem access, scan context), violating parser purity.
3. **Use a resolution strategy pattern** — polymorphic resolver objects per symbol type. Rejected because the algebraic approach is simpler, more testable, and composable.

**Why this approach:**

- **Compositional** — scoping is expressed through `intersect`, not special-case binder logic. New operations (e.g., `exclude`) compose naturally.
- **Pure domain values** — `CarrierExpr` is a plain data type with no behavior, no I/O, no resolution logic. It lives in the domain layer.
- **Single resolution service** — `CarrierResolver` centralizes all file resolution in one testable service, replacing scattered probing logic in the binder.
- **Backward-compatible keys** — `carrierKey()` returns the raw path string for path carriers, so `resolvedFiles` map lookups that used `symbol.id` continue to work.
- **Eliminates `isFileInSymbol()`** — consumers operate on resolved file sets (set membership) rather than path-prefix heuristics.

## Impact

- `ArchSymbol` entity: `id?: string` replaced by `carrier?: CarrierExpr`
- Domain layer gains `src/domain/types/carrier.ts` (CarrierExpr, carrierKey, hasTaggedAtom)
- Application layer gains `src/application/pipeline/carrier/carrier-resolver.ts`
- `ParseService` produces `CarrierExpr` values instead of path strings
- `BindService` delegates resolution to `CarrierResolver`, dispatches on `hasTaggedAtom()` instead of `isWrappedKind()`
- Plugins use `carrierKey(symbol.carrier)` for `resolvedFiles` lookups instead of `symbol.id`
- `isFileInSymbol()` removed from `path-utils.ts` (replaced by set membership)
- All tests migrated from `symbol.id` to `symbol.carrier`
- 382 tests passing, no behavioral changes to constraint checking

---
