# Existence & Filesystem Constraints: Analysis and Options

> **IMPLEMENTED (2026-02-07):** Option C was selected and fully implemented. The `colocated` contract and implicit existence check have been replaced with `filesystem: { exists?, mirrors? }` on the Kind type's third parameter. All tests pass (25 suites, 278 tests). See the "Decision: Option C" section for the implementation plan.

> Why the implicit existence check should become an explicit constraint, how it relates to `colocated`, and what the right design looks like.

**Date:** 2026-02-07

---

## The Problem

KindScript currently has an implicit existence check that runs automatically for every derived member location. It cannot be disabled. This is a design problem for several reasons:

1. **It's hidden behavior.** Users don't declare it; they can't opt out of it. It's the only check that runs without a corresponding constraint in `Constraints`.
2. **It conflates two concerns.** The location derivation system (mapping member names to directories) is a mechanism. Whether those directories must exist is a policy. These are separate decisions, but the current code fuses them.
3. **It assumes filesystem structure always matters.** But constraints like `noDependency` and `noCycles` are really about *import relationships*, not about whether directories exist. If `infrastructure/` doesn't exist, `noDependency(domain, infrastructure)` trivially passes — there's nothing to import from. That's arguably correct, not an error.
4. **`colocated` is a related but broken constraint** that also checks filesystem structure, but at a different granularity and with a different (flawed) matching strategy. The two overlap conceptually but are implemented as completely separate mechanisms.

---

## How the Current System Works

### Location Derivation

When KindScript encounters `{ ... } satisfies Instance<T>`, it:

1. **Infers root** from the `.k.ts` file's directory: `src/context.k.ts` → root is `src/`
2. **Derives member paths** by appending member names: `domain: {}` → `src/domain/`
3. **Allows path overrides**: `domain: { path: "value-objects" }` → `src/value-objects/`
4. **Marks every member** with `locationDerived: true`

Every member created by `deriveMembers()` gets `locationDerived = true` unconditionally. There is no way for a member to exist in the Kind definition without having a derived filesystem path.

### The Implicit Existence Check

After all contracts are evaluated, `CheckContractsService.execute()` runs a separate loop:

```typescript
// Always runs — no opt-out
for (const symbol of request.symbols) {
  for (const member of symbol.descendants()) {
    if (!member.locationDerived) continue;
    if (!member.declaredLocation) continue;
    if (!this.fsPort.directoryExists(member.declaredLocation)) {
      diagnostics.push(Diagnostic.locationNotFound(...));
    }
  }
}
```

This means:
- It runs on **every** derived member, regardless of whether any constraint references that member
- It produces diagnostic code **70010** (`LocationNotFound`)
- It is **not a contract** — there's no `ContractType.Existence` enum value, no `Contract` object, no entry in the switch statement
- Its diagnostics are counted in `violationsFound`, making the check fail even if all actual contracts pass

### The `colocated` Constraint

`colocated` is a proper constraint that checks file-level correspondence between two members:

```typescript
// For each file in "components/", does a file with the same basename exist in "tests/"?
const primaryFiles = this.fsPort.readDirectory(primaryLocation, true);
const relatedFiles = new Set(
  this.fsPort.readDirectory(relatedLocation, true).map(f => this.fsPort.basename(f))
);

for (const file of primaryFiles) {
  const basename = this.fsPort.basename(file);
  if (!relatedFiles.has(basename)) {
    diagnostics.push(Diagnostic.notColocated(file, expectedFile, contract));
  }
}
```

---

## Why These Two Are Connected

Both existence and colocated are **filesystem structure constraints**. They ask questions about the physical layout of code on disk, as opposed to the other constraints which ask about import relationships:

| Constraint | Question Asked | What It Queries |
|---|---|---|
| `noDependency` | "Does A import from B?" | Import graph |
| `noCycles` | "Is there a circular import path?" | Import graph |
| `purity` | "Does A import platform modules?" | Import specifiers |
| `mustImplement` | "Does B have a class implementing A's interface?" | Type declarations |
| **`colocated`** | "Does every file in A have a counterpart in B?" | **Filesystem structure** |
| **existence** (implicit) | "Does this derived directory exist?" | **Filesystem structure** |

