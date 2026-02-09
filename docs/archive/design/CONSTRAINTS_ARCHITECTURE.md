# Constraints Architecture: Separation of Concerns Analysis

> **Status:** Implemented (Option C: Full Vertical Slices)
> **Date:** 2026-02-07
> **Last updated:** 2026-02-08

Analysis of the current constraints/contracts system architecture, with options for better separation of concerns in code and filesystem structure.

> **Note:** This design exploration is now fully implemented. The chosen approach was **Option C (Full Vertical Slices)** — each contract type has its own directory containing a checker class and generator function. The `CONSTRAINT_BINDINGS` map was replaced by a `GENERATORS` registry (`generator-registry.ts`). The ASTPort was uplifted from 27 fine-grained methods to 2 high-level view methods (`ASTViewPort`). `CheckContractsService` is now a thin dispatcher (~60 lines) that delegates to per-contract `ContractChecker` implementations.

---

## Current Architecture

### The Monolith: `CheckContractsService`

All six contract checkers live in a single ~322-line class (`src/application/use-cases/check-contracts/check-contracts.service.ts`). The class:

1. Takes only `TypeScriptPort` in its constructor (filesystem data arrives pre-resolved as `Map<string, string[]>` in the request)
2. Iterates contracts, validates each, then dispatches via a `switch` statement
3. Calls a private method per contract type (`checkNoDependency`, `checkPurity`, etc.)
4. Aggregates diagnostics and returns a response

### What Each Checker Actually Needs

Filesystem data is pre-resolved before `CheckContractsService.execute()` is called. The request carries a `resolvedFiles: Map<string, string[]>` that maps each symbol location to its files. This means checkers no longer call any filesystem port directly — they receive pre-computed file lists.

| Checker | TypeScriptPort | Pre-resolved Files | Domain Utilities |
|---------|:-:|:-:|---|
| `checkNoDependency` | `getSourceFile`, `getImports`, `getTypeChecker` | `resolvedFiles` | `isFileInSymbol` |
| `checkPurity` | `getSourceFile`, `getImportModuleSpecifiers` | `resolvedFiles` | `NODE_BUILTINS` |
| `checkNoCycles` | `getSourceFile`, `getImports`, `getTypeChecker` | `resolvedFiles` | `isFileInSymbol`, `findCycles` |
| `checkMustImplement` | `getSourceFile`, `getExportedInterfaceNames`, `hasClassImplementing` | `resolvedFiles` | (none) |
| `checkExists` | (none) | `resolvedFiles` | (none) |
| `checkMirrors` | (none) | `resolvedFiles` | `relativePath` |

Two clear groups emerge:

- **Import-analysis contracts** (`noDependency`, `purity`, `noCycles`, `mustImplement`): Need the TypeScript compiler to resolve imports, scan interfaces, etc. Also use pre-resolved file lists.
- **Filesystem contracts** (`exists`, `mirrors`): Only use pre-resolved file lists, no TypeScript analysis needed.

### Current Filesystem Layout

```
src/application/use-cases/check-contracts/
├── check-contracts.request.ts      # DTO
├── check-contracts.response.ts     # DTO
├── check-contracts.service.ts      # All 6 checkers in one class (~322 lines)
└── check-contracts.use-case.ts     # Interface
```

### Other Places Contracts Appear

| Layer | File | Responsibility |
|-------|------|----------------|
| Domain | `contract-type.ts` | Flat enum of 6 variants |
| Domain | `contract.ts` | Validation switch (arg count per type) |
| Domain | `diagnostic.ts` | Factory methods (one per violation type) |
| Domain | `diagnostic-codes.ts` | Flat constants |
| Application | `classify-ast.service.ts` | `CONSTRAINT_BINDINGS` map + `walkConstraintView()` — data-driven conversion of `TypeNodeView` constraints into `Contract[]` |
| Runtime | `kind.ts` | `Constraints<Members>` — the user-facing type |
| Port | `ast.port.ts` | `ASTViewPort` (2 methods), `TypeNodeView` — structural view of constraint type trees |

---

## Problems with the Current Design

### 1. Single Responsibility Violation

`CheckContractsService` knows how to check all six contract types. Adding a 7th means modifying this class. The `switch` statement is the classic Open-Closed Principle violation.

### 2. Over-wide Dependencies

