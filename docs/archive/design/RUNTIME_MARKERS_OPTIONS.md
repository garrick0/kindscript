# Options for Eliminating Runtime Marker Functions

> **Update (2026-02-07):** `ContractConfig<T>` has been removed from KindScript. All constraints are now declared exclusively on the Kind type's third parameter (`Kind<N, Members, Constraints>`). References to `ContractConfig<T>` and `satisfies ContractConfig<T>` in this document are historical -- the recommended approach (Option A) was implemented for `Instance<T>` but the additive `ContractConfig<T>` was subsequently removed rather than kept as a separate declaration mechanism. The Kind type is the single source of truth for all architectural rules.

> Everything KindScript does is purely static AST analysis. The `locate()` and `defineContracts()` functions are identity no-ops that never execute. This document explores options for removing or replacing them.

**Prerequisite decision:** Kind definitions moved from `interface X extends Kind<"X"> { ... }` to `type X = Kind<"X", { ... }>` (see `docs/design/KIND_DEFINITION_SYNTAX.md`, Option C — decided and implemented). This was a breaking change to the user API and classifier. All analysis below assumes the new Kind syntax.

---

## Current State (pre-change)

Users write `architecture.ts` files like this:

```typescript
import { Kind, locate, defineContracts, MemberMap, ContractConfig } from 'kindscript';

interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}
interface DomainLayer extends Kind<"DomainLayer"> {}
interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

export const app = locate<CleanContext>("src", {
  domain: {},
  infrastructure: {},
});

export const contracts = defineContracts<CleanContext>({
  noDependency: [["domain", "infrastructure"]],
  purity: ["domain"],
});
```

KindScript's AST classifier walks the source AST looking for:
1. Interfaces extending `Kind` (by name matching `getHeritageTypeNames()`)
2. Call expressions named `locate` (extracts type argument + object literal)
3. Call expressions named `defineContracts` (extracts type argument + config object)

**The classifier never executes these functions. It never uses the type checker. It is purely syntactic string-matching on AST node names.** The functions exist solely so TypeScript compiles the file without errors.

### What the identity functions actually cost

- `kindscript` must be installed as a real dependency (not just `devDependencies`)
- The `import { locate, defineContracts } from 'kindscript'` emits a `require("kindscript")` in the output JS
- If `architecture.ts` is accidentally bundled into production, the runtime no-ops ship with it
- The boilerplate in `infer-architecture.service.ts` (lines 66-93) is a hardcoded string copy of these functions, creating a sync problem (issue C1 from the codebase review)

### What the Kind syntax change means for this decision

The Kind syntax change is already breaking. Users must rewrite every Kind definition:

```diff
- interface DomainLayer extends Kind<"DomainLayer"> {}
+ type DomainLayer = Kind<"DomainLayer">;

- interface CleanContext extends Kind<"CleanContext"> {
-   domain: DomainLayer;
-   infrastructure: InfrastructureLayer;
- }
+ type CleanContext = Kind<"CleanContext", {
+   domain: DomainLayer;
+   infrastructure: InfrastructureLayer;
+ }>;
```

Since every `architecture.ts` file must be rewritten anyway, the incremental cost of also changing `locate()` → `satisfies` is near zero. The "non-breaking" argument for a gradual migration no longer applies. This makes it practical to change everything at once.

Additionally, the classifier is already being rewritten to handle type alias nodes (`SatisfiesExpression` recognition requires similar scope of work). Adding `SatisfiesExpression` support alongside the type alias changes is a natural extension, not a separate effort.

---

## Option A: `satisfies` + `import type` (Recommended)

Replace function calls with plain object literals validated by `satisfies`. All imports become `import type` (fully erased from output).

### User code

```typescript
import type { Kind, Instance, ContractConfig } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type ShopContext = Kind<"ShopContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

export const shop = {
  root: "src",
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<ShopContext>;

export const contracts = {
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
} as const satisfies ContractConfig<ShopContext>;
```

Every import is `import type`. The entire file is type-level declarations + plain object literals. Zero runtime dependency on `kindscript`.

### New types needed

Two new types replace the two deleted functions:

```typescript
// Replaces locate<T>(root, members)
// Instance<T> = { root: string } + member slots from Kind
type Instance<T extends Kind> = { root: string } & MemberMap<T>;

// Replaces defineContracts<T>(config)
// ContractConfig<T> adds a phantom type parameter for classifier linkage
type ContractConfig<_T extends Kind = Kind> = {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
};
```

`Instance<T>` gives the same type safety as `locate<T>(root, members)` — it validates that the object has the correct member properties for the Kind. The `root` property replaces the first argument of `locate()`.

`ContractConfig<T>` adds a phantom type parameter `_T`. The classifier reads `_T` from the `SatisfiesExpression`'s type reference to associate contracts with the correct Kind. The parameter is unused at the type level (same as `defineContracts<_T>` today).

