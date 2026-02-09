# Distributed Definition Files

> Design exploration: auto-discovered, filesystem-rooted definition files

**Status:** Implemented
**Date:** 2026-02-07

---

## Problem Statement

KindScript currently requires a centralized configuration model:

1. A `kindscript.json` file must exist at the project root
2. It must explicitly enumerate every definition file: `"definitions": ["architecture.ts"]`
3. Each instance must manually specify a `root` property: `{ root: "src", ... }`
4. The filename `architecture.ts` is a soft convention with no enforcement

This creates friction in larger projects:

- **Central bottleneck** — every team/module must coordinate through one `kindscript.json`
- **Manual bookkeeping** — adding a new bounded context means editing `kindscript.json`
- **Redundant information** — the `root` in `InstanceConfig` is usually derivable from where the file lives
- **No compositional scaling** — monorepo with 20 bounded contexts means 20 entries in one JSON file

TypeScript itself solved an analogous problem. Early TypeScript required `files: [...]` in `tsconfig.json`. Later it added `include` globs, and then project references for compositional scaling. KindScript should learn from this trajectory.

---

## Proposal: Convention-Based Discovery

Instead of requiring explicit enumeration, KindScript discovers definition files by **filename convention** — any file matching the pattern is automatically treated as a definition file.

### How It Works

```
my-project/
├── tsconfig.json
├── src/
│   ├── ordering/
│   │   ├── ordering.k.ts          ← auto-discovered
│   │   ├── domain/
│   │   │   └── order.ts
│   │   └── infrastructure/
│   │       └── order-repo.ts
│   ├── billing/
│   │   ├── billing.k.ts           ← auto-discovered
│   │   ├── domain/
│   │   │   └── invoice.ts
│   │   └── adapters/
│   │       └── payment-gateway.ts
│   └── shared/
│       └── shared.k.ts            ← auto-discovered
```

Each `.k.ts` file defines the architectural rules for its subtree. **No `kindscript.json` needed.** No `root` property needed — the root is the directory containing the file.

### What a Definition File Looks Like (Before vs After)

**Before (centralized):**

```typescript
// architecture.ts (at project root, listed in kindscript.json)
import type { Kind, ConstraintConfig, InstanceConfig } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const ordering = {
  root: "src/ordering",        // ← must manually specify
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
```

**After (distributed):**

```typescript
// src/ordering/ordering.k.ts (auto-discovered, root inferred as "src/ordering/")
import type { Kind, ConstraintConfig, InstanceConfig } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const ordering = {
  domain: {},                  // ← no root needed
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
```

The `root` is inferred as the directory containing `ordering.k.ts`.

---

## Design Decision 1: File Naming Convention

The specifier must be **valid TypeScript** (so editors, linters, and `tsc` can process it) while being **unambiguously identifiable** as a KindScript definition file.

### Options

| Option | Example | Pros | Cons |
|--------|---------|------|------|
| **`.k.ts`** | `ordering.k.ts` | Short, distinctive, mirrors `.d.ts` pattern | Slightly cryptic to newcomers |
| **`.kind.ts`** | `ordering.kind.ts` | Self-documenting, clearly KindScript | Verbose, could collide with user code about "kinds" |
| **`.ks.ts`** | `ordering.ks.ts` | Short, recognizable abbreviation | "ks" is ambiguous (Kotlin Script uses `.kts`) |
| **`.ksc.ts`** | `ordering.ksc.ts` | Matches CLI name (`ksc`) | Slightly longer, "ksc" less memorable than "kind" |
| **`.arch.ts`** | `ordering.arch.ts` | Describes purpose (architecture) | Not KindScript-specific; could conflict |

### Recommendation: `.k.ts`

**Rationale:**

1. **Precedent in TypeScript ecosystem.** TypeScript uses `.d.ts` for declaration files — a two-part extension where the first part (`.d`) signals the file's role. `.k.ts` follows the exact same pattern: the `.k` signals "this is a Kind definition" while `.ts` ensures tooling compatibility.

2. **Minimal yet distinctive.** A single character is enough to be unambiguous. No real-world TypeScript file would accidentally end in `.k.ts`. Compare to `.kind.ts` where a user might legitimately have a file named `product.kind.ts` meaning "the kind of product."

3. **Ergonomic.** In imports and CLI output, `ordering.k.ts` is quick to read and type. Files sort naturally alongside their siblings.

