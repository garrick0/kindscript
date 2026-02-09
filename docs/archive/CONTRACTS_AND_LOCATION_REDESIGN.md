# Contracts and Location Redesign — Design Exploration

> Should contracts live on the Kind type? Should locate() be simplified or eliminated?

**Status:** Exploration
**Date:** 2026-02-07

**Related decisions:**
- `docs/design/KIND_DEFINITION_SYNTAX.md` — **Decided and implemented.** Kind definitions now use `type X = Kind<"X", { ... }>` (type aliases) instead of `interface X extends Kind<"X"> { ... }`. All code, fixtures, and tests have been migrated.
- `docs/design/RUNTIME_MARKERS_OPTIONS.md` — **Proposed (not yet implemented).** Replace `locate()` and `defineContracts()` function calls with `satisfies Instance<T>` and `satisfies ContractConfig<T>` expressions. This would eliminate all runtime code from the `kindscript` package — every import becomes `import type`.

Both of these are relevant context. The Kind syntax migration is complete, and the `satisfies` migration is planned. This document builds on both to explore a deeper question: should contracts be encoded directly in the Kind type itself, and should the compiler take more responsibility for deriving locations?

---

## How Things Work Today

KindScript uses a **three-declaration model**. Users write three separate things in their `architecture.ts`:

```typescript
// 1. STRUCTURE — what layers exist (type-level)
type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type ShopContext = Kind<"ShopContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

// 2. LOCATION — where they live on disk (runtime marker)
export const shop = locate<ShopContext>("src", {
  domain: {},
  application: {},
  infrastructure: {},
});

// 3. RULES — what constraints they must follow (runtime marker)
export const contracts = defineContracts<ShopContext>({
  noDependency: [
    ["domain", "application"],
    ["domain", "infrastructure"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
  mustImplement: [["application", "infrastructure"]],
});
```

The compiler pipeline:
1. **ClassifyAST** reads the `architecture.ts` AST in three phases:
   - **Phase 1:** Find Kind definitions — type alias declarations referencing `Kind<N>` or `Kind<N, Members>`. Uses `isTypeAliasDeclaration()` → `getTypeAliasReferenceName()` → `getTypeAliasTypeArgLiterals()` → `getTypeAliasMemberProperties()`.
   - **Phase 2:** Find Instance declarations — `locate<T>(root, members)` call expressions. Derives member paths as `root + "/" + memberName` recursively.
   - **Phase 3:** Find Contract descriptors — `defineContracts<T>(config)` call expressions. Linked to the Kind via the type parameter `<T>`.
2. **CheckContracts** validates each contract against the real codebase using the TypeScript compiler.