### How the classifier finds things

The AST classifier looks for `SatisfiesExpression` nodes instead of `CallExpression` nodes:

- **Instance declarations:** Variable with initializer that is a `SatisfiesExpression` where the type reference is `Instance<T>`. The type argument `T` gives the Kind name. The `root` property in the object gives the base path. The remaining properties are members.
- **Contract declarations:** Variable with initializer that is a `SatisfiesExpression` where the type reference is `ContractConfig<T>`. The type argument `T` gives the Kind name. The object properties contain the contract definitions (same structure as today).

TypeScript's AST for `{ ... } satisfies Instance<ShopContext>` produces a `SatisfiesExpression` node with:
- `.expression` = the object literal (all the data)
- `.type` = `TypeReference` with name `Instance` and type argument `ShopContext`

This provides the same information the classifier currently extracts from `locate<ShopContext>("src", { ... })`.

### Emitted JS

```javascript
// Zero imports. Zero function calls. Just data.
exports.shop = {
    root: "src",
    domain: {},
    application: {},
    infrastructure: {},
};
exports.contracts = {
    noDependency: [["domain", "infrastructure"], ["domain", "application"], ["application", "infrastructure"]],
    purity: ["domain"],
};
```

### What `src/runtime/` becomes

After both the Kind syntax change and the `satisfies` change, the runtime directory contains only type definitions:

| File | Before | After |
|------|--------|-------|
| `kind.ts` | `interface Kind<N>` | `type Kind<N, Members>` (still a type — no change in runtime presence) |
| `locate.ts` | `MemberMap<T>` type + `locate()` function | `MemberMap<T>` type + `Instance<T>` type (no function) |
| `define-contracts.ts` | `ContractConfig` interface + `defineContracts()` function | `ContractConfig<T>` type (no function) |

Everything in `src/runtime/` becomes purely type-level. The directory could be renamed to `src/types/` to reflect this.

### What `src/index.ts` becomes

```typescript
// Before:
export { Kind } from './runtime/kind';
export { defineContracts, ContractConfig } from './runtime/define-contracts';
export { locate, MemberMap } from './runtime/locate';

// After:
export type { Kind } from './runtime/kind';
export type { ContractConfig } from './runtime/define-contracts';
export type { MemberMap, Instance } from './runtime/locate';
```

All exports are `export type`. The compiled `index.js` is effectively empty. `kindscript` has zero runtime footprint.

### How C1 (boilerplate sync problem) is resolved

The `infer-architecture.service.ts` boilerplate (lines 66-93) currently hardcodes function source text. With the new approach, it only needs to emit type declarations:

```typescript
private generateBoilerplate(): string {
  return `type Kind<
  N extends string = string,
  Members extends Record<string, Kind> = Record<string, never>,
> = {
  readonly kind: N;
  readonly location: string;
} & Members;

type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};

type Instance<T extends Kind> = { root: string } & MemberMap<T>;

type ContractConfig<_T extends Kind = Kind> = {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
};
`;
}
```

This is still a hardcoded string (the boilerplate is still duplicated), but the risk of silent divergence is lower because:
1. Type definitions change less frequently than function implementations
2. There are no function bodies, `void root` hacks, or identity-return patterns to drift
3. The types are structural — any mismatch between the inlined types and the real types causes immediate TypeScript errors in generated files, rather than silent behavioral differences

The boilerplate could be fully eliminated by reading the type definitions from the source files at build time, but that's a separate improvement.

### Migration for stdlib packages

```typescript
// Before (packages/clean-architecture/index.ts)
import { Kind, ContractConfig, defineContracts, locate, MemberMap } from 'kindscript';
export { locate, MemberMap };

export interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}
export interface DomainLayer extends Kind<"DomainLayer"> {}
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

export const cleanArchitectureContracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
});

// After
import type { Kind, Instance, ContractConfig } from 'kindscript';
export type { Instance };

export type DomainLayer = Kind<"DomainLayer">;
export type ApplicationLayer = Kind<"ApplicationLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

export const cleanArchitectureContracts = {
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
} as const satisfies ContractConfig<CleanContext>;
```

The stdlib package becomes entirely type exports + one plain object. Its compiled JS is a single object literal. No function imports, no re-exports of `locate` or `MemberMap`.

### What changes (combined with Kind syntax change)

