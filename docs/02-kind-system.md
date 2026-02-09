# The Kind System

> Kind definitions, instances, location derivation, and discovery.

---

## Overview

KindScript's type system has two primitives:

1. **Kind definitions** — type-level declarations of architectural patterns (`type X = Kind<...>`)
2. **Instance declarations** — value-level declarations mapping patterns to a specific codebase (`satisfies Instance<T>`)

Kinds are normative (what the architecture MUST look like). Instances are descriptive (where the code ACTUALLY lives). The compiler compares them and reports violations.

---

## Kind Definitions

A Kind is a TypeScript type alias using the `Kind<N, Members, Constraints>` generic:

```typescript
import type { Kind } from 'kindscript';

// Leaf kind (no members)
type DomainLayer = Kind<"DomainLayer">;

// Leaf kind with constraints
type PureDomainLayer = Kind<"PureDomainLayer", {}, { pure: true }>;

// Composite kind with members
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

// Composite kind with members AND constraints
type StrictCleanContext = Kind<"StrictCleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
  ];
  pure: true;  // applies to this kind's own scope
}>;
```

### The Three Type Parameters

| Parameter | Required | Purpose |
|-----------|----------|---------|
| `N` (name) | Yes | String literal discriminant — must match the type alias name |
| `Members` | No | Object type mapping member names to their Kind types |
| `Constraints` | No | `Constraints<Members>` — architectural rules to enforce |

### Why `type` Instead of `interface`

KindScript uses `type X = Kind<...>` (type alias), not `interface X extends Kind<...>`. Reasons:

- **No redundant name** — `interface` required the name twice (`interface Foo extends Kind<"Foo">`)
- **Cleaner syntax** — no empty `{}` for leaf kinds
- **Constraints as type parameters** — the 3rd type parameter on `Kind` carries constraints naturally
- **No false inheritance** — `extends` implied OOP inheritance, but kinds are pure type-level concepts

---

## Instance Declarations

An instance maps a Kind to a specific location in a codebase using `satisfies Instance<T>`:

```typescript
import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

// Instance declaration — root derived from this file's directory
export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies Instance<OrderingContext>;
```

### What `satisfies` Gives Us

The `satisfies` keyword is valid TypeScript — no macros, no transforms, no runtime. It provides:

1. **Type safety** — TypeScript validates the member object structure at compile time
2. **Zero runtime** — `import type` is fully erased; no `kindscript` dependency at runtime
3. **IDE support** — autocomplete, hover docs, go-to-definition all work natively

### What Instances Never Do

Instances never specify paths. The Kind defines structure (what members exist). The compiler discovers reality (what directories exist). Validation compares them. If an instance said "look here," it would be doing the compiler's job.

---

## Location Derivation

KindScript automatically derives filesystem locations from the instance declaration. The scope depends on whether the Kind has members:

- **Composite Kind** (has members) — location is the **directory** containing the declaring file. Members map to subdirectories.
- **Leaf Kind** (no members) — location is the **declaring file itself**. The file IS the architectural entity.

### Composite Instance (Directory Scope)

Given this file at `src/context.ts`:

```typescript
export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies Instance<OrderingContext>;
```

KindScript derives:
- **Root:** `src/` (directory of `context.ts` — composite Kind, has members)
- **domain:** `src/domain/` (root + member name)
- **infrastructure:** `src/infrastructure/` (root + member name)

### Leaf Instance (File Scope)

Given this file at `src/components/atoms/Button/v1.0.0/Button.tsx`:

```typescript
type AtomSource = Kind<"AtomSource", {}, { pure: true }>;

export const _ = {} satisfies Instance<AtomSource>;
```

KindScript derives:
- **Location:** `Button.tsx` itself (leaf Kind, no members — the file IS the entity)

Constraints on `AtomSource` (like `pure`) apply only to `Button.tsx`. Other files in the same directory (`Button.stories.tsx`, `Button.test.tsx`) are unaffected.

### Why Members Determine Scope

Members structurally require directories — `{ domain: {}, infra: {} }` needs `domain/` and `infra/` subdirectories to exist. So directory scope is justified by necessity. Without members, there's nothing that requires directory expansion, and the natural reading of a declaration in a file is "this file is the thing."

### Nested Members

For kinds with nested members, paths compose naturally:

```typescript
type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;
  ports: PortsModule;
}>;

type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
}>;
```

If the instance is at `src/context.ts`:
- `domain` → `src/domain/`
- `domain.entities` → `src/domain/entities/`
- `domain.ports` → `src/domain/ports/`

---

## Multi-Instance (Bounded Contexts)

Multiple instances of the same Kind can coexist in a project. Each instance has its own root, derived from its file location:

```
src/
  ordering/
    ordering.ts           # OrderingContext instance → root is src/ordering/
    domain/
    infrastructure/
  billing/
    billing.ts            # BillingContext instance → root is src/billing/
    domain/
    adapters/
```

```typescript
// src/ordering/ordering.ts
export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies Instance<OrderingContext>;

// src/billing/billing.ts
export const billing = {
  domain: {},
  adapters: {},
} satisfies Instance<BillingContext>;
```

Each instance is checked independently. Contracts on `OrderingContext` only apply to files under `src/ordering/`. Contracts on `BillingContext` only apply to files under `src/billing/`.

---

## Discovery via TypeScript Piggybacking

KindScript does not use file extensions, config files, or naming conventions to find definitions. Instead, it piggybacks on TypeScript's own type checker.

### How Discovery Works

1. The `ASTAdapter` walks each source file in the TypeScript program
2. For type aliases, it uses `checker.getSymbolAtLocation()` to check if the type reference resolves to `Kind` from the `'kindscript'` package
3. For `satisfies` expressions, it checks if the type reference resolves to `Instance` from `'kindscript'`
4. This works through aliases, re-exports, and any valid TypeScript import path

### What This Means

- **No `.k.ts` extension** — definitions live in regular `.ts` files
- **No `kindscript.json`** — no config file needed for discovery
- **No naming convention** — any file name works
- **Alias-safe** — `import type { Kind as K } from 'kindscript'` works (because the type checker resolves the original symbol)
- **Invisible** — KindScript adds zero artifacts to a project beyond the type imports

---

## MemberMap

The `MemberMap<T>` type transforms a Kind type into its instance shape — the object type used with `satisfies Instance<T>`:

```typescript
type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | Record<string, never>
      : never;
};
```

It strips the `kind` and `location` properties (which are derived automatically), keeps member names, and recursively applies to child Kinds. Each member value is either a nested `MemberMap` (for Kinds with sub-members) or an empty object `{}` (for leaf Kinds).

Member names must be valid TypeScript identifiers. They double as directory names for location derivation. This is by design — the member name `domain` implies the relative path `./domain`.

---

## Public API

KindScript exports four types from `src/types/index.ts`:

| Type | Purpose |
|------|---------|
| `Kind<N, Members?, Constraints?>` | Define an architectural pattern |
| `Instance<T>` | Declare where a Kind is instantiated (used with `satisfies`) |
| `Constraints<Members>` | Type for the constraints parameter (usually inlined) |
| `MemberMap` | Alias for the members object type |

All exports are `export type` — zero runtime footprint.