**Note:** The RUNTIME_MARKERS_OPTIONS proposal would change Phases 2 and 3 from call expression matching to `SatisfiesExpression` matching (`satisfies Instance<T>` and `satisfies ContractConfig<T>`). The proposals in this document affect Phase 1 (reading constraints from the Kind type's third parameter) and Phase 2 (simplifying instance declarations).

---

## Problem Statement

### 1. Contracts feel disconnected from the types they describe

Contracts reference member names as strings (`"domain"`, `"infrastructure"`), but these names are already defined structurally in the Kind type. The connection between a Kind's structure and its constraints is indirect — they're linked only by the type parameter on `defineContracts<ShopContext>()`.

If I define a DomainLayer, the fact that it must be pure is intrinsic to what a "domain layer" *means* in clean architecture. Yet purity lives in a separate `defineContracts()` call, far from the type definition. Similarly, `noDependency(domain, infrastructure)` is a fundamental rule of the clean architecture pattern, but it's declared separately from the pattern's structure.

### 2. locate() repeats what the Kind type already knows

The Kind type already defines what members exist. Yet locate() makes you re-specify every member:

```typescript
// Kind already knows these members:
type ShopContext = Kind<"ShopContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

// ...but locate() makes you say them again:
const shop = locate<ShopContext>("src", {
  domain: {},        // ← redundant
  application: {},   // ← redundant
  infrastructure: {}, // ← redundant
});
```

In practice, the vast majority of member entries in locate() are just `{}` — meaning "derive the path from the member name." The member map provides no information beyond what the Kind type already declares. Only the rare `{ path: "value-objects" }` override adds new information.

### 3. locate() conflates two concerns

`locate()` currently does two things:
- **Binds a Kind to a root path** — "this instance of CleanArchitecture lives at `src`"
- **Specifies the member structure** — "these are the members and their path overrides"

The root path is necessary (the compiler must know where to look). The member structure is redundant (the Kind type already defines it). Path overrides are the only novel information in the member map, and they're rare.

### 4. The user can't tell what a Kind *means* by reading just its type

A `DomainLayer` kind is pure. An `ApplicationLayer` provides ports that infrastructure must implement. These are fundamental properties of these architectural abstractions — but they're invisible at the type level. You must find the separate `defineContracts()` call to understand the rules.

---

## Part 1: Contracts on the Kind Type

### What kinds of constraints exist?

The five current contract types fall into two categories:

| Category | Contracts | What they constrain |
|---|---|---|
| **Intrinsic** (property of a single kind) | `purity` | The kind itself — "this layer must be pure" |
| **Relational** (property of the relationship between kinds) | `noDependency`, `mustImplement`, `colocated`, `noCycles` | How members relate to each other |

This distinction is key. Intrinsic constraints belong on the leaf kind they describe. Relational constraints belong on the composite kind that contains the related members.

### Option A: Keep contracts separate (status quo)

```typescript
type DomainLayer = Kind<"DomainLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;

// Constraints live here, completely separate
const contracts = defineContracts<CleanArch>({
  purity: ["domain"],
  noDependency: [["domain", "infrastructure"]],
});
```

**Pros:**
- Already implemented and tested (~248 tests passing)
- Maximum flexibility — same Kind can have different contracts in different projects
- Clean separation of concerns: structure vs. rules vs. location

**Cons:**
- Contracts reference members as untyped strings (`"domain"`) — no compile-time validation that the string matches a real member name
- A reader must find the defineContracts() call to understand what rules apply
- Redundant — the type parameter `<CleanArch>` on defineContracts is the only link between structure and rules
- Encourages copy-paste of common constraint patterns (every clean architecture has the same noDependency rules, but each project re-declares them)
- The stdlib packages (`packages/clean-architecture/`, `packages/hexagonal/`, `packages/onion/`) that previously shipped reusable contract configs have been removed — users must declare all contracts manually

---

### Option B: Third type parameter for relational constraints

Add a `Constraints` parameter to `Kind<N, Members, Constraints>`. Relational constraints go here because they describe relationships between the members defined in the second parameter.

```typescript
type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "application"],
    ["domain", "infrastructure"],
    ["application", "infrastructure"],
  ];
  mustImplement: [["application", "infrastructure"]];
  noCycles: ["domain", "application", "infrastructure"];
}>;
```

Intrinsic constraints (purity) would go on the leaf kind — see Option C below for how.

**Library type:**

```typescript
type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = Record<string, never>,
  Constraints extends Constraints<Members> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;

// Type-safe constraint config — member names are validated at the type level
type Constraints<Members> = {
  noDependency?: [MemberName<Members>, MemberName<Members>][];
  mustImplement?: [MemberName<Members>, MemberName<Members>][];
  noCycles?: MemberName<Members>[];
  colocated?: [MemberName<Members>, MemberName<Members>][];
};

// Extract member names as string literal union
type MemberName<Members> = keyof Members & string;
```

**What the classifier reads:** The third type argument of `Kind<N, Members, Constraints>` is a type literal. The classifier extracts its properties (e.g., `noDependency`, `mustImplement`) and their values (array literal type annotations with string literal tuples).

**Pros:**
- Constraints are **co-located with structure** — you see the full architectural pattern in one type
- **Type-safe member references** — `["domain", "infrastructure"]` is validated against `keyof Members`. If you rename a member, TypeScript catches the mismatch
- Eliminates `defineContracts<T>()` for relational constraints
- Reusable — the same `CleanArch` type carries its constraints to every project that uses it
- The classifier already reads type arguments from `Kind<...>` — a third is a natural extension

**Cons:**
- The `Constraints` parameter adds visual weight to composite Kind definitions
- The constraint values are array types, not runtime arrays — the AST shape is different from Option A's runtime object literals (LiteralTypeNode with TupleTypeNode vs. ArrayLiteralExpression)
- Three type parameters is getting complex: `Kind<"Name", { members }, { constraints }>`
- The Constraints parameter is "dead" at the type level — TypeScript flattens the type and ignores the third parameter structurally. Only the classifier reads it. (But this is already true for Members — TypeScript just sees the intersection.)

**Classifier changes:**
- `getTypeAliasTypeArgLiterals()` already reads `typeArguments[0]` (the kind name). Extend it or add a new port method to also read `typeArguments[2]` (the constraints type literal).
- Parse the constraints type literal to extract property signatures and their tuple/array type values. This is structurally similar to how `getTypeAliasMemberProperties()` already reads `typeArguments[1]` (the members type literal) — the same AST traversal pattern applies.
- Constraints from the type parameter supplement (or replace) Phase 3's `defineContracts()` parsing. The classifier would merge constraints from both sources during the transition period.

---

### Option C: Intrinsic constraints via wrapper types

For constraints that belong to a single kind (like purity), use wrapper types:

```typescript
type DomainLayer = Pure<Kind<"DomainLayer">>;
```

Or as a branded intersection:

```typescript
type DomainLayer = Kind<"DomainLayer"> & Pure;
```

Or as a constraint in the third parameter of the leaf kind:

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
```

**Analysis of each form:**

**`Pure<Kind<"DomainLayer">>`** — The classifier sees a type alias where the referenced type is `Pure<...>`, not `Kind<...>`. This breaks the `referenceName === 'Kind'` signal. The classifier would need to recognize `Pure` as a Kind wrapper and unwrap it. Each new intrinsic constraint type needs a new wrapper type and new classifier logic. Fragile.

**`Kind<"DomainLayer"> & Pure`** — The classifier sees an intersection type, not a type reference. The signal detection changes from "is this a type reference to Kind?" to "does this intersection contain a reference to Kind?" This is the Option B approach from the KIND_DEFINITION_SYNTAX exploration and was rejected for complexity.

**`Kind<"DomainLayer", {}, { pure: true }>`** — Clean. The classifier signal is the same (`Kind<...>`). The third parameter carries intrinsic constraints. For leaf kinds, `Members` is `{}` and `Constraints` carries `{ pure: true }`. For composite kinds, both Members and Constraints are populated.

**Recommendation: Third parameter for both intrinsic and relational constraints.** The constraint config type can handle both:

```typescript
type Constraints<Members = Record<string, never>> = {
  // Intrinsic constraints (for leaf kinds, or applied to the composite itself)
  pure?: true;

  // Relational constraints (only meaningful on composite kinds with members)
  noDependency?: [MemberName<Members>, MemberName<Members>][];
  mustImplement?: [MemberName<Members>, MemberName<Members>][];
  noCycles?: MemberName<Members>[];
  colocated?: [MemberName<Members>, MemberName<Members>][];
};
```

This gives us a uniform third parameter for all constraint types:

```typescript
// Leaf with intrinsic constraint
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

// Leaf without constraints
type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Composite with relational constraints
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;
```

---

### Option D: Constraints propagate from leaf kinds to composite

What if the composite kind doesn't need to re-declare constraints that are already on its leaf kinds? If `DomainLayer` is declared as pure, then any composite containing a `domain: DomainLayer` member automatically inherits the purity constraint.

```typescript
// Pure is declared once, on the leaf
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

// CleanArch doesn't need to say "domain is pure" — it already knows
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;  // ← carries { pure: true } from its definition
  infrastructure: InfrastructureLayer;
}, {
  // Only relational constraints here — purity is inherited from DomainLayer
  noDependency: [["domain", "infrastructure"]];
}>;
```

**How the classifier would implement this:** When processing a composite Kind, for each member, look up the member's Kind definition and check its constraint parameter. If a member kind has `{ pure: true }`, automatically generate a purity contract for that member in the composite's contract list.

**Pros:**
- DRY — declare once, enforce everywhere
- If DomainLayer is pure in one composite, it's pure in all composites (which is the right semantic — purity is intrinsic to the concept of a domain layer)
- Composites only need to declare relational constraints

**Cons:**
- Implicit behavior — the composite has constraints that aren't visible in its definition
- The classifier must recursively walk member Kind definitions to collect inherited constraints
- What if you want a DomainLayer that ISN'T pure in a specific context? You'd need a different Kind type.

**Recommendation:** Support propagation as the default, but allow composites to explicitly override. The common case (DomainLayer is always pure) is handled automatically. The rare case (override in a specific context) is handled by the composite's explicit constraint parameter.

---

### Option E: Constraints as member modifiers (branded members)

Instead of a third parameter, express constraints by wrapping member types:

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: NoDependsOn<"infrastructure", DomainLayer>;
  application: NoDependsOn<"infrastructure", ApplicationLayer>;
  infrastructure: Implements<"application", InfrastructureLayer>;
}>;
```