The constructor takes `TypeScriptPort` even though `checkExists` and `checkMirrors` never use it. This makes the dependency graph wider than necessary and makes it harder to reason about what each checker actually requires.

> **Update:** The `FileSystemPort` dependency was removed — filesystem data now arrives pre-resolved in the request. However, `TypeScriptPort` is still injected into the constructor even though filesystem-only checkers don't need it. On the classifier side, the ASTPort was uplifted from 27 fine-grained methods to `ASTViewPort` with just 2 methods, fully resolving the over-wide dependency problem for classification.

### 3. Classification Also Has a Switch *(Largely Resolved)*

~~`generateContractsFromConfig()` in `ClassifyASTService` has its own embedded knowledge of all contract shapes (tuple pairs vs. collective lists vs. booleans). Adding a new contract requires modifying both the classifier AND the checker.~~

This is now largely resolved. The classifier uses a data-driven `CONSTRAINT_BINDINGS` map that declaratively maps constraint property names (e.g., `"noDependency"`, `"filesystem.exists"`) to contract types and shapes. The `walkConstraintView()` method generically traverses the `TypeNodeView` tree and generates contracts using the bindings. Adding a new tuple-pair or string-list contract requires only adding one entry to `CONSTRAINT_BINDINGS` + one checker. Only `purity` (boolean/intrinsic) remains a special case handled by propagation logic.

### 4. Test Files Don't Match Contract Boundaries

Tests are split by loose conceptual grouping, not by contract type:

| Test File | Contracts Tested |
|-----------|-----------------|
| `check-contracts-dependency.test.ts` | `noDependency` + `noCycles` |
| `check-contracts-implementation.test.ts` | `mustImplement` + `mirrors` |
| `check-contracts-purity.test.ts` | `purity` + `exists` + general |

`mirrors` is tested alongside `mustImplement` even though they have nothing in common. `exists` is tested alongside `purity` even though they use entirely different ports. The groupings were arbitrary splits by file size, not by domain concept.

### 5. No Filesystem Structure Communicates the Taxonomy

Looking at the folder tree, there's no indication that contracts fall into natural categories. Everything is flat under `check-contracts/`.

---

## Options

### Option A: Strategy Pattern (Separate Checker Classes, Flat)

Extract each contract type's checking logic into its own class implementing a common `ContractChecker` interface:

```
src/application/use-cases/check-contracts/
├── check-contracts.request.ts
├── check-contracts.response.ts
├── check-contracts.use-case.ts
├── check-contracts.service.ts         # Dispatcher only (~50 lines)
├── checkers/
│   ├── contract-checker.ts            # Interface
│   ├── no-dependency.checker.ts
│   ├── purity.checker.ts
│   ├── no-cycles.checker.ts
│   ├── must-implement.checker.ts
│   ├── exists.checker.ts
│   └── mirrors.checker.ts
```

**Interface:**

```typescript
interface ContractChecker {
  readonly type: ContractType;
  check(contract: Contract, context: CheckContext): CheckResult;
}

interface CheckContext {
  program: Program;
  checker: TypeChecker;
}

interface CheckResult {
  diagnostics: Diagnostic[];
  filesAnalyzed: number;
}
```

**Dispatcher becomes trivial:**

```typescript
class CheckContractsService {
  private readonly checkers: Map<ContractType, ContractChecker>;

  constructor(checkers: ContractChecker[]) {
    this.checkers = new Map(checkers.map(c => [c.type, c]));
  }

  execute(request: CheckContractsRequest): CheckContractsResponse {
    for (const contract of request.contracts) {
      const checker = this.checkers.get(contract.type);
      const result = checker.check(contract, { program, checker });
      // ...aggregate
    }
  }
}
```

**Pros:**
- Open-Closed: adding a new contract = adding a new file, no modification to dispatcher
- Each checker declares only the ports it actually needs in its own constructor
- Easy to test in isolation
- Simple, well-understood pattern

**Cons:**
- No grouping by category — all 6 checkers are flat peers
- `CheckContext` passes `program`/`checker` even to filesystem-only checkers that ignore them
- Doesn't address the classification side (`generateContractsFromConfig` still has embedded knowledge)

---

### Option B: Strategy + Category Folders

Same as Option A but with filesystem structure that communicates the two natural categories:

```
src/application/use-cases/check-contracts/
├── check-contracts.request.ts
├── check-contracts.response.ts
├── check-contracts.use-case.ts
├── check-contracts.service.ts         # Dispatcher (~50 lines)
├── contract-checker.ts                # Interface
├── import-analysis/                   # Needs TypeScriptPort + FileSystemPort
│   ├── no-dependency.checker.ts
│   ├── purity.checker.ts
│   ├── no-cycles.checker.ts
│   └── must-implement.checker.ts
└── filesystem/                        # Needs FileSystemPort only
    ├── exists.checker.ts
    └── mirrors.checker.ts
```

**Pros:**
- All of Option A's benefits
- Folder structure communicates the dependency split (TS-dependent vs. FS-only)
- Easy to understand at a glance which checkers need which ports
- Natural place to put category-specific shared utilities (e.g., `import-analysis/` could hold the import-graph-builder if that gets extracted)

**Cons:**
- More directories to navigate for only 6 files
- Categories might feel premature for 4+2 split
- Still doesn't address classification side

---

### Option C: Full Vertical Slices

Each contract type becomes a vertical slice containing everything related to it — checker, contract generation logic, and tests:

```
src/application/use-cases/contracts/
├── contract-checker.ts                # Shared interface
├── check-contracts.service.ts         # Dispatcher
├── check-contracts.request.ts
├── check-contracts.response.ts
├── no-dependency/
│   ├── no-dependency.checker.ts
│   └── no-dependency.generator.ts     # Extracted from classify-ast
├── purity/
│   ├── purity.checker.ts
│   └── purity.generator.ts
├── no-cycles/
│   ├── no-cycles.checker.ts
│   └── no-cycles.generator.ts
├── must-implement/
│   ├── must-implement.checker.ts
│   └── must-implement.generator.ts
├── exists/
│   ├── exists.checker.ts
│   └── exists.generator.ts
└── mirrors/
    ├── mirrors.checker.ts
    └── mirrors.generator.ts
```

Test structure would mirror:

```
tests/unit/contracts/
├── no-dependency.checker.test.ts
├── purity.checker.test.ts
├── no-cycles.checker.test.ts
├── must-implement.checker.test.ts
├── exists.checker.test.ts
└── mirrors.checker.test.ts
```

The `*.generator.ts` files extract the contract-creation logic from `generateContractsFromConfig()`. Each generator knows its shape (tuple pair, collective list, etc.) and how to resolve symbols into `Contract` objects.

**Pros:**
- Maximum cohesion — everything about `mirrors` is in one folder
- Adding a new contract type is fully self-contained (add one folder with checker + generator)
- Both the checker AND the classifier are now open-closed
- Filesystem structure is maximally expressive
- Test organization follows naturally (one test file per checker)

**Cons:**
- Significant refactoring effort — need to extract generator logic from `ClassifyASTService`
- Lots of small files and directories (12+ new files for 6 contracts)
- Generators still need access to `ArchSymbol.findByPath()` and the instance symbol — how to pass this context cleanly needs design
- `ClassifyASTService.generateContractsFromConfig()` becomes a thin loop over generators, which raises the question: should it still exist as a method, or does it just become a registry lookup?
- Risk of over-engineering for only 6 contract types

---

### Option D: Hybrid — Strategy Checkers + Declarative Generation *(Generation side implemented)*

> **Status:** The declarative generation part of this option is already implemented. The classifier now uses a `CONSTRAINT_BINDINGS` map and `walkConstraintView()` — essentially what this option proposes as `CONTRACT_SHAPES`. The remaining work is the checker extraction into strategy classes.

Split checking into strategy classes (like Option A/B) but handle contract generation declaratively rather than extracting generators:

```
src/application/use-cases/check-contracts/
├── check-contracts.request.ts
├── check-contracts.response.ts
├── check-contracts.use-case.ts
├── check-contracts.service.ts         # Dispatcher
├── contract-checker.ts                # Interface
├── import-analysis/
│   ├── no-dependency.checker.ts
│   ├── purity.checker.ts
│   ├── no-cycles.checker.ts
│   └── must-implement.checker.ts
└── filesystem/
    ├── exists.checker.ts
    └── mirrors.checker.ts
```

For contract generation, instead of extracting per-type generators, formalize the three shapes as a data-driven mapping in `ClassifyASTService`. This is now implemented as `CONSTRAINT_BINDINGS`:

```typescript
// Already in classify-ast.service.ts (current codebase)
const CONSTRAINT_BINDINGS: Record<string, { type: ContractType; shape: 'boolean' | 'stringList' | 'tuplePairs'; intrinsic?: boolean }> = {
  'noDependency':       { type: ContractType.NoDependency,  shape: 'tuplePairs' },
  'mustImplement':      { type: ContractType.MustImplement, shape: 'tuplePairs' },
  'noCycles':           { type: ContractType.NoCycles,      shape: 'stringList' },
  'pure':               { type: ContractType.Purity,        shape: 'boolean', intrinsic: true },
  'filesystem.exists':  { type: ContractType.Exists,        shape: 'stringList' },
  'filesystem.mirrors': { type: ContractType.Mirrors,       shape: 'tuplePairs' },
};
```

The `walkConstraintView()` method generically traverses the `TypeNodeView` tree, builds dotted property names (e.g., `"filesystem.exists"`), looks up bindings, and generates contracts. `pure` is marked `intrinsic: true` and handled by propagation rather than direct generation.

**Pros:**
- Checker separation gets all the benefits of Options A/B
- Generation side becomes data-driven without the overhead of per-type generator files
- Adding a new tuple-pair or collective-list contract = add one entry to the array + one checker file
- Moderate refactoring effort
- Doesn't create excessive file count

**Cons:**
- New contract shapes (not tuple-pair or collective-list) still require new handler code
- `purity` propagation remains a special case that doesn't fit the declarative model
- Generation logic stays in `ClassifyASTService` rather than being co-located with its checker

---

## Comparison Matrix

| Criterion | A (Flat Strategy) | B (Category Folders) | C (Vertical Slices) | D (Hybrid) |
|-----------|:-:|:-:|:-:|:-:|
| Open-Closed for checkers | Yes | Yes | Yes | Yes |
| Open-Closed for generation | No | No | Yes | Mostly (**done**) |
| Filesystem expressiveness | Low | Medium | High | Medium |
| Dependency narrowing | Yes | Yes | Yes | Yes |
| Refactoring effort | Small | Small | Large | Small (generation done) |
| File/directory count | +7 | +9 | +18 | +9 |
| Risk of over-engineering | Low | Low | Medium | Low |
| Test organization clarity | Better | Better | Best | Better |

---

## Recommendation

**Option C (Full Vertical Slices)** — maximum cohesion, each contract type fully self-contained.

The generation side is already data-driven (`CONSTRAINT_BINDINGS` + `walkConstraintView()`), so extracting per-contract generators is lower-effort than originally estimated. The remaining work is:

1. **Checker extraction** — each private method lifts cleanly into its own class (no shared state).
2. **Generator extraction** — each contract type gets its own generator function, replacing the generic shape handlers in `walkConstraintView()`.
3. **Directory restructuring** — one subdirectory per contract type under `check-contracts/`.
4. **Test reorganization** — one test file per contract type, eliminating the current arbitrary groupings.

---

## Target Architecture

### Directory Structure

```
src/application/use-cases/check-contracts/
├── check-contracts.request.ts        # DTO (unchanged)
├── check-contracts.response.ts       # DTO (unchanged)
├── check-contracts.use-case.ts       # Interface (unchanged)
├── check-contracts.service.ts        # Thin dispatcher (~60 lines)
├── contract-checker.ts               # ContractChecker interface + CheckContext + CheckResult
├── contract-generator.ts             # ContractGenerator type + GeneratorContext
├── no-dependency/
│   ├── no-dependency.checker.ts      # Extracted from checkNoDependency()
│   └── no-dependency.generator.ts    # tuplePairs → Contract[]
├── purity/
│   ├── purity.checker.ts             # Extracted from checkPurity()
│   └── purity.generator.ts           # boolean/intrinsic + propagation logic
├── no-cycles/
│   ├── no-cycles.checker.ts          # Extracted from checkNoCycles()
│   └── no-cycles.generator.ts        # stringList → Contract[]
├── must-implement/
│   ├── must-implement.checker.ts     # Extracted from checkMustImplement()
│   └── must-implement.generator.ts   # tuplePairs → Contract[]
├── exists/
│   ├── exists.checker.ts             # Extracted from checkExists()
│   └── exists.generator.ts           # stringList → Contract[]
└── mirrors/
    ├── mirrors.checker.ts            # Extracted from checkMirrors()
    └── mirrors.generator.ts          # tuplePairs → Contract[]
```