4. **Memorable connection.** `k` → Kind. Just as `d` → Declaration in `.d.ts`.

### Alternative Worth Considering: `.kind.ts`

If discoverability and onboarding matter more than brevity, `.kind.ts` is the self-documenting alternative. A new team member seeing `ordering.kind.ts` immediately understands its purpose. The tradeoff is verbosity and a small collision risk with user-domain concepts.

---

## Design Decision 2: Root Inference

### Current Model

```typescript
export const app = {
  root: "src",           // ← explicit, relative to project root
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanContext>;
```

The `root` property is resolved relative to the project root (where `kindscript.json` lives). This is necessary in the centralized model because the definition file could live anywhere relative to the directories it governs.

### Distributed Model

When the definition file lives **inside** the subtree it governs, root becomes redundant:

```
src/ordering/ordering.k.ts   → root is "src/ordering/"
src/billing/billing.k.ts     → root is "src/billing/"
src/shared/shared.k.ts       → root is "src/shared/"
```

**Inference rule:** The root is the **directory containing the `.k.ts` file**.

### InstanceConfig Changes

**Decision: Drop `root` entirely.**

```typescript
// Before: InstanceConfig<T> = { root: string } & MemberMap<T>
export const ordering = {
  root: "src/ordering",
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;

// After: InstanceConfig<T> = MemberMap<T>
export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
```

`InstanceConfig<T>` becomes a pure alias for `MemberMap<T>`:

```typescript
export type InstanceConfig<T extends Kind> = MemberMap<T>;
```

The root is **always** the directory containing the `.k.ts` file. There is no override mechanism — if you need a different root, move the `.k.ts` file to the right directory. This enforces a clean 1:1 relationship between definition files and the subtrees they govern.

This simplifies the mental model: a `.k.ts` file **is** the architectural declaration for its directory, period. No indirection, no "this file governs a directory somewhere else." The filesystem layout is the source of truth.

---

## Design Decision 3: Discovery Mechanism

How does KindScript find all `.k.ts` files?

### Option A: Glob-Based Discovery (No Config File)