The conceptual overlap:

- **Existence** asks: "Does the directory `src/domain/` exist at all?" (directory-level)
- **Colocated** asks: "For every file in `src/components/`, does `src/tests/` have a matching file?" (file-level)

Both are about whether the filesystem matches expectations derived from the architectural model. But they operate at different granularities and with different triggering mechanisms.

---

## Why Existence Shouldn't Be Implicit

### Case 1: Scaffolding a new project

You define a Kind with 5 members but have only created 2 directories so far. Every `ksc check` run screams about 3 missing directories. You can't suppress this without removing the members from your Kind definition — but you want to keep them because they express your *intended* architecture.

### Case 2: Optional / future members

You define a `MonitoringLayer` member in your Kind because your architecture *should* have monitoring, but the team hasn't built it yet. The Kind definition documents the intent. Existence checking punishes you for declaring intent before implementation.

### Case 3: Members used only for constraint relationships

You might have a member that participates only in `noDependency` or `noCycles` constraints. If infrastructure doesn't exist, `noDependency(domain, infrastructure)` is trivially satisfied — domain can't import from a directory that has no files. That's a correct result, not an error that needs a separate diagnostic.

### Case 4: Virtual / logical groupings

A Kind member might represent a logical grouping (e.g., "external-apis") that doesn't map to a single directory. The path derivation convention doesn't fit here, but the member is useful for expressing constraints between other members.

### The deeper point

The existence check is really answering: **"Does the filesystem conform to the naming convention that KindScript assumes?"** That's a valid question — but it's a question the user should be able to choose to ask or not ask. Right now the system forces the question on every run.

---

## `colocated` Is Partially Doing the Same Job (Badly)

`colocated` is the only proper constraint that checks filesystem structure. But it has significant problems:

### Problem 1: Basename matching doesn't work for real use cases

The primary use case for `colocated` is "every component has a test." But:

- `components/button.ts` vs `tests/button.test.ts` → **FAIL** (different basenames)
- `components/button.tsx` vs `tests/button.test.tsx` → **FAIL**
- `components/button.ts` vs `tests/button.spec.ts` → **FAIL**

The only scenario it handles is the unlikely case where test files have *identical names* to their source files, in a *separate directory*. This is extremely rare in practice.

### Problem 2: Flat matching ignores directory structure

```
components/
  forms/input.ts
  forms/select.ts
  layout/header.ts
tests/
  layout/input.ts      ← this matches forms/input.ts by basename!
```

The check only compares basenames, ignoring the subdirectory structure. `input.ts` in `tests/layout/` would satisfy the match for `input.ts` in `components/forms/`, which is incorrect.

### Problem 3: Unidirectional only

It checks that every file in A has a counterpart in B, but NOT that every file in B has a counterpart in A. Orphan test files are invisible.

### Problem 4: It doesn't check directory existence

If the `tests/` directory doesn't exist at all, `readDirectory` returns `[]`, and `colocated` produces no diagnostics for the related side. Every file in the primary directory gets flagged individually as "not colocated" — but the root cause (missing directory) is obscured by N file-level diagnostics.

### The overlap with existence

If `colocated` were properly implemented, it would partially subsume existence checking for the specific case of paired members. But existence checking is broader — it applies to *every* derived member, not just members in a colocated pair.

---

## Options

### Option A: Make `exists` a first-class constraint

Add `exists` to `Constraints` as an explicit, opt-in constraint. Remove the implicit check entirely.

```typescript
type Constraints<Members> = {
  // ... existing constraints ...

  /** Require that these members have existing directories on disk */
  exists?: ReadonlyArray<keyof Members & string>;
};
```

**Usage:**
```typescript
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
  exists: ["domain", "infrastructure"];  // opt-in
}>;
```

**Pros:**
- Clean, consistent with other constraints
- Opt-in — users choose which members must exist
- Can be combined with other constraints or used alone
- Easy to understand: collective list shape like `noCycles`