### Test Structure

```
tests/unit/
├── no-dependency.test.ts             # Checker tests (from check-contracts-dependency)
├── purity.test.ts                    # Checker tests (from check-contracts-purity)
├── no-cycles.test.ts                 # Checker tests (from check-contracts-dependency)
├── must-implement.test.ts            # Checker tests (from check-contracts-implementation)
├── exists.test.ts                    # Checker tests (from check-contracts-purity)
├── mirrors.test.ts                   # Checker tests (from check-contracts-implementation)
├── check-contracts-service.test.ts   # Dispatcher: validation, aggregation, metrics
├── classify-ast-contracts.test.ts    # Generator integration via ClassifyASTService (unchanged)
└── ... (other existing test files)
```

### Key Interfaces

```typescript
// contract-checker.ts
interface ContractChecker {
  readonly type: ContractType;
  check(contract: Contract, context: CheckContext): CheckResult;
}

interface CheckContext {
  tsPort: TypeScriptPort;
  program: Program;
  checker: TypeChecker;
  resolvedFiles: Map<string, string[]>;
}

interface CheckResult {
  diagnostics: Diagnostic[];
  filesAnalyzed: number;
}
```

```typescript
// contract-generator.ts
type ContractGenerator = (
  value: TypeNodeView,
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
) => { contracts: Contract[]; errors: string[] };
```

The generator type is a simple function signature. Each `*.generator.ts` exports a function matching this type. Purity is special — its generator also handles propagation (see implementation plan).

### Dispatcher

```typescript
// check-contracts.service.ts (~60 lines)
class CheckContractsService implements CheckContractsUseCase {
  private readonly checkers: Map<ContractType, ContractChecker>;

  constructor(checkers: ContractChecker[]) {
    this.checkers = new Map(checkers.map(c => [c.type, c]));
  }

  execute(request: CheckContractsRequest): CheckContractsResponse {
    const context: CheckContext = {
      tsPort: /* from constructor or request */,
      program: request.program,
      checker: /* tsPort.getTypeChecker(program) */,
      resolvedFiles: request.resolvedFiles,
    };

    for (const contract of request.contracts) {
      // validate, then dispatch to checker
      const checker = this.checkers.get(contract.type);
      const result = checker.check(contract, context);
      // aggregate diagnostics + filesAnalyzed
    }
  }
}
```

### Generator Registry

```typescript
// In classify-ast.service.ts — replaces CONSTRAINT_BINDINGS + walkConstraintView
import { generateNoDependency } from '../check-contracts/no-dependency/no-dependency.generator';
import { generateMustImplement } from '../check-contracts/must-implement/must-implement.generator';
// ... etc

const GENERATORS: Record<string, { type: ContractType; generate: ContractGenerator }> = {
  'noDependency':       { type: ContractType.NoDependency, generate: generateNoDependency },
  'mustImplement':      { type: ContractType.MustImplement, generate: generateMustImplement },
  'noCycles':           { type: ContractType.NoCycles, generate: generateNoCycles },
  'filesystem.exists':  { type: ContractType.Exists, generate: generateExists },
  'filesystem.mirrors': { type: ContractType.Mirrors, generate: generateMirrors },
};
```

The classifier still walks the `TypeNodeView` tree to extract dotted property names, but instead of inline shape handling, delegates to the per-contract generator function. Purity propagation remains in `generateTypeLevelContracts()` but calls the purity generator.

### Domain Layer — No Changes Needed

The domain types (`ContractType`, `Contract`, `Diagnostic`, `DiagnosticCode`) are already well-separated and do not need restructuring. The domain layer's flat organization is appropriate — these are small, stable types.

---

## Implementation Plan

### Phase 1: Checker Extraction (additive, no breakage)

**Goal:** Extract each private checker method into its own class. The dispatcher delegates to registered checkers. No test breakage — the `switch` is replaced by a registry lookup but behavior is identical.

**1a. Create shared interfaces**

Create `contract-checker.ts` with `ContractChecker`, `CheckContext`, and `CheckResult`. These are new types with no consumers yet.

**1b. Create the 6 checker classes**

Each checker is a mechanical lift of the corresponding private method:

| File | Extracted from | Needs |
|------|---------------|-------|
| `no-dependency/no-dependency.checker.ts` | `checkNoDependency()` | `tsPort`, `program`, `checker`, `resolvedFiles` |
| `purity/purity.checker.ts` | `checkPurity()` | `tsPort`, `program`, `resolvedFiles` |
| `no-cycles/no-cycles.checker.ts` | `checkNoCycles()` | `tsPort`, `program`, `checker`, `resolvedFiles` |
| `must-implement/must-implement.checker.ts` | `checkMustImplement()` | `tsPort`, `program`, `resolvedFiles` |
| `exists/exists.checker.ts` | `checkExists()` | `resolvedFiles` |
| `mirrors/mirrors.checker.ts` | `checkMirrors()` | `resolvedFiles` |

Each checker takes the full `CheckContext` — filesystem-only checkers simply ignore `tsPort`/`program`/`checker`.

**1c. Rewrite `CheckContractsService` as dispatcher**

- Constructor takes `ContractChecker[]` instead of `TypeScriptPort`
- `execute()` builds `CheckContext`, iterates contracts, dispatches via `checkers.get(contract.type)`
- Contract validation (the `contract.validate()` guard) stays in the dispatcher
- ~60 lines

**1d. Update wiring**

All call sites that construct `CheckContractsService(tsPort)` must now construct individual checkers and pass them in. Update:
- `get-plugin-diagnostics.service.ts` (plugin entry point)
- `check.command.ts` (CLI entry point)
- Test files that construct the service directly

**1e. Verify**

- `npm test` — all tests pass
- `npm run build` — clean TypeScript build

### Phase 2: Test Reorganization

**Goal:** One test file per contract type. Eliminates arbitrary groupings.

**2a. Split test files**

| Current file | New files | Tests moved |
|-------------|-----------|-------------|
| `check-contracts-dependency.test.ts` (18 tests) | `no-dependency.test.ts` (~11 tests), `no-cycles.test.ts` (~7 tests) | Split at describe boundary |
| `check-contracts-implementation.test.ts` (12 tests) | `must-implement.test.ts` (~7 tests), `mirrors.test.ts` (~3 tests) | Split at describe boundary + move guard tests |
| `check-contracts-purity.test.ts` (16 tests) | `purity.test.ts` (~8 tests), `exists.test.ts` (~4 tests), `check-contracts-service.test.ts` (~4 tests: validation, aggregation, metrics, guard) | Split at describe boundary |

Each new file constructs only the single checker it tests (not the full service), giving true isolation.

The general/cross-cutting tests (contract validation, multiple contracts aggregation, response metrics, guard clauses for no-location) move to `check-contracts-service.test.ts` which tests the dispatcher.

**2b. Delete old test files**

Remove `check-contracts-dependency.test.ts`, `check-contracts-implementation.test.ts`, `check-contracts-purity.test.ts`.

**2c. Verify**

- `npm test` — same test count, all passing
- `npm test -- --coverage` — thresholds met

### Phase 3: Generator Extraction

**Goal:** Extract per-contract generator functions from `ClassifyASTService.walkConstraintView()`. Each generator lives alongside its checker in the same contract directory.

**3a. Create `contract-generator.ts`**

Define the `ContractGenerator` function type and `GeneratorContext` (or just use inline types).

**3b. Extract 5 generator functions**

Each is a small function extracted from the shape-handling logic in `walkConstraintView()`:

| File | Shape | Logic |
|------|-------|-------|
| `no-dependency/no-dependency.generator.ts` | tuplePairs | For each `[from, to]` pair, resolve to ArchSymbols, create Contract |
| `must-implement/must-implement.generator.ts` | tuplePairs | Same shape as noDependency |
| `no-cycles/no-cycles.generator.ts` | stringList | Resolve all names to ArchSymbols, create one Contract |
| `exists/exists.generator.ts` | stringList | Same shape as noCycles |
| `mirrors/mirrors.generator.ts` | tuplePairs | Same shape as noDependency |

Note: `tuplePairs` generators and `stringList` generators share the same underlying logic. Each generator can be ~15-25 lines. If desired, a shared helper (`resolveTuplePairs`, `resolveStringList`) can reduce duplication, but each generator file must exist for the vertical slice structure.

**3c. Handle purity specially**

Purity is different from the other 5:
- It uses `boolean` shape (not tuplePairs or stringList)
- It propagates intrinsically from member Kinds to composites
- The current propagation logic is in `generateTypeLevelContracts()` (lines 183-208 of classify-ast.service.ts)