| Aspect | Before (current) | After (both changes) |
|--------|-------------------|----------------------|
| Kind definitions | `interface X extends Kind<"X"> { ... }` | `type X = Kind<"X", { ... }>` |
| Kinds (no members) | `interface X extends Kind<"X"> {}` | `type X = Kind<"X">` |
| Instance declaration | `locate<T>(root, members)` | `{ root, ...members } satisfies Instance<T>` |
| Contract declaration | `defineContracts<T>(config)` | `config satisfies ContractConfig<T>` |
| Import style | `import { Kind, locate, ... }` (value import) | `import type { Kind, ... }` (erased) |
| Runtime dependency | Required | None |
| Emitted JS | `require("kindscript")` + function calls | Plain object literals, no imports |
| `src/runtime/` contents | 2 interfaces + 1 type + 2 functions | 4 types, 0 functions |
| Classifier Phase 1 | `isInterfaceDeclaration` + heritage check | `isTypeAliasDeclaration` + reference check |
| Classifier Phase 2 | `CallExpression` named `locate` | `SatisfiesExpression` typed `Instance<T>` |
| Classifier Phase 3 | `CallExpression` named `defineContracts` | `SatisfiesExpression` typed `ContractConfig<T>` |
| Boilerplate (C1) | Hardcoded function source text | Hardcoded type definitions (simpler, lower risk) |
| TS version requirement | Any TS 5.x | TS 4.9+ (for `satisfies`) |

### Pros

- **Zero runtime dependency.** `kindscript` becomes a purely dev-time tool. All imports are `import type`, fully erased.
- **Resolves C1.** Generated boilerplate is type-only — simpler, less likely to drift, and any mismatch causes immediate compile errors rather than silent behavioral differences.
- **Clean emitted JS.** No function calls, no `require()`, just plain objects.
- **Works with all transpilers.** Babel, SWC, esbuild, and Node.js type stripping all handle `import type` + `satisfies` since they're erasable syntax.
- **Near-zero incremental cost.** The Kind syntax change already requires rewriting every `architecture.ts` file and the classifier. Adding `satisfies` support is a natural extension of the same work.
- **The `as const satisfies` pattern is increasingly standard** in the TypeScript ecosystem (Prisma, Drizzle, etc.).
- **`src/runtime/` becomes purely type-level.** Can be renamed to `src/types/`. The package has no runtime code at all.
- **Compatible with `verbatimModuleSyntax` and `isolatedModules`.** All imports are `import type`, so there's no ambiguity about whether an import is used as a value.

### Cons

- **Breaking change to user API.** But this is already true due to the Kind syntax change — the incremental breakage from `locate()` → `satisfies` is minimal.
- **`satisfies` requires TS 4.9+.** In practice this is fine (TS 4.9 released Nov 2022), but worth noting.
- **Loses the "function call" semantic marker.** `locate()` and `defineContracts()` are self-documenting names. With `satisfies`, the distinction comes from the type name (`Instance` vs `ContractConfig`) rather than the function name. However, these type names are equally descriptive.
- **`root` moves from a function argument to an object property.** `locate<T>("src", { ... })` puts the root path in a prominent position (first argument). `{ root: "src", domain: {}, ... } satisfies Instance<T>` puts it inline with the members. This is slightly less visually distinct but arguably more consistent (root is just another property of the instance).

---

## Option B: Keep Functions, Make Them Declaration-Only

Keep the `locate()` / `defineContracts()` call syntax but ship them as ambient declarations (`.d.ts`) with no runtime JavaScript.

### User code

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;

export const app = locate<CleanContext>("src", {
  domain: {},
  infrastructure: {},
});
```

Kind definitions use the new syntax, but `locate()` and `defineContracts()` remain as call expressions.

### How it works

The `kindscript` package would ship:
- `index.d.ts` with `declare function locate<T>(...): ...` and `declare function defineContracts<T>(...): ...`
- **No `index.js`** (or a minimal stub that throws "this module is not meant to be executed")

### Emitted JS

```javascript
// Crashes at runtime:
const kindscript_1 = require("kindscript");
exports.app = (0, kindscript_1.locate)("src", { ... });
```

### Pros

- **No change to instance/contract syntax.** Only the Kind definitions change (already decided).
- **No change to Phase 2/3 of the classifier.** Only Phase 1 changes (for the Kind syntax).

### Cons

- **Emitted JS is broken.** If `architecture.ts` is imported at runtime, it crashes with `ReferenceError`.
- **Still requires `kindscript` installed** for TypeScript to resolve the `import`.
- **`import { locate }` is a value import** — incompatible with `verbatimModuleSyntax` if there's no JS backing.
- **Doesn't fix C1.** Boilerplate generation still needs function source text.
- **Misses the opportunity.** We're already rewriting the classifier and breaking the API. Not changing the markers at the same time leaves dead weight that must be addressed later.

---

## Option C: Custom TypeScript Transformer (Strip at Emit)

Keep `locate()` and `defineContracts()` in source code, but strip them during compilation.

### User code

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
}>;

export const app = locate<CleanContext>("src", { domain: {} });
```

A custom transformer replaces `locate(root, members)` → `members` and `defineContracts(config)` → `config` at emit time.

