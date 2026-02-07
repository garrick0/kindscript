# Test Suite Improvement Plan V2

## Second Review: Post-Consolidation Analysis
**Date:** 2026-02-07
**Status:** ✅ **APPROVED FOR IMPLEMENTATION - ALL PHASES**
**Current State:** 34 test files, 393 tests, 100% passing

This document presents a second-pass analysis after the initial consolidation (45→34 files). It identifies additional optimization opportunities now that the structure is cleaner.

**Implementation Status:** This plan has been approved and all phases (2A, 2B, 2C) are being implemented.

---

## Executive Summary

After consolidating from 45 to 34 test files, there are still significant opportunities for improvement:

- **10 more files** could be consolidated (34→24, another 29% reduction)
- **~500 lines of duplicate code** across test infrastructure
- **3 massive test files** (>600 lines each) that should be split
- **Heavy E2E test overlap** - same fixtures tested multiple ways
- **Scattered helper functions** - same utilities redefined in 5+ places

**Recommended Approach:** Phase 2 consolidation focused on:
1. E2E unification (biggest quick win)
2. Value object consolidation (simplest change)
3. Shared test infrastructure (reduces maintenance burden)

---

## Current State Analysis

### File Distribution

| Category | Files | Lines | Tests | Avg Tests/File |
|----------|-------|-------|-------|----------------|
| **Unit Tests** | 24 | ~4,800 | ~580 | 24 |
| **Integration Tests** | 5 | ~1,300 | ~60 | 12 |
| **E2E Tests** | 3 | ~520 | ~75 | 25 |
| **Helpers** | 1 | ~50 | N/A | N/A |
| **Fixtures** | 29 dirs | ~134 files | N/A | N/A |
| **TOTAL** | **34** | **~6,670** | **~715** | **21** |

### Test File Size Distribution

| Size Category | Count | Files |
|---------------|-------|-------|
| **Tiny** (<50 lines) | 3 | `generated-tsconfig`, `layer-dependency-edge`, `detected-layer` |
| **Small** (50-150 lines) | 7 | `config-adapter`, `diagnostic-converter`, `inferred-definitions`, etc. |
| **Medium** (150-350 lines) | 16 | Most service tests, integration tests |
| **Large** (350-600 lines) | 5 | `arch-symbol`, `infer-architecture.service`, `check-command`, `cli-infer`, `cli-scaffold` |
| **Massive** (>600 lines) | 3 | `classify-ast` (1,035), `check-contracts.service` (687), `language-service-proxy` (224) |

---

## Priority 1: E2E Test Consolidation (HIGH IMPACT)

### Problem

Three E2E test files with heavy duplication:

| File | Lines | Tests | Helper Functions | Fixtures Used |
|------|-------|-------|-----------------|---------------|
| `cli-check.e2e.test.ts` | 151 | 18 | `run()`, `copyDirSync()`, `copyFixtureToTemp()` | 11 fixtures |
| `cli-infer.e2e.test.ts` | 195 | 21 | `run()`, `copyDirSync()`, `copyFixtureToTemp()` | 6 fixtures |
| `cli-scaffold.e2e.test.ts` | 177 | 23 | `run()`, `copyDirSync()`, `copyFixtureToTemp()` | 4 fixtures |
| **TOTAL** | **523** | **62** | **9 duplicate functions** | **~15 unique** |

**Duplicate Code:**
- `run()` function: **3 identical copies** (10 lines each = 30 lines)
- `copyDirSync()`: **3 identical copies** (13 lines each = 39 lines)
- `copyFixtureToTemp()`: **2 copies** (7 lines each = 14 lines)
- Constants: `CLI_PATH`, `FIXTURES_DIR` redefined 3 times

**Total Duplication:** ~83 lines of identical code

### Proposed Solution

#### Create `tests/e2e/helpers.ts`
```typescript
// Shared E2E test utilities
export const CLI_PATH = path.resolve(__dirname, '../../dist/infrastructure/cli/main.js');
export const FIXTURES_DIR = path.resolve(__dirname, '../integration/fixtures');

export function run(args: string[]): { stdout: string; stderr: string; exitCode: number } { ... }
export function copyDirSync(src: string, dest: string): void { ... }
export function copyFixtureToTemp(fixtureName: string): string { ... }
```