KindScript scans the project for `**/*.k.ts` starting from the working directory (or from `tsconfig.json`'s `rootDir`/`include` patterns).

**Pros:**
- Zero configuration — just create a `.k.ts` file and it works
- Matches mental model of "convention over configuration"

**Cons:**
- Must scan the filesystem (performance concern in large monorepos)
- No way to exclude files without introducing config
- `node_modules` must be excluded (standard ignore patterns needed)

### Option B: TypeScript Program-Driven Discovery

Instead of filesystem scanning, piggyback on the TypeScript program. Any `.k.ts` file included in the TS compilation (via `tsconfig.json` `include` patterns) is automatically treated as a definition file.

**Pros:**
- No new discovery mechanism — uses the same file set TypeScript already knows about
- Respects existing `include`/`exclude` patterns
- Works naturally with project references
- No additional filesystem scanning

**Cons:**
- Requires that `.k.ts` files are included in the TS program (usually automatic)
- Slightly less "magical" — users must ensure their tsconfig includes the files (but this is almost always already true)

### Option C: Hybrid (Default to Glob, Optional Config)

By default, scan for `**/*.k.ts`. Allow an optional `kindscript.json` for advanced scenarios (explicit file lists, custom patterns, exclusions).

```json
// Optional kindscript.json — only needed for non-standard setups
{
  "include": ["src/**/*.k.ts"],
  "exclude": ["src/legacy/**"]
}
```

**Pros:**
- Works out of the box for simple projects
- Scales to complex setups with config override

**Cons:**
- Two discovery modes to maintain and document

### Recommendation: Option B (TypeScript Program-Driven)

This is the most elegant and least surprising approach. TypeScript already knows which files are in the project. KindScript simply filters for `.k.ts` files within that set. No new config format, no filesystem scanning, no discovery surprises. If a file is compiled by `tsc`, it's governed by `ksc`.

This also naturally handles monorepo project references — each `tsconfig.json` project includes its own `.k.ts` files.

---

## Design Decision 4: Cross-File References

In the centralized model, one file defines everything, so cross-references are trivial. In the distributed model, we need to handle:

1. **Shared Kind definitions** — `DomainLayer` used across multiple bounded contexts
2. **Cross-context contracts** — "ordering.domain cannot depend on billing.infrastructure"

### Shared Kind Definitions

Kind types are just TypeScript type aliases. Standard TypeScript `import type` handles this:

```typescript
// src/shared/kinds.k.ts (or a non-.k.ts shared file)
export type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;
```

```typescript
// src/ordering/ordering.k.ts
import type { DomainLayer, InfrastructureLayer } from '../shared/kinds.k';

export type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;

export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
```

This works today — the classifier follows TypeScript type resolution. No special mechanism needed.

### Cross-Context Contracts

For contracts that span multiple bounded contexts (e.g., "ordering cannot depend on billing"), a higher-level `.k.ts` file can reference instances from child contexts:

```
src/
├── boundaries.k.ts              ← cross-context contracts
├── ordering/
│   └── ordering.k.ts
└── billing/
    └── billing.k.ts
```

```typescript
// src/boundaries.k.ts
import type { Kind } from 'kindscript';

// Define a higher-level Kind that composes bounded contexts
export type SystemBoundary = Kind<"SystemBoundary", {
  ordering: OrderingContext;
  billing: BillingContext;
}, {
  noDependency: [["ordering", "billing"], ["billing", "ordering"]];
}>;
```

This is a natural extension — the hierarchical Kind system already supports arbitrary nesting. A "system-level" `.k.ts` file simply defines a Kind whose members are other Kinds.

---

## Design Decision 5: Retain `kindscript.json`

Even though `definitions` enumeration goes away, `kindscript.json` remains valuable as the home for **project-level configuration**.

### What Changes

| Field | Status |
|-------|--------|
| `definitions` | **Removed** — auto-discovered via `.k.ts` convention |
| `rootDir` | Kept — override for TS program root |
| `compilerOptions` | Kept — merge overrides for compiler |
| *(future settings)* | New home for configurable behavior |

### Rationale

KindScript will inevitably need project-level settings that don't belong in individual `.k.ts` files:

- **Severity levels** — treat certain violations as warnings vs errors
- **Ignore patterns** — exclude paths from enforcement
- **Plugin configuration** — language service plugin behavior
- **Reporting format** — output format for CI (JSON, SARIF, etc.)
- **Custom diagnostic messages** — project-specific error text
- **Extension points** — custom contract type registrations

These are concerns of the **project** (or the team's workflow), not of any single architectural boundary. Putting them in `kindscript.json` follows the well-established pattern of tool-level config files (`eslint.config.js`, `jest.config.js`, `prettier.json`).

### New Shape

```json
{
  "compilerOptions": {
    "rootDir": "src"
  }
}
```

The `definitions` field is removed. Discovery is convention-based. Everything else stays (and new fields will be added as features require them).

The CLI flow becomes:

```bash
# kindscript.json is optional — used for settings, not file discovery
ksc check

# If no kindscript.json exists, KindScript uses defaults + tsconfig.json
ksc check
```

---

## Impact Analysis

### What Changes

| Component | Current | Distributed |
|-----------|---------|-------------|
| Config file | `kindscript.json` required (with `definitions`) | `kindscript.json` optional (settings only, no `definitions`) |
| Definition files | `architecture.ts` (soft convention) | `*.k.ts` (enforced convention, auto-discovered) |
| Root property | Required in every instance | Removed — always inferred from file location |
| `InstanceConfig<T>` | `{ root: string } & MemberMap<T>` | `MemberMap<T>` |
| Discovery | Explicit enumeration in JSON | Convention-based within TS program |
| Cross-context | All in one file | Import + compose via Kind hierarchy |
| CLI entry | `ksc check [path]` | `ksc check [path]` (unchanged) |

### What Doesn't Change

- Kind type system (`Kind<N, Members, Constraints>`)
- Instance declarations (`satisfies InstanceConfig<T>`)
- Constraints declared on Kind type's 3rd parameter
- All six contract types (noDependency, mustImplement, purity, noCycles, filesystem.exists, filesystem.mirrors)
- The constraint propagation mechanism
- Member path derivation algorithm

### Migration Path

1. **Phase 1 — Core type + AST changes.** Remove `root` from `InstanceConfig`. Update the classifier to infer root from the source file path. Add `.k.ts` file filtering. All existing tests updated.

2. **Phase 2 — Discovery pipeline.** Replace `definitions`-driven discovery in `ClassifyProjectService` with `.k.ts` convention-based discovery. Remove `definitions` from `KindScriptConfig`. Update CLI.

3. **Phase 3 — Fixture + test migration.** Rename all `architecture.ts` fixtures to `*.k.ts`. Update all test helpers, integration tests, and E2E tests.

### Code Changes Required

| File | Change |
|------|--------|
| `src/runtime/locate.ts` | Remove `root` from `InstanceConfig<T>` (becomes alias for `MemberMap<T>`) |
| `src/application/use-cases/classify-ast/` | Infer root from source file directory path (no more `root` property parsing) |
| `src/application/use-cases/classify-project/` | Replace `definitions` enumeration with `.k.ts` filtering of TS program source files |
| `src/application/ports/config.port.ts` | Remove `definitions` from `KindScriptConfig` |
| `src/infrastructure/adapters/config/` | Stop reading `definitions` field |
| `src/infrastructure/cli/main.ts` | Support running when `kindscript.json` has no `definitions` |
| All fixture `architecture.ts` files | Rename to `*.k.ts`, remove `root` from instances |
| `tests/helpers/fixtures.ts` | Update fixture paths |
| All test files | Update references to fixture definition files |

---

## Comparison: How TypeScript Does It

| Aspect | TypeScript | KindScript (Proposed) |
|--------|------------|----------------------|
| Config file | `tsconfig.json` | `kindscript.json` (settings only, no file enumeration) |
| File convention | `.ts`, `.d.ts` | `.k.ts` |
| Discovery | `include` globs in tsconfig | `.k.ts` files within TS program |
| Root inference | `rootDir` in tsconfig | Directory of `.k.ts` file (always) |
| Composition | Project references (`references: [...]`) | Kind hierarchy + imports |
| Distributed configs | Yes (`tsconfig.json` per package) | Yes (`.k.ts` per bounded context) |

The parallel is deliberate. Just as `.d.ts` files declare type information without runtime behavior, `.k.ts` files declare architectural information without runtime behavior. Both are discovered by convention, both compose naturally through the module system.

---

## Open Questions

1. **Should `.k.ts` files be excluded from the emitted output?** They contain only types, so `tsc` already strips them from `.js` output. But should `ksc` explicitly verify this?

2. **What happens when a `.k.ts` file has no instances?** (e.g., a shared Kinds library.) Should it be silently ignored, or should the classifier treat it as a "type-only" definition file?

3. **Performance.** Filtering the TS program for `.k.ts` files is O(n) over source files. Is this fast enough for large monorepos with 10,000+ files? (Likely yes — it's a simple string suffix check.)

4. **IDE integration.** The language service plugin currently uses `kindscript.json` to know which files to classify. With convention-based discovery, the plugin would need to filter the project's source files by extension. This is straightforward but needs implementation.

5. **Should the prefix part of the filename matter?** e.g., must `src/ordering/ordering.k.ts` match the directory name? Or is `src/ordering/foo.k.ts` fine? (Recommendation: any name is fine — the directory is what matters, not the filename prefix.)

---

## Summary of Decisions

| Decision | Choice |
|----------|--------|
| File extension | **`.k.ts`** — short, distinctive, follows `.d.ts` precedent |
| Root inference | **Drop `root` entirely** — always inferred from `.k.ts` file location |
| Discovery | **TypeScript program-driven** — filter TS source files by `.k.ts` extension |
| Cross-file references | **Standard imports** — TypeScript's module system handles it |
| Config file | **Retain `kindscript.json`** — for project-level settings (not file discovery) |
| Migration | **Three-phase** — types, discovery pipeline, fixtures/tests |

---

## Implementation Plan

### Step 1: Remove `root` from `InstanceConfig<T>`

**Files:**
- `src/runtime/locate.ts` — Change `InstanceConfig<T>` from `{ root: string } & MemberMap<T>` to `MemberMap<T>`

**Rationale:** This is the foundational type change. Everything downstream depends on this.

### Step 2: Update `ClassifyASTService` to Infer Root from File Location

**Files:**
- `src/application/use-cases/classify-ast/classify-ast.service.ts`
- `src/application/use-cases/classify-ast/classify-ast.types.ts`

**Changes:**
- `ClassifyASTRequest` already has `projectRoot` — add the source file's own path so the classifier knows the directory
- In `classifySatisfiesInstance()`: stop looking for a `root` property in the object literal. Instead, derive root from the source file's directory (the directory containing the `.k.ts` file)
- `resolveLocation()` uses the source file's directory as the base for member path derivation
- Remove the error for missing `root` property

### Step 3: Update `ClassifyProjectService` for `.k.ts` Discovery

**Files:**
- `src/application/use-cases/classify-project/classify-project.service.ts`
- `src/application/ports/config.port.ts`

**Changes:**
- Remove requirement for `definitions` in `KindScriptConfig`
- Instead of reading definition paths from config, filter the TypeScript program's source files for files ending in `.k.ts`
- If `kindscript.json` doesn't exist, still proceed (read `tsconfig.json` directly)
- If `kindscript.json` exists but has no `definitions`, use `.k.ts` discovery
- Remove the "No definitions found" error

### Step 4: Update Config Adapter

**Files:**
- `src/infrastructure/adapters/config/config.adapter.ts`

**Changes:**
- `readKindScriptConfig()` becomes optional — returning `undefined` is fine (means "use defaults")
- Remove logic that depends on `definitions` field

### Step 5: Update CLI

**Files:**
- `src/infrastructure/cli/commands/check.command.ts`
- `src/infrastructure/cli/main.ts`

**Changes:**
- `check` command works without `kindscript.json` (falls back to tsconfig.json + `.k.ts` discovery)
- Update help text to describe `.k.ts` convention

### Step 6: Update Mock Adapters

**Files:**
- `src/infrastructure/adapters/testing/mock-config.adapter.ts`
- `src/infrastructure/adapters/testing/mock-ast.adapter.ts`

**Changes:**
- Mock config adapter stops requiring `definitions`
- Mock AST/config adapters updated to match new interfaces

### Step 7: Rename Fixture Definition Files

**Files:**
- All `tests/integration/fixtures/*/architecture.ts` → `*.k.ts`
- `tests/helpers/fixtures.ts` — update all fixture path constants
- All `tests/integration/fixtures/*/kindscript.json` — remove `definitions` field (or remove entirely if only `definitions` was present)

**Changes:**
- Each fixture's `architecture.ts` is renamed to `<name>.k.ts` (e.g., `clean-arch-valid/clean-arch.k.ts`)
- Remove `root` property from all instance declarations in fixture files
- Update `kindscript.json` files (remove `definitions`, keep other fields if present)

### Step 8: Update Unit Tests

**Files:**
- `tests/unit/classify-ast-kind-parsing.test.ts`
- `tests/unit/classify-ast-contracts.test.ts`
- `tests/unit/classify-ast-locate.test.ts`
- `tests/unit/config-adapter.test.ts`
- `tests/unit/classify-project.service.test.ts`
- Any other unit tests referencing `root` or `definitions`

**Changes:**
- Update test inputs to not include `root` in instance declarations
- Update mock source file names to use `.k.ts` extension
- Update assertions that expect `root` in parsed results
- Add tests for root-inference-from-file-path behavior
- Add tests for `.k.ts` discovery (no definitions needed)

### Step 9: Update Integration Tests

**Files:**
- `tests/integration/check-contracts.integration.test.ts`
- `tests/integration/tier2-contracts.integration.test.ts`
- `tests/integration/tier2-locate.integration.test.ts`

**Changes:**
- Update to use renamed `.k.ts` fixture files
- Verify root inference works end-to-end through the pipeline
- Add integration test for multi-file `.k.ts` discovery

### Step 10: Update E2E Tests

**Files:**
- `tests/e2e/cli.e2e.test.ts`

**Changes:**
- Update fixture references
- Test that CLI works with `.k.ts` files and no `definitions` in config
- Test that CLI works with no `kindscript.json` at all (just tsconfig + `.k.ts` files)

### Step 11: Update Public API and Notebooks

**Files:**
- `src/index.ts` — no change needed (still exports `InstanceConfig`)
- `notebooks/example-codebase/architecture.ts` → rename to `.k.ts`
- `notebooks/*.ipynb` — update references

### Step 12: Update Documentation

**Files:**
- `README.md`
- `CLAUDE.md`
- `docs/architecture/COMPILER_ARCHITECTURE.md`
- `docs/status/DONE_VS_TODO.md`

**Changes:**
- Document `.k.ts` convention
- Remove references to `architecture.ts` as the default name
- Remove references to `root` property in `InstanceConfig`
- Update examples throughout