**Pros:**
- Each member carries its constraints inline
- Reads naturally: "domain has no dependency on infrastructure"

**Cons:**
- Awkward for multi-target constraints (`NoDependsOn<"application" | "infrastructure", DomainLayer>`)
- noCycles doesn't fit this model at all (it's a property of N members collectively)
- Directionality is confusing — does `NoDependsOn<"infrastructure", DomainLayer>` mean "domain can't depend on infra" or "infra can't depend on domain"?
- Each member needs multiple wrappers for multiple constraints — verbose and hard to read
- The AST shape is complex — type-level conditional types and generic wrappers are hard to parse

**Verdict:** Rejected. Too awkward for relational constraints. The third-parameter approach (Option B) handles these much more naturally.

---

### Comparison of Options

| | Intrinsic constraints | Relational constraints | Type safety | Classifier complexity | Readability |
|---|---|---|---|---|---|
| **A (separate defineContracts)** | Strings in config | Strings in config | None (string refs) | Current | Split across 3 declarations |
| **B (3rd type param, relational)** | N/A (still separate) | Type literals | Full (keyof Members) | Medium | Good for composites |
| **C (3rd type param, intrinsic)** | Type literal on leaf | N/A | Full | Medium | Good for leaves |
| **B+C (3rd param, both)** | Type literal on leaf | Type literal on composite | Full | Medium | Best — everything in one place |
| **D (propagation)** | Inherited from members | Type literal on composite | Full | Higher | Good — DRY |
| **E (member modifiers)** | Per-member wrappers | Per-member wrappers | Partial | High | Poor for multi-constraint |

---

## Part 2: Location Redesign

> **Context:** The RUNTIME_MARKERS_OPTIONS proposal (see `docs/design/RUNTIME_MARKERS_OPTIONS.md`) already plans to replace `locate()` function calls with `satisfies Instance<T>` expressions. This section explores a deeper question: regardless of the surface syntax (`locate()` vs `satisfies`), can we simplify *what the user must specify* about locations?

### What locate() does today

```typescript
export const shop = locate<ShopContext>("src", {
  domain: {},           // → derives path: src/domain
  application: {},      // → derives path: src/application
  infrastructure: {},   // → derives path: src/infrastructure
});
```

Or, under the RUNTIME_MARKERS_OPTIONS proposal:

```typescript
export const shop = {
  root: "src",
  domain: {},           // → derives path: src/domain
  application: {},      // → derives path: src/application
  infrastructure: {},   // → derives path: src/infrastructure
} satisfies Instance<ShopContext>;
```