#### Consolidate into `tests/e2e/cli.e2e.test.ts`
```typescript
import { run, copyFixtureToTemp, FIXTURES_DIR } from './helpers';

describe('CLI E2E Tests', () => {
  describe('ksc check', () => { ... });      // From cli-check
  describe('ksc infer', () => { ... });      // From cli-infer
  describe('ksc scaffold', () => { ... });   // From cli-scaffold
  describe('ksc version', () => { ... });    // Common tests
});
```

**Benefits:**
- **3 files → 2 files** (1 main test file + 1 helper file)
- Eliminates 83 lines of duplication
- All CLI tests in one place, easier to find
- Shared helper maintenance
- Version tests consolidated (currently duplicated in all 3 files)

**Estimated Impact:**
- -2 files
- -83 lines duplication
- -10 redundant tests (version checks)
- Better organization

---

## Priority 2: Value Object Test Consolidation (QUICK WIN)

### Problem

Five separate files testing simple value objects:

| File | Lines | Tests | What It Tests |
|------|-------|-------|---------------|
| `value-objects.test.ts` | 144 | 14 | `ImportEdge`, `DependencyRule` |
| `generated-tsconfig.test.ts` | 27 | 3 | `GeneratedTSConfig.toJSON()` |
| `layer-dependency-edge.test.ts` | 41 | 4 | `LayerDependencyEdge.equals()`, `toString()` |
| `detected-layer.test.ts` | 42 | 5 | `DetectedLayer.equals()`, `toString()` |
| `inferred-definitions.test.ts` | 110 | 10 | `InferredDefinitions` value object |
| **TOTAL** | **364** | **36** | **5 value object types** |

**Pattern Identified:** All test the same methods:
- Construction
- `equals()` comparison
- `toString()` formatting
- Factory methods / getters

### Proposed Solution

#### Merge into `tests/unit/value-objects.test.ts`

```typescript
describe('Value Objects', () => {
  describe('ImportEdge', () => { ... });              // 8 tests
  describe('DependencyRule', () => { ... });          // 5 tests
  describe('GeneratedTSConfig', () => { ... });       // 3 tests
  describe('LayerDependencyEdge', () => { ... });     // 4 tests
  describe('DetectedLayer', () => { ... });           // 5 tests
  describe('InferredDefinitions', () => { ... });     // 10 tests
});
```

**Benefits:**
- **5 files → 1 file**
- Centralized value object testing
- Easier to see all value objects at a glance
- Consistent testing patterns
- ~350 lines in one well-organized file vs. 5 scattered files

**Estimated Impact:**
- -4 files
- Better discoverability
- Consistent test structure

---

## Priority 3: Integration Test Pipeline Extraction (REDUCES DUPLICATION)

### Problem

Five integration test files redefine the same test pipeline:

**Files with duplicate pipeline setup:**
1. `tier2-contracts.integration.test.ts` (139 lines)
2. `tier2-locate.integration.test.ts` (275 lines)
3. `check-contracts.integration.test.ts` (205 lines)
4. `scaffold.integration.test.ts` (243 lines)
5. `infer-and-detect.integration.test.ts` (318 lines)

**Duplicate Pattern:** (appears in 3+ files with minor variations)
```typescript
function runPipeline(fixturePath: string) {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const astAdapter = new ASTAdapter();
  const classifyService = new ClassifyASTService(astAdapter);
  const checkService = new CheckContractsService(tsAdapter, fsAdapter);

  const archFile = path.join(fixturePath, 'architecture.ts');
  const srcFiles = fsAdapter.readDirectory(path.join(fixturePath, 'src'), true);
  const program = tsAdapter.createProgram([...srcFiles, archFile], {});
  const checker = tsAdapter.getTypeChecker(program);
  const sourceFile = tsAdapter.getSourceFile(program, archFile)!;

  const classifyResult = classifyService.execute({ ... });
  const checkResult = checkService.execute({ ... });

  return { classifyResult, checkResult };
}
```

**Estimated Duplication:** ~120 lines across 5 files

### Proposed Solution

#### Create `tests/helpers/test-pipeline.ts`

```typescript
export interface TestPipeline {
  tsAdapter: TypeScriptAdapter;
  fsAdapter: FileSystemAdapter;
  astAdapter: ASTAdapter;
  classifyService: ClassifyASTService;
  checkService: CheckContractsService;
}

export function createTestPipeline(): TestPipeline { ... }

export function classifyFixture(
  pipeline: TestPipeline,
  fixturePath: string
): ClassifyResult { ... }

export function runFullPipeline(
  pipeline: TestPipeline,
  fixturePath: string
): { classifyResult: ClassifyResult; checkResult: CheckResult } { ... }
```

