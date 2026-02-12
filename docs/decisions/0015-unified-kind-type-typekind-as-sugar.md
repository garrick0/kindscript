# 15. Unified Kind Type — TypeKind as Sugar

Date: 2026-02-10
Status: Done

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript had two separate type-level primitives: `Kind<N, Members, Constraints>` for directory/file-based architectural units, and `TypeKind<N, T>` for declaration-based units. At the type level, they were unrelated types. This created a conceptual split — users had to learn two different systems — and a practical problem: `Members extends Record<string, KindRef>` needed `KindRef` to be a shared marker, but `Kind` and `TypeKind` had no common base.

Additionally, `TypeKind` only took 2 type parameters — it couldn't carry standalone constraints (like `pure: true`), limiting its expressiveness.

### Decision

Make `Kind` a conditional type with a 4th parameter `_Config extends KindConfig`:

```typescript
type KindConfig = { wraps?: unknown; scope?: 'folder' | 'file' };

type Kind<N, Members, _Constraints, _Config> =
  _Config extends { wraps: infer T }
    ? T & { readonly __kindscript_brand?: N }  // TypeKind shape
    : { kind: N; location: string } & Members; // structural shape

type TypeKind<N, T, C = {}> = Kind<N, {}, C, { wraps: T }>;  // sugar
```

`TypeKind<N, T, C>` is now literally `Kind<N, {}, C, { wraps: T }>` — not a separate concept, but a convenience alias. Both produce `KindRef`-compatible types.

### Rationale

- **One concept, not two** — Kind and TypeKind are the same thing configured differently (directory scope vs. declaration scope)
- **TypeKind gains constraints** — `TypeKind<"Decider", DeciderFn, { pure: true }>` enables standalone purity enforcement on typed exports
- **Shared `KindRef`** — both branches satisfy the phantom marker, so `Members extends Record<string, KindRef>` works naturally
- **`KindConfig` consolidates** — the previous 4th parameter `_Scope` (from D14) and the new `wraps` live together in one config type
- **Minimal API expansion** — 2 new exports (`KindConfig`, `KindRef`), 1 parameter added to `TypeKind`

### Impact

- `src/types/index.ts`: `Kind` is now a conditional type; `TypeKind` gains 3rd parameter; `KindConfig` and `KindRef` exported
- Public API: 6 types (`Kind`, `TypeKind`, `Instance`, `Constraints`, `KindConfig`, `KindRef`)
- Scanner: extracts `constraints` from TypeKind's 3rd type parameter via `TypeKindDefinitionView.constraints`
- Binder: generates standalone TypeKind contracts from `typeKindDefs` with constraints
- 2 new integration fixtures (typekind-purity-clean, typekind-purity-violation)
- 2 new E2E tests for TypeKind standalone purity
- 26 test files, 263 tests, 100% passing

**Subsequent decisions:**
- [D34](0034-instanceof-tagged-export-mechanism.md) completes the unification by removing `TypeKind` from the public API and introducing `InstanceOf<K>` as the tagged export mechanism
- [D35](0035-two-pass-scanner-model.md) restructures the scanner around the unified model (two-pass extraction)
- [D33](0033-carrier-based-resolution.md) replaces `symbol.id` with algebraic `CarrierExpr`, which was enabled by the unified model

---