### Pros

- **No change to instance/contract syntax.** Only Kind definitions change.
- **Clean emitted JS** — the transformer produces the same output as Option A.

### Cons

- **Does not work in IDE/language service.** TypeScript's plugin API doesn't expose transformer hooks.
- **Requires `ts-patch` for vanilla `tsc`.** Extra dependency.
- **Doesn't work with Babel/SWC/esbuild.** These transpilers don't run TypeScript transformers.
- **Doesn't fix C1.** Same boilerplate issue.
- **Adds a moving part** (the transformer) when Option A eliminates the problem entirely with zero moving parts.

---

## Option D: DSL File Format

Eliminated. The Kind syntax decision doubles down on TypeScript as the definition language. A custom DSL contradicts this direction.

---

## Comparison Matrix

| | A: `satisfies` | B: Decl-only | C: Transformer |
|---|---|---|---|
| **Incremental API change** (beyond Kind syntax) | Instance + contract syntax | None | None |
| **Runtime dependency** | None | Install-only | None (with transformer) |
| **Clean emitted JS** | Yes | No (crashes) | Yes |
| **Classifier changes** (beyond Kind syntax) | Phase 2 + 3 rewrite | None | None |
| **Works with Babel/SWC** | Yes | Partial | No |
| **IDE type-checking** | Full | Full | Full |
| **Fixes C1 (boilerplate)** | Yes | No | No |
| **`verbatimModuleSyntax` compatible** | Yes | No | No |
| **Total moving parts** | 0 (pure types) | 1 (stub package) | 1 (transformer) |
| **Migration effort** (incremental over Kind change) | Low | None | Low |

---

## Recommendation

**Option A. Do it at the same time as the Kind syntax change.**

The Kind syntax decision already requires:
- Rewriting every `architecture.ts` file (user code, fixtures, stdlib packages)
- Rewriting Phase 1 of the classifier (type alias instead of interface)
- Rewriting the mock AST adapter
- Updating all tests and docs

Adding `satisfies` support on top of this is a modest incremental effort:
- Phase 2 and 3 of the classifier change from `CallExpression` matching to `SatisfiesExpression` matching (same scope of work as Phase 1)
- Two new types (`Instance<T>`, `ContractConfig<T>`) replace two deleted functions
- The same files that are already being rewritten (fixtures, stdlib packages, tests) get the `satisfies` syntax at the same time

The result is a fundamentally cleaner architecture: `kindscript` exports only types, has zero runtime code, and every `import` in user code is `import type`. There is no reason to do the Kind syntax change now and defer the marker change to later — it's strictly less work to do them together.

### Combined end state

After both changes, a complete `architecture.ts` looks like:

```typescript
import type { Kind, Instance, ContractConfig } from 'kindscript';

// Kind definitions
type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type ShopContext = Kind<"ShopContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

// Instance
export const shop = {
  root: "src",
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<ShopContext>;

// Contracts
export const contracts = {
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
} as const satisfies ContractConfig<ShopContext>;
```

Emitted JS:

```javascript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shop = {
    root: "src",
    domain: {},
    application: {},
    infrastructure: {},
};
exports.contracts = {
    noDependency: [
        ["domain", "infrastructure"],
        ["domain", "application"],
        ["application", "infrastructure"],
    ],
    purity: ["domain"],
};
```

No `require("kindscript")`. No function calls. Just data.

### What gets deleted

| File | Outcome |
|------|---------|
| `src/runtime/locate.ts` | `locate()` function deleted. `MemberMap<T>` type stays. `Instance<T>` type added. |
| `src/runtime/define-contracts.ts` | `defineContracts()` function deleted. `ContractConfig` becomes `ContractConfig<T>` (phantom param). |
| `src/runtime/kind.ts` | `Kind` changes from interface to type alias with second parameter (Kind syntax change). |
| `src/index.ts` | All `export` become `export type`. Compiled JS is empty. |

### Open questions

1. **Should `Instance` be named something else?** Alternatives: `Instance<T>`, `Layout<T>`, `Mapping<T>`. `Instance` matches the existing terminology ("Kind instance" is the term for a located Kind).

2. **Should `ContractConfig` stay non-generic for inline fixtures?** Test fixtures that inline the boilerplate don't always have a Kind to link to. The phantom `_T` parameter defaults to `Kind`, so `satisfies ContractConfig` (no type argument) still works. The classifier would then infer the Kind association from context.

3. **Should `root` be a separate property or the first tuple element?** Current: `locate<T>("src", members)` — root is a separate argument. Proposed: `{ root: "src", ...members } satisfies Instance<T>` — root is a property. Alternative: `["src", { domain: {}, ... }] satisfies Instance<T>` — root is first element of a tuple. The property approach is the clearest.

---

**Date:** 2026-02-07