**Benefits:**
- Eliminates 120 lines of duplication
- Single source of truth for test setup
- Easier to update when services change
- Consistent behavior across integration tests

**Estimated Impact:**
- No file reduction (just refactoring)
- -120 lines duplication
- Improved maintainability

---

## Priority 4: Split Massive Test Files (IMPROVES READABILITY)

### Problem: Test Files Over 600 Lines

#### 1. `classify-ast.service.test.ts` (1,035 lines, 78 tests)

**Current Structure:**
- Lines 1-180: Kind definition parsing (20 tests)
- Lines 182-550: Contract parsing (40 tests)
- Lines 552-800: Error handling (13 tests)
- Lines 802-1,035: locate<T>() recognition (14 tests)

**Proposal:** Split into 3 files
- `classify-ast-kind-parsing.test.ts` (20 tests, ~200 lines)
- `classify-ast-contracts.test.ts` (40 tests, ~450 lines)
- `classify-ast-locate.test.ts` (14 tests, ~250 lines)

**Benefits:**
- Easier to navigate
- Logical separation by feature
- Faster to run individual test suites
- Clearer responsibility

---

#### 2. `check-contracts.service.test.ts` (687 lines, 60 tests)

**Current Structure:**
- noDependency contract tests (9 tests)
- Purity contract tests (9 tests)
- noCycles contract tests (8 tests)
- mustImplement contract tests (11 tests)
- Colocated contract tests (3 tests)
- Existence checking tests (3 tests)
- Integration tests (various)

**Proposal:** Split by contract type
- `check-contracts-dependency.test.ts` (noDependency + noCycles, ~250 lines)
- `check-contracts-implementation.test.ts` (mustImplement + colocated, ~200 lines)
- `check-contracts-purity.test.ts` (purity + existence, ~250 lines)

**Benefits:**
- Clear separation by contract type
- Easier to add new contract types
- Parallel test execution
- Focused test suites

---

#### 3. `language-service-proxy.test.ts` (224 lines, 12 tests)

**Problem:** Over-engineered with custom test proxy implementation (lines 38-99)

**Current Structure:**
- Test proxy class definition (60 lines)
- Proxy creation tests (6 tests)
- Diagnostic append tests (3 tests)
- Code fix append tests (3 tests)

**Proposal:** Simplify
- Remove custom test proxy class (use jest.fn() instead)
- Focus on behavior, not implementation
- Reduce from 12 tests to 6-8 core behavior tests

**Benefits:**
- ~100 lines reduction
- Simpler, more focused tests
- Easier to maintain

---

## Priority 5: Consolidate Domain Entity Test Patterns (SHARED INFRASTRUCTURE)

### Problem

Four entity test files with similar patterns:

| File | Lines | Tests | Pattern |
|------|-------|-------|---------|
| `arch-symbol.test.ts` | 412 | 18 | Construction, members, traversal, toString |
| `contract.test.ts` | 252 | 13 | Construction, validation, equality, toString |
| `diagnostic.test.ts` | 194 | 19 | Construction, factory methods, toString |
| `detected-architecture.test.ts` | 92 | 8 | Construction, getDeps, getDependents |

**Common Patterns:**
- Construction tests (all 4 files)
- Factory method tests (3 files)
- Equality tests (2 files)
- toString() tests (all 4 files)
- Validation tests (2 files)

### Proposed Solution

#### Create `tests/helpers/entity-test-helpers.ts`

```typescript
export function testConstruction<T>(
  entityName: string,
  createFn: () => T,
  assertions: (entity: T) => void
) { ... }

export function testToString<T>(
  entity: T,
  expected: string
) { ... }

export function testEquality<T>(
  entity1: T,
  entity2: T,
  shouldBeEqual: boolean
) { ... }
```

**Benefits:**
- Reduces boilerplate
- Consistent test patterns
- Easier to add new entities
- Clear testing conventions

**Estimated Impact:**
- No file reduction
- ~150 lines less boilerplate
- Better consistency

---

## Priority 6: Parameterized Test Opportunities (REDUCES REPETITION)

### Files with Parameterizable Tests

