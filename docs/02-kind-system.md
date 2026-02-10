# The Kind System

> Kind definitions, instances, location resolution, and discovery.

---

## Overview

KindScript's type system has two primitives:

1. **Kind definitions** — type-level declarations of architectural patterns (`type X = Kind<...>`)
2. **Instance declarations** — value-level declarations mapping patterns to a specific codebase (`satisfies Instance<T, Path>`)

Kinds are normative (what the architecture MUST look like). Instances are descriptive (where the code ACTUALLY lives). The compiler compares them and reports violations.

---

## Kind Definitions

A Kind is a TypeScript type alias using the `Kind<N, Members, Constraints, Config>` generic. `Kind` is a conditional type — when `Config` includes `wraps`, it produces a wrapped type (TypeKind behavior); otherwise it produces a structural type for `satisfies Instance<T, Path>`.

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

### The Type Parameters

| Parameter | Required | Purpose |
|-----------|----------|---------|
| `N` (name) | Yes | String literal discriminant — must match the type alias name |
| `Members` | No | Object type mapping member names to their Kind types |
| `Constraints` | No | `Constraints<Members>` — architectural rules to enforce |
| `_Config` | No | `KindConfig` — `{ wraps?: T; scope?: 'folder' \| 'file' }`. `wraps` makes Kind produce a type annotation shape (TypeKind behavior). `scope` declares the expected instance scope, validated by the scope plugin. |

### Why `type` Instead of `interface`

KindScript uses `type X = Kind<...>` (type alias), not `interface X extends Kind<...>`. Reasons:

- **No redundant name** — `interface` required the name twice (`interface Foo extends Kind<"Foo">`)
- **Cleaner syntax** — no empty `{}` for leaf kinds
- **Constraints as type parameters** — the 3rd type parameter on `Kind` carries constraints naturally
- **No false inheritance** — `extends` implied OOP inheritance, but kinds are pure type-level concepts

---

## Instance Declarations

An instance maps a Kind to a specific location in a codebase using `satisfies Instance<T, Path>`:

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

// Instance declaration — context file is inside the directory it governs
export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies Instance<OrderingContext, '.'>;
```

### What `satisfies` Gives Us

The `satisfies` keyword is valid TypeScript — no macros, no transforms, no runtime. It provides:

1. **Type safety** — TypeScript validates the member object structure at compile time
2. **Zero runtime** — `import type` is fully erased; no `kindscript` dependency at runtime
3. **IDE support** — autocomplete, hover docs, go-to-definition all work natively

### Explicit Location

The second type parameter on `Instance<T, Path>` specifies where the instance lives, relative to the declaration file (same resolution semantics as TypeScript imports):

```typescript
// src/context.ts — '.' resolves to src/
export const app = { domain: {}, infra: {} } satisfies Instance<App, '.'>;

// src/architecture.ts — './ordering' resolves to src/ordering/
export const ordering = { domain: {}, infra: {} } satisfies Instance<App, './ordering'>;

// src/components/atoms/Button/Button.tsx — './Button.tsx' resolves to the file itself
export const _ = {} satisfies Instance<AtomSource, './Button.tsx'>;
```

Path syntax determines granularity:
- `'./ordering'` — folder (directory tree, all `.ts` files recursively)
- `'./helpers.ts'` — file (single source file)
- `'./handlers.ts#validate'` — sub-file (specific named export)

Location is required. Omitting it is a scanner error.

---

## Location Resolution

KindScript resolves the instance root from the declared path, then derives member paths from member names.

### Root Resolution

The declared path is resolved relative to the directory of the declaring file, using the same semantics as TypeScript import paths:

- `'.'` — directory of the declaring file
- `'./src'` — `src/` subdirectory relative to the declaring file
- `'../sibling'` — a sibling directory one level up

### Composite Instance (Directory Scope)

Given this file at `src/context.ts`:

```typescript
export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies Instance<OrderingContext, '.'>;
```

KindScript resolves:
- **Root:** `src/` (declared path `'.'` resolves to the directory of `context.ts`)
- **domain:** `src/domain/` (root + member name)
- **infrastructure:** `src/infrastructure/` (root + member name)

### Leaf Instance (File Scope)

Given this file at `src/components/atoms/Button/v1.0.0/Button.tsx`:

```typescript
type AtomSource = Kind<"AtomSource", {}, { pure: true }>;

