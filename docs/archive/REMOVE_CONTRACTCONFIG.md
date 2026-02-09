# Remove ContractConfig — Implementation Plan

> **Goal:** Remove `ContractConfig<T>` (additive instance-level contract declarations) entirely. All constraints must be declared on the Kind type's third parameter. The Kind *is* the complete contract.

## Motivation

Allowing instances to declare their own constraints via `satisfies ContractConfig<T>` breaks the core thesis ("abstractions as types"):

1. **Breaks the type metaphor** — instances are values, not type authors. The Kind should fully describe the rules.
2. **Inconsistency across instances** — two instances of the same Kind could enforce different rules, making the Kind name meaningless as a guarantee.
3. **Scattered enforcement** — constraints live in two places (Kind + instance), hurting discoverability.
4. **The feature is unused** — no integration fixtures, no E2E tests, no real-world usage. Only unit tests exercise it.

**Design principle:** If you need different constraints, define a different Kind.

---

## Scope of Changes

### What Gets Removed

| Item | Location | Lines |
|------|----------|-------|
| `ContractConfig` type definition | `src/runtime/define-contracts.ts` | entire file (33 lines) |
| `ContractConfig` export | `src/index.ts` | 1 line |
| Phase 3 classifier loop | `classify-ast.service.ts:108-129` | ~22 lines |
| `classifySatisfiesContracts()` | `classify-ast.service.ts:416-479` | ~64 lines |
| `parseTuplePairContracts()` | `classify-ast.service.ts:485-536` | ~52 lines |
| `parseIndividualContracts()` | `classify-ast.service.ts:542-574` | ~33 lines |
| `parseCollectiveContract()` | `classify-ast.service.ts:580-619` | ~40 lines |
| `toContractType()` | `classify-ast.service.ts:621-629` | ~9 lines |
| `withSatisfiesContractConfig()` | `mock-ast.adapter.ts:170-192` | ~23 lines |
| Entire additive contract test section | `classify-ast-contracts.test.ts:22-367` | ~346 lines |
| "merges type-level and additive" test | `classify-ast-contracts.test.ts:687-718` | ~32 lines |
| "deduplicates propagated and explicit" test | `classify-ast-contracts.test.ts:720-749` | ~30 lines |
| `ContractConfig` type in all 18 fixture `.k.ts` files | `tests/integration/fixtures/*/src/*.k.ts` | ~7 lines each |
| `ContractConfig` import in notebook `02-contracts.ipynb` | `notebooks/02-contracts.ipynb` | type defs in cells |
| `ContractConfig` import in notebook `04-bounded-contexts.ipynb` | `notebooks/04-bounded-contexts.ipynb` | import lines |

**Total estimated removal:** ~800+ lines of code, tests, and fixture boilerplate.

### What Gets Updated (Not Removed)

| Item | Location | Change |
|------|----------|--------|
| `src/index.ts` | Public API | Remove `ContractConfig` export, update module doc comment |
| `CLAUDE.md` | Project guide | Remove all `ContractConfig` references |
| `README.md` | Project readme | Remove additive contract examples/mentions |
| `docs/architecture/COMPILER_ARCHITECTURE.md` | Compiler spec | Remove Phase 3 from classifier description |
| `docs/architecture/DESIGN_DECISIONS.md` | Decisions | Add decision record for why ContractConfig was removed |
| `docs/status/DONE_VS_TODO.md` | Status | Update to reflect removal |
| `docs/status/CODEBASE_REVIEW_2026_02_07.md` | Review | Remove ContractConfig-related issues |
| `docs/design/RUNTIME_MARKERS_OPTIONS.md` | Design | Remove ContractConfig sections |
| `docs/design/KIND_DEFINITION_SYNTAX.md` | Design | Update if references ContractConfig |
| `docs/design/DISTRIBUTED_DEFINITIONS.md` | Design | Update if references ContractConfig |
| `docs/design/FILESYSTEM_CONSTRAINTS.md` | Design | Update if references ContractConfig |
| `docs/design/KIND_DERIVED_LOCATIONS.md` | Design | Update if references ContractConfig |
| `notebooks/02-contracts.ipynb` | Notebook | Remove "Additive Contracts" section, remove ContractConfig from imports/types |
| `notebooks/04-bounded-contexts.ipynb` | Notebook | Remove additive contract discussion, remove ContractConfig imports |
| `tests/unit/classify-ast-contracts.test.ts` | Unit tests | Remove additive sections, keep type-level contract tests |
| `tests/unit/classify-ast-locate.test.ts` | Unit tests | Check for ContractConfig references |
| 18 fixture `.k.ts` files | Integration fixtures | Remove `ContractConfig` type declaration from each |