#### 1. `get-plugin-code-fixes.service.test.ts`

**Current:** 6 individual tests for error codes
```typescript
it('returns fix for KS70001 (forbidden dependency)', ...) { ... }
it('returns fix for KS70003 (impure import)', ...) { ... }
it('returns empty for non-KS code', ...) { ... }
```

**Proposed:**
```typescript
describe.each([
  [70001, 'kindscript-remove-forbidden-import', 'Forbidden dependency'],
  [70003, 'kindscript-remove-impure-import', 'Impure import'],
])('error code KS%s', (code, fixName, description) => {
  it(`returns fix ${fixName}`, ...) { ... }
});

it.each([
  1001, // Non-KS code
  9999, // Unknown KS code
])('returns empty for code %s', (code) => { ... });
```

**Benefit:** 6 tests → 2 parameterized test groups, ~40 lines reduction

---

#### 2. `tier2-contracts.integration.test.ts`

**Current:** 8 describe blocks for contract types
```typescript
describe('purity contract', () => {
  it('detects impure import in purity-violation fixture', ...) { ... }
  it('passes for purity-clean fixture', ...) { ... }
});

describe('noCycles contract', () => { ... });
describe('mustImplement contract', () => { ... });
describe('colocated contract', () => { ... });
```

**Proposed:**
```typescript
describe.each([
  ['purity', 'purity-violation', 'purity-clean', 70003],
  ['noCycles', 'no-cycles-violation', null, 70004],
  ['mustImplement', 'must-implement-violation', 'must-implement-clean', 70002],
  ['colocated', 'colocated-violation', 'colocated-clean', 70005],
])('contract: %s', (contractType, violationFixture, cleanFixture, errorCode) => {
  it('detects violation', ...) { ... }
  if (cleanFixture) {
    it('passes when satisfied', ...) { ... }
  }
});
```

**Benefit:** Reduces repetition, easier to add new contract types

---

#### 3. `cli-check.e2e.test.ts`

**Current:** Multiple describe blocks with similar patterns
```typescript
describe('purity contract', () => {
  it('exits 1 when purity is violated', ...) { ... }
  it('exits 0 when purity is satisfied', ...) { ... }
});
// Repeated 4 times for different contracts
```

**Proposed:** Could use parameterized tests after E2E consolidation

---

## Priority 7: Factory Function Consolidation (SHARED MOCKS)

### Problem

Factory/builder functions scattered across 6+ files:

| File | Factory Functions | Purpose |
|------|-------------------|---------|
| `tests/helpers/factories.ts` | 8 functions | Symbols, contracts, diagnostics |
| `infer-architecture.service.test.ts` | `makeDetectMock()`, `cleanArchResponse()` | Mock responses |
| `scaffold.service.test.ts` | `makeInstance()` | Symbol instances |
| `check-contracts.service.test.ts` | Uses factories.ts | Contract builders |
| `classify-ast.service.test.ts` | `setupContextWithContracts()` | Mock contexts |

**Duplication:** Symbol builders redefined 3+ times with slight variations

### Proposed Solution

#### Expand `tests/helpers/factories.ts`

**Add:**
- `makeDetectedArchitecture()` - DetectArchitectureResponse builders
- `makeClassifyResult()` - ClassifyResult builders
- `makeProgram()` - Mock TypeScript Program
- `makeSourceFile()` - Mock SourceFile
- `makeChecker()` - Mock TypeChecker
- `FIXTURE_PATHS` - Constant object with all fixture paths

**Benefits:**
- One canonical source for test data
- Reduces redefinition
- Easier to maintain
- Better test consistency

**Estimated Impact:**
- No file reduction
- ~80 lines less duplication
- Single import for all factories

---

## Fixture Usage Analysis

### Current Fixture Distribution

