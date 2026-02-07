# Test Suite Audit & Consolidation Plan

## Executive Summary

The project has **44 test files** totaling **8,092 lines** across 4 directories, with **29 fixture directories** containing **134 files**. Testing is thorough but has significant structural issues:

1. **Misclassified tests** — files in the wrong tier (E2E tests that are unit tests, integration tests that spawn subprocesses)
2. **Heavy duplication** — the same fixture + behavior tested at multiple tiers with no additional value
3. **Fragmented E2E suite** — 9 small CLI test files that should be 2-3
4. **Fixture sprawl** — 29 directories, many nearly identical, some only used by one test

---

## Full Inventory

### Test File Counts by Directory

| Directory | Files | Lines | Tests (approx) |
|-----------|-------|-------|-----------------|
| `tests/unit/` | 16 | 4,335 | ~200 |
| `tests/architecture/domain/` | 7 | 881 | ~47 |
| `tests/architecture/validation/` | 4 | 601 | ~24 |
| `tests/integration/` | 9 | 1,480 | ~57 |
| `tests/e2e/` | 9 | 794 | ~50 |
| **Total** | **45** | **8,092** | **~378** |

### Helpers

| File | Lines | Purpose |
|------|-------|---------|
| `tests/helpers/factories.ts` | ~50 | `makeSymbol`, `noDependency`, `mustImplement`, `purity`, `noCycles`, `colocated`, `makeCheckRequest`, `makeDiagnostic` |

---

## Detailed File Inventory

### Unit Tests (`tests/unit/`) — 16 files, 4,335 lines

| File | Lines | Tests | What it tests |
|------|-------|-------|---------------|
| `classify-ast.service.test.ts` | 1,034 | ~50 | Kind def parsing, contract parsing, locate() recognition |
| `check-contracts.service.test.ts` | 686 | ~45 | All 5 contract types + existence checking |
| `infer-architecture.service.test.ts` | 365 | ~22 | Kind/instance/contract generation from detected arch |
| `scaffold.service.test.ts` | 273 | ~13 | plan() + apply() for scaffolding |
| `detect-architecture.service.test.ts` | 247 | ~16 | Pattern detection (Clean/Hex/Layered/Unknown) |
| `get-plugin-diagnostics.service.test.ts` | 224 | ~7 | Plugin diagnostic orchestration |
| `language-service-proxy.test.ts` | 224 | ~6 | TS language service proxy |
| `ast.adapter.test.ts` | 217 | ~20 | AST node identification + extraction |
| `scaffold-value-objects.test.ts` | 181 | ~18 | ScaffoldOperation, ScaffoldPlan, OperationResult, ScaffoldResult |
| `resolve-files.service.test.ts` | 179 | ~9 | Directory-to-file resolution |
| `generate-project-refs.service.test.ts` | 171 | ~7 | TSConfig project reference generation |
| `diagnostic-converter.test.ts` | 156 | ~13 | Diagnostic ↔ TS diagnostic conversion |
| `inferred-definitions.test.ts` | 110 | ~10 | InferredDefinitions value object |
| `get-plugin-code-fixes.service.test.ts` | 102 | ~7 | Code fix generation for KS diagnostic codes |
| `cli-diagnostic.adapter.test.ts` | 88 | ~7 | CLI diagnostic formatting |
| `config-adapter.test.ts` | 79 | ~5 | kindscript.json parsing |

**Assessment**: This layer is solid. The two largest files (`classify-ast` at 1,034 lines and `check-contracts` at 686 lines) are big but justified — they test complex services with many branches. No action needed.

---

### Architecture/Domain Tests (`tests/architecture/domain/`) — 7 files, 881 lines

| File | Lines | Tests | What it tests |
|------|-------|-------|---------------|
| `contract.test.ts` | 252 | ~16 | Contract entity (construction, validation, equality, toString) |
| `arch-symbol.test.ts` | 234 | ~15 | ArchSymbol entity (members, descendants, findByPath) |
| `diagnostic.test.ts` | 194 | ~12 | Diagnostic entity (factory methods, toString) |
| `detected-architecture.test.ts` | 92 | ~6 | DetectedArchitecture entity |
| `detected-layer.test.ts` | 42 | ~5 | DetectedLayer value object |
| `layer-dependency-edge.test.ts` | 41 | ~6 | LayerDependencyEdge value object |
| `generated-tsconfig.test.ts` | 26 | ~3 | GeneratedTSConfig value object |