Either way, the classifier:
1. Extracts the root path (`"src"`)
2. For each member in the Kind definition, derives the path as `root + "/" + memberName`
3. If a member has `{ path: "value-objects" }`, uses the override instead of the member name
4. Creates ArchSymbol objects with the derived paths
5. Later, the existence check verifies these directories actually exist on disk

### The anti-pattern

The user's observation: **locate() tells the compiler where things ARE, but the compiler should be the one figuring that out.**

In the current model:
- The user explicitly maps every member to a location (even if it's just `{}`)
- The compiler trusts these locations and validates constraints against them
- If a location doesn't exist, the compiler reports it — but only after the user specified it

This is backwards. The architectural pattern (the Kind type) should define **what the filesystem structure should look like**. The compiler should then check whether the actual filesystem matches. The user shouldn't need to hand-hold the compiler through every directory mapping.

### Option A: Keep locate() as-is (status quo)

```typescript
const shop = locate<ShopContext>("src", {
  domain: {},
  application: {},
  infrastructure: {},
});
```

**Pros:** Already works, supports path overrides, explicit.
**Cons:** Verbose, redundant, the anti-pattern described above.

---

### Option B: Root-only locate()

Since the member map is almost always just `{}` for every member, simplify to just the root:

```typescript
const shop = locate<ShopContext>("src");
```

The compiler derives all member paths from the Kind definition's member names:
- `domain` → `src/domain`
- `application` → `src/application`
- `infrastructure` → `src/infrastructure`

**What about path overrides?** Move them to the Kind type:

```typescript
type ValueObjects = Kind<"ValueObjects", {}, { path: "value-objects" }>;

type ShopContext = Kind<"ShopContext", {
  domain: ValueObjects;  // compiler reads ValueObjects' path constraint
  application: ApplicationLayer;
}>;

const shop = locate<ShopContext>("src");
// → domain maps to src/value-objects (from ValueObjects' path constraint)
// → application maps to src/application (default: member name)
```

**Pros:**
- Dramatically simpler — one argument instead of a full member map
- No more redundant structure re-declaration
- Path overrides are on the type (where they're a property of the kind itself, not of a specific instance)

**Cons:**
- Path overrides are now part of the type definition, so all instances of that Kind use the same path. If two instances need different paths for the same member, you'd need different Kind types.
- The library's `locate<T>()` type signature changes — no more `MemberMap<T>`

**Library type change (function form):**

```typescript
// Before:
function locate<T extends Kind>(root: string, members: MemberMap<T>): MemberMap<T>;

// After:
function locate<T extends Kind>(root: string): void;
```

**Library type change (satisfies form, per RUNTIME_MARKERS_OPTIONS):**

```typescript
// Before:
type Instance<T extends Kind> = { root: string } & MemberMap<T>;

// After:
type Instance<T extends Kind> = { root: string } & Partial<PathOverrides<T>>;

type PathOverrides<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]?:
    T[K] extends Kind ? { path: string } | PathOverrides<T[K]> : never;
};
```

The key insight: regardless of whether we use `locate()` or `satisfies`, the member map should be optional. Members default to `{}` (derived path from member name). Only explicit path overrides need to be specified.

---

### Option C: Convention-based auto-discovery (no locate() at all)

The compiler scans the project root and discovers instances automatically based on directory structure matching Kind member names.

```typescript
// architecture.ts — just type definitions, no locate() call
type DomainLayer = Kind<"DomainLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;

// That's it. No locate(). The compiler finds directories
// matching the pattern and creates instances.
```

The compiler would:
1. Read Kind definitions from architecture.ts
2. Scan the project's filesystem for directories matching the member names
3. For each match, create an instance and validate constraints

**Pros:**
- Zero boilerplate — just define the type, the compiler does the rest
- Truly declarative — the type says what should exist, the compiler checks

**Cons:**
- **Ambiguity.** What if `src/domain` exists AND `lib/domain` exists? Which is the instance? Are both? The compiler can't know which directories the user intends as architectural members without an explicit root.
- **False positives.** A directory named `domain` might not be an architectural domain layer. Without explicit binding, the compiler would flag random directories.
- **Multi-instance confusion.** If you have `src/ordering/domain` and `src/billing/domain`, auto-discovery can't distinguish between two instances of the same Kind at different roots.
- **No root path.** The compiler needs to know where to start. Without a locate() call or config file, it would have to scan the entire project — slow and error-prone.
- **Implicit magic.** Users can't see what the compiler will discover without running it. This makes debugging hard.

**Verdict:** Too much magic. The compiler needs at least a root path to anchor its search.

---

### Option D: Location constraints on the Kind type

Instead of specifying *where* things are, specify *where things should be relative to their parent*:

```typescript
type DomainLayer = Kind<"DomainLayer", {}, {
  pure: true,
  relativePath: "domain",  // default: name of the member referencing this kind
}>;

type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;       // expected at: <root>/domain
  infrastructure: InfraLayer; // expected at: <root>/infrastructure
}>;

// locate() just provides the root
const shop = locate<CleanArch>("src");
```

**How does `relativePath` work?** When a composite Kind contains `domain: DomainLayer`, the compiler derives the member's path as `root + "/" + relativePath`. If `relativePath` isn't specified, it defaults to the member property name (`"domain"`).

This moves path information from the instance (locate) to the type (Kind), which makes sense — the path convention is a property of the architectural pattern, not of a specific deployment.

But wait — `relativePath` on the *leaf kind* doesn't make sense. The leaf kind (`DomainLayer`) doesn't know it will be referenced as `domain: DomainLayer` in a composite. The member property name (`domain`) is what determines the default path. The relativePath would need to be on the *member reference* in the composite, not on the leaf kind.

**Revised approach — path on the composite member:**

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;                        // path: "domain" (default)
  valueObjects: DomainLayer & Path<"vo">;     // path: "vo" (override)
  infrastructure: InfrastructureLayer;
}>;
```

This uses intersection types to attach path overrides to specific member positions. The classifier would read the intersection, find the `Path<"vo">` component, and use `"vo"` instead of the member name.

**Pros:**
- Path overrides are part of the type system, not runtime configuration
- The Kind definition fully describes the expected filesystem structure
- locate() becomes trivially simple

**Cons:**
- Intersection types add complexity to the classifier (must parse intersections to find Path<> references)
- It's unusual TypeScript — `DomainLayer & Path<"vo">` isn't standard practice
- Only needed for the rare path override case

---

### Option E: Make the member map optional (recommended)

The simplest practical improvement: make the member map optional. If omitted, all paths are derived from member names. This applies regardless of whether we use `locate()` or `satisfies`.

```typescript
// Function form — simple case:
const shop = locate<CleanArch>("src");

// Function form — with path override:
const shop = locate<CleanArch>("src", {
  domain: { path: "value-objects" },
});

// Satisfies form (per RUNTIME_MARKERS_OPTIONS) — simple case:
const shop = { root: "src" } satisfies Instance<CleanArch>;

// Satisfies form — with path override:
const shop = {
  root: "src",
  domain: { path: "value-objects" },
} satisfies Instance<CleanArch>;
```

The member map becomes optional — if a member isn't specified, its path defaults to its name.

**Library type (function form):**

```typescript
function locate<T extends Kind>(
  root: string,
  overrides?: Partial<MemberMap<T>>,
): void;
```

**Library type (satisfies form):**

```typescript
type Instance<T extends Kind> = { root: string } & Partial<MemberMap<T>>;
```

**Classifier change:** If the second argument is missing (function form) or a member isn't present in the object (satisfies form), use the member name from the Kind definition as the path segment. This is already how `{}` entries work today — the classifier derives paths from the Kind definition tree, not from the member map. The change is to make the member map itself optional, not to change the derivation logic.

**Pros:**
- Compatible with both the current `locate()` syntax and the proposed `satisfies` syntax
- Simple evolution — just make the member map optional
- Path overrides still available for rare cases
- No new type-level concepts (no `Path<>`, no intersection tricks)

**Cons:**
- Doesn't move path overrides to the type level
- The user still specifies a root path (but this is inherently necessary — see Option C's analysis)

---

### Comparison of Location Options

| | User writes | Root required | Path overrides | Compiler complexity |
|---|---|---|---|---|
| **A (current)** | `locate<T>("src", { domain: {}, ... })` | Yes | In member map | Current |
| **A' (satisfies, per RUNTIME_MARKERS_OPTIONS)** | `{ root: "src", domain: {}, ... } satisfies Instance<T>` | Yes | In object | Current |
| **B (root-only)** | `locate<T>("src")` or `{ root: "src" } satisfies ...` | Yes | On Kind type | Medium |
| **C (auto-discover)** | Nothing | No | N/A | High |
| **D (type-level paths)** | `locate<T>("src")` or `{ root: "src" } satisfies ...` | Yes | Intersection types | High |
| **E (optional members)** | Root only, or root + overrides | Yes | In optional member map | Low |

Note: Options B-E are orthogonal to the function-vs-satisfies syntax choice. The `satisfies` migration (RUNTIME_MARKERS_OPTIONS) changes the surface syntax; these options change what information must be specified.

---

## Part 3: Combined Vision

If we adopt **Option B+C+D for contracts** (third type parameter with propagation), **Option E for location** (optional member map), and **Option A from RUNTIME_MARKERS_OPTIONS** (`satisfies` instead of function calls), the end state looks like this:

### Leaf Kinds with Intrinsic Constraints

```typescript
// "DomainLayer is a pure architectural layer"
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

// "ApplicationLayer has no special intrinsic constraints"
type ApplicationLayer = Kind<"ApplicationLayer">;

// "InfrastructureLayer has no special intrinsic constraints"
type InfrastructureLayer = Kind<"InfrastructureLayer">;
```

Reading `DomainLayer`'s type tells you everything about what it means — it's a pure layer. No need to search for a separate contract declaration.

### Composite Kinds with Relational Constraints

```typescript
type CleanArchitecture = Kind<"CleanArchitecture", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "application"],
    ["domain", "infrastructure"],
    ["application", "infrastructure"],
  ];
  mustImplement: [["application", "infrastructure"]];
  noCycles: ["domain", "application", "infrastructure"];
}>;
```

Reading `CleanArchitecture`'s type tells you:
- What layers it contains (Members)
- What dependency rules apply (noDependency)
- What implementation requirements exist (mustImplement)
- What cycle rules apply (noCycles)
- That `domain` is pure (inherited from DomainLayer)

**One type, one source of truth.**

### Instances — Just a Root

With the `satisfies` syntax from RUNTIME_MARKERS_OPTIONS:

```typescript
// Common case: all paths derived from member names
export const shop = { root: "src" } satisfies Instance<CleanArchitecture>;
// → src/domain, src/application, src/infrastructure