export const _ = {} satisfies Instance<AtomSource, './Button.tsx'>;
```

KindScript resolves:
- **Location:** `Button.tsx` itself (the path ends with `.tsx`, so it's a single file)

Constraints on `AtomSource` (like `pure`) apply only to `Button.tsx`. Other files in the same directory (`Button.stories.tsx`, `Button.test.tsx`) are unaffected.

### Path Granularity

| Path syntax | Example | Resolves to | Constraints apply to |
|-------------|---------|-------------|---------------------|
| No extension | `'.'`, `'./ordering'` | Directory | All `.ts`/`.tsx` files recursively |
| `.ts` / `.tsx` extension | `'./Button.tsx'` | Single file | That file only |
| Hash syntax | `'./handlers.ts#validate'` | Named export in file | That specific export |

### Scope Validation

Kinds can declare their expected instance scope using the `scope` property in `Kind`'s 4th type parameter (`_Config`):

```typescript
type KindConfig = { wraps?: unknown; scope?: 'folder' | 'file' };
```

When a Kind declares a scope, the compiler validates that instance locations match:

```typescript
// This Kind expects instances to point at folders
type PureModule = Kind<"PureModule", {}, { pure: true }, { scope: "folder" }>;

// Valid — '.' resolves to a directory
export const m = {} satisfies Instance<PureModule, '.'>;

// Violation (KS70005) — './module.ts' is a file, not a folder
export const m = {} satisfies Instance<PureModule, './module.ts'>;
```

The scope plugin generates a `Scope` contract during the bind stage and validates it during the check stage. If the instance's resolved location doesn't match the declared scope, a `KS70005: Scope mismatch` diagnostic is produced.

| Declared scope | Instance path must resolve to |
|---------------|------------------------------|
| `"folder"` | A directory (no `.ts`/`.tsx` extension) |
| `"file"` | A file (`.ts` or `.tsx` extension) |
| Not declared | No scope validation (any path is accepted) |

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
} satisfies Instance<OrderingContext, '.'>;

// src/billing/billing.ts
export const billing = {
  domain: {},
  adapters: {},
} satisfies Instance<BillingContext, '.'>;
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

`MemberMap<T>` is the internal type projection used by `Instance<T, Path>` — it transforms a Kind into the object shape you write with `satisfies`. Users typically use `Instance<T, Path>` directly and never reference `MemberMap<T>` themselves.

The `MemberMap<T>` type transforms a Kind type into its instance shape — the object type used with `satisfies Instance<T, Path>`:

```typescript
type MemberMap<T extends KindRef> = {
  [K in keyof T as K extends 'kind' | 'location' | '__kindscript_ref' | '__kindscript_brand' ? never : K]:
    T[K] extends KindRef
      ? MemberMap<T[K]> | Record<string, never>
      : never;
};
```

It strips the `kind`, `location`, and internal phantom properties (which are derived automatically), keeps member names, and recursively applies to child Kinds. Each member value is either a nested `MemberMap` (for Kinds with sub-members) or an empty object `{}` (for leaf Kinds). `KindRef` is a shared phantom marker type that both wrapped and structural Kinds satisfy.

Member names must be valid TypeScript identifiers. They double as directory names for location resolution. This is by design — the member name `domain` implies the relative path `./domain`.

---

## TypeKind — Type-Wrapped Kinds

TypeKind is ergonomic sugar for Kind with `wraps`. Where a plain Kind classifies **places** (directories and files), a wrapped Kind (TypeKind) classifies **types** (individual exported declarations via their type annotations).

At the type level, `TypeKind<N, T, C>` is literally `Kind<N, {}, C, { wraps: T }>`. Both forms are interchangeable.

### Defining a TypeKind

```typescript
import type { TypeKind } from 'kindscript';