**Assessment**: These are clean, focused entity/value-object tests. The small ones (`detected-layer`, `layer-dependency-edge`, `generated-tsconfig`) are only 26-42 lines each and could be consolidated but aren't hurting anything.

---

### Architecture/Validation Tests (`tests/architecture/validation/`) — 4 files, 601 lines

| File | Lines | Tests | What it tests |
|------|-------|-------|---------------|
| `layer-structure.validation.test.ts` | 181 | ~5 | Domain modeling validation (builds ArchSymbol trees for different arch patterns) |
| `value-objects.validation.test.ts` | 144 | ~9 | ImportEdge + DependencyRule value objects |
| `must-implement.validation.test.ts` | 141 | ~4 | mustImplement contract validation |
| `no-dependency.validation.test.ts` | 135 | ~6 | noDependency contract validation |

**Assessment**: These overlap significantly with `tests/unit/check-contracts.service.test.ts` which already tests all 5 contract types thoroughly. The validation tests re-test `noDependency` and `mustImplement` at an intermediate level that doesn't add clear value over the unit tests. `layer-structure` and `value-objects` are essentially unit tests in disguise.

---

### Integration Tests (`tests/integration/`) — 9 files, 1,480 lines

| File | Lines | Tests | Fixtures Used |
|------|-------|-------|---------------|
| `tier2-locate.integration.test.ts` | 275 | ~13 | 7 locate-* fixtures |
| `scaffold.integration.test.ts` | 270 | ~6 | scaffold-*, detect-clean-arch |
| `infer-architecture.integration.test.ts` | 212 | ~5 | detect-* fixtures |
| `tier2-classify.integration.test.ts` | 179 | ~6 | tier2-* fixtures |
| `tier2-contracts.integration.test.ts` | 139 | ~7 | purity-*, no-cycles-*, must-implement-*, colocated-* |
| `noDependency.integration.test.ts` | 133 | ~6 | clean-arch-* fixtures |
| `detect-architecture.integration.test.ts` | 120 | ~4 | detect-* fixtures |
| `plugin-diagnostics.integration.test.ts` | 76 | ~4 | clean-arch-* fixtures |
| `stdlib-packages.integration.test.ts` | 76 | ~6 | stdlib-* fixtures |

**Assessment**: This is where the most problems are.

---

### E2E Tests (`tests/e2e/`) — 9 files, 794 lines

| File | Lines | Tests | What it tests |
|------|-------|-------|---------------|
| `cli-infer.e2e.test.ts` | 166 | ~8 | `ksc infer` command + --write |
| `cli-scaffold.e2e.test.ts` | 151 | ~8 | `ksc scaffold` command + --write |
| `cli.e2e.test.ts` | 89 | ~4 | CheckCommand (direct instantiation, NOT subprocess) |
| `plugin-loading.e2e.test.ts` | 88 | ~5 | Plugin module exports (NOT subprocess) |
| `cli-tier2-contracts.e2e.test.ts` | 87 | ~8 | `ksc check` for tier2 contracts |
| `cli-subprocess.e2e.test.ts` | 59 | ~6 | Basic CLI routing + exit codes |
| `cli-stdlib.e2e.test.ts` | 53 | ~4 | `ksc check/scaffold` with stdlib |
| `cli-init-detect.e2e.test.ts` | 53 | ~4 | `ksc init --detect` (legacy?) |
| `cli-tier2.e2e.test.ts` | 48 | ~4 | `ksc check` for tier2 definitions |

**Assessment**: Highly fragmented. 9 files averaging only 88 lines and 5.7 tests each. Several are misclassified.

---

## Problems Identified

### Problem 1: Misclassified Tests

These files are in the wrong tier:

| File | Current Tier | Actual Tier | Reason |
|------|-------------|-------------|--------|
| `cli.e2e.test.ts` | E2E | Unit/Integration | Directly instantiates `CheckCommand`, mocks `process.stderr` — no subprocess |
| `plugin-loading.e2e.test.ts` | E2E | Unit | Tests module exports with mocks, no I/O |
| `stdlib-packages.integration.test.ts` | Integration | E2E | Spawns `ksc` CLI subprocess for every test |
| `scaffold.integration.test.ts` (last test) | Integration | E2E | Last test case spawns CLI subprocess |
| `validation/*.test.ts` (4 files) | Architecture/Validation | Unit | They're just unit tests with more setup |