// Multi-instance: different roots, same pattern
export const ordering = { root: "src/ordering" } satisfies Instance<CleanArchitecture>;
export const billing = { root: "src/billing" } satisfies Instance<CleanArchitecture>;

// Rare: with a path override
export const legacy = {
  root: "src",
  domain: { path: "core" },  // src/core instead of src/domain
} satisfies Instance<CleanArchitecture>;
```

Or with the current `locate()` syntax (if RUNTIME_MARKERS_OPTIONS is not adopted):

```typescript
export const shop = locate<CleanArchitecture>("src");
export const ordering = locate<CleanArchitecture>("src/ordering");
export const billing = locate<CleanArchitecture>("src/billing");
```

### What contract declarations become

**Eliminated for the common case.** If all constraints are on the Kind types, there's no need for a separate contract declaration — whether via `defineContracts()` or `satisfies ContractConfig<T>`.

**Retained as an escape hatch** for instance-specific overrides:

```typescript
// The Kind type carries standard clean architecture constraints
type CleanArchitecture = Kind<"CleanArchitecture", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

// This specific instance adds an extra constraint not on the type
export const shop = { root: "src" } satisfies Instance<CleanArchitecture>;

// Instance-specific constraint (satisfies form)
export const extraContracts = {
  colocated: [["domain", "infrastructure"]],
} as const satisfies ContractConfig<CleanArchitecture>;