**Cons:**
- Breaking change: projects relying on implicit existence checking would need to add `exists` explicitly
- Slightly more verbose

**Implementation:**
- Add `ContractType.Exists` enum value
- Add `DiagnosticCode.MemberNotFound` (or reuse `LocationNotFound`)
- Add `exists` to `ConstraintsAST`
- Add `checkExists` method to `CheckContractsService`
- Remove the implicit `checkExistence` loop from `execute()`
- Parse `exists` arrays in `generateContractsFromConfig`

---

### Option B: Make existence checking a config-level toggle (not a constraint)

Keep existence checking as a separate mechanism but make it opt-in via `kindscript.json` or a Kind-level flag.

```jsonc
// kindscript.json
{
  "checkExistence": true  // default: false
}
```

Or per-Kind:
```typescript
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
  checkExistence: true;  // applies to all members
}>;
```

**Pros:**
- Simple on/off toggle
- Less verbose than listing every member

**Cons:**
- All-or-nothing: can't choose which members must exist
- `checkExistence: true` on the Kind type is a different shape from other constraints (boolean flag rather than member references)
- Mixes configuration concerns with architectural constraints

---

### Option C: Replace both `exists` and `colocated` with a unified `filesystem` constraint

Recognize that both existence and colocation are filesystem structure checks and design a single, well-thought-out constraint.

```typescript
type Constraints<Members> = {
  // ... existing constraints ...

  /** Filesystem structure requirements */
  filesystem?: {
    /** These member directories must exist */
    exists?: ReadonlyArray<keyof Members & string>;

    /** File-level correspondence between members */
    mirrors?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string, MirrorConfig?]>;
  };
};

type MirrorConfig = {
  /** How to match filenames between the two members */
  match?: 'basename' | 'stem';  // 'stem' strips extension
  /** Suffix transform: "button.ts" matches "button.test.ts" */
  suffix?: string;
  /** Check both directions */
  bidirectional?: boolean;
  /** Preserve subdirectory structure */
  preserveStructure?: boolean;
};
```

**Usage:**
```typescript
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
  components: ComponentsLayer;
  tests: TestsLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
  filesystem: {
    exists: ["domain", "infrastructure"],
    mirrors: [["components", "tests", { suffix: ".test", preserveStructure: true }]],
  };
}>;
```

**Pros:**
- Unified model for all filesystem structure concerns
- `mirrors` fixes every problem with `colocated` (suffix handling, structure preservation, bidirectionality)
- `exists` is explicit and per-member
- Clear conceptual grouping

**Cons:**
- Larger API surface in a single constraint
- More complex to implement
- Breaking change to `colocated` (could keep as deprecated alias)
- Nested object in `Constraints` is a different shape from the flat constraint keys

---

### Option D: Make `exists` a constraint, fix `colocated` separately

Treat these as two separate problems:

1. **New `exists` constraint** (same as Option A)
2. **Fix `colocated`** to support suffix transforms and structure preservation, as a separate effort

```typescript
type Constraints<Members> = {
  // New
  exists?: ReadonlyArray<keyof Members & string>;

  // Fixed (backwards-compatible extension)
  colocated?: ReadonlyArray<
    readonly [keyof Members & string, keyof Members & string]
    | readonly [keyof Members & string, keyof Members & string, { suffix?: string; match?: 'basename' | 'stem' }]
  >;
};
```

**Pros:**
- Each change is small and focused
- `exists` is a clean addition
- `colocated` fix is backwards-compatible (tuples with 2 elements still work)
- Separate concerns, separate implementations

**Cons:**
- Two separate efforts
- Doesn't unify the conceptual model (filesystem structure is still spread across two constraint names)

---

### Option E: Remove existence checking entirely, let other constraints handle it

Don't add an `exists` constraint. Simply remove the implicit check. If a member's directory doesn't exist:

- `noDependency` trivially passes (no files to import from)
- `noCycles` trivially passes (no import edges)
- `purity` trivially passes (no files to scan)
- `mustImplement` reports missing implementations (port interfaces have no adapters)
- `colocated` reports missing counterpart files