### Problem 2: Duplicate Coverage Across Tiers

The same behavior is tested by multiple files at different tiers, with no additional value:

| Behavior | Tested in (redundant) |
|----------|----------------------|
| noDependency contract detection on `clean-arch-violation` | `check-contracts.service.test.ts` (unit) + `noDependency.integration.test.ts` + `plugin-diagnostics.integration.test.ts` + `cli-subprocess.e2e.test.ts` + `cli.e2e.test.ts` + `cli-tier2.e2e.test.ts` — **6 files** |
| Clean result on `clean-arch-valid` | Same 6 files above |
| stdlib package check pass/fail | `stdlib-packages.integration.test.ts` + `cli-stdlib.e2e.test.ts` — **identical tests** |
| Tier2 contract violations (purity, cycles, mustImpl, colocated) | `tier2-contracts.integration.test.ts` + `cli-tier2-contracts.e2e.test.ts` — **same assertions via different invocation** |
| Tier2 classify → check pipeline | `tier2-classify.integration.test.ts` + `cli-tier2.e2e.test.ts` |
| Scaffold plan + apply | `scaffold.integration.test.ts` + `cli-scaffold.e2e.test.ts` |
| Architecture detection | `detect-architecture.integration.test.ts` + `cli-init-detect.e2e.test.ts` |

### Problem 3: Fragmented E2E Suite

9 E2E files averaging 88 lines each. Many test the same `ksc check` command on different fixtures. These should be organized by **command**, not by **feature**:

- `cli-subprocess.e2e.test.ts` — tests `ksc check` on clean-arch fixtures
- `cli-tier2.e2e.test.ts` — tests `ksc check` on tier2 fixtures
- `cli-tier2-contracts.e2e.test.ts` — tests `ksc check` on tier2 contract fixtures
- `cli-stdlib.e2e.test.ts` — tests `ksc check` on stdlib fixtures
- `cli.e2e.test.ts` — tests check command directly (not even E2E)

These are all testing the same CLI command (`check`) across different scenarios. They should be one file.

### Problem 4: Fixture Sprawl

29 fixture directories with 134 files. Many share the same structure with minor variations:

| Pattern | Fixture Count | Notes |
|---------|--------------|-------|
| `clean-arch-*` | 2 | valid vs violation (differ by one import line) |
| `detect-*` | 4 | clean-arch, clean-arch-impure, hexagonal, unknown |
| `locate-*` | 7 | Each tests one locate() edge case |
| `stdlib-*` | 3 | Same as clean-arch but with node_modules/ |
| `tier2-*` | 2 | Same as clean-arch but with Kind definitions |
| `scaffold-*` | 3 | Clean-arch, multi-instance, nested |
| `purity/colocated/must-implement/no-cycles` | 7 | Each contract type has clean + violation |

Some fixtures are nearly identical. For example, `clean-arch-valid`, `tier2-clean-arch`, `locate-clean-arch`, and `stdlib-clean-arch` all represent valid clean architecture with domain + infrastructure layers.

### Problem 5: Confusing Directory Structure

The `tests/architecture/` directory name is confusing — it suggests tests *for* architecture enforcement, but it actually contains domain entity tests and validation tests that are indistinguishable from unit tests.

---

## Consolidation Plan

### Phase 1: Reclassify Misplaced Tests

**Move these:**

1. `tests/e2e/cli.e2e.test.ts` → `tests/unit/check-command.test.ts`
   - It directly instantiates CheckCommand; it's a unit test

2. `tests/e2e/plugin-loading.e2e.test.ts` → `tests/unit/plugin-loading.test.ts`
   - Tests module exports with mocks; it's a unit test

3. `tests/integration/stdlib-packages.integration.test.ts` → `tests/e2e/cli-stdlib.e2e.test.ts` (merge into)
   - All tests spawn CLI subprocess; they're E2E tests

4. Move the round-trip test from `scaffold.integration.test.ts` into `cli-scaffold.e2e.test.ts`