---

## Implementation Steps

### Step 1: Delete `src/runtime/define-contracts.ts`

Delete the entire file. It contains only the `ContractConfig` type definition.

### Step 2: Update `src/index.ts`

Remove the `ContractConfig` export and update the module doc comment:

```typescript
// BEFORE
export type { Kind, Constraints } from './runtime/kind';
export type { ContractConfig } from './runtime/define-contracts';
export type { MemberMap, Instance } from './runtime/locate';

// AFTER
export type { Kind, Constraints } from './runtime/kind';
export type { MemberMap, Instance } from './runtime/locate';
```

Update the doc comment to remove `ContractConfig` from the list of exports.

### Step 3: Remove Phase 3 from `classify-ast.service.ts`

Remove the entire Phase 3 loop (lines 108-129) and all supporting private methods:

- `classifySatisfiesContracts()` (lines 416-479)
- `parseTuplePairContracts()` (lines 485-536)
- `parseIndividualContracts()` (lines 542-574)
- `parseCollectiveContract()` (lines 580-619)
- `toContractType()` (lines 621-629)

Also remove the `ContractType` import if it's only used by these methods (check — it's likely also used by Phase 1, so keep it if so).

Update the Phase 1 comment to remove "Phase 1" numbering since there's no Phase 3 anymore. The classifier now has two passes: Kind+constraint parsing, and instance parsing.

### Step 4: Remove `withSatisfiesContractConfig()` from `MockASTAdapter`

Remove the method (lines 170-192) from `src/infrastructure/adapters/testing/mock-ast.adapter.ts`.

### Step 5: Update unit tests — `classify-ast-contracts.test.ts`

**Remove entirely:**
- The `'Additive contract parsing (satisfies ContractConfig)'` describe block (lines 22-367) — all 16 tests
- The `'Contract error paths'` describe block (lines 369-612) — all 8 tests
- The `'merges type-level and additive contracts'` test (lines 687-718)
- The `'deduplicates propagated and explicitly declared purity'` test (lines 720-749) — the deduplication concern is about additive+propagated, which no longer applies

**Keep:**
- The `'Type-level contracts (from Kind third parameter)'` describe block — tests for `noDependency`, `mustImplement`, `noCycles` from Kind constraints (lines 614-685)

**Result:** The file shrinks from ~750 lines to ~90 lines (just the 4 type-level contract tests). Consider whether to merge the remaining tests into `classify-ast-kind-parsing.test.ts` if the file becomes too small to warrant its own file.

### Step 6: Check `classify-ast-locate.test.ts` for ContractConfig references

Search and remove any `ContractConfig` references. Based on the grep results, this file has a reference — investigate and remove.

### Step 7: Update all 18 fixture `.k.ts` files

