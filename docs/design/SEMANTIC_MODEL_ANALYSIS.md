# Semantic Model Analysis: Replacing Live Queries with Pre-Built Data

> **Status:** Implemented (Option D) — see `src/application/services/resolve-symbol-files.ts`
> **Date:** 2026-02-07
> **Supersedes:** None (new analysis)
> **Related:** CONTRACT_BINDING_ANALYSIS_V3.md, CONSTRAINTS_ARCHITECTURE.md

Analysis of how the checker's live filesystem and compiler queries could be replaced with a pre-built semantic model, analogous to how TypeScript's checker evaluates over a pre-loaded `Program` rather than querying the filesystem during type-checking.

---

## The Problem

The `CheckContractsService` currently makes **live queries** to two external systems during contract evaluation:

### Filesystem Queries (via `FileSystemPort`)

| Method | Used By | Purpose |
|--------|---------|---------|
| `readDirectory(location, true)` | noDependency, purity, noCycles, mustImplement, mirrors | Get files belonging to a symbol |
| `directoryExists(location)` | exists | Check if a member directory exists |
| `relativePath(from, to)` | mirrors | Compute relative path for comparison |

### TypeScript Compiler Queries (via `TypeScriptPort`)

| Method | Used By | Purpose |
|--------|---------|---------|
| `getSourceFile(program, file)` | noDependency, purity, noCycles, mustImplement | Get parsed source file from program |
| `getImports(sourceFile, checker)` | noDependency, noCycles | Resolve import edges |
| `getImportModuleSpecifiers(program, sf)` | purity | Get raw module specifier strings |
| `getExportedInterfaceNames(program, sf)` | mustImplement | Find exported interfaces |
| `hasClassImplementing(program, sf, name)` | mustImplement | Check if class implements interface |
| `getTypeChecker(program)` | (dispatcher) | Create type checker instance |

### Why This Is Architecturally Odd

In TypeScript's own compiler pipeline, the checker **never touches the filesystem**. All files are pre-loaded into the `Program` during creation. The checker operates entirely over in-memory data structures — `SourceFile` objects, the symbol table, and the type cache.

This is a universal pattern across modern compilers and static analysis tools:

| Tool | Model | Filesystem During Checking? |
|------|-------|-----------------------------|
| **TypeScript** | `Program` + `SourceFile` cache | No — all files pre-loaded |
| **Roslyn (.NET)** | `Compilation` + `SemanticModel` | No — operates on in-memory syntax trees |
| **rust-analyzer** | Salsa query database | No — durability vectors avoid re-reading |
| **ESLint** | Pre-parsed AST | No — `Linter` class is pure |
| **Semgrep** | Cached generic AST | No — AST cached for multiple rules |

**None of them query the filesystem during rule/constraint evaluation.** They all follow the same two-phase pattern: (1) build a complete model, then (2) evaluate rules against it. The standard compiler terminology for this is the **analysis phase** (build the decorated AST / intermediate representation) followed by the **checking phase** (evaluate over it).

Our checker violates this principle. It reaches back out to both the filesystem and the TypeScript compiler during evaluation, making it impure — its results depend on external system state at the moment of evaluation, not on a consistent snapshot.

---

## What the Checker Actually Needs

Distilling all six checkers down to the data they consume (not the ports they query):

### Per-symbol data

| Data | Source | Used By |
|------|--------|---------|
| Files belonging to this symbol | `fsPort.readDirectory(symbol.declaredLocation)` | noDependency, purity, noCycles, mustImplement, mirrors |
| Whether directory exists | `fsPort.directoryExists(symbol.declaredLocation)` | exists |

### Per-file data

| Data | Source | Used By |
|------|--------|---------|
| Resolved import edges (`ImportEdge[]`) | `tsPort.getImports(sourceFile, checker)` | noDependency, noCycles |
| Module specifiers (raw strings) | `tsPort.getImportModuleSpecifiers(program, sf)` | purity |
| Exported interface names | `tsPort.getExportedInterfaceNames(program, sf)` | mustImplement |
| Whether file has class implementing X | `tsPort.hasClassImplementing(program, sf, name)` | mustImplement |

### Path computations

| Data | Source | Used By |
|------|--------|---------|
| Relative path from directory to file | `fsPort.relativePath(from, to)` | mirrors |

---

## Key Insight: Two Different Problems

The live queries fall into two categories with very different characteristics:

### 1. Filesystem Resolution (the real problem)