| Fixture | Used By (# of test files) | Purpose |
|---------|---------------------------|---------|
| `clean-arch-valid` | 4 files | Basic clean architecture |
| `clean-arch-violation` | 5 files | noDependency violation |
| `detect-clean-arch` | 3 files | Architecture detection |
| `tier2-clean-arch` | 2 files | Kind-based definitions |
| `purity-violation` | 2 files | Purity contract |
| `scaffold-clean-arch` | 2 files | Scaffolding |
| `locate-*` (7 variants) | 1 file each | locate<T>() feature |

**Observation:** Heavy fixture reuse is actually GOOD - it means consistent test scenarios. The `locate-*` fixtures are appropriately specialized.

**Recommendation:** Document fixture purpose and usage in `tests/integration/fixtures/README.md`

---

## Quick Wins (Easy Improvements)

### 1. Extract CLI Test Helpers (15 minutes)
- Create `tests/e2e/helpers.ts`
- Move `run()`, `copyDirSync()`, `copyFixtureToTemp()`
- Update imports in 3 E2E files
- **Impact:** -83 lines duplication

### 2. Consolidate Value Object Tests (30 minutes)
- Merge 4 small files into `value-objects.test.ts`
- Update imports
- **Impact:** -4 files

### 3. Create Fixture Path Constants (15 minutes)
- `tests/helpers/fixtures.ts`
- Export `FIXTURES` object with all paths
- **Impact:** Reduces string duplication

### 4. Add Test Documentation (30 minutes)
- `tests/README.md` - Overview of test structure
- `tests/integration/fixtures/README.md` - Fixture catalog
- **Impact:** Better onboarding

### 5. Extract Diagnostic Factories (20 minutes)
- Add to `tests/helpers/factories.ts`
- **Impact:** -30 lines duplication

---

## Recommended Phased Approach

### Phase 2A: Quick Wins (2-3 hours)
1. ✅ Extract CLI test helpers
2. ✅ Consolidate value object tests
3. ✅ Create fixture constants
4. ✅ Add basic test documentation

**Expected Result:** -5 files, -115 lines duplication

---

### Phase 2B: Medium Refactoring (4-6 hours)
1. ✅ Extract integration test pipeline
2. ✅ Consolidate E2E tests into one file
3. ✅ Expand factory helpers
4. ✅ Add parameterized tests where beneficial

**Expected Result:** -2 more files, -200 lines duplication, better organization

---

### Phase 2C: Major Restructuring (8-12 hours)
1. Split `classify-ast.service.test.ts` (1,035 lines → 3 files)
2. Split `check-contracts.service.test.ts` (687 lines → 3 files)
3. Simplify `language-service-proxy.test.ts`
4. Create entity test helpers

**Expected Result:** +3 files (but better organization), -300 lines complexity

---

## Projected Final State

| Metric | Current | After Phase 2A | After Phase 2B | After Phase 2C |
|--------|---------|----------------|----------------|----------------|
| **Total Files** | 34 | 29 | 27 | 30 |
| **Test Cases** | 393 | 383 | 383 | 383 |
| **Duplicate Lines** | ~500 | ~385 | ~185 | ~185 |
| **Avg File Size** | 196 lines | 230 lines | 247 lines | 222 lines |
| **Largest File** | 1,035 lines | 1,035 lines | 1,035 lines | 450 lines |
| **Helper Files** | 1 | 3 | 4 | 5 |

---

## Risk Assessment

### Low Risk Changes
- ✅ Extract helper functions
- ✅ Consolidate value object tests
- ✅ Add fixture constants
- ✅ Add documentation

### Medium Risk Changes
- ⚠️ Consolidate E2E tests (changes test organization)
- ⚠️ Extract pipeline helpers (affects 5 files)
- ⚠️ Parameterize tests (changes test output)

### High Risk Changes
- 🔴 Split large test files (significant restructuring)
- 🔴 Change entity test patterns (affects core domain tests)

**Recommendation:** Start with low-risk, high-impact changes (Phase 2A) before attempting major restructuring.

---

## Code Quality Metrics

### Before Phase 2

| Metric | Value | Grade |
|--------|-------|-------|
| **Code Duplication** | ~500 lines | C |
| **File Organization** | Good structure | B+ |
| **Test Coverage** | 100% passing | A |
| **Largest File Size** | 1,035 lines | D |
| **Helper Reuse** | 1 helper file | C |
| **Documentation** | Minimal | D |

### After Phase 2A

| Metric | Value | Grade |
|--------|-------|-------|
| **Code Duplication** | ~385 lines | B- |
| **File Organization** | Good structure | B+ |
| **Test Coverage** | 100% passing | A |
| **Largest File Size** | 1,035 lines | D |
| **Helper Reuse** | 4 helper files | B+ |
| **Documentation** | Basic guides | B- |

### After Phase 2B

| Metric | Value | Grade |
|--------|-------|-------|
| **Code Duplication** | ~185 lines | A- |
| **File Organization** | Excellent structure | A |
| **Test Coverage** | 100% passing | A |
| **Largest File Size** | 1,035 lines | D |
| **Helper Reuse** | 5 helper files | A- |
| **Documentation** | Good coverage | B+ |

### After Phase 2C

| Metric | Value | Grade |
|--------|-------|-------|
| **Code Duplication** | ~185 lines | A- |
| **File Organization** | Excellent structure | A |
| **Test Coverage** | 100% passing | A |
| **Largest File Size** | 450 lines | B+ |
| **Helper Reuse** | 6 helper files | A |
| **Documentation** | Comprehensive | A- |

---

## Implementation Checklist

### Phase 2A: Quick Wins ✅
- [ ] Create `tests/e2e/helpers.ts`
- [ ] Extract `run()`, `copyDirSync()`, `copyFixtureToTemp()` from E2E tests
- [ ] Merge value object tests into one file
  - [ ] Move `generated-tsconfig.test.ts` → `value-objects.test.ts`
  - [ ] Move `layer-dependency-edge.test.ts` → `value-objects.test.ts`
  - [ ] Move `detected-layer.test.ts` → `value-objects.test.ts`
  - [ ] Delete source files
- [ ] Create `tests/helpers/fixtures.ts` with fixture path constants
- [ ] Create `tests/README.md`
- [ ] Create `tests/integration/fixtures/README.md`
- [ ] Run full test suite to verify

### Phase 2B: Medium Refactoring
- [ ] Create `tests/helpers/test-pipeline.ts`
- [ ] Extract pipeline creation to helper
- [ ] Update 5 integration test files to use helper
- [ ] Consolidate E2E tests
  - [ ] Create `tests/e2e/cli.e2e.test.ts`
  - [ ] Move check tests
  - [ ] Move infer tests
  - [ ] Move scaffold tests
  - [ ] Delete old E2E files
- [ ] Expand `tests/helpers/factories.ts`
  - [ ] Add architecture response builders
  - [ ] Add classify result builders
  - [ ] Add mock TypeScript program builders
- [ ] Add parameterized tests to `get-plugin-code-fixes.service.test.ts`
- [ ] Run full test suite to verify

### Phase 2C: Major Restructuring
- [ ] Split `classify-ast.service.test.ts`
  - [ ] Create `classify-ast-kind-parsing.test.ts`
  - [ ] Create `classify-ast-contracts.test.ts`
  - [ ] Create `classify-ast-locate.test.ts`
  - [ ] Delete original
- [ ] Split `check-contracts.service.test.ts`
  - [ ] Create `check-contracts-dependency.test.ts`
  - [ ] Create `check-contracts-implementation.test.ts`
  - [ ] Create `check-contracts-purity.test.ts`
  - [ ] Delete original
- [ ] Simplify `language-service-proxy.test.ts`
  - [ ] Remove custom test proxy class
  - [ ] Use jest.fn() mocks
  - [ ] Reduce from 12→8 tests
- [ ] Create `tests/helpers/entity-test-helpers.ts`
- [ ] Update entity tests to use helpers
- [ ] Run full test suite to verify

---

## Success Criteria

✅ **Phase 2A Complete When:**
- All tests passing (393/393)
- 5 fewer files (34→29)
- No duplicate helper functions in E2E tests
- Basic test documentation exists

✅ **Phase 2B Complete When:**
- All tests passing (383-393 range, may consolidate some redundant tests)
- 7 fewer files (34→27)
- All E2E tests in one file
- Pipeline setup extracted to helper
- Enhanced factory library

✅ **Phase 2C Complete When:**
- All tests passing (383-393 range)
- No test file over 500 lines
- Entity test helpers in use
- Improved code quality metrics (A- or better across board)

---

## Conclusion

The first consolidation (45→34 files) focused on **eliminating redundancy**. This second phase should focus on:

1. **Shared Infrastructure** - Extract common patterns into helpers
2. **Logical Organization** - Split massive files, consolidate tiny files
3. **Documentation** - Make the test suite approachable for new contributors

The biggest wins are in **Phase 2A** (Quick Wins) and **Phase 2B** (E2E consolidation + pipeline extraction). These provide 80% of the value with 20% of the effort.

**Recommended Action:** Start with Phase 2A (2-3 hours) and reassess before committing to larger refactorings.