### Phase 2: Consolidate E2E Tests (9 files → 3 files)

Reorganize by CLI command:

| New File | Absorbs | Description |
|----------|---------|-------------|
| `tests/e2e/cli-check.e2e.test.ts` | `cli-subprocess.e2e.test.ts` + `cli-tier2.e2e.test.ts` + `cli-tier2-contracts.e2e.test.ts` + `cli-stdlib.e2e.test.ts` (merged) | All `ksc check` tests: basic, tier2, contracts, stdlib |
| `tests/e2e/cli-infer.e2e.test.ts` | `cli-infer.e2e.test.ts` + `cli-init-detect.e2e.test.ts` | All `ksc infer` / `ksc init --detect` tests |
| `tests/e2e/cli-scaffold.e2e.test.ts` | `cli-scaffold.e2e.test.ts` | Already coherent, just absorb the round-trip test from integration |

### Phase 3: Consolidate Integration Tests (9 files → 5 files)

| New File | Absorbs | Rationale |
|----------|---------|-----------|
| `tests/integration/check-contracts.integration.test.ts` | `noDependency.integration.test.ts` + `plugin-diagnostics.integration.test.ts` | Both test CheckContractsService on same fixtures; plugin-diagnostics adds nothing over noDependency |
| `tests/integration/tier2-contracts.integration.test.ts` | `tier2-contracts.integration.test.ts` + `tier2-classify.integration.test.ts` | Both test classify → check pipeline on tier2 fixtures; classify is just a subset of contracts |
| `tests/integration/tier2-locate.integration.test.ts` | (keep as-is) | Unique feature with 7 fixtures, well-organized |
| `tests/integration/infer-and-detect.integration.test.ts` | `infer-architecture.integration.test.ts` + `detect-architecture.integration.test.ts` | Both use detect-* fixtures; infer builds directly on detect results |
| `tests/integration/scaffold.integration.test.ts` | (keep, minus round-trip test) | Already coherent after removing the CLI-spawning test |

### Phase 4: Flatten Architecture Tests (11 files → absorbed into unit/)

The `tests/architecture/` directory should be eliminated:

1. **Move domain entity tests** to `tests/unit/`:
   - `arch-symbol.test.ts` → `tests/unit/arch-symbol.test.ts` (already fine as unit tests)
   - `contract.test.ts` → `tests/unit/contract.test.ts`
   - `diagnostic.test.ts` → `tests/unit/diagnostic.test.ts`
   - `detected-architecture.test.ts` → `tests/unit/detected-architecture.test.ts`
   - `detected-layer.test.ts` → `tests/unit/detected-layer.test.ts`
   - `layer-dependency-edge.test.ts` → `tests/unit/layer-dependency-edge.test.ts`
   - `generated-tsconfig.test.ts` → `tests/unit/generated-tsconfig.test.ts`

2. **Delete or merge validation tests**:
   - `no-dependency.validation.test.ts` — fully covered by `check-contracts.service.test.ts` (45 tests including 9 noDependency). **Delete.**
   - `must-implement.validation.test.ts` — fully covered by `check-contracts.service.test.ts` (11 mustImplement tests). **Delete.**
   - `value-objects.validation.test.ts` — tests ImportEdge + DependencyRule. **Move to `tests/unit/value-objects.test.ts`.**
   - `layer-structure.validation.test.ts` — tests ArchSymbol tree building. **Merge into `tests/unit/arch-symbol.test.ts`.**

### Phase 5: Reduce Fixture Duplication

Fixtures that could share a base:

1. `clean-arch-valid` and `tier2-clean-arch` differ only in architecture.ts format. Consider parameterizing the integration test instead of maintaining two fixture trees.

2. `stdlib-clean-arch` is `clean-arch-valid` + a `node_modules/` folder. The stdlib test could copy clean-arch-valid into a tmpdir and add node_modules programmatically.

3. `clean-arch-valid` vs `clean-arch-violation` differ by one import line. Consider generating the violation in-test rather than maintaining a separate fixture.

The `locate-*` fixtures (7) are justified — each tests a distinct locate() scenario.

---

## Proposed Final Structure