The checker calls `readDirectory()` and `directoryExists()` to answer: **"which files belong to which symbols?"** This is I/O — it hits the actual filesystem. It's non-deterministic (files could change between calls), it's slow relative to in-memory lookups, and it means the checker's results depend on filesystem state at evaluation time rather than on a consistent snapshot.

Critically, **`ResolveFilesService` already exists** and solves this exact problem. It resolves `ArchSymbol → string[]` via `FileSystemPort`. But the checker doesn't use it — it duplicates this logic inline by calling `readDirectory` directly.

### 2. TypeScript Program Queries (mostly fine)

The checker calls `getSourceFile()`, `getImports()`, etc. against the TypeScript `Program`. But the `Program` **is already a pre-built model** — TypeScript pre-loads all files during `createProgram()`. Calling `getSourceFile(program, path)` is a hash map lookup, not filesystem I/O. These queries are analogous to how TypeScript's own checker queries its Program.

The TypeScript port queries are not the architectural problem. They're already operating on a pre-built model. The only question is whether we want an additional abstraction layer between the checker and the TypeScript Program — and that's a separate concern from the filesystem issue.

### Implication

The scope of the problem is narrower than it first appears. We don't need to pre-compute everything. We primarily need to **pre-resolve symbol → files** (which `ResolveFilesService` already does) and pass that mapping to the checker instead of a `FileSystemPort`.

---

## Options

### Option A: Status Quo — Live Queries

Keep the checker as-is. It takes `TypeScriptPort` + `FileSystemPort` and queries them during evaluation.

**Pros:**
- No refactoring needed
- Simple to understand
- Works today

**Cons:**
- Checker is impure — results depend on external system state
- Filesystem queries are duplicated (checker re-does what `ResolveFilesService` already does)
- Cannot test the checker without mocking two port interfaces
- No consistent snapshot — theoretically, filesystem could change between calls to different checkers
- Doesn't follow the universal compiler pattern of "build model, then evaluate"

---

### Option B: Pre-Resolved File Map — Narrow Fix

Add a pre-resolved `Map<string, string[]>` (symbol location → files) to the `CheckContractsRequest`. The orchestrator calls `ResolveFilesService` before checking and passes the results in. The checker stops calling `FileSystemPort`.

**Changes to `CheckContractsRequest`:**

```typescript
interface CheckContractsRequest {
  symbols: ArchSymbol[];
  contracts: Contract[];
  config: KindScriptConfig;
  program: Program;
  resolvedFiles: Map<string, string[]>;  // location → files
}
```

**Checker changes:**

