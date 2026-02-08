# Contracts and Location Redesign V2

> Contracts live on the Kind type. Instances use `satisfies`. Location is optional per member.

**Status:** Design (decisions made, implementation not started)
**Date:** 2026-02-07
**Supersedes:** `docs/design/CONTRACTS_AND_LOCATION_REDESIGN.md` (V1 exploration)

**Decided:**
- **Contracts:** Third type parameter on Kind for both intrinsic and relational constraints (V1 Options B+C)
- **Propagation:** Implicit classifier-time propagation of intrinsic constraints (V1 Option D1), with type-level validation (D2/D3) as a future enhancement
- **Syntax:** `satisfies` expressions only. Remove `locate()` and `defineContracts()` functions entirely. All imports become `import type`.
- **Instances:** Full member map required (A'), with optional member map (E) as a future ergonomic improvement. Member location is optional — declaring a member doesn't require binding it to a path.

**Related decisions:**
- `docs/design/KIND_DEFINITION_SYNTAX.md` — **Implemented.** Kind definitions use type aliases.
- `docs/design/RUNTIME_MARKERS_OPTIONS.md` — **Adopted (Option A).** `satisfies` instead of function calls.

---

## The End State

A complete `architecture.ts` file:

```typescript
import type { Kind, InstanceConfig } from 'kindscript';

// Leaf kinds with intrinsic constraints
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Composite kind — structure + constraints in one type
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

// Instance — member map required, location per member optional
export const shop = {
  root: "src",
  domain: {},              // location derived: src/domain
  application: {},         // location derived: src/application
  infrastructure: {},      // location derived: src/infrastructure
} satisfies InstanceConfig<CleanArchitecture>;
```

- Every `import` is `import type` (zero runtime dependency)
- The Kind type IS the full specification (structure + all constraints)
- `purity("domain")` is inherited from DomainLayer's `{ pure: true }` — no need to declare it
- No `locate()`. No `defineContracts()`. No runtime functions at all.

---

## Part 1: Contracts on the Kind Type

### Decision: Third type parameter `Kind<N, Members, Constraints>`

```typescript
type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = Record<string, never>,
  Constraints extends ConstraintConfig<Members> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;
```

The five existing contract types split naturally:

| Category | Constraints | Where declared |
|---|---|---|
| **Intrinsic** (property of a kind) | `pure` | On the leaf kind: `Kind<"DomainLayer", {}, { pure: true }>` |
| **Relational** (property of the relationship) | `noDependency`, `mustImplement`, `colocated`, `noCycles` | On the composite kind that contains both members |

### Intrinsic constraints on leaf kinds

```typescript
// "DomainLayer is a pure architectural layer"
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

// "InfrastructureLayer has no intrinsic constraints"
type InfrastructureLayer = Kind<"InfrastructureLayer">;
```

Reading `DomainLayer` tells you everything about what it means — it's pure. No need to search for a separate declaration.

### Relational constraints on composite kinds

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

Reading `CleanArchitecture` tells you:
- What members it has (second parameter)
- All relational constraints between them (third parameter)
- That `domain` is pure (inherited from DomainLayer — see Part 2)

### Type-safe member references

Member names in the constraints parameter are validated against `keyof Members`:

```typescript
type ConstraintConfig<Members = Record<string, never>> = {
  // Intrinsic
  pure?: true;

  // Relational (member names are type-checked)
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  noCycles?: ReadonlyArray<keyof Members & string>;
  colocated?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
};
```

A typo like `["domian", "infrastructure"]` is a TypeScript error — "domian" is not assignable to `"domain" | "application" | "infrastructure"`. This catches mistakes at compile time, before running `ksc check`.

### What the classifier reads

The classifier's Phase 1 (`classifyKindDefinition`) currently reads:
- `typeArguments[0]` → kind name (via `getTypeAliasTypeArgLiterals`)
- `typeArguments[1]` → members (via `getTypeAliasMemberProperties`)

It will additionally read:
- `typeArguments[2]` → constraints type literal

A new AST port method — `getTypeAliasConstraintConfig(node)` — extracts the constraint properties and their tuple/array type values. The pattern is identical to how `getTypeAliasMemberProperties` reads the second type argument's property signatures.

Constraints from the type parameter are converted to `Contract` objects during Phase 1, alongside the Kind definition. These merge with any additive contract declarations found in Phase 3 (for instance-specific overrides).

---

## Part 2: Constraint Propagation

### Decision: D1 — Implicit classifier-time propagation

When the classifier processes a composite Kind, it walks each member's Kind definition and collects intrinsic constraints. If `DomainLayer` has `{ pure: true }`, and a composite has `domain: DomainLayer`, the classifier automatically generates a `purity("domain")` contract for every instance of that composite.

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;
// ↑ The classifier generates purity("domain") automatically.
//   The composite doesn't need to declare it.
```

**How it works in the classifier:**

After Phase 1 builds `kindDefs`, a propagation step runs:

```
For each composite Kind definition:
  For each member property:
    Look up the member's Kind definition in kindDefs
    If the member Kind has constraints in typeArguments[2]:
      For each intrinsic constraint (e.g., pure: true):
        Generate a Contract object targeting this member name
```

The generated contracts are identical to contracts that would be created by an explicit declaration — `CheckContracts` sees no difference.

**Rules:**
- **Intrinsic constraints propagate.** If a leaf declares `{ pure: true }`, every composite containing that leaf inherits the constraint.
- **Relational constraints don't propagate.** `noDependency` and `mustImplement` reference member names that only exist within their composite's scope. They apply within their scope, not at parent levels.
- **Constraints accumulate, never conflict.** If both a parent and child declare purity, it's one deduplicated check. More constraints = more enforcement.

### Future enhancement: D2/D3

**D2 (type-level validation):** The `ConstraintConfig<Members>` type would use conditional types to compute what intrinsic constraints the members carry, and require the composite to acknowledge them. If `DomainLayer` declares `{ pure: true }`, the composite's constraints parameter would be required to include `purity: ["domain"]` — omitting it would be a TypeScript error.

This makes propagation **visible and explicit** — you can see all active constraints by reading the composite's definition alone. The downside is verbosity: you must repeat constraints from every member.

**D3 (full automatic merging):** The classifier propagates not just intrinsic constraints but also relational constraints from nested composites. If `DomainLayer` is itself a composite with `noDependency: [["entities", "ports"]]`, that constraint propagates to any parent. This enables building composable architectural patterns from smaller, pre-constrained building blocks.

Both D2 and D3 are additive — they can be implemented on top of D1 without changing existing behavior.

---

## Part 3: Instance Declarations

### Decision: `satisfies InstanceConfig<T>`, no `locate()`

Per RUNTIME_MARKERS_OPTIONS (Option A), all runtime marker functions are removed. Instances are declared as plain objects validated by `satisfies`:

```typescript
export const shop = {
  root: "src",
  domain: {},
  application: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanArchitecture>;
```

The `locate()` function is deleted. The `InstanceConfig<T>` type replaces it:

```typescript
type InstanceConfig<T extends Kind> = { root: string } & MemberMap<T>;
```

The classifier's Phase 2 changes from matching `CallExpression` nodes named `locate` to matching `SatisfiesExpression` nodes where the type reference is `InstanceConfig<T>`. The data extraction is the same — root path from the `root` property, member assignments from the remaining properties.

### Decision: Full member map required (A'), with optional (E) as future improvement

Starting with A': every member defined in the Kind type must appear in the instance config. TypeScript enforces this through the `InstanceConfig<T>` type.

```typescript
// All three members are required:
export const shop = {
  root: "src",
  domain: {},
  application: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanArchitecture>;

// TypeScript error if you omit one:
export const shop = {
  root: "src",
  domain: {},
  // ← Missing application and infrastructure — type error
} satisfies InstanceConfig<CleanArchitecture>;
```

This is the safe starting point. Once the system is working well, the member map can be made optional (E) as an ergonomic improvement by changing `InstanceConfig<T>` to use `Partial<MemberMap<T>>`.

---

## Part 4: Member Location — The Logical Reference Model

This is the most nuanced design question. Currently, every member MUST resolve to a filesystem path. The proposal is: member location should be optional.

### The key insight: members are logical references, not just filesystem paths

When you write:

```typescript
type CleanArchitecture = Kind<"CleanArchitecture", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;
```

You're declaring that CleanArchitecture has three **architectural concepts**: domain, application, and infrastructure. These are logical references — they exist in the architectural model regardless of where (or whether) they live on disk.

When you write an instance:

```typescript
export const shop = {
  root: "src",
  domain: {},
  application: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanArchitecture>;
```

You're binding each logical reference to a location. But not every member necessarily needs a location. Some constraints are purely structural (e.g., "these three layers exist"). Others require filesystem access (e.g., "domain must not import from infrastructure").

### What happens to contracts when a member has no location?

Contracts fall into two categories:

| Contract | Needs filesystem? | What it checks |
|---|---|---|
| `noDependency` | Yes | Resolves imports in source files, checks targets |
| `purity` | Yes | Checks import specifiers against Node.js built-in list |
| `mustImplement` | Yes | Scans for exported interfaces and implementing classes |
| `noCycles` | Yes | Builds import graph, detects cycles |
| `colocated` | Yes | Compares file basenames across directories |
| `existence` (implicit) | Yes | Checks that derived directories exist on disk |

Today, all five contract types plus the existence check require filesystem access. If a member has no location, none of these contracts can be checked for that member.

### Options for member location semantics

**Option L1: `{}` means "derive path from member name" (current behavior)**

```typescript
export const shop = {
  root: "src",
  domain: {},              // → src/domain (derived, existence checked)
  infrastructure: {},      // → src/infrastructure (derived, existence checked)
} satisfies InstanceConfig<CleanArchitecture>;
```

Every member gets a path. Every contract is checked. The existence check verifies derived directories exist.

- Pro: All constraints are always enforced. No ambiguity.
- Con: No way to declare a member without binding it to a path. The existence check can be annoying during early development when directories don't exist yet.

**Option L2: `{}` means "no location" — location requires explicit declaration**

```typescript
export const shop = {
  root: "src",
  domain: { path: "src/domain" },       // explicit location → contracts checked
  application: {},                       // no location → contracts skipped
  infrastructure: { path: "src/infra" }, // explicit location → contracts checked
} satisfies InstanceConfig<CleanArchitecture>;
```

Members with `{}` are logical references only. The compiler knows they exist architecturally but doesn't know where their files are. Contracts referencing unlocated members are skipped.

- Pro: Flexible. Supports incremental adoption — bind members as you build them.
- Con: Easy to accidentally leave members unlocated. Contracts silently don't fire.

**Option L3: `{}` means "derive path" (like L1), but existence check is optional**

```typescript
export const shop = {
  root: "src",
  domain: {},                    // → src/domain (derived, contracts checked, existence NOT required)
  infrastructure: {},            // → src/infrastructure (derived, contracts checked)
} satisfies InstanceConfig<CleanArchitecture>;
```

Every member gets a derived path for contract checking, but the existence check (diagnostic 70010) doesn't fire. The compiler uses the derived path to check noDependency, purity, etc. — but doesn't require the directory to exist. If it doesn't exist, the import-based contracts naturally find nothing to check (no files = no imports = no violations).

- Pro: Contracts work when directories exist, silently pass when they don't. No false positives during development.
- Con: "No files = no violations" means you could think you're clean when you're actually missing directories. The existence check was there to catch this.

**Option L4: Location is always derived, but can be overridden**

```typescript
export const shop = {
  root: "src",
  domain: {},                          // → src/domain (derived from root + member name)
  infrastructure: { path: "infra" },   // → src/infra (overridden)
} satisfies InstanceConfig<CleanArchitecture>;
```

Every member always gets a location. `{}` derives from the member name. `{ path: "..." }` overrides. No concept of "unlocated" members. Existence is always checked.

This is essentially the current behavior with satisfies syntax.

- Pro: Simple. Every member has a path. Every contract is always checked.
- Con: No flexibility for members you don't want to bind yet.

### Recommendation: L4 for now, L2 as future option

Start with L4 — it's closest to the current behavior and the safest. Every member has a location (derived or overridden), every contract is checked, existence is verified.

L2 (explicit location, no-location-means-logical-reference) is a powerful concept for future development. It enables:
- Incremental adoption (bind members as you build them)
- Abstract architectural patterns (define structure and constraints without committing to filesystem layout)
- Mixed enforcement (check some members strictly, leave others as logical markers)

But L2 adds complexity: the compiler must handle "unlocated" members, contract checking must gracefully skip them, and diagnostic output must clearly explain why some contracts weren't checked. Better to get the core system working with L4 first.

### How L2 would work (future)

When a member has no location:
1. **The member exists as an ArchSymbol** with `declaredLocation: undefined` and `locationDerived: false`.
2. **Contracts that reference it are skipped** with an info-level diagnostic: "noDependency(domain → infrastructure): skipped — domain has no declared location."
3. **Intrinsic constraints (purity) are also skipped** — can't check purity without knowing which files to scan.
4. **The member IS still a valid target** for type-level validation (D2/D3 future). The type system can verify that constraints reference real member names even if the member has no location.

The key distinction: the member is a **logical reference** (it exists in the architectural model) even when it's not a **filesystem binding** (the compiler doesn't know where its files are).

---

## Part 5: Additive Contract Declarations (Escape Hatch)

Type-level constraints handle the common case. But instance-specific constraints that don't belong on the type can still be declared separately:

```typescript
// The Kind type carries the standard constraints
type CleanArchitecture = Kind<"CleanArchitecture", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

// Instance
export const shop = {
  root: "src",
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanArchitecture>;

// Instance-specific additive constraint
export const extraContracts = {
  colocated: [["domain", "infrastructure"]],
} as const satisfies ContractConfig<CleanArchitecture>;
```

The compiler merges constraints from two sources:
1. The Kind type's third parameter (and propagated intrinsic constraints from members)
2. Any `satisfies ContractConfig<T>` declarations for the same Kind

This is **additive only** — declarations can add constraints, never remove type-level ones.

The `ContractConfig<T>` type adds a phantom parameter for classifier linkage:

```typescript
type ContractConfig<_T extends Kind = Kind> = {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
};
```

Note: additive declarations use `string` member references (not `keyof Members`), because `ContractConfig<T>` doesn't have access to the Kind's Members parameter. Type-level constraints in the Kind type get full type safety; additive declarations get runtime validation by the classifier (same as today).

---

## Part 6: What Gets Deleted

| Component | Before | After |
|---|---|---|
| `src/runtime/kind.ts` | `Kind<N, Members>` (2 params) | `Kind<N, Members, Constraints>` (3 params) |
| `src/runtime/locate.ts` | `locate()` function + `MemberMap<T>` | `InstanceConfig<T>` type + `MemberMap<T>` (no function) |
| `src/runtime/define-contracts.ts` | `defineContracts()` function + `ContractConfig` | `ContractConfig<T>` type (no function) |
| `src/index.ts` | `export { Kind, locate, defineContracts }` | `export type { Kind, InstanceConfig, ContractConfig }` |
| Classifier Phase 1 | Reads `Kind<N, Members>` | Reads `Kind<N, Members, Constraints>` |
| Classifier Phase 2 | Matches `locate()` call | Matches `satisfies InstanceConfig<T>` |
| Classifier Phase 3 | Matches `defineContracts()` call | Matches `satisfies ContractConfig<T>` |

Every export becomes `export type`. The compiled `index.js` is empty. Zero runtime footprint.

---

## Part 7: Classifier Changes

### Phase 1: Kind definitions (enhanced)

**Current flow:**
```
isTypeAliasDeclaration(stmt) →
  getTypeAliasReferenceName(node)        → "Kind" (signal)
  getDeclarationName(node)               → "CleanArchitecture"
  getTypeAliasTypeArgLiterals(node)      → ["CleanArchitecture"] (from typeArguments[0])
  getTypeAliasMemberProperties(node)     → [{name: "domain", typeName: "DomainLayer"}, ...] (from typeArguments[1])
```

**New: add constraint extraction:**
```
  getTypeAliasConstraintConfig(node)     → {
    noDependency: [["domain", "infrastructure"], ...],
    mustImplement: [...],
    pure: true,
    ...
  } (from typeArguments[2])
```

The new method reads `typeArguments[2]` of the `Kind<N, Members, Constraints>` type reference. It parses the type literal's property signatures, extracting:
- Boolean type values (`pure: true` → `TrueLiteralType`)
- Array/tuple type values (`noDependency: [["a", "b"]]` → `TupleTypeNode` containing `TupleTypeNode` containing `LiteralTypeNode`)

**New: constraint propagation step:**

After collecting all Kind definitions, iterate composites and propagate intrinsic constraints from member Kinds:

```
For each kindDef in kindDefs:
  For each property in kindDef.properties:
    memberKindDef = kindDefs.get(property.typeName)
    if memberKindDef has constraints with { pure: true }:
      Add purity contract targeting this member name
```

### Phase 2: Instance declarations (rewritten)

**Before:** Match `CallExpression` named `locate`. Extract type argument and call arguments.

**After:** Match `SatisfiesExpression` where the type reference is `InstanceConfig<T>`. Extract:
- Type argument `T` → Kind name
- `root` property from the object literal → base path
- Remaining properties → member assignments (for path overrides)

The member derivation logic (`deriveMembers`) is unchanged — it still walks the Kind definition tree and computes paths as `parentPath + "/" + memberName` (or the override).

### Phase 3: Contract declarations (rewritten)

**Before:** Match `CallExpression` named `defineContracts`. Extract type argument and config object.

**After:** Match `SatisfiesExpression` where the type reference is `ContractConfig<T>`. Extract the same information from the object literal.

Phase 3 contracts are now additive — they supplement the type-level contracts from Phase 1.

### AST port additions

```typescript
// New methods on ASTNodePort:
isSatisfiesExpression(node: ASTNode): boolean;
getSatisfiesTypeReferenceName(node: ASTNode): string | undefined;
getSatisfiesTypeArgumentNames(node: ASTNode): string[];
getSatisfiesExpression(node: ASTNode): ASTNode | undefined;

// New method on ASTDeclarationPort:
getTypeAliasConstraintConfig(node: ASTNode): ConstraintConfigAST | undefined;

// Where ConstraintConfigAST is:
interface ConstraintConfigAST {
  pure?: boolean;
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  noCycles?: string[];
  colocated?: [string, string][];
}
```

---

## Part 8: Implementation Phases

### Phase 1: Third type parameter + constraint extraction

1. Update `Kind` type in `src/runtime/kind.ts` to accept three parameters
2. Add `ConstraintConfig` type
3. Add `getTypeAliasConstraintConfig()` to AST port, adapter, and mock
4. Update `classifyKindDefinition()` to extract constraints from third type arg
5. Generate `Contract` objects from type-level constraints (alongside Phase 3 contracts)
6. Add constraint propagation step (intrinsic constraints from leaf kinds)
7. Tests: new unit tests for constraint extraction and propagation

**Backwards compatible:** Existing `Kind<"X">` and `Kind<"X", Members>` definitions continue to work (third parameter defaults). Existing `defineContracts()` continues to work (additive).

### Phase 2: `satisfies` migration (instances + contracts)

1. Add `InstanceConfig<T>` type to `src/runtime/locate.ts`
2. Add phantom parameter to `ContractConfig<T>` in `src/runtime/define-contracts.ts`
3. Add `SatisfiesExpression` support to AST port, adapter, and mock
4. Rewrite classifier Phase 2 to match `satisfies InstanceConfig<T>`
5. Rewrite classifier Phase 3 to match `satisfies ContractConfig<T>`
6. Delete `locate()` and `defineContracts()` functions
7. Change all `export` to `export type` in `src/index.ts`
8. Migrate all fixtures from `locate()`/`defineContracts()` to `satisfies`
9. Tests: update all integration and E2E tests

**Breaking change:** All `architecture.ts` files must be rewritten. Since the Kind syntax migration already required this, the incremental cost is low.

### Phase 3: Docs, examples, fixtures

1. Update all fixtures to use the new syntax (type-level constraints + satisfies)
2. Update notebooks
3. Update README, CLAUDE.md, architecture docs
4. Update tests/README.md and fixture docs

### Phase 4: Future enhancements (not in initial implementation)

- **D2/D3:** Type-level validation / full propagation of relational constraints
- **E:** Optional member map (`Partial<MemberMap<T>>` in `InstanceConfig<T>`)
- **L2:** Logical references (members without locations)
- **Strict mode:** Disallow additive contract declarations (all constraints on the type)
- **Custom constraints:** Extensible `ConstraintConfig` for plugin contract types

---

## Summary

### What we're building

| Decision | Choice | Rationale |
|---|---|---|
| Contracts location | Third type parameter: `Kind<N, Members, Constraints>` | Co-locates structure and rules. Type-safe member refs. Self-documenting. |
| Intrinsic constraints | On leaf kinds: `Kind<"X", {}, { pure: true }>` | Purity is intrinsic to what a domain layer *means*. |
| Relational constraints | On composite kinds: `Kind<"X", Members, { noDependency: [...] }>` | Relationships belong on the composite that contains both sides. |
| Constraint propagation | D1: classifier-time, intrinsic only | DRY. Declare once, enforce everywhere. D2/D3 later. |
| Instance syntax | `satisfies InstanceConfig<T>` | Zero runtime. Pure types. `import type` only. |
| Contract syntax | `satisfies ContractConfig<T>` (additive escape hatch) | Same benefits. Optional — most constraints are on the type. |
| Member map | Required (A') | Safe starting point. E (optional) later. |
| Member location | Derived from member name (L4) | Simple. Every member has a path. L2 (logical refs) later. |

### What gets removed

- `locate()` function
- `defineContracts()` function
- All value exports from `kindscript` (everything becomes `export type`)
- The `packages/` stdlib (already removed)

### What the user writes

```typescript
import type { Kind, InstanceConfig } from 'kindscript';

type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

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

export const shop = {
  root: "src",
  domain: {},
  application: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanArchitecture>;
```

The Kind type is the specification. The instance is the binding. The compiler enforces it.

---

## Implementation Plan

This section is the step-by-step plan for implementing the redesign. Each step includes the files to change, what to change, how to validate, and the cleanup required to remove all backward compatibility.

### Guiding Principles

1. **No backward compatibility.** Every step fully replaces old code. No legacy code paths are maintained alongside new ones.
2. **Tests pass after every step.** Each step ends with `npm test` green. Tests are updated alongside production code.
3. **Fixtures are the single source of truth for syntax.** All 18 integration fixtures are converted early so integration and E2E tests validate the real pipeline.

---

### Step 1: Add `ConstraintConfig` type and third type parameter to Kind

**Files to change:**

| File | Change |
|------|--------|
| `src/runtime/kind.ts` | Add `ConstraintConfig<Members>` type. Add third type parameter `Constraints` to `Kind`. |

**Detail:**

```typescript
// src/runtime/kind.ts — new state

export type ConstraintConfig<Members = Record<string, never>> = {
  pure?: true;
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  noCycles?: ReadonlyArray<keyof Members & string>;
  colocated?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
};

export type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = {},
  Constraints extends ConstraintConfig<Members> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;
```

`Constraints` defaults to `Record<string, never>` so existing `Kind<"X">` and `Kind<"X", Members>` usages are valid until they're migrated.

**Validation:** `npm run build` compiles. `npm test` passes (no behavioral changes yet).

---

### Step 2: Replace `locate()` with `InstanceConfig<T>` type and replace `defineContracts()` with `ContractConfig<T>` type

**Files to change:**

| File | Change |
|------|--------|
| `src/runtime/locate.ts` | Delete `locate()` function. Add `InstanceConfig<T>` type. Keep `MemberMap<T>`. |
| `src/runtime/define-contracts.ts` | Delete `defineContracts()` function. Change `ContractConfig` from interface to type with phantom `_T` parameter. |
| `src/index.ts` | Change all exports to `export type`. Add `InstanceConfig` and `ConstraintConfig` exports. Remove `locate` and `defineContracts` value exports. |

**Detail:**

```typescript
// src/runtime/locate.ts — new state
import { Kind } from './kind';

export type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};

export type InstanceConfig<T extends Kind> = { root: string } & MemberMap<T>;
```

```typescript
// src/runtime/define-contracts.ts — new state
import { Kind } from './kind';

export type ContractConfig<_T extends Kind = Kind> = {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
};
```

```typescript
// src/index.ts — new state
export type { Kind, ConstraintConfig } from './runtime/kind';
export type { ContractConfig } from './runtime/define-contracts';
export type { MemberMap, InstanceConfig } from './runtime/locate';
```

**Validation:** `npm run build` compiles. Tests will fail (locate/defineContracts calls removed) — that's expected. Fixed in subsequent steps.

---

### Step 3: Add `satisfies` expression support to AST ports

**Files to change:**

| File | Change |
|------|--------|
| `src/application/ports/ast.port.ts` | Add `isSatisfiesExpression`, `getSatisfiesTypeReferenceName`, `getSatisfiesTypeArgumentNames`, `getSatisfiesExpression` to `ASTNodePort`/`ASTExpressionPort`. Add `getTypeAliasConstraintConfig` to `ASTDeclarationPort`. Add `ConstraintConfigAST` interface. |

**Detail:**

```typescript
// New interface added alongside existing ones
export interface ConstraintConfigAST {
  pure?: boolean;
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  noCycles?: string[];
  colocated?: [string, string][];
}

// Additions to ASTNodePort:
isSatisfiesExpression(node: ASTNode): boolean;

// Additions to ASTExpressionPort:
getSatisfiesTypeReferenceName(node: ASTNode): string | undefined;
getSatisfiesTypeArgumentNames(node: ASTNode): string[];
getSatisfiesExpression(node: ASTNode): ASTNode | undefined;

// Additions to ASTDeclarationPort:
getTypeAliasConstraintConfig(node: ASTNode): ConstraintConfigAST | undefined;
```

**Validation:** `npm run build` compiles (ports are interfaces — implementations must follow).

---

### Step 4: Implement `satisfies` expression methods in real AST adapter

**Files to change:**

| File | Change |
|------|--------|
| `src/infrastructure/adapters/ast/ast.adapter.ts` | Implement all new port methods using TypeScript compiler API (`ts.SatisfiesExpression`, `ts.isTypeReferenceNode`, etc.). Implement `getTypeAliasConstraintConfig` to parse the third type argument of `Kind<N, Members, Constraints>`. |

**Detail for `getTypeAliasConstraintConfig`:**

Reads `typeArguments[2]` from the `Kind` type reference. Parses the type literal's property signatures:
- `pure: true` → `TrueLiteralType` → `{ pure: true }`
- `noDependency: [["a", "b"]]` → `TupleType` containing `TupleType` containing `LiteralType` → `{ noDependency: [["a", "b"]] }`
- `noCycles: ["a", "b"]` → `TupleType` containing `LiteralType` → `{ noCycles: ["a", "b"] }`

**Detail for `satisfies` methods:**

TypeScript represents `expr satisfies Type` as a `ts.SatisfiesExpression` node (since TS 4.9). Key properties:
- `node.expression` → the object literal
- `node.type` → the type reference (`InstanceConfig<T>` or `ContractConfig<T>`)

The `isSatisfiesExpression` checks `ts.isSatisfiesExpression(node)`.
`getSatisfiesTypeReferenceName` extracts the type reference name from `node.type`.
`getSatisfiesTypeArgumentNames` extracts type arguments from the type reference.
`getSatisfiesExpression` returns `node.expression` (the object literal).

**Validation:** `npm run build` compiles. Unit tests for adapter methods (Step 8).

---

### Step 5: Implement `satisfies` expression methods in mock AST adapter

**Files to change:**

| File | Change |
|------|--------|
| `src/infrastructure/adapters/testing/mock-ast.adapter.ts` | Add `MockSatisfiesExpressionNode` interface. Add `withSatisfiesInstanceConfig` and `withSatisfiesContractConfig` fluent methods. Remove `withLocateCall` and `withDefineContractsCall`. Implement all new port methods. Implement `getTypeAliasConstraintConfig` returning constraint data from mock nodes. |

**Detail:**

```typescript
// New mock node type
interface MockSatisfiesExpressionNode extends ASTNode {
  __type: 'satisfiesExpression';
  expression: ASTNode;          // The object literal
  typeReferenceName: string;    // "InstanceConfig" or "ContractConfig"
  typeArgumentNames: string[];  // ["CleanArchitecture"]
}

// Updated MockTypeAliasNode — add constraintConfig field
interface MockTypeAliasNode extends ASTNode {
  __type: 'typeAlias';
  name: string;
  referenceName: string;
  typeArgLiterals: string[];
  memberProperties: Array<{ name: string; typeName?: string }>;
  constraintConfig?: ConstraintConfigAST;  // NEW
}
```

Add `MockSatisfiesExpressionNode` to the `MockNode` union.

New fluent methods:

```typescript
withSatisfiesInstanceConfig(
  fileName: string,
  varName: string,
  kindName: string,
  configObject: ASTNode,
): this;

withSatisfiesContractConfig(
  fileName: string,
  kindName: string,
  configObject: ASTNode,
): this;
```

Delete: `withLocateCall`, `withDefineContractsCall` (backward compat removed).

Update `withTypeAlias` to accept optional `constraintConfig` parameter.

**Validation:** `npm run build` compiles.

---

### Step 6: Rewrite classifier — Phase 1 (constraints + propagation), Phase 2 (satisfies InstanceConfig), Phase 3 (satisfies ContractConfig)

**Files to change:**

| File | Change |
|------|--------|
| `src/application/use-cases/classify-ast/classify-ast.service.ts` | Rewrite all three phases. Add constraint propagation step. Update `KindDefinition` interface. |

**Detail:**

**KindDefinition update:**

```typescript
interface KindDefinition {
  name: string;
  kindNameLiteral: string;
  properties: Array<{ name: string; typeName?: string }>;
  constraints?: ConstraintConfigAST;  // NEW
}
```

**Phase 1 enhancement — `classifyKindDefinition`:**

Add constraint extraction:
```
getTypeAliasConstraintConfig(node) → constraints (from typeArguments[2])
```

Store constraints on `KindDefinition`.

**New step — constraint propagation (after Phase 1, before Phase 2):**

After all Kind definitions are collected across all files:
```
For each composite kindDef:
  For each memberProp in kindDef.properties:
    memberKindDef = kindDefs.get(memberProp.typeName)
    if memberKindDef?.constraints?.pure:
      Mark this member name for auto-generated purity contract
```

Store propagated constraints alongside type-level relational constraints on the composite's KindDefinition (or in a separate map keyed by composite name).

**Phase 1 contract generation (new):**

After Phase 2 creates instances, iterate composites' type-level constraints and generate Contract objects the same way Phase 3 currently does. This replaces the need for explicit `purity: ["domain"]` in `defineContracts` — purity is inherited from `DomainLayer`'s `{ pure: true }`.

**Phase 2 rewrite — instance declarations:**

Replace:
```typescript
// Old: match locate<T>(root, members) call expression
if (init && this.astPort.isCallExpression(init)) {
  const funcName = this.astPort.getCallExpressionName(init);
  if (funcName === 'locate') { ... }
}
```

With:
```typescript
// New: match { ... } satisfies InstanceConfig<T>
if (init && this.astPort.isSatisfiesExpression(init)) {
  const typeName = this.astPort.getSatisfiesTypeReferenceName(init);
  if (typeName === 'InstanceConfig') {
    const typeArgs = this.astPort.getSatisfiesTypeArgumentNames(init);
    const kindName = typeArgs[0];
    const expression = this.astPort.getSatisfiesExpression(init);
    // Extract root from the "root" property of the object literal
    // Extract member assignments from remaining properties
    // Same deriveMembers logic as before
  }
}
```

The `classifyLocateInstance` method is renamed to `classifySatisfiesInstance` and updated to get the root and members from the object literal properties instead of call arguments.

**Phase 3 rewrite — contract declarations:**

Replace:
```typescript
// Old: match defineContracts<T>(...) call expression
if (init && this.astPort.isCallExpression(init)) {
  const result = this.classifyContracts(init, ...);
}
```

With:
```typescript
// New: match { ... } satisfies ContractConfig<T>
if (init && this.astPort.isSatisfiesExpression(init)) {
  const typeName = this.astPort.getSatisfiesTypeReferenceName(init);
  if (typeName === 'ContractConfig') {
    const typeArgs = this.astPort.getSatisfiesTypeArgumentNames(init);
    const kindName = typeArgs[0];
    const expression = this.astPort.getSatisfiesExpression(init);
    // Parse contract config from the object literal (same logic as before)
  }
}
```

The `classifyContracts` method is updated to accept an object literal node (from `getSatisfiesExpression`) instead of extracting it from call arguments.

**Contracts from two sources:**

The classifier produces contracts from:
1. Type-level constraints on the Kind definition (Phase 1) + propagated intrinsic constraints
2. Additive `satisfies ContractConfig<T>` declarations (Phase 3)

Both are merged into the same `contracts` array. `CheckContracts` sees no difference.

**Error messages:**

Update all error messages:
- `locate()` → `satisfies InstanceConfig<T>`
- `defineContracts()` → `satisfies ContractConfig<T>`
- `locate() call has no type argument` → `InstanceConfig satisfies expression has no type argument`
- etc.

**Remove dead code:**

Delete `isCallExpression`/`getCallExpressionName` checks for `locate` and `defineContracts` in the classifier. The `isCallExpression` port method stays (may be used elsewhere) but the classifier no longer calls it.

**Validation:** Tests will fail at this point — mock and unit tests need updating (next steps).

---

### Step 7: Update all unit tests for the classifier

**Files to change:**

| File | Tests | Change |
|------|-------|--------|
| `tests/unit/classify-ast-kind-parsing.test.ts` | 4 tests | Add constraint config tests (Kind third parameter). Update `withTypeAlias` calls to include `constraintConfig` where applicable. |
| `tests/unit/classify-ast-locate.test.ts` | 20 tests | Replace all `mockAST.withLocateCall(...)` with `mockAST.withSatisfiesInstanceConfig(...)`. Update variable resolution tests. Rename file to `classify-ast-instance.test.ts`. |
| `tests/unit/classify-ast-contracts.test.ts` | 34 tests | Replace all `mockAST.withDefineContractsCall(...)` with `mockAST.withSatisfiesContractConfig(...)`. Update error message assertions. Add tests for type-level contracts from Kind definition. Add constraint propagation tests. |

**New tests to add:**

In `classify-ast-kind-parsing.test.ts`:
- `extracts constraint config from Kind third type parameter`
- `returns undefined constraintConfig when Kind has no third parameter`
- `extracts pure: true from constraint config`
- `extracts noDependency tuples from constraint config`
- `extracts mixed constraints`

In `classify-ast-contracts.test.ts` (or new `classify-ast-propagation.test.ts` if file gets too long):
- `generates purity contract from leaf Kind with { pure: true }`
- `propagates intrinsic constraints through composite hierarchy`
- `does not propagate relational constraints`
- `merges type-level and additive contracts`
- `deduplicates propagated and explicitly declared purity`

**Validation:** `npm test -- tests/unit/classify-ast` passes.

---

### Step 8: Add unit tests for new AST adapter methods

**Files to change:**

| File | Change |
|------|--------|
| `tests/unit/ast-adapter.test.ts` (or new file) | Add tests for `isSatisfiesExpression`, `getSatisfiesTypeReferenceName`, `getSatisfiesTypeArgumentNames`, `getSatisfiesExpression`, `getTypeAliasConstraintConfig`. |

**Test approach:** Create TypeScript source strings containing the new syntax, parse them with `ts.createSourceFile`, pass through the real `ASTAdapter`, and assert correct extraction.

Example test:
```typescript
it('extracts constraint config from Kind<N, Members, Constraints>', () => {
  const source = `type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;`;
  // Parse, find the type alias, call getTypeAliasConstraintConfig
  // Assert: { pure: true }
});

it('recognizes satisfies InstanceConfig expression', () => {
  const source = `export const app = { root: "src", domain: {} } satisfies InstanceConfig<CleanCtx>;`;
  // Parse, find the variable, check isSatisfiesExpression, extract type ref
  // Assert: typeReferenceName === "InstanceConfig", typeArgs === ["CleanCtx"]
});
```

**Validation:** `npm test -- tests/unit/ast` passes.

---

### Step 9: Convert all 18 integration fixtures to new syntax

**Files to change:** All `tests/integration/fixtures/*/architecture.ts` (18 files).

**Conversion pattern for each fixture:**

1. Replace the inline runtime boilerplate (Kind type, MemberMap, locate function, ContractConfig, defineContracts function) with the new boilerplate:

```typescript
// NEW BOILERPLATE (replaces the old ~30-line header in each fixture)
type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = {},
  Constraints extends ConstraintConfig<Members> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;

type ConstraintConfig<Members = Record<string, never>> = {
  pure?: true;
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  noCycles?: ReadonlyArray<keyof Members & string>;
  colocated?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
};

type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};

type InstanceConfig<T extends Kind> = { root: string } & MemberMap<T>;

type ContractConfig<_T extends Kind = Kind> = {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
};
```

2. Move contracts from `defineContracts<T>({...})` calls onto the Kind type's third parameter where appropriate.

3. Replace `locate<T>("root", {...})` with `{ root: "root", ... } satisfies InstanceConfig<T>`.

4. Replace `defineContracts<T>({...})` with `{...} as const satisfies ContractConfig<T>` (for any remaining additive contracts).

**Fixture-specific notes:**

| Fixture | Contracts to move to Kind type | Notes |
|---------|-------------------------------|-------|
| `clean-arch-valid` | `noDependency` → `CleanContext` third param | |
| `clean-arch-violation` | `noDependency` → `CleanContext` third param | |
| `tier2-clean-arch` | `noDependency` → `CleanContext` third param | Most representative fixture |
| `tier2-violation` | `noDependency` → `CleanContext` third param | |
| `locate-clean-arch` | `noDependency` → `CleanContext` third param | |
| `locate-violation` | `noDependency` → `CleanContext` third param | |
| `locate-existence` | None (empty contracts) | |
| `purity-clean` | `purity` → intrinsic `{ pure: true }` on `DomainLayer` | No explicit purity in contracts — propagated from Kind |
| `purity-violation` | `purity` → intrinsic `{ pure: true }` on `DomainLayer` | Same |
| `no-cycles-violation` | `noCycles` → composite third param | |
| `must-implement-clean` | `mustImplement` → composite third param | |
| `must-implement-violation` | `mustImplement` → composite third param | |
| `colocated-clean` | `colocated` → composite third param | |
| `colocated-violation` | `colocated` → composite third param | |
| `locate-nested` | `noDependency` → `AppContext` third param | Has nested Kind hierarchy |
| `locate-standalone-member` | `noDependency` → `AppContext` third param | Uses standalone variables |
| `locate-path-override` | `noDependency` → `AppContext` third param | Uses `{ path: "value-objects" }` |
| `locate-multi-instance` | `noDependency` → `AppContext` third param | Multiple instances of same Kind |

**Validation:** `npm test -- tests/integration` passes. `npm test -- tests/e2e` passes.

---

### Step 10: Update integration and E2E tests

**Files to change:**

| File | Change |
|------|--------|
| `tests/integration/check-contracts.integration.test.ts` | Should pass without changes if fixtures are correct. Verify. |
| `tests/integration/tier2-contracts.integration.test.ts` | Should pass without changes if fixtures are correct. Verify. |
| `tests/integration/tier2-locate.integration.test.ts` | Should pass without changes if fixtures are correct. Verify. Rename to `tier2-instance.integration.test.ts`. |
| `tests/e2e/cli.e2e.test.ts` | Should pass without changes if fixtures are correct. Verify. |
| `tests/helpers/test-pipeline.ts` | Check if any references to `locate` or `defineContracts` exist and update. |

**Validation:** `npm test` — full suite passes.

---

### Step 11: Update other unit tests that reference old syntax

**Files to check and update:**

| File | Change |
|------|--------|
| `tests/unit/config-adapter.test.ts` | No changes expected (config adapter tests config file reading, not AST). |
| `tests/unit/get-plugin-diagnostics.service.test.ts` | Check for `locate`/`defineContracts` references in mock setups and update. |
| `tests/unit/check-contracts-dependency.test.ts` | No changes expected (uses `makeSymbol`/`noDependency` factories, not AST). |
| `tests/unit/check-contracts-implementation.test.ts` | No changes expected. |
| `tests/unit/check-contracts-purity.test.ts` | No changes expected. |

**Validation:** `npm test -- tests/unit` passes.

---

### Step 12: Remove dead code and references

**Files to change:**

| File | Change |
|------|--------|
| `src/application/ports/ast.port.ts` | Consider removing `isCallExpression`, `getCallExpressionName`, `getCallTypeArgumentNames`, `getCallArguments` if no longer used anywhere. Audit first. |
| `src/infrastructure/adapters/ast/ast.adapter.ts` | Remove implementations of methods removed from port (if any). |
| `src/infrastructure/adapters/testing/mock-ast.adapter.ts` | Remove `MockCallExpressionNode` if no longer used. Remove related implementations. |
| `src/infrastructure/cli/commands/check.command.ts` | Check for any references to old syntax in error messages or comments. |
| `src/infrastructure/cli/main.ts` | Check for references. |

**Audit procedure:** `grep -r "locate\|defineContracts" src/` — ensure zero references to the old function names in production code. Allow references in comments that describe the migration.

**Validation:** `npm run build` compiles. `npm test` passes.

---

### Step 13: Update notebooks

**Files to change:**

| File | Cells to update |
|------|----------------|
| `notebooks/01-quickstart.ipynb` | Update `BOILERPLATE` constant (if any), architecture.ts template in `cell-detect`, explanatory markdown cells (`cell-step1-heading`, `cell-generated-explanation`, `cell-part3-heading`), multi-instance examples in Part 2. Replace all `locate<T>()` with `satisfies InstanceConfig<T>`. Replace all `defineContracts<T>()` with type-level constraints. Update imports from `import { Kind, locate, defineContracts }` to `import type { Kind, InstanceConfig }`. |
| `notebooks/02-contracts.ipynb` | Update `BOILERPLATE` constant. Update every demo cell (A through F) — each creates an `architecture.ts` with old syntax. Replace `locate()` with `satisfies InstanceConfig`. Replace `defineContracts()` with type-level constraints or `satisfies ContractConfig`. Update the summary cell. |
| `notebooks/04-bounded-contexts.ipynb` | Update single-instance architecture, multi-instance architecture, workaround section. This notebook documents the multi-instance binding bug — update to reflect the new contract-on-Kind approach. |

**Key changes per notebook:**

**01-quickstart.ipynb:**
- `cell-detect`: The `architecture.ts` template changes from:
  ```typescript
  import { Kind, defineContracts, locate, MemberMap } from 'kindscript';
  // ...
  export const app = locate<CleanArchitectureContext>("src", { ... });
  export const contracts = defineContracts<CleanArchitectureContext>({ ... });
  ```
  To:
  ```typescript
  import type { Kind, InstanceConfig } from 'kindscript';
  // ...
  type DomainLayer = Kind<"DomainLayer">;  // no constraints (or { pure: true })
  type CleanArchitectureContext = Kind<"CleanArchitectureContext", { ... }, {
    noDependency: [["domain", "infrastructure"], ["domain", "application"]],
  }>;
  export const app = {
    root: "src",
    domain: {},
    application: {},
    infrastructure: {},
  } satisfies InstanceConfig<CleanArchitectureContext>;
  ```
- `cell-generated-explanation`: Update to describe the three sections (Kind definitions with constraints, instance declaration with satisfies, no separate contracts section).
- Standalone member and multi-instance examples: Update syntax.

**02-contracts.ipynb:**
- `BOILERPLATE` constant: Replace the entire ~30-line boilerplate with the new type definitions (ConstraintConfig, MemberMap, InstanceConfig, ContractConfig — no functions).
- Each demo cell (A-F): Move contract declarations from `defineContracts<T>({...})` to the Kind type's third parameter. Replace `locate<T>(...)` with `satisfies InstanceConfig<T>`.
- For purity (demo B): Use intrinsic `{ pure: true }` on DomainLayer instead of `purity: ["domain"]` in contracts.
- Summary cell: Update the combined example and table.

**04-bounded-contexts.ipynb:**
- Single-instance setup: Update syntax.
- Multi-instance setup: Contracts move to the Kind type. This inherently fixes the multi-instance binding bug documented in the notebook — when contracts are on the Kind type (not in a separate `defineContracts` call), every instance gets the same contracts automatically.
- Issues section: Update to note that the multi-instance bug is fixed by the redesign (contracts on Kind type bind to all instances).
- Workaround section: Can be removed or kept as historical context.

**Validation:** Run each notebook manually with `deno jupyter` to verify all cells execute without errors and `ksc check` produces expected results.

---

### Step 14: Update documentation

**Files to change:**

| File | Change |
|------|--------|
| `README.md` | Update Quick Start section: new `architecture.ts` example with `satisfies` syntax and type-level constraints. Update "Source Layout" to mention `InstanceConfig`/`ConstraintConfig`. Remove references to `locate` and `defineContracts` functions. |
| `CLAUDE.md` | Update "Project Overview" (version bump). Update "Directory Structure" to list new files. Update "Common Patterns" section with new test patterns. Update "Recent Changes" section. Update code examples throughout. |
| `docs/architecture/COMPILER_ARCHITECTURE.md` | Update binder/classifier description (Phase 1 now reads third type arg, constraint propagation step added; Phase 2 matches satisfies InstanceConfig; Phase 3 matches satisfies ContractConfig). |
| `docs/architecture/DESIGN_DECISIONS.md` | Add decision record for: contracts on Kind type (B+C), satisfies syntax (Option A from RUNTIME_MARKERS_OPTIONS), constraint propagation (D1). |
| `docs/architecture/BUILD_PLAN.md` | Add new milestone for the redesign. |
| `docs/status/DONE_VS_TODO.md` | Update Phase 2 (classifier description). Add new section for contracts-on-Kind-type redesign. |
| `docs/status/CODEBASE_REVIEW.md` | Update any references to locate/defineContracts as areas of concern. |
| `docs/status/CLEANUP_PLAN.md` | Mark the redesign as complete. Remove any cleanup items related to old syntax. |
| `docs/README.md` | Add `CONTRACTS_AND_LOCATION_REDESIGN_V2.md` to the design docs listing. Add `RUNTIME_MARKERS_OPTIONS.md` to the listing (if not already). |
| `tests/README.md` | Update test patterns — new mock methods (`withSatisfiesInstanceConfig`, `withSatisfiesContractConfig`). Update example code. |
| `tests/integration/fixtures/README.md` | Update fixture catalog — note that all fixtures use the new syntax. Update the boilerplate description. |

**Docs to archive:**

| File | Action |
|------|--------|
| `docs/design/CONTRACTS_AND_LOCATION_REDESIGN.md` (V1) | Move to `docs/archive/design/` |
| `docs/design/RUNTIME_MARKERS_OPTIONS.md` | Mark as "Decided — Implemented" at the top, leave in place or move to `docs/archive/design/` |
| `docs/design/KIND_DEFINITION_SYNTAX.md` | Already marked as "Decided — Implemented". Leave in place or move to `docs/archive/design/` |

**Validation:** Read through each updated doc to verify consistency. No broken links.

---

### Step 15: Final validation and cleanup

**Commands:**

```bash
# Full build
npm run build

# Full test suite — must pass 100%
npm test

# Coverage check — must meet thresholds
npm test -- --coverage

# Verify zero references to old functions in production code
grep -r "locate(" src/ --include="*.ts" | grep -v "// " | grep -v ".d.ts"
grep -r "defineContracts(" src/ --include="*.ts" | grep -v "// " | grep -v ".d.ts"

# Verify zero references to old functions in test fixtures
grep -r "locate(" tests/integration/fixtures/ --include="*.ts"
grep -r "defineContracts(" tests/integration/fixtures/ --include="*.ts"

# Verify compiled output has no runtime functions
# dist/index.js should be empty or minimal (type-only exports)
cat dist/index.js

# Verify notebooks (manual)
# cd notebooks && deno jupyter --run 01-quickstart.ipynb
# cd notebooks && deno jupyter --run 02-contracts.ipynb
# cd notebooks && deno jupyter --run 04-bounded-contexts.ipynb
```

**Expected results:**
- All tests pass (should be 248+ tests — new constraint propagation tests added)
- Coverage thresholds met
- Zero references to `locate()` or `defineContracts()` functions anywhere
- `dist/index.js` is empty or minimal
- All three notebooks run clean

---

### Step Summary

| Step | Description | Files | Risk |
|------|-------------|-------|------|
| 1 | Add ConstraintConfig + Kind third param | 1 | Low |
| 2 | Replace locate/defineContracts with types | 3 | Medium (breaking) |
| 3 | Add satisfies methods to AST port | 1 | Low |
| 4 | Implement satisfies in real AST adapter | 1 | Medium (TS compiler API) |
| 5 | Implement satisfies in mock AST adapter | 1 | Low |
| 6 | Rewrite classifier (all 3 phases) | 1 | High (core logic) |
| 7 | Update classifier unit tests | 3 | Medium (many tests) |
| 8 | Add AST adapter unit tests | 1 | Low |
| 9 | Convert all 18 fixtures | 18 | Medium (tedious) |
| 10 | Verify integration + E2E tests | 4 | Low |
| 11 | Update other unit tests | 5 | Low |
| 12 | Remove dead code | 5 | Low |
| 13 | Update notebooks | 3 | Medium |
| 14 | Update documentation | 11 | Low |
| 15 | Final validation | 0 | Low |

**Total files changed:** ~58 (18 fixtures + 12 source + 12 tests + 3 notebooks + 13 docs)

**Test count change:** ~248 existing + ~10-15 new tests for constraint extraction and propagation = ~260 tests

**Breaking changes:** All `architecture.ts` files (user-facing and fixtures) must be rewritten. No backward compatibility is maintained.

---

### Dependency Graph

```
Step 1 (Kind type)
  ↓
Step 2 (runtime types)
  ↓
Step 3 (AST port)
  ↓
Step 4 (real adapter)  ──→  Step 8 (adapter tests)
  ↓
Step 5 (mock adapter)
  ↓
Step 6 (classifier rewrite)
  ↓
Step 7 (classifier tests)
  ↓
Step 9 (fixture conversion)
  ↓
Step 10 (integration/E2E tests)  ──→  Step 11 (other unit tests)
  ↓
Step 12 (dead code removal)
  ↓
Step 13 (notebooks)  ──→  Step 14 (docs)
  ↓
Step 15 (final validation)
```

Steps 4 and 5 can be done in parallel. Steps 8 and 7 can overlap. Steps 13 and 14 can be done in parallel. All other steps are sequential.