type DeciderFn = (command: Command) => readonly Event[];
type Decider = TypeKind<"Decider", DeciderFn>;

// With constraints (3rd parameter):
type PureDecider = TypeKind<"PureDecider", DeciderFn, { pure: true }>;

// Or equivalently, using Kind directly:
type PureDecider = Kind<"PureDecider", {}, { pure: true }, { wraps: DeciderFn }>;
```

TypeKind takes up to three type parameters:
- `N` — the kind name (string literal)
- `T` — the wrapped TypeScript type
- `C` — optional constraints (same as Kind's 3rd parameter)

The implementation uses a phantom brand: `T & { readonly __kindscript_brand?: N }`. The brand is optional, so any value of type `T` satisfies `TypeKind<N, T>` — zero assignability impact.

### TypeKind Instances

The type annotation IS the instance declaration — no `satisfies`, no `register()`, no companion const:

```typescript
// These are TypeKind instances (type annotation names a TypeKind):
export const validateOrder: Decider = (cmd) => { ... };
export const applyDiscount: Decider = (cmd) => { ... };

// This is NOT an instance (DeciderFn is not a TypeKind):
export const helper: DeciderFn = (cmd) => { ... };

// This is NOT an instance (no explicit type annotation):
export const inline = (cmd: Command): Event[] => { ... };
```

Discovery is **syntactic** — the scanner checks whether the type annotation explicitly names a TypeKind, not whether the value structurally matches. The developer's choice of type name is the opt-in signal.

### Composability with Kind

TypeKind members can be used inside filesystem Kinds, enabling cross-scope constraints:

```typescript
type Decider = TypeKind<"Decider", DeciderFn>;
type Effector = TypeKind<"Effector", EffectorFn>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
  effectors: Effector;
}, {
  noDependency: [["deciders", "effectors"]];
}>;

export const order = {
  deciders: {},
  effectors: {},
} satisfies Instance<OrderModule, '.'>;
```

This means: "within the OrderModule directory, collect all Decider-typed exports into one group and all Effector-typed exports into another. No file containing a Decider may import from a file containing an Effector."

The binder resolves TypeKind members by scanning typed exports within the parent Kind's scope. Existing constraints (`noDependency`, `noCycles`, etc.) work unchanged — they operate on the `resolvedFiles` map, which the binder populates for both filesystem and TypeKind members.

### TypeKind vs Kind

| Aspect | Kind | TypeKind |
|--------|------|----------|
| Classifies | Places (directories, files) | Types (exported declarations) |
| Scope | Directory or file | Individual declaration |
| Instance mechanism | `satisfies Instance<T, Path>` | Type annotation |
| Resolution | Filesystem paths (binder) | Typed-export collection within scope (binder) |
| Members | Subdirectories | As Kind members (composability) |
| Standalone constraints | All 3 constraint types | All 3 constraint types (via 3rd parameter) |
| Underlying type | `Kind<N, Members, C, Config>` | `Kind<N, {}, C, { wraps: T }>` (sugar alias) |

---

## Public API

KindScript exports six types from `src/types/index.ts`:

| Type | Purpose |
|------|---------|
| `Kind<N, Members?, Constraints?, Config?>` | Define an architectural pattern (conditional type) |
| `TypeKind<N, T, C?>` | Sugar for `Kind<N, {}, C, { wraps: T }>` — declaration-level enforcement |
| `Instance<T, Path>` | Declare where a Kind is instantiated (used with `satisfies`) |
| `Constraints<Members>` | Type for the constraints parameter (usually inlined) |
| `KindConfig` | `{ wraps?: T; scope?: 'folder' \| 'file' }` — Kind behavior configuration |
| `KindRef` | Phantom marker type — shared by both wrapped and structural Kinds |

All exports are `export type` — zero runtime footprint.