Replace every `this.fsPort.readDirectory(location, true)` call with `request.resolvedFiles.get(location) ?? []`. Replace `this.fsPort.directoryExists(location)` with `request.resolvedFiles.has(location)`. Move `relativePath` to a domain utility (it's a pure path computation).

The constructor drops `FileSystemPort`:

```typescript
class CheckContractsService {
  constructor(
    private readonly tsPort: TypeScriptPort,
    // FileSystemPort removed
  ) {}
}
```

**Orchestrator (GetPluginDiagnosticsService or CLI) builds the map:**

```typescript
// Before calling checkContracts
const resolvedFiles = new Map<string, string[]>();
for (const symbol of symbols) {
  for (const s of allDescendants(symbol)) {
    if (s.declaredLocation) {
      const result = resolveFilesService.execute({ symbol: s, projectRoot });
      resolvedFiles.set(s.declaredLocation, result.resolved.files);
    }
  }
}
```

**Pros:**
- Minimal refactoring — the checker structure barely changes
- Removes `FileSystemPort` dependency from the checker entirely
- Uses `ResolveFilesService` (which already exists and handles child exclusion)
- Checker becomes a pure function of its inputs (data in → diagnostics out)
- Filesystem is queried once, upfront, producing a consistent snapshot
- Easier to test — no `FileSystemPort` mocking needed in checker tests

**Cons:**
- `TypeScriptPort` queries remain (the checker still calls `getSourceFile`, `getImports`, etc.)
- Pre-resolves files for ALL symbols, even those not referenced by any contract (minor waste)
- `resolvedFiles` map is a "dumb" data structure — just a `Map<string, string[]>`

---

### Option C: ProjectModel — Full Pre-Built Semantic Model

Build a `ProjectModel` domain entity that contains everything the checker needs: resolved files, import graphs, exported interfaces, and implementation relationships. The checker takes only this model and `Contract[]`.

**Domain entities:**

```typescript
/** Pre-built model of a project's architectural structure. */
class ProjectModel {
  constructor(
    private readonly symbolFiles: Map<string, ResolvedFiles>,
    private readonly fileAnalysis: Map<string, FileAnalysis>,
  ) {}

  /** Get files for a symbol location */
  getFiles(location: string): string[] { ... }

  /** Check if a location exists */
  locationExists(location: string): boolean { ... }

  /** Get import edges for a file */
  getImports(filePath: string): ImportEdge[] { ... }

  /** Get module specifiers for a file */
  getModuleSpecifiers(filePath: string): ModuleSpecifier[] { ... }

  /** Get exported interfaces for a file */
  getExportedInterfaces(filePath: string): string[] { ... }

  /** Check if file has class implementing interface */
  hasImplementation(filePath: string, interfaceName: string): boolean { ... }

  /** Get relative path between two locations */
  relativePath(from: string, to: string): string { ... }
}

/** Pre-analyzed data for a single source file. */
interface FileAnalysis {
  imports: ImportEdge[];
  moduleSpecifiers: ModuleSpecifier[];
  exportedInterfaces: string[];
  implementedInterfaces: string[];
}

interface ModuleSpecifier {
  moduleName: string;
  line: number;
  column: number;
}
```

**Checker simplifies dramatically:**

```typescript
class CheckContractsService {
  // No constructor dependencies — purely functional
  execute(contracts: Contract[], model: ProjectModel): CheckContractsResponse {
    for (const contract of contracts) {
      // ...dispatch to checkers, which query model instead of ports
    }
  }
}
```

**Builder service (new):**

```typescript
class ProjectModelBuilder {
  constructor(
    private readonly tsPort: TypeScriptPort,
    private readonly fsPort: FileSystemPort,
  ) {}

  build(symbols: ArchSymbol[], program: Program): ProjectModel {
    // 1. Resolve all symbol → files
    // 2. Analyze all files (imports, interfaces, etc.)
    // 3. Return immutable ProjectModel
  }
}
```

**Pros:**
- Checker becomes fully pure — zero port dependencies, zero constructor args
- Clean architectural boundary: build model → evaluate model
- `ProjectModel` is a testable domain entity
- Consistent snapshot — all data captured at one point in time
- Mirrors how TypeScript, Roslyn, and rust-analyzer work
- Enables future optimizations (caching, incremental updates, parallelism)
- Checker tests only need to construct a `ProjectModel` — no port mocking at all

**Cons:**
- Largest refactoring — new builder service, new domain entities, new types
- Pre-computes everything even if not all data is needed by current contracts
- Memory overhead — holds all import edges, interface names, etc. in memory
- `FileAnalysis` per-file data is extensive — 4 fields per file, across potentially hundreds of files
- Risk of over-engineering for a project with only 6 contract types

---

### Option D: Hybrid — Pre-Resolve Files, Keep Program Queries

Pre-resolve the filesystem side (Option B) but keep the TypeScript Program queries as-is. The reasoning: `Program` is already a pre-built model, so querying it through ports is architecturally sound. The filesystem queries are the real violation.

This is essentially Option B, but with a clearer rationale: **we draw the boundary at I/O type**. Queries against the pre-built `Program` are fine. Queries against the live filesystem are not.

**Checker constructor:**

```typescript
class CheckContractsService {
  constructor(
    private readonly tsPort: TypeScriptPort,
    // FileSystemPort removed
  ) {}

  execute(request: CheckContractsRequest): CheckContractsResponse {
    // request.resolvedFiles replaces all fsPort calls
    // tsPort calls remain for import analysis, interface checking, etc.
  }
}
```

**Pros:**
- All of Option B's benefits
- Clearer architectural principle: "no live I/O during checking"
- TypeScript queries remain familiar and readable
- Moderate refactoring effort
- `TypeScriptPort` is already well-tested and well-mocked

**Cons:**
- Checker still has a port dependency (`TypeScriptPort`)
- Tests still need `TypeScriptPort` mocking (but this is straightforward — mock adapters already exist)
- Not as "pure" as Option C — but pragmatically equivalent since `Program` is already a snapshot

---

### Option E: Query-Based Model (Salsa-Style)

Instead of eagerly pre-computing everything (Option C), build a lazy query cache. Each query is computed on first access and cached for subsequent calls. This mirrors rust-analyzer's Salsa database pattern.

```typescript
class ProjectQueries {
  private fileCache = new Map<string, string[]>();
  private importCache = new Map<string, ImportEdge[]>();
  // ...more caches

  constructor(
    private readonly tsPort: TypeScriptPort,
    private readonly fsPort: FileSystemPort,
    private readonly program: Program,
  ) {}

  getFiles(location: string): string[] {
    if (!this.fileCache.has(location)) {
      this.fileCache.set(location, this.fsPort.readDirectory(location, true));
    }
    return this.fileCache.get(location)!;
  }

  getImports(filePath: string): ImportEdge[] {
    if (!this.importCache.has(filePath)) {
      const sf = this.tsPort.getSourceFile(this.program, filePath);
      const checker = this.tsPort.getTypeChecker(this.program);
      this.importCache.set(filePath, sf ? this.tsPort.getImports(sf, checker) : []);
    }
    return this.importCache.get(filePath)!;
  }

  // ...similar for other queries
}
```

**Pros:**
- Lazy — only computes what's actually needed by the current contracts
- Cached — no duplicate work across checkers
- Simple implementation — just memoized method calls
- No new domain entities needed
- Could evolve into Salsa-style incremental system later

**Cons:**
- Still performs I/O during checking (just cached) — doesn't solve the consistency problem
- The "model" is actually a cache, not a true snapshot
- Checker still has indirect port dependencies (through the queries object)
- Not fundamentally different from the status quo — it's an optimization, not an architectural improvement
- Hides the I/O behind a cache, making it less obvious where side effects occur

---

## Comparison Matrix

| Criterion | A (Status Quo) | B (File Map) | C (Full Model) | D (Hybrid) | E (Query Cache) |
|-----------|:-:|:-:|:-:|:-:|:-:|
| Checker purity | No | Partial | **Full** | Partial | No |
| Filesystem I/O during checking | Yes | **No** | **No** | **No** | Yes (cached) |
| Consistent snapshot | No | **Files only** | **Everything** | **Files only** | No |
| Checker port dependencies | TS + FS | TS only | **None** | TS only | Indirect |
| Refactoring effort | None | **Small** | Large | **Small** | Medium |
| Over-computation risk | None | Minor | Significant | Minor | None |
| Test simplicity | Port mocks | Less mocking | **No mocking** | Less mocking | Port mocks |
| Memory overhead | None | Small | Significant | Small | Grows lazily |

---

## Recommendation

**Option D (Hybrid)** provides the best balance.

### Why

1. **The filesystem queries are the real problem.** The TypeScript `Program` is already a pre-built model — querying it through ports is exactly what TypeScript's own checker does against its own Program. The `readDirectory` and `directoryExists` calls are the ones that violate the "build model, then evaluate" principle.

2. **`ResolveFilesService` already exists.** The infrastructure for pre-resolving symbol → files is already built and tested. We just need to call it before checking and pass the results in.

3. **Option C over-engineers the solution.** Pre-computing all import edges, interface names, and implementation relationships for every file creates a large intermediate data structure that mirrors what the TypeScript `Program` already holds. We'd be extracting data from one pre-built model (`Program`) into another (`ProjectModel`) for minimal architectural benefit.

4. **The refactoring is small and safe.** Add `resolvedFiles` to the request, replace `fsPort` calls with map lookups, move `relativePath` to a domain utility. The checker's structure and tests barely change.

5. **It follows a clear principle:** "No live I/O during checking." The TypeScript Program queries remain because `Program` is already a snapshot of the codebase. The filesystem queries get eliminated because they're live I/O.

### Upgrade Path

If we later want Option C (full `ProjectModel`), Option D is a clean stepping stone. The file resolution is already factored out; we'd just need to add the TypeScript analysis extraction. But with only 6 contract types and a well-typed `TypeScriptPort`, the additional abstraction isn't justified today.

---

## Implementation Plan (Option D)

### Overview

Four phases, each independently testable. All phases are safe — no behaviour changes, only structural refactoring. Run `npm test` after each phase to verify.

---

### Phase 1: Add `relativePath` Domain Utility

**Why first:** This has zero dependents to update. It's a pure addition that we can test immediately, and later phases consume it.

**File:** `src/domain/utils/path-matching.ts`

Add a new export alongside the existing `isFileInSymbol`, `joinPath`, `dirnamePath`:

```typescript
/**
 * Pure relative-path computation — no filesystem needed.
 *
 * Given a base directory and a file path under it, returns the
 * portion of `to` after `from`. If `to` doesn't start with `from`,
 * returns `to` unchanged.
 */
export function relativePath(from: string, to: string): string {
  const normalizedFrom = from.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedTo = to.replace(/\\/g, '/');

  if (normalizedTo.startsWith(normalizedFrom + '/')) {
    return normalizedTo.substring(normalizedFrom.length + 1);
  }
  return normalizedTo;
}
```

**Tests:** Add a small test block in `tests/unit/path-matching.test.ts` (or create it if it doesn't exist) covering basic cases: subpath extraction, no-match passthrough, trailing slash normalization.

**Verification:** `npm test`

---

### Phase 2: Add `resolvedFiles` to `CheckContractsRequest` and Update Checker

This is the core change. The checker stops calling `FileSystemPort` and reads from the pre-resolved map instead.

#### Step 2a: Update the request DTO

**File:** `src/application/use-cases/check-contracts/check-contracts.request.ts`

```typescript
export interface CheckContractsRequest {
  symbols: ArchSymbol[];
  contracts: Contract[];
  config: KindScriptConfig;
  program: Program;

  /**
   * Pre-resolved mapping from symbol location → files on disk.
   * Built by the orchestrator before checking begins.
   * Replaces live FileSystemPort.readDirectory() calls during checking.
   */
  resolvedFiles: Map<string, string[]>;
}
```

#### Step 2b: Update `CheckContractsService`

**File:** `src/application/use-cases/check-contracts/check-contracts.service.ts`

Changes (mechanical replacements — the logic of each checker stays identical):

1. **Remove `FileSystemPort` from constructor:**

```typescript
// Before
constructor(
  private readonly tsPort: TypeScriptPort,
  private readonly fsPort: FileSystemPort
) {}

// After
constructor(
  private readonly tsPort: TypeScriptPort,
) {}
```

2. **Thread `resolvedFiles` into each checker method.** Each private method gains a `resolvedFiles: Map<string, string[]>` parameter (passed from `execute()`).

3. **Replace filesystem calls** (6 replacements total):

| Checker | Old Call | New Call |
|---------|---------|---------|
| `checkNoDependency` | `this.fsPort.readDirectory(fromLocation, true)` | `resolvedFiles.get(fromLocation) ?? []` |
| `checkNoDependency` | `this.fsPort.readDirectory(toLocation, true)` | `resolvedFiles.get(toLocation) ?? []` |
| `checkPurity` | `this.fsPort.readDirectory(location, true)` | `resolvedFiles.get(location) ?? []` |
| `checkNoCycles` | `this.fsPort.readDirectory(sym.declaredLocation, true)` | `resolvedFiles.get(sym.declaredLocation) ?? []` |
| `checkMustImplement` | `this.fsPort.readDirectory(portsLocation, true)` | `resolvedFiles.get(portsLocation) ?? []` |
| `checkMustImplement` | `this.fsPort.readDirectory(adaptersLocation, true)` | `resolvedFiles.get(adaptersLocation) ?? []` |
| `checkExists` | `this.fsPort.directoryExists(location)` | `resolvedFiles.has(location)` |
| `checkMirrors` | `this.fsPort.readDirectory(primaryLocation, true)` | `resolvedFiles.get(primaryLocation) ?? []` |
| `checkMirrors` | `this.fsPort.readDirectory(relatedLocation, true)` | `resolvedFiles.get(relatedLocation) ?? []` |
| `checkMirrors` | `this.fsPort.relativePath(relatedLocation, f)` | `relativePath(relatedLocation, f)` (domain import) |
| `checkMirrors` | `this.fsPort.relativePath(primaryLocation, file)` | `relativePath(primaryLocation, file)` (domain import) |

4. **Add import** for the new domain utility:

```typescript
import { isFileInSymbol, relativePath } from '../../../domain/utils/path-matching';
```

5. **Remove import** for `FileSystemPort`.

#### Step 2c: Update the use-case interface docstring

**File:** `src/application/use-cases/check-contracts/check-contracts.use-case.ts`

Update the comment to reflect that file resolution is now done before checking, not during:

```typescript
/**
 * Use case interface for checking architectural contracts.
 *
 * Evaluates contracts against a pre-built model of the project
 * (resolved files + TypeScript program) and reports violations.
 * The caller is responsible for resolving symbol locations to
 * files before invoking this use case.
 */
```

**Do NOT change at this step:** Tests, orchestrators, or wiring. The code won't compile yet because callers don't pass `resolvedFiles`. That's Phase 3.

---

### Phase 3: Update All Callers

Every site that constructs a `CheckContractsRequest` needs to build the `resolvedFiles` map and pass it in. There are exactly 5 call sites:

#### 3a: `makeCheckRequest` test factory

**File:** `tests/helpers/factories.ts`

This is the most impactful change because all 3 unit test files and the plugin diagnostics test use it. The factory needs to build `resolvedFiles` from the mock filesystem state. But since we're removing `FileSystemPort` from the checker, the factory should instead accept `resolvedFiles` directly.

```typescript
// Before
export function makeCheckRequest(contracts: Contract[], program?: Program) {
  return {
    symbols: [] as ArchSymbol[],
    contracts,
    config: {},
    program: program ?? new Program([], {}),
  };
}

// After
export function makeCheckRequest(
  contracts: Contract[],
  program?: Program,
  resolvedFiles?: Map<string, string[]>,
) {
  return {
    symbols: [] as ArchSymbol[],
    contracts,
    config: {},
    program: program ?? new Program([], {}),
    resolvedFiles: resolvedFiles ?? new Map<string, string[]>(),
  };
}
```

#### 3b: Unit tests — build `resolvedFiles` from mock data

**Files:**
- `tests/unit/check-contracts-dependency.test.ts`
- `tests/unit/check-contracts-purity.test.ts`
- `tests/unit/check-contracts-implementation.test.ts`

Each test currently calls `mockFS.withFile(path, content)` to populate the mock filesystem. After the change, tests build a `resolvedFiles` map instead, and pass it to `makeCheckRequest`.

**Pattern for each test:**

```typescript
// Before
beforeEach(() => {
  mockTS = new MockTypeScriptAdapter();
  mockFS = new MockFileSystemAdapter();
  service = new CheckContractsService(mockTS, mockFS);
});

// After
beforeEach(() => {
  mockTS = new MockTypeScriptAdapter();
  service = new CheckContractsService(mockTS);
});
```

```typescript
// Before (typical test)
mockFS
  .withFile('src/domain/service.ts', '...')
  .withFile('src/infrastructure/database.ts', '...');

mockTS
  .withSourceFile('src/domain/service.ts', '...')
  .withImport(...);

const result = service.execute(makeCheckRequest([noDependency(domain, infra)]));

// After
mockTS
  .withSourceFile('src/domain/service.ts', '...')
  .withImport(...);

const resolvedFiles = new Map([
  ['src/domain', ['src/domain/service.ts']],
  ['src/infrastructure', ['src/infrastructure/database.ts']],
]);

const result = service.execute(makeCheckRequest([noDependency(domain, infra)], undefined, resolvedFiles));
```

Each test needs its `mockFS.withFile()` calls converted to `resolvedFiles` map entries. This is a mechanical transformation:
- Group `mockFS.withFile(path, ...)` calls by their parent directory (the symbol's `declaredLocation`)
- Build a `Map` where key = directory, value = list of files under it
- Pass the map to `makeCheckRequest`
- Remove `mockFS` from setup/teardown entirely

**Specific test files and their sizes:**
- `check-contracts-dependency.test.ts`: 17 tests, ~12 use `mockFS`
- `check-contracts-purity.test.ts`: ~16 tests, ~10 use `mockFS`
- `check-contracts-implementation.test.ts`: ~13 tests, ~10 use `mockFS`

Total: ~32 tests to update. Each is a mechanical `withFile → map entry` conversion.

#### 3c: `GetPluginDiagnosticsService`

**File:** `src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts`

This orchestrator needs to build `resolvedFiles` before calling the checker. It needs access to `FileSystemPort` (which it doesn't currently have).

```typescript
// Before
export class GetPluginDiagnosticsService implements GetPluginDiagnosticsUseCase {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly classifyProject: ClassifyProjectUseCase,
  ) {}

// After
export class GetPluginDiagnosticsService implements GetPluginDiagnosticsUseCase {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly classifyProject: ClassifyProjectUseCase,
    private readonly fsPort: FileSystemPort,
  ) {}
```

In the `getDiagnostics` method, add resolution before checking:

```typescript
private getDiagnostics(request: GetPluginDiagnosticsRequest): Diagnostic[] {
  const result = this.classifyProject.execute({ projectRoot: request.projectRoot });
  if (!result.ok) return [];
  if (result.contracts.length === 0) return [];

  // Pre-resolve symbol → files
  const resolvedFiles = this.resolveSymbolFiles(result.symbols);

  const checkResult = this.checkContracts.execute({
    symbols: result.symbols,
    contracts: result.contracts,
    config: result.config,
    program: result.program,
    resolvedFiles,
  });

  return checkResult.diagnostics.filter(d => this.isRelevantToFile(d, request.fileName));
}

private resolveSymbolFiles(symbols: ArchSymbol[]): Map<string, string[]> {
  const resolved = new Map<string, string[]>();
  for (const symbol of symbols) {
    for (const s of [symbol, ...symbol.descendants()]) {
      if (s.declaredLocation && !resolved.has(s.declaredLocation)) {
        resolved.set(
          s.declaredLocation,
          this.fsPort.readDirectory(s.declaredLocation, true),
        );
      }
    }
  }
  return resolved;
}
```

#### 3d: `CheckCommand` (CLI)

**File:** `src/infrastructure/cli/commands/check.command.ts`

Same pattern as the plugin service. Needs `FileSystemPort` injected:

```typescript
// Before
export class CheckCommand {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly classifyProject: ClassifyProjectUseCase,
    private readonly diagnosticPort: DiagnosticPort,
  ) {}

// After
export class CheckCommand {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly classifyProject: ClassifyProjectUseCase,
    private readonly diagnosticPort: DiagnosticPort,
    private readonly fsPort: FileSystemPort,
  ) {}
```

In the `execute` method:

```typescript
// Build resolvedFiles before checking
const resolvedFiles = new Map<string, string[]>();
for (const symbol of result.symbols) {
  for (const s of [symbol, ...symbol.descendants()]) {
    if (s.declaredLocation && !resolvedFiles.has(s.declaredLocation)) {
      resolvedFiles.set(
        s.declaredLocation,
        this.fsPort.readDirectory(s.declaredLocation, true),
      );
    }
  }
}

const checkResult = this.checkContracts.execute({
  symbols: result.symbols,
  contracts: result.contracts,
  config: result.config,
  program: result.program,
  resolvedFiles,
});
```

#### 3e: Integration test pipeline

**File:** `tests/helpers/test-pipeline.ts`

`runFullPipeline` needs to build `resolvedFiles` before calling the checker:

```typescript
// In runFullPipeline, after classification:
const resolvedFiles = new Map<string, string[]>();
for (const symbol of classifyResult.symbols) {
  for (const s of [symbol, ...symbol.descendants()]) {
    if (s.declaredLocation && !resolvedFiles.has(s.declaredLocation)) {
      resolvedFiles.set(
        s.declaredLocation,
        pipeline.fsAdapter.readDirectory(s.declaredLocation, true),
      );
    }
  }
}

const checkResult = pipeline.checkService.execute({
  symbols: classifyResult.symbols,
  contracts: classifyResult.contracts,
  config: {},
  program,
  resolvedFiles,
});
```

Also update `createTestPipeline` since `CheckContractsService` no longer takes `FileSystemPort`:

```typescript
// Before
const checkService = new CheckContractsService(tsAdapter, fsAdapter);

// After
const checkService = new CheckContractsService(tsAdapter);
```

#### 3f: CLI composition root

**File:** `src/infrastructure/cli/main.ts`

Update wiring in `runCheck`:

```typescript
// Before
const checkContracts = new CheckContractsService(a.ts, a.fs);
const cmd = new CheckCommand(checkContracts, classifyProject, a.diagnostic);

// After
const checkContracts = new CheckContractsService(a.ts);
const cmd = new CheckCommand(checkContracts, classifyProject, a.diagnostic, a.fs);
```

#### 3g: Plugin diagnostics test

**File:** `tests/unit/get-plugin-diagnostics.service.test.ts`

Update `beforeEach` to pass `FileSystemPort` to the service:

```typescript
// Before
service = new GetPluginDiagnosticsService(checkContracts, mockClassifyProject);

// After
service = new GetPluginDiagnosticsService(checkContracts, mockClassifyProject, mockFS);
```

And update `CheckContractsService` construction:

```typescript
// Before
checkContracts = new CheckContractsService(mockTS, mockFS);

// After
checkContracts = new CheckContractsService(mockTS);
```

#### 3h: CLI unit test

**File:** `tests/unit/check-command.test.ts`

Update `createCheckCommand` to pass `FileSystemPort`:

```typescript
// Before
const checkContracts = new CheckContractsService(tsAdapter, fsAdapter);
return new CheckCommand(checkContracts, classifyProject, diagnosticAdapter);

// After
const checkContracts = new CheckContractsService(tsAdapter);
return new CheckCommand(checkContracts, classifyProject, diagnosticAdapter, fsAdapter);
```

**Verification:** `npm test` — all 278 tests should pass.

---

### Phase 4: Cleanup

#### 4a: Extract `resolveSymbolFiles` helper

The file-resolution logic is duplicated in 3 places (plugin service, check command, test pipeline). Extract it to a shared utility:

**File:** `src/application/services/resolve-symbol-files.ts` (new)

```typescript
import { ArchSymbol } from '../../domain/entities/arch-symbol';
import { FileSystemPort } from '../ports/filesystem.port';

/**
 * Pre-resolve all symbol locations to their file listings.
 *
 * Walks the symbol tree and builds a map from each symbol's
 * declaredLocation to the files it contains. This map is passed
 * to the checker so it can evaluate contracts without live
 * filesystem queries.
 */
export function resolveSymbolFiles(
  symbols: ArchSymbol[],
  fsPort: FileSystemPort,
): Map<string, string[]> {
  const resolved = new Map<string, string[]>();
  for (const symbol of symbols) {
    for (const s of [symbol, ...symbol.descendants()]) {
      if (s.declaredLocation && !resolved.has(s.declaredLocation)) {
        resolved.set(
          s.declaredLocation,
          fsPort.readDirectory(s.declaredLocation, true),
        );
      }
    }
  }
  return resolved;
}
```

Then the three call sites become one-liners:

```typescript
import { resolveSymbolFiles } from '../../services/resolve-symbol-files';
// ...
const resolvedFiles = resolveSymbolFiles(result.symbols, this.fsPort);
```

#### 4b: Consider removing `ResolveFilesService`

`ResolveFilesService` (the existing use case) does more than what we need — it handles child exclusion, relative path resolution, and error reporting. The new `resolveSymbolFiles` helper is simpler and does exactly what the checker needs.

**Decision:** Keep `ResolveFilesService` if it's used elsewhere or has distinct value (child exclusion). If it turns out to be dead code after this refactoring, remove it then.

#### 4c: Update documentation

- **`CLAUDE.md`:** No structural changes needed — the architecture section still describes the same layers. The only impact is that `CheckContractsService` no longer depends on `FileSystemPort`.
- **`docs/status/DONE_VS_TODO.md`:** Mark this as completed.
- **`docs/status/CLEANUP_PLAN.md`:** Remove any related items if present.

**Verification:** `npm test` — final confirmation.

---

### Summary of All Files Changed

| Phase | File | Change |
|-------|------|--------|
| 1 | `src/domain/utils/path-matching.ts` | Add `relativePath()` function |
| 1 | `tests/unit/path-matching.test.ts` | Add tests (new or extend) |
| 2 | `src/application/use-cases/check-contracts/check-contracts.request.ts` | Add `resolvedFiles` field |
| 2 | `src/application/use-cases/check-contracts/check-contracts.service.ts` | Remove `FileSystemPort`, use map + domain utility |
| 2 | `src/application/use-cases/check-contracts/check-contracts.use-case.ts` | Update docstring |
| 3 | `tests/helpers/factories.ts` | Add `resolvedFiles` param to `makeCheckRequest` |
| 3 | `tests/unit/check-contracts-dependency.test.ts` | Replace `mockFS` with `resolvedFiles` map |
| 3 | `tests/unit/check-contracts-purity.test.ts` | Replace `mockFS` with `resolvedFiles` map |
| 3 | `tests/unit/check-contracts-implementation.test.ts` | Replace `mockFS` with `resolvedFiles` map |
| 3 | `tests/unit/get-plugin-diagnostics.service.test.ts` | Update constructor calls |
| 3 | `tests/unit/check-command.test.ts` | Update constructor calls |
| 3 | `src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts` | Add `FileSystemPort`, build `resolvedFiles` |
| 3 | `src/infrastructure/cli/commands/check.command.ts` | Add `FileSystemPort`, build `resolvedFiles` |
| 3 | `src/infrastructure/cli/main.ts` | Update wiring |
| 3 | `tests/helpers/test-pipeline.ts` | Build `resolvedFiles` in `runFullPipeline` |
| 4 | `src/application/services/resolve-symbol-files.ts` | New shared helper (extract duplication) |

**Total:** ~16 files modified/created. ~32 unit tests updated (mechanical). No new test files needed (except possibly `path-matching.test.ts`). Zero behaviour change — all tests should continue to pass with identical results.