Create `purity/purity.generator.ts` that exports two functions:
1. `generatePurityDirect()` — no-op (purity is always propagated, never direct)
2. `propagatePurity(memberKindDef, memberSymbol, kindName, location)` — creates a Purity contract for a member whose Kind has `{ pure: true }`

**3d. Rewrite `ClassifyASTService` to use generators**

Replace `CONSTRAINT_BINDINGS` + `walkConstraintView()` with:
1. A `GENERATORS` registry mapping constraint keys to generator functions
2. A simplified `walkConstraints()` that traverses the `TypeNodeView` object tree, builds dotted names, and calls the appropriate generator
3. Purity propagation calls `propagatePurity()` instead of inline logic

The `hasIntrinsicPure()` helper moves to `purity/purity.generator.ts`.

**3e. Verify**

- `npm test` — all tests pass (classify-ast-contracts tests should pass without changes since they test via `ClassifyASTService.execute()`)
- `npm run build` — clean

### Phase 4: Cleanup

**Goal:** Remove dead code, update documentation.

**4a. Remove dead code from `classify-ast.service.ts`**

- Remove `CONSTRAINT_BINDINGS` constant
- Remove `walkConstraintView()` method (replaced by `walkConstraints()` + per-contract generators)
- Remove `hasIntrinsicPure()` method (moved to purity generator)

**4b. Update documentation**

- Update `CLAUDE.md` test section (new test file names)
- Update `tests/README.md` (new test organization)
- Update `docs/status/DONE_VS_TODO.md` (mark vertical slices as done)
- Update this document's status to "Implemented"

**4c. Final verification**

- `npm test` — all tests pass
- `npm test -- --coverage` — all thresholds met
- `npm run build` — clean

---

## File Change Summary

| File | Action |
|------|--------|
| `check-contracts/contract-checker.ts` | **New** — interfaces |
| `check-contracts/contract-generator.ts` | **New** — generator type |
| `check-contracts/no-dependency/no-dependency.checker.ts` | **New** — extracted checker |
| `check-contracts/no-dependency/no-dependency.generator.ts` | **New** — extracted generator |
| `check-contracts/purity/purity.checker.ts` | **New** — extracted checker |
| `check-contracts/purity/purity.generator.ts` | **New** — extracted generator + propagation |
| `check-contracts/no-cycles/no-cycles.checker.ts` | **New** — extracted checker |
| `check-contracts/no-cycles/no-cycles.generator.ts` | **New** — extracted generator |
| `check-contracts/must-implement/must-implement.checker.ts` | **New** — extracted checker |
| `check-contracts/must-implement/must-implement.generator.ts` | **New** — extracted generator |
| `check-contracts/exists/exists.checker.ts` | **New** — extracted checker |
| `check-contracts/exists/exists.generator.ts` | **New** — extracted generator |
| `check-contracts/mirrors/mirrors.checker.ts` | **New** — extracted checker |
| `check-contracts/mirrors/mirrors.generator.ts` | **New** — extracted generator |
| `check-contracts/check-contracts.service.ts` | **Modified** — 322 lines → ~60 lines dispatcher |
| `classify-ast/classify-ast.service.ts` | **Modified** — remove inline generation, use generator registry |
| `get-plugin-diagnostics.service.ts` | **Modified** — updated wiring |
| `infrastructure/cli/commands/check.command.ts` | **Modified** — updated wiring |
| `tests/unit/no-dependency.test.ts` | **New** — split from check-contracts-dependency |
| `tests/unit/no-cycles.test.ts` | **New** — split from check-contracts-dependency |
| `tests/unit/must-implement.test.ts` | **New** — split from check-contracts-implementation |
| `tests/unit/mirrors.test.ts` | **New** — split from check-contracts-implementation |
| `tests/unit/purity.test.ts` | **New** — split from check-contracts-purity |
| `tests/unit/exists.test.ts` | **New** — split from check-contracts-purity |
| `tests/unit/check-contracts-service.test.ts` | **New** — dispatcher tests |
| `tests/unit/check-contracts-dependency.test.ts` | **Deleted** |
| `tests/unit/check-contracts-implementation.test.ts` | **Deleted** |
| `tests/unit/check-contracts-purity.test.ts` | **Deleted** |

**New files:** 16 source + 7 test = 23
**Modified files:** 4 source
**Deleted files:** 3 test