// Or (current function form):
export const extraContracts = defineContracts<CleanArchitecture>({
  colocated: [["domain", "infrastructure"]],
});
```

The compiler merges constraints from two sources:
1. The Kind type's third parameter (and inherited intrinsic constraints from members)
2. Any additional contract declarations for the same Kind (via `defineContracts()` or `satisfies ContractConfig<T>`)

This is additive — contract declarations can only ADD constraints, never remove ones defined on the type. Type-level constraints are always enforced.

---

## Part 4: The Compiler's Responsibility

### Today's model: "The user tells the compiler what to check"

1. User defines structure (Kind types)
2. User specifies locations (locate)
3. User declares constraints (defineContracts)
4. Compiler validates constraints at the specified locations

The compiler is reactive — it only checks what it's told to check.

### Proposed model: "The type is the specification, the compiler enforces it"

1. User defines the architectural pattern as a Kind type, including all constraints
2. User binds instances to root paths
3. Compiler derives locations from the type definition
4. Compiler extracts constraints from the type definition (and any defineContracts overrides)
5. Compiler validates everything

The compiler becomes more active — it reads the full specification from the type and enforces it. The user's job is to describe what the architecture *should* look like. The compiler's job is to verify that it *does*.

### What changes in the pipeline

**ClassifyAST Phase 1** — Enhanced. Currently, `classifyKindDefinition()` calls `getTypeAliasReferenceName()` (signal), `getTypeAliasTypeArgLiterals()` (kind name from first type arg), and `getTypeAliasMemberProperties()` (members from second type arg). The enhancement adds a fourth step: extract the constraint configuration from `typeArguments[2]` (the third type arg). This requires a new AST port method — e.g., `getTypeAliasConstraintProperties(node)` — that reads property signatures from the third type argument's type literal. The pattern is identical to how `getTypeAliasMemberProperties()` already reads the second type argument.

**ClassifyAST Phase 2** — Simplified. Instance declarations (whether via `locate()` or `satisfies Instance<T>`) only need the root string. The member map becomes optional. Member paths are derived from the Kind definition's member names (this is already how `{}` entries work today — the derivation logic in `deriveMembers()` uses the Kind definition tree, not the member map's structure).

**ClassifyAST Phase 3** — Reduced scope. Contract declarations (`defineContracts()` or `satisfies ContractConfig<T>`) become optional. The primary source of contracts is now the Kind type itself. The classifier merges type-level and declaration-level contracts.

**New: Constraint propagation.** After Phase 1, walk the Kind definition tree and collect intrinsic constraints from leaf kinds. For each member in a composite Kind, look up the member's Kind definition in `kindDefs` and check if it has constraints in its third parameter. Generate Contract objects for any intrinsic constraints found. These are "inherited contracts" — the composite doesn't declare them, but they apply because its members carry them.

**CheckContracts** — No changes. It already takes `Contract[]` and validates them. Where the contracts come from (type parameter vs. defineContracts call) is irrelevant to validation.

---

## Part 5: Constraint Inheritance Deep Dive

One of the most interesting aspects of putting constraints on Kind types is inheritance. When a composite Kind contains members that carry their own constraints, what happens?

### Simple case: purity propagates

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;
```

The classifier processes CleanArch and sees that its `domain` member's type is `DomainLayer`, which has `{ pure: true }`. It automatically generates a `purity("domain")` contract for the CleanArch instance. The user didn't need to declare this — it's inherited from the member's type.

### Nested case: constraints at multiple levels