The argument: if no constraint cares about a missing directory, it doesn't matter that the directory is missing.

**Pros:**
- Simplest approach — remove code
- No new constraints to learn
- Forces users to express what they actually care about via real constraints

**Cons:**
- Loses a useful sanity check. A user who typos a member name (`infrastrcuture`) would get no feedback unless another constraint catches it indirectly.
- `mustImplement` and `colocated` would catch some cases, but `noDependency` and `noCycles` would silently pass on nonexistent directories
- Debugging experience degrades — "why is my noDependency check passing?" is harder than "your directory doesn't exist"

---

## Analysis of Each Option

| Criterion | A: `exists` constraint | B: Config toggle | C: Unified `filesystem` | D: `exists` + fix `colocated` | E: Remove entirely |
|---|---|---|---|---|---|
| **Solves implicit behavior** | Yes | Yes | Yes | Yes | Yes |
| **Per-member control** | Yes | No | Yes | Yes | N/A |
| **Fixes colocated** | No | No | Yes | Yes | No |
| **API consistency** | High (same shape as `noCycles`) | Medium | Medium (nested object) | High | N/A |
| **Implementation effort** | Low | Low | High | Medium | Very low |
| **Breaking changes** | Medium (remove implicit) | Low | High (deprecate colocated) | Medium | Low |
| **Conceptual clarity** | Good | Poor (not a constraint) | Best (unified model) | Good | Risky |

---

## Decision: Option C — Unified `filesystem` Constraint

**Chosen:** Option C. Replace both the implicit existence check and the broken `colocated` constraint with a single, unified `filesystem` constraint that groups all filesystem structure checks under one key.

**Rationale:**
- Both existence and colocation are filesystem structure checks — grouping them is conceptually clean
- `colocated` is broken for real use cases (basename matching fails for `.test.ts` suffix patterns) — replacing it rather than patching it avoids backwards-compatibility complexity
- A unified `filesystem` key makes it obvious which constraints are about filesystem layout vs import relationships
- The `mirrors` sub-constraint fixes every problem with `colocated`: suffix handling, relative path preservation, and basename-only matching as an option

---

## Implementation Plan

### New API

```typescript
type Constraints<Members = Record<string, never>> = {
  pure?: true;
  noDependency?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  mustImplement?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  noCycles?: ReadonlyArray<keyof Members & string>;
  // REMOVED: colocated
  // NEW: filesystem
  filesystem?: {
    exists?: ReadonlyArray<keyof Members & string>;
    mirrors?: ReadonlyArray<readonly [keyof Members & string, keyof Members & string]>;
  };
};
```

`filesystem.exists` — collective list (like `noCycles`). Lists members whose derived directories must exist on disk.

`filesystem.mirrors` — tuple pairs (like `noDependency`). For each file in the primary member's directory, a file with the same relative path must exist in the related member's directory. Uses relative paths from the member root (not just basenames) to fix the flat-matching bug.

### Step-by-Step Changes

#### Step 1: Domain Layer

| File | Change |
|---|---|
| `src/domain/types/contract-type.ts` | Remove `Colocated`, add `Exists` and `Mirrors` |
| `src/domain/constants/diagnostic-codes.ts` | Replace `NotColocated` with `MirrorMismatch`, keep `LocationNotFound` |
| `src/domain/entities/contract.ts` | Update `validate()`: add `Exists` (≥1 args) and `Mirrors` (exactly 2), remove `Colocated` |
| `src/domain/entities/diagnostic.ts` | Replace `notColocated` factory with `mirrorMismatch`, keep `locationNotFound` |

#### Step 2: Runtime Types

| File | Change |
|---|---|
| `src/runtime/kind.ts` | Replace `colocated` with `filesystem?: { exists?: ..., mirrors?: ... }` in `Constraints` |

#### Step 3: Application Layer (Ports)

