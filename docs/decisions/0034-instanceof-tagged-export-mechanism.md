# 34. InstanceOf\<K\> Tagged Export Mechanism

Date: 2026-02-11
Status: Done

## Context

D15 unified `TypeKind<N, T, C>` into `Kind<N, {}, C, { wraps: T }>` at the type level. But the scanner still used separate extraction methods (`getTypeKindDefinitions`, `getTypeKindInstances`) and separate view DTOs (`TypeKindDefinitionView`, `TypeKindInstanceView`, `ScannedTypeKindInstance`) for wrapped Kinds. The public API still exported `TypeKind` as a type alias.

Meanwhile, wrapped Kind instance discovery relied on matching any type annotation that resolved to the wrapped Kind's output type. This was fragile — a function typed as `DeciderFn` (the raw unwrapped type) was indistinguishable from one typed as `Decider` (the wrapped Kind) without deep type-checker analysis.

The project needed an explicit, syntactic opt-in signal for wrapped Kind membership.

## Decision

Introduce `InstanceOf<K>` as a public API type that serves as the explicit annotation for wrapped Kind instances:

```typescript
export type InstanceOf<K extends KindRef> = K;
```

`InstanceOf<K>` is structurally identical to `K` (it's an alias), but it serves as a **syntactic marker** that the scanner detects. Discovery is syntactic, not structural — the scanner checks whether a type annotation explicitly names `InstanceOf` with a wrapped Kind argument.

### What counts as an instance

```typescript
// YES — detected by scanner:
export const validateOrder: InstanceOf<Decider> = (cmd) => { ... };

// NO — not detected (raw type, no InstanceOf wrapper):
export const helper: DeciderFn = (cmd) => { ... };
export const inline = (cmd: Command): Event[] => { ... };
```

### Cleanup

- Remove `TypeKind` from public API exports (it was `Kind<N, {}, C, { wraps: T }>` sugar — users write `Kind` directly)
- Remove `getTypeKindDefinitions()` and `getTypeKindInstances()` from `ASTViewPort`
- Remove `TypeKindDefinitionView`, `TypeKindInstanceView`, `ScannedTypeKindInstance` view DTOs
- Add `getTaggedExports()` to `ASTViewPort`, returning `TaggedExportView[]`
- Add `TaggedExportView` (`{ exportName, kindTypeName }`) and `ScannedTaggedExport` DTOs
- Wrapped Kind definitions are now detected by `wrapsTypeName` on the existing `KindDefinitionView`

### Public API After

7 types exported from `src/types/index.ts`:

| Type | Purpose |
|------|---------|
| `Kind<N, Members?, Constraints?, Config?>` | Define an architectural pattern (conditional type) |
| `Instance<T, Path>` | Declare where a structural Kind is instantiated |
| `InstanceOf<K>` | Tag an export as a wrapped Kind instance |
| `MemberMap<T>` | Transforms a Kind into its instance object shape |
| `Constraints<Members>` | Constraint parameter type |
| `KindConfig` | `{ wraps?: T; scope?: 'folder' \| 'file' }` |
| `KindRef` | Phantom marker shared by structural and wrapped Kinds |

## Rationale

**Alternatives considered:**

1. **Keep `TypeKind` as a convenience alias** — users would write `TypeKind<"Decider", DeciderFn>` instead of `Kind<"Decider", {}, {}, { wraps: DeciderFn }>`. Rejected because maintaining two spellings for the same concept adds cognitive load without expressiveness. The `Kind<N, {}, C, { wraps: T }>` form also makes constraints visible inline.
2. **Structural matching** — detect wrapped Kind instances by checking if a type annotation resolves to the branded type shape. Rejected because it's fragile (any type structurally matching `T & { brand }` would be classified) and requires deep type-checker resolution rather than syntactic checking.
3. **Runtime registration** — `register(validateOrder, Decider)` calls. Rejected because it adds runtime overhead and breaks the zero-runtime-footprint guarantee.

**Why this approach:**

- **Explicit opt-in** — the developer's choice of `InstanceOf<Decider>` vs `DeciderFn` is the architectural intent signal. No implicit classification.
- **Syntactic detection** — the scanner checks for `InstanceOf` as a type name in annotations, making detection fast, local, and independent of type resolution.
- **Zero runtime** — `InstanceOf<K> = K` is a pure type alias. It erases completely at runtime.
- **One concept** — `Kind` is the single primitive for both structural and wrapped architectural units. No parallel type hierarchy.

## Impact

- Public API: `TypeKind` removed, `InstanceOf<K>` and `MemberMap<T>` added (net: 7 types, was 6)
- `ASTViewPort`: `getTypeKindDefinitions()` and `getTypeKindInstances()` removed, `getTaggedExports()` added
- `views.ts`: `TypeKindDefinitionView`, `TypeKindInstanceView` removed, `TaggedExportView` added
- `scan.types.ts`: `ScannedTypeKindInstance` removed, `ScannedTaggedExport` added; `ScanResult.typeKindDefs` and `.typeKindInstances` replaced by `.taggedExports`
- `KindDefinitionView` gains `wrapsTypeName?: string` for wrapped Kind detection
- `ast.adapter.ts`: 123 new tests for `getTaggedExports`
- Renamed fixtures: `typekind-*` → `wrapped-kind-*`, `TYPEKIND_*` → `WRAPPED_KIND_*`
- Completes D15's unification: D15 unified the type level, D34 unifies the scanner and view DTOs
- 382 tests passing

---