```typescript
type EntitiesModule = Kind<"EntitiesModule", {}, { pure: true }>;
type PortsModule = Kind<"PortsModule", {}, { pure: true }>;

type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;
  ports: PortsModule;
}, {
  pure: true,  // The whole domain layer is pure
}>;

type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;
```

Does the purity constraint on `DomainLayer` make the purity constraints on `EntitiesModule` and `PortsModule` redundant? Yes — if the parent is pure, all its children must be pure too. But the explicit constraints on the children serve as documentation and allow the same children to be used in contexts where the parent isn't pure.

**Rule: Constraints don't conflict, they accumulate.** If both a parent and child declare purity, it's just one purity check on the child (deduplicated). If only the parent declares purity, the compiler checks all files under the parent's path (which includes all children). If only the child declares purity, only the child's path is checked.

### Relational constraints don't propagate

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;
```

The `noDependency` constraint is on the composite `CleanArch`, not on its members. If `CleanArch` is used as a member of a larger Kind, the noDependency constraint applies within its own scope (between its own members), not at the parent level. Relational constraints don't "propagate up" because they reference specific member names that only exist within the composite.

---

## Part 6: Type-Safe Member References

One significant advantage of constraints on the Kind type: **member names can be type-checked.**

### Today (string-based, no safety)

```typescript
defineContracts<CleanArch>({
  noDependency: [["domian", "infrastructure"]],  // ← typo: "domian"
  //               ^^^^^^ no error until runtime!
});
```

The typo `"domian"` is not caught until the classifier tries to resolve it against the instance's member map and produces a classification error. If you don't run `ksc check`, you never know.

### With type-level constraints (full safety)

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domian", "infrastructure"]];
  //               ^^^^^^ TypeScript error: "domian" is not assignable to "domain" | "infrastructure"
}>;
```

Because `Constraints<Members>` constrains member name strings to `keyof Members & string`, TypeScript catches the typo at compile time — before even running the KindScript checker.

**This is a major improvement.** It means:
- Renaming a member in the Members parameter immediately surfaces all stale references in the Constraints parameter
- IDE autocompletion works for member names in constraints
- Invalid member names are caught by TypeScript itself, not just by the KindScript classifier

### Implementation

```typescript
type Constraints<Members = Record<string, never>> = {
  pure?: true;
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  noCycles?: ReadonlyArray<keyof Members & string>;
  colocated?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
};
```

Note: the constraint values use `ReadonlyArray` and `readonly` tuples because they're type-level annotations. The actual values exist only in the type space — there are no runtime arrays.

---

## Recommendations

### 1. Add a third type parameter to Kind for constraints

```typescript
type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = Record<string, never>,
  Constraints extends Constraints<Members> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;
```

This is the highest-impact change. It:
- Co-locates constraints with structure (one type = complete specification)
- Adds type-safe member references (catch typos at compile time)
- Enables constraint inheritance (leaf constraints propagate to composites)
- Makes Kind types self-documenting (read one type to understand the full pattern)

### 2. Make the instance member map optional

Whether we use `locate()` or `satisfies Instance<T>` (per RUNTIME_MARKERS_OPTIONS), the member map should be optional. The common case — all paths derived from member names — should require only a root path.

```typescript
// Function form:
function locate<T extends Kind>(root: string, overrides?: Partial<MemberMap<T>>): void;

// Satisfies form:
type Instance<T extends Kind> = { root: string } & Partial<MemberMap<T>>;
```

This is a low-risk, high-reward simplification. Path overrides remain available for the rare case that needs them.

### 3. Keep contract declarations as an optional additive escape hatch