| File | Change |
|---|---|
| `src/application/ports/ast.port.ts` | Replace `colocated` with `filesystem?: { exists?: string[], mirrors?: [string, string][] }` in `ConstraintsAST` |

#### Step 4: Application Layer (AST Parsing)

| File | Change |
|---|---|
| `src/infrastructure/adapters/ast/ast.adapter.ts` | Update `getTypeAliasConstraints`: parse `filesystem` as a nested type literal containing `exists` (string array) and `mirrors` (tuple pairs) |
| `src/application/use-cases/classify-ast/classify-ast.service.ts` | Update `generateContractsFromConfig`: parse `config.filesystem.exists` as collective contracts, `config.filesystem.mirrors` as tuple-pair contracts. Remove `colocated` parsing. |

#### Step 5: Application Layer (Contract Checking)

| File | Change |
|---|---|
| `src/application/use-cases/check-contracts/check-contracts.service.ts` | Remove `checkColocated`, add `checkExists` and `checkMirrors`. Remove the implicit `checkExistence` loop (lines 81-85). Add `Exists` and `Mirrors` cases to the switch. |

`checkExists`: For each symbol arg, check `fsPort.directoryExists(symbol.declaredLocation)`. Emit `Diagnostic.locationNotFound` on failure.

`checkMirrors`: For each file in primary member's directory, compute the relative path from the member root, then check if that relative path exists in the related member's directory. Emit `Diagnostic.mirrorMismatch` on failure. This fixes the old basename-only matching by using relative paths.

#### Step 6: Infrastructure (Mock Adapters)

| File | Change |
|---|---|
| `src/infrastructure/adapters/testing/mock-ast.adapter.ts` | No structural change needed — `constraintConfig` already passes through `ConstraintsAST` |

#### Step 7: Test Helpers

| File | Change |
|---|---|
| `tests/helpers/factories.ts` | Remove `colocated()`, add `exists()` and `mirrors()` factory functions |

#### Step 8: Unit Tests

| File | Change |
|---|---|
| `tests/unit/contract.test.ts` | Replace `Colocated` validation tests with `Exists` and `Mirrors` |
| `tests/unit/check-contracts-implementation.test.ts` | Replace `colocated` describe block with `mirrors` tests. Add tests for relative-path matching. |
| `tests/unit/check-contracts-purity.test.ts` | Move `existence checking` describe block → become `exists contract` tests (now contract-based, not implicit) |
| `tests/unit/classify-ast-contracts.test.ts` | Add tests for parsing `filesystem: { exists: [...], mirrors: [...] }` |

#### Step 9: Fixtures

All 17 fixture `.k.ts` files declare `Constraints` locally. Each must be updated:
- Remove `colocated` from `Constraints` type
- Add `filesystem?: { exists?: ..., mirrors?: ... }` to `Constraints` type
- `colocated-clean` and `colocated-violation` fixtures: rename constraint usage from `colocated:` to `filesystem: { mirrors: ... }`
- `locate-existence` fixture: add `filesystem: { exists: ["domain", "infrastructure"] }` to the Kind definition (so existence is now explicitly tested)

#### Step 10: Integration Tests

| File | Change |
|---|---|
| `tests/integration/tier2-contracts.integration.test.ts` | Replace `colocated contract` describe with `mirrors contract` describe. Update `ContractType` references. |
| `tests/integration/tier2-locate.integration.test.ts` | Update `locate-existence` test to expect `exists` contract-based diagnostics instead of implicit existence diagnostics |

### Migration Summary

| Before | After |
|---|---|
| `colocated: [["A", "B"]]` | `filesystem: { mirrors: [["A", "B"]] }` |
| Implicit existence (always-on) | `filesystem: { exists: ["A", "B"] }` (opt-in) |
| `ContractType.Colocated` | `ContractType.Mirrors` |
| `DiagnosticCode.NotColocated` (70005) | `DiagnosticCode.MirrorMismatch` (70005) |
| `DiagnosticCode.LocationNotFound` (70010) | `DiagnosticCode.LocationNotFound` (70010) — unchanged |
| Basename-only matching | Relative-path matching from member root |