Remove the `ContractConfig` type declaration from each fixture. The fixtures declare this type locally (they don't import from kindscript). Remove these lines from every `.k.ts` file:

```typescript
// REMOVE these lines:
type ContractConfig<_T extends Kind = Kind> = {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
};
```

**Files (18):**
- `tests/integration/fixtures/clean-arch-valid/src/context.k.ts`
- `tests/integration/fixtures/clean-arch-violation/src/context.k.ts`
- `tests/integration/fixtures/colocated-clean/src/context.k.ts`
- `tests/integration/fixtures/colocated-violation/src/context.k.ts`
- `tests/integration/fixtures/locate-clean-arch/src/context.k.ts`
- `tests/integration/fixtures/locate-existence/src/context.k.ts`
- `tests/integration/fixtures/locate-multi-instance/src/billing/billing.k.ts`
- `tests/integration/fixtures/locate-multi-instance/src/ordering/ordering.k.ts`
- `tests/integration/fixtures/locate-nested/src/context.k.ts`
- `tests/integration/fixtures/locate-path-override/src/context.k.ts`
- `tests/integration/fixtures/locate-standalone-member/src/context.k.ts`
- `tests/integration/fixtures/locate-violation/src/context.k.ts`
- `tests/integration/fixtures/must-implement-clean/src/context.k.ts`
- `tests/integration/fixtures/must-implement-violation/src/context.k.ts`
- `tests/integration/fixtures/no-cycles-violation/src/context.k.ts`
- `tests/integration/fixtures/purity-clean/src/context.k.ts`
- `tests/integration/fixtures/purity-violation/src/context.k.ts`
- `tests/integration/fixtures/tier2-clean-arch/src/context.k.ts`
- `tests/integration/fixtures/tier2-violation/src/context.k.ts`

### Step 8: Update notebooks

**`notebooks/02-contracts.ipynb`:**
- Remove the last line of the summary cell: `"For additive per-instance contracts, use satisfies ContractConfig<T>."`
- Remove `ContractConfig` from any `import type` statements in notebook cells
- If there is an "Additive Contracts (Escape Hatch)" section, remove it entirely

**`notebooks/04-bounded-contexts.ipynb`:**
- Remove `ContractConfig` from import lines (e.g., `cell-detect` has `import type { Kind, Constraints, Instance, ContractConfig }`)
- Remove the "additive per-instance rules" discussion in `cell-issues-heading` (the paragraph: "For additive per-instance rules, use `satisfies ContractConfig<T>` in addition to type-level constraints.")

### Step 9: Update documentation

**`docs/architecture/COMPILER_ARCHITECTURE.md`:**
- Remove Phase 3 from the classifier pipeline description
- Remove any mention of `ContractConfig` as a recognized marker
- Update the classifier to describe a 2-phase pipeline (Kind+constraints, then instances)

**`docs/architecture/DESIGN_DECISIONS.md`:**
- Add a new decision record:
  - **Decision:** Remove `ContractConfig<T>` (additive instance-level constraints)
  - **Context:** Allowing instances to add constraints breaks the "abstractions as types" metaphor
  - **Consequence:** All constraints must be declared on the Kind type. Different rules → different Kind.

**`docs/status/DONE_VS_TODO.md`:**
- Update to mark ContractConfig removal as done
- Remove any TODO items related to additive contracts

**`docs/status/CODEBASE_REVIEW_2026_02_07.md`:**
- Remove the section about additive contracts being affected by the multi-instance bug (since additive contracts no longer exist)

**`docs/design/` files:**
- Search all design docs for `ContractConfig` references and update/remove as appropriate
- These are exploratory docs, so mark relevant sections as superseded

**`CLAUDE.md`:**
- Remove `ContractConfig` from the public API listing
- Remove `ContractConfig` from the "Recent Changes" section
- Remove `define-contracts.ts` from the "Key Files" section
- Update the `src/index.ts` description to remove ContractConfig
- Update any import examples that show ContractConfig

**`README.md`:**
- Remove `ContractConfig` from the public API section
- Remove additive contract examples

### Step 10: Run tests and verify

```bash
npm test
npm run build
```

- All 298 tests should pass (minus the ~26 removed additive contract tests)
- Coverage thresholds should still be met
- TypeScript compilation should succeed

---

## Test Impact Analysis

| Test File | Tests Before | Tests Removed | Tests After |
|-----------|-------------|---------------|-------------|
| `classify-ast-contracts.test.ts` | 34 | 26 (additive + merge/dedup) | 8 (type-level only) |
| All other test files | 264 | 0 | 264 |
| **Total** | **298** | **26** | **~272** |

The 26 removed tests are exclusively for additive contract parsing. The remaining 8 tests in `classify-ast-contracts.test.ts` validate type-level constraint parsing (from Kind's third parameter), which is the only contract source going forward.

**Coverage impact:** The removed code paths are exclusively in the classifier's Phase 3 methods. Removing both the tests and the code should keep coverage ratios stable, since we're removing dead code alongside its tests.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Breaking existing users | **Very Low** — no real-world usage of `ContractConfig` exists | None needed |
| Coverage drops below thresholds | **Low** — removing code + tests proportionally | Run `npm test -- --coverage` to verify |
| Missed references in docs | **Medium** — 43 files reference `ContractConfig` | Use grep to verify all removed |
| Fixtures break after removing type | **Low** — fixtures declare it locally but never use it | Run integration tests to verify |

---

## Ordering

Steps 1-4 are the code changes (can be done in one pass).
Step 5-6 are the test changes.
Step 7 is fixture cleanup (mechanical, can be scripted).
Steps 8-9 are documentation updates.
Step 10 is verification.

All steps are safe and reversible via git.

---

## Post-Removal: What Replaces the Escape Hatch?

Nothing — by design. If a user needs constraints that differ from their Kind type, they define a new Kind:

```typescript
// Instead of additive contracts on instance:
type StrictCleanArch = Kind<"StrictCleanArch", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
  colocated: [["domain", "infrastructure"]];  // extra constraint → new Kind
}>;
```

This keeps the Kind as the single source of truth for all architectural rules.

A future `ExtendKind<Base, AdditionalConstraints>` utility type could reduce boilerplate for Kind variants, but that's a separate design initiative — not a prerequisite for this removal.