```
tests/
├── helpers/
│   └── factories.ts
├── unit/                              # ~23 files (was 16 + 11 from architecture/)
│   ├── arch-symbol.test.ts            # (moved from architecture/domain/)
│   ├── ast.adapter.test.ts
│   ├── check-command.test.ts          # (moved from e2e/cli.e2e.test.ts)
│   ├── check-contracts.service.test.ts
│   ├── classify-ast.service.test.ts
│   ├── cli-diagnostic.adapter.test.ts
│   ├── config-adapter.test.ts
│   ├── contract.test.ts              # (moved from architecture/domain/)
│   ├── detected-architecture.test.ts  # (moved from architecture/domain/)
│   ├── detected-layer.test.ts         # (moved from architecture/domain/)
│   ├── detect-architecture.service.test.ts
│   ├── diagnostic-converter.test.ts
│   ├── diagnostic.test.ts            # (moved from architecture/domain/)
│   ├── generated-tsconfig.test.ts     # (moved from architecture/domain/)
│   ├── generate-project-refs.service.test.ts
│   ├── get-plugin-code-fixes.service.test.ts
│   ├── get-plugin-diagnostics.service.test.ts
│   ├── infer-architecture.service.test.ts
│   ├── inferred-definitions.test.ts
│   ├── language-service-proxy.test.ts
│   ├── layer-dependency-edge.test.ts  # (moved from architecture/domain/)
│   ├── plugin-loading.test.ts         # (moved from e2e/)
│   ├── resolve-files.service.test.ts
│   ├── scaffold-value-objects.test.ts
│   ├── scaffold.service.test.ts
│   └── value-objects.test.ts          # (moved from architecture/validation/)
├── integration/                       # 5 files (was 9)
│   ├── check-contracts.integration.test.ts    # noDependency + plugin-diagnostics merged
│   ├── infer-and-detect.integration.test.ts   # infer + detect merged
│   ├── scaffold.integration.test.ts           # minus CLI round-trip test
│   ├── tier2-contracts.integration.test.ts    # tier2-contracts + tier2-classify merged
│   ├── tier2-locate.integration.test.ts       # kept as-is
│   └── fixtures/                              # 29 dirs → target ~22 dirs
├── e2e/                               # 3 files (was 9)
│   ├── cli-check.e2e.test.ts          # all ksc check tests (basic, tier2, contracts, stdlib)
│   ├── cli-infer.e2e.test.ts          # ksc infer + init --detect
│   └── cli-scaffold.e2e.test.ts       # ksc scaffold (+ round-trip from integration)
```

### Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total test files | 45 | 31 | -14 files (31% reduction) |
| E2E files | 9 | 3 | -6 files |
| Integration files | 9 | 5 | -4 files |
| `tests/architecture/` files | 11 | 0 | eliminated |
| Fixture directories | 29 | ~22-25 | -4 to -7 dirs |
| Total test lines | ~8,092 | ~7,200 | ~-900 lines (deleting dupes) |
| Total test cases | ~378 | ~330 | ~-48 cases (deleting redundant) |

### Tests to Delete Outright (Redundant)

These are covered identically by other tests and add zero unique value:

1. `no-dependency.validation.test.ts` (135 lines, 6 tests) — fully redundant with `check-contracts.service.test.ts`
2. `must-implement.validation.test.ts` (141 lines, 4 tests) — fully redundant with `check-contracts.service.test.ts`
3. `cli-stdlib.e2e.test.ts` tests 1-3 (duplicated by `stdlib-packages.integration.test.ts` which itself spawns CLI)
4. `cli-tier2.e2e.test.ts` tests for `clean-arch-valid/violation` (already tested in `cli-subprocess.e2e.test.ts`)
5. `cli-subprocess.e2e.test.ts` version test (tested in every other CLI file)

---

## Execution Priority

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | Consolidate 9 E2E files → 3 | Medium | High — removes confusion, easier to find tests |
| 2 | Flatten `tests/architecture/` → `tests/unit/` | Low | Medium — removes a confusing directory |
| 3 | Delete redundant validation tests | Low | Medium — removes ~280 lines of duplicate coverage |
| 4 | Merge overlapping integration tests (9 → 5) | Medium | Medium — reduces duplication |
| 5 | Reclassify misplaced tests | Low | Low — correctness improvement |
| 6 | Reduce fixture duplication | High | Low — saves maintenance but risky to change |