Don't remove contract declarations entirely — there are legitimate cases for instance-specific constraints that don't belong on the type (e.g., a colocated constraint that only applies in one project's deployment). But make them optional. If all constraints are on the Kind type, no separate contract declaration is needed.

This is orthogonal to the `satisfies` vs `defineContracts()` syntax choice — either way, the declaration is additive and optional.

### 4. Implement constraint propagation in the classifier

When the classifier processes a composite Kind, it should walk each member's Kind definition (via `kindDefs.get(memberKindTypeName)`) and check for constraints in the third type parameter. Intrinsic constraints (like `pure: true`) become additional contracts on the composite's instance, as if the user had declared them explicitly.

### 5. Phase the implementation

This proposal builds on two in-flight changes:
- **Already done:** Kind syntax migration to type aliases (KIND_DEFINITION_SYNTAX.md)
- **Proposed:** `satisfies` migration to eliminate runtime functions (RUNTIME_MARKERS_OPTIONS.md)

The constraints-on-types work can be phased as follows:

**Phase 1:** Add the third type parameter to Kind. Add `getTypeAliasConstraintProperties()` to the AST port and adapter. Update `classifyKindDefinition()` to read constraints from the third type arg and generate Contract objects alongside the Phase 3 contracts. Keep contract declarations (whether `defineContracts()` or `satisfies ContractConfig<T>`) working as-is. Both sources coexist.

**Phase 2:** Make the instance member map optional. Update `classifyLocateInstance()` (or the equivalent `SatisfiesExpression` handler) to handle a missing member map by deriving all paths from the Kind definition tree.

**Phase 3:** Add constraint propagation (intrinsic constraints from leaf kinds).

**Phase 4:** Update docs, examples, and fixtures to use the new syntax. De-emphasize separate contract declarations in docs.

**Note:** Phases 1-2 of this proposal are independent of the `satisfies` migration. They can be implemented on the current `locate()`/`defineContracts()` syntax or on the proposed `satisfies` syntax — the classifier logic is the same either way.

### What the end state looks like

With all three proposals combined (constraints on types + `satisfies` syntax + optional member map):

```typescript
import type { Kind, Instance } from 'kindscript';

// Leaf kinds with intrinsic constraints
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Composite kind — full architectural specification in one type
type CleanArchitecture = Kind<"CleanArchitecture", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "application"],
    ["domain", "infrastructure"],
    ["application", "infrastructure"],
  ];
  mustImplement: [["application", "infrastructure"]];
  noCycles: ["domain", "application", "infrastructure"];
}>;

// Instance — just a root path
export const shop = { root: "src" } satisfies Instance<CleanArchitecture>;
```

No contract declaration. No member map. Every import is `import type`. The Kind type IS the specification. The compiler enforces it.

---

## Open Questions

1. **Should the constraints parameter use semicolons (type-level) or commas (value-level)?** In the examples above, the constraints are written with semicolons because they're inside a type literal. TypeScript's parser produces `TypeLiteralNode` with `PropertySignature` members whose types are `TupleTypeNode` or `ArrayTypeNode`. The classifier must traverse this AST shape to extract constraint values — structurally similar to how `getTypeAliasMemberProperties()` already reads the second type argument, but with array/tuple type values instead of type references.

2. **Can constraints be defined on intermediate composite kinds?** If `DomainLayer` has sub-members (`entities`, `ports`), can it have relational constraints between them (`noDependency: [["entities", "ports"]]`) in addition to intrinsic constraints (`pure: true`)? Yes — the third parameter handles both. But this means the classifier must recursively process constraints at every level of the Kind tree, not just the top level.

3. **Should there be a `strict` mode that requires ALL constraints to be on the Kind type?** In strict mode, separate contract declarations would be disallowed — all architectural rules must be encoded in the type. This would be a project-level setting in `kindscript.json`.

4. **How do we handle backwards compatibility?** The Kind syntax migration (type aliases) was a breaking change, and the `satisfies` migration (if adopted) will be another. Adding a third type parameter to Kind is backwards-compatible — existing `Kind<"X">` and `Kind<"X", Members>` definitions continue to work because the third parameter defaults to `Record<string, never>`. Contract declarations (`defineContracts()` or `satisfies ContractConfig<T>`) also continue to work alongside type-level constraints. The classifier merges both sources.

5. **What about custom/plugin constraints?** If users can define their own contract types in the future, they'd need a way to extend the `Constraints` type. This might require a more extensible design than a fixed set of known properties.

6. **What happens when the instance has no member map and a member Kind has `{ path: "value-objects" }` in its constraints?** The classifier would need to check the member Kind's constraints for a `path` property and use it as the derived path segment. This adds a new classifier responsibility: reading path constraints from Kind types, not just from the instance declaration.

7. **How does this interact with the `satisfies` migration?** The proposals are independent but complementary. Type-level constraints (this doc) change Phase 1 of the classifier. The `satisfies` migration (RUNTIME_MARKERS_OPTIONS) changes Phases 2 and 3. They can be implemented in any order, or together. The combined result is the cleanest: constraints on types, instances via `satisfies`, no runtime functions.

8. **What about the `Constraints<T>` phantom type parameter?** RUNTIME_MARKERS_OPTIONS proposes adding a phantom `_T` parameter to `ContractConfig` for classifier linkage. If constraints move to the Kind type, the phantom parameter becomes less important — it's only needed for the escape-hatch case of instance-specific additive constraints.

---

## Summary

### Changes proposed in this document

| Change | Impact | Complexity | Phase | Depends on |
|---|---|---|---|---|
| Third type parameter for constraints | High — self-documenting types, type-safe member refs | Medium | 1 | Nothing (can start now) |
| Optional member map in instances | Medium — removes boilerplate | Low | 2 | Nothing (independent) |
| Constraint propagation (intrinsic) | Medium — DRY, correct inheritance | Medium | 3 | Phase 1 |
| De-emphasize contract declarations | Low — docs and examples | Low | 4 | Phase 1 |

### Related in-flight changes (other docs)

| Change | Status | Doc |
|---|---|---|
| Kind syntax: type aliases instead of interfaces | **Done** | `docs/design/KIND_DEFINITION_SYNTAX.md` |
| Replace `locate()`/`defineContracts()` with `satisfies` | Proposed | `docs/design/RUNTIME_MARKERS_OPTIONS.md` |
| Remove stdlib packages (clean-arch, hexagonal, onion) | **Done** | Working tree |
| Remove detect/infer/scaffold use cases | **Done** | Working tree |

### How they fit together

The three proposals form a natural progression:

1. **Kind syntax** (done) → Types instead of interfaces. Foundation for everything else.
2. **Constraints on types** (this doc) → Kind type becomes the full specification. Eliminates most contract declarations.
3. **Satisfies migration** (RUNTIME_MARKERS_OPTIONS) → Eliminates all runtime functions. Pure type-level architecture definitions.

The end state: a `architecture.ts` file that is nothing but type definitions and plain objects, with `import type` only, zero runtime dependency on `kindscript`, and complete architectural specifications encoded in the type system.
