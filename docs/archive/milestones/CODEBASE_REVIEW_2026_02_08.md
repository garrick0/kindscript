# Codebase Architecture Review — 2026-02-08

> Thorough review of the KindScript codebase based on reading every source file, test file, and fixture.
> Focused on: backward compatibility debt, migration candidates, separation of concerns, ports/adapters improvements, correctness risks, and test quality.

---

## Executive Summary

The codebase is in strong shape overall. The domain layer is pure, the application layer has clean port definitions, and the apps layer correctly isolates CLI vs plugin concerns. That said, there are **20 actionable findings** across architecture, correctness, and testing.

### Architecture & Code (Findings 1-16)

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | Classification imports enforcement types (cross-capability coupling) | Medium | Separation of concerns |
| 2 | ConfigAdapter bypasses FileSystemPort (uses `fs` directly) | Medium | Ports/adapters |
| 3 | `findConfigFile` is dead code on the port + adapter + mock | Low | Dead code |
| 4 | Orchestration logic duplicated between CLI and plugin | Medium | Separation of concerns |
| 5 | `resolveSymbolFiles` lives in an odd location | Low | Architecture |
| 6 | TypeScriptAdapter silently swallows missing checker association | Low | Correctness |
| 7 | `main.ts` uses `process.stderr.write` directly (bypasses ConsolePort) | Low | Ports/adapters |
| 8 | Plugin creates a new Engine on every `create()` call | High | Performance |
| 9 | Code-fixes service has hardcoded fix map, only 2 of 6 contracts covered | Medium | Open-closed principle |
| 10 | Duplicated `generate()` logic across contract plugins | Medium | DRY / separation of concerns |
| 11 | Repeated null-check pattern for `getSourceFile()` in plugins | Low | Code quality |
| 12 | `readDirectory` has implicit business-level file filtering | Low | Ports/adapters |
| 13 | `convertToCodeFixAction` has 4 unused parameters (future placeholders) | Low | Dead code |
| 14 | ASTAdapter hardcodes `'Kind'` and `'InstanceConfig'` string literals | Medium | Fragility |
| 15 | ASTAdapter silently drops malformed input (multiple cases) | Medium | Correctness |
| 16 | Diagnostic `file` field has inconsistent semantics across plugins | Medium | Design |

### Test Quality (Findings 17-20)

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 17 | `makeDiagnostic()` factory and `copyFixtureToTemp()` helper are dead code | Low | Dead code |
| 18 | MockFileSystemAdapter.readDirectory() doesn't filter by extension like real adapter | Medium | Test fidelity |
| 19 | Weak/trivial assertions in integration and plugin tests | Medium | Test quality |
| 20 | Performance test title/assertion mismatch and E2E gaps | Low | Test quality |

---

## Finding 1: Classification Imports Enforcement Types

**Location:** `src/application/classification/classify-ast/classify-ast.service.ts:8`

```typescript
import type { ContractPlugin } from '../../enforcement/check-contracts/contract-plugin';
```

**Problem:** The classification capability (`classify-ast`) has a type-level import from the enforcement capability (`check-contracts`). This creates a dependency arrow from classification -> enforcement within the application layer.

The `ClassifyASTService` constructor accepts `ContractPlugin[]` and uses it to:
- Build `pluginsByName` map (line 32) — used to look up generators by constraint name
- Build `intrinsicPlugins` list (line 33) — used for intrinsic constraint propagation

This means classification *knows* about enforcement's plugin shape. If the `ContractPlugin` interface changes (e.g., adding a new required field), classification code must be updated even though it only needs `constraintName`, `generate`, and `intrinsic`.

**Recommended fix:** Extract a narrow interface that classification actually depends on:

```typescript
// src/application/classification/classify-ast/constraint-provider.ts
export interface ConstraintProvider {
  readonly constraintName: string;
  generate?: (value: TypeNodeView, instanceSymbol: ArchSymbol, kindName: string, location: string) => GeneratorResult;
  intrinsic?: {
    detect(view: TypeNodeView): boolean;
    propagate(memberSymbol: ArchSymbol, memberName: string, location: string): Contract;
  };
}
```

Then `ClassifyASTService` depends on `ConstraintProvider[]` and `ContractPlugin extends ConstraintProvider`. Classification no longer imports anything from enforcement.

---

## Finding 2: ConfigAdapter Bypasses FileSystemPort

**Location:** `src/infrastructure/config/config.adapter.ts:1-3`

```typescript
import * as fs from 'fs';
import * as nodePath from 'path';
import * as ts from 'typescript';
```

**Problem:** The ConfigAdapter reads files using `fs.readFileSync` directly (lines 17, 26) and does path operations using `nodePath` directly (lines 15, 32, 48-63), rather than going through the `FileSystemPort` that already exists.

This means:
- **Two filesystem access patterns** exist in infrastructure: one through `FileSystemPort` and one direct
- ConfigAdapter cannot be tested with `MockFileSystemAdapter` — it always hits real disk
- The `findConfigFile` method (lines 47-64) reimplements directory walking that `FileSystemPort` could provide

The `FileSystemAdapter` already implements `fileExists`, `readFile`, `resolvePath`, `dirname`, and `joinPath` — everything ConfigAdapter needs.

**Recommended fix:** ConfigAdapter should accept `FileSystemPort` as a constructor dependency:

```typescript
export class ConfigAdapter implements ConfigPort {
  constructor(private readonly fs: FileSystemPort) {}

  readKindScriptConfig(projectPath: string): KindScriptConfig | undefined {
    const configPath = this.fs.joinPath(projectPath, 'kindscript.json');
    const raw = this.fs.readFile(configPath);
    if (!raw) return undefined;
    return JSON.parse(raw) as KindScriptConfig;
  }
  // ...
}
```

This also means `engine-factory.ts` would wire it as `new ConfigAdapter(fs)` instead of `new ConfigAdapter()`.

Note: The `readTSConfig` method uses `ts.readConfigFile` and `ts.parseJsonConfigFileContent`, which need TypeScript's `sys` object. This part legitimately needs direct `ts` access. But the file reading within it could still be delegated through the port.

---

## Finding 3: `findConfigFile` Is Dead Code

**Location:**
- Port: `src/application/ports/config.port.ts:70`
- Adapter: `src/infrastructure/config/config.adapter.ts:47-64`
- Mock: `tests/helpers/mocks/mock-config.adapter.ts:74`

**Problem:** `findConfigFile` is defined on `ConfigPort`, implemented in `ConfigAdapter`, and mocked in `MockConfigAdapter`, but **no production code calls it**. Grepping the entire codebase confirms zero callers outside of the port definition, implementation, and mock.

It was likely planned for a feature where KindScript would walk up the directory tree to find `kindscript.json` (similar to how TypeScript finds `tsconfig.json`), but that feature was never implemented. Currently, `ClassifyProjectService` constructs the config path directly:

```typescript
// classify-project.service.ts:32
const ksConfig = this.configPort.readKindScriptConfig(projectRoot) ?? {};
```

**Recommended fix:** Remove `findConfigFile` from the port interface, the adapter implementation, and the mock. If the feature is needed later, it can be re-added.

---

## Finding 4: Duplicated Orchestration Between CLI and Plugin

**Location:**
- `src/apps/cli/commands/check.command.ts:23-47`
- `src/apps/plugin/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts:42-56`

**Problem:** Both apps perform the exact same 3-step orchestration:

```
1. classifyProject.execute({ projectRoot })
2. resolveSymbolFiles(result.symbols, fsPort)
3. checkContracts.execute({ symbols, contracts, config, program, resolvedFiles })
```

The only differences are:
- CLI formats diagnostics for stderr and returns an exit code
- Plugin filters diagnostics by file and returns them for the IDE

This orchestration is **business logic** (it defines the pipeline: classify -> resolve -> check), but it lives in two separate app-layer files. If the pipeline changes (e.g., adding a validation step between classify and check), both files must be updated in sync.

**Recommended fix:** Extract the orchestration into the application layer, either:

**Option A:** Add an `execute` method to `Engine` that runs the full pipeline:

```typescript
// In engine.ts or a new application service
interface PipelineResult {
  diagnostics: Diagnostic[];
  contractsChecked: number;
  filesAnalyzed: number;
  classificationErrors: string[];
}

function runPipeline(projectRoot: string): PipelineResult | { error: string }
```

Then CLI and plugin both call `engine.runPipeline(projectRoot)` and only handle presentation.

**Option B:** Create a dedicated `RunCheckService` in the application layer that encapsulates the orchestration, and have both apps depend on it.

Either way, the apps layer would be reduced to pure presentation/formatting — which is exactly what apps should do.

---

## Finding 5: `resolveSymbolFiles` Lives in an Odd Location

**Location:** `src/application/services/resolve-symbol-files.ts`

**Problem:** This function is a standalone helper in a `services/` directory that only has one file. It's called by:
- `src/apps/cli/commands/check.command.ts`
- `src/apps/plugin/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts`
- `tests/helpers/test-pipeline.ts`
- `tests/integration/check-contracts.integration.test.ts`

It bridges classification output (symbols) and enforcement input (resolvedFiles), making it part of the orchestration pipeline — not a standalone service.

**Recommended fix:** If Finding 4 is addressed (extract orchestration into a pipeline), `resolveSymbolFiles` should move into that pipeline as a private step. It wouldn't need to be exported at all.

If Finding 4 is not addressed, it could at least be co-located with the enforcement layer since it produces `resolvedFiles` which is the enforcement layer's input format.

---

## Finding 6: TypeScriptAdapter Silently Swallows Missing Checker

**Location:** `src/infrastructure/typescript/typescript.adapter.ts:59-62`

```typescript
getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[] {
  const tsChecker = checker as unknown as ts.TypeChecker;
  const tsProgram = this.checkerToProgram.get(tsChecker);
  if (!tsProgram) return [];  // <-- silently returns empty
```

**Problem:** The adapter uses a `WeakMap<object, ts.Program>` to associate type checkers back to their programs. If `getImports` is called with a checker that wasn't created by the same adapter instance, it silently returns an empty array — which means **no imports are found**, and **no dependency violations are detected**. This would look like a clean project to the user, when in reality the tool is broken.

The current architecture guarantees a single adapter instance via `createEngine()`, so this bug can't currently manifest. But it's a latent correctness issue.

**Recommended fix:** Throw an error instead of returning empty:

```typescript
if (!tsProgram) {
  throw new Error(
    'TypeChecker not associated with a Program. Was getTypeChecker() called on this adapter instance?'
  );
}
```

---

## Finding 7: `main.ts` Bypasses ConsolePort

**Location:** `src/apps/cli/main.ts:35, 52-68`

```typescript
process.stderr.write(`Unknown command: ${command}\n\n`);  // line 35
// ...
function printUsage(): void {
  process.stderr.write(/* ... */);  // lines 52-68
}
```

**Problem:** The CLI app introduced `ConsolePort` to decouple `CheckCommand` from `process.stderr` (good), but `main.ts` itself still uses `process.stderr.write` directly for error messages and usage output. Similarly, `process.stdout.write` is used for version output (line 20).

For the version and usage output, this is arguably fine since `main.ts` is the composition root and these are framework-level concerns (not business logic). But the inconsistency means the `ConsolePort` abstraction is partially applied.

**Recommended fix (low priority):** Either:
- Accept that `main.ts` as a composition root is allowed to use `process` directly (document this as intentional)
- Or wire a `ConsolePort` instance earlier and use it for all output

---

## Finding 8: Plugin Creates a New Engine on Every `create()` Call

**Location:** `src/apps/plugin/index.ts:23-37`

```typescript
function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const engine = createEngine();  // <-- NEW ENGINE EVERY TIME
      // ...
    },
  };
}
```

**Problem:** The `create()` method is called by TypeScript's language server every time a new project is opened or the language service host is recreated. Each call to `createEngine()` instantiates 4 fresh adapters, creates all plugins, and wires all services from scratch.

The engine should be created once at the `init()` level. The `create()` call should only wire the per-project adapters (`LanguageServiceAdapter`) that depend on the specific `PluginCreateInfo`.

**Impact:** In VS Code with multiple projects, this creates redundant adapter instances. It also means the `ClassifyProjectService` cache (keyed on definition file modification times) is thrown away every time `create()` is called, defeating its purpose.

**Recommended fix:**

```typescript
function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
  const engine = createEngine();  // Create ONCE

  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const lsAdapter = new LanguageServiceAdapter(info, modules.typescript);
      const diagnosticsService = new GetPluginDiagnosticsService(
        engine.checkContracts, engine.classifyProject, engine.fs
      );
      const codeFixesService = new GetPluginCodeFixesService();

      return createLanguageServiceProxy(
        info, modules.typescript, lsAdapter, diagnosticsService, codeFixesService
      );
    },
  };
}
```

---

## Finding 9: Code-Fixes Service Has Hardcoded Fix Map

**Location:** `src/apps/plugin/use-cases/get-plugin-code-fixes/get-plugin-code-fixes.service.ts:4-18`

```typescript
const KS_FIXES: Record<number, { fixName: string; description: string }> = {
  70001: {
    fixName: 'kindscript-remove-forbidden-import',
    description: 'Remove this import (forbidden dependency)',
  },
  70003: {
    fixName: 'kindscript-remove-impure-import',
    description: 'Remove this import (impure import in pure layer)',
  },
};
```

**Problem:** Only 2 of 6 diagnostic codes have code fixes defined:
- 70001 (`ForbiddenDependency`) — has fix
- 70003 (`ImpureImport`) — has fix
- 70002 (`MissingImplementation`) — **no fix**
- 70004 (`CircularDependency`) — **no fix**
- 70005 (`MirrorMismatch`) — **no fix**
- 70010 (`LocationNotFound`) — **no fix**

More importantly, the mapping is hardcoded in the service rather than derived from the contract plugins. Adding a new contract type requires editing this map separately — there's no mechanism to ensure the fix map stays in sync with the plugin registry.

**Recommended fix:** Either:
- Add an optional `codeFix` property to `ContractPlugin` so each plugin declares its own fix metadata
- Or at minimum, co-locate the fix map with the diagnostic codes so they're reviewed together

---

## Finding 10: Duplicated `generate()` Logic Across Contract Plugins

**Location:** 5 of 6 contract plugins in `src/application/enforcement/check-contracts/`

**Problem:** The `generate()` functions follow two templates that are copy-pasted with minor variations:

**Template A — tuplePairs** (used by no-dependency, must-implement, mirrors):
```typescript
generate(value, instanceSymbol, kindName, location) {
  if (value.kind !== 'tuplePairs') return { contracts: [], errors: [] };
  const contracts: Contract[] = [];
  const errors: string[] = [];
  for (const [firstName, secondName] of value.values) {
    const first = instanceSymbol.findByPath(firstName);
    const second = instanceSymbol.findByPath(secondName);
    if (!first) { errors.push(`...member '${firstName}' not found...`); continue; }
    if (!second) { errors.push(`...member '${secondName}' not found...`); continue; }
    contracts.push(new Contract(ContractType.X, `${location}:constraintName`, [first, second]));
  }
  return { contracts, errors };
}
```

All three plugins repeat this identical structure. The only differences are the `ContractType` enum value and the constraint name string.

**Template B — stringList** (used by no-cycles, exists):
Same pattern but iterates `value.values` as single strings instead of tuples, calling `instanceSymbol.findByPath(name)` once per entry.

**Recommended fix:** Extract shared generator helpers:

```typescript
// In a shared location (e.g., contract-plugin.ts or a new generator-helpers.ts)
function generateFromTuplePairs(
  value: TypeNodeView, instanceSymbol: ArchSymbol, kindName: string,
  location: string, contractType: ContractType, constraintName: string,
): GeneratorResult { /* shared logic */ }

function generateFromStringList(
  value: TypeNodeView, instanceSymbol: ArchSymbol, kindName: string,
  location: string, contractType: ContractType, constraintName: string,
): GeneratorResult { /* shared logic */ }
```

Each plugin's `generate` would then be a one-liner delegating to the appropriate helper.

---

## Finding 11: Repeated Null-Check Pattern for `getSourceFile()`

**Location:** At least 5 contract plugins repeat this pattern:

```typescript
// no-dependency.plugin.ts:64, purity.plugin.ts:32, no-cycles.plugin.ts:74, etc.
const sourceFile = ctx.tsPort.getSourceFile(ctx.program, file);
if (!sourceFile) continue;
```

**Problem:** Every plugin that iterates over files must independently handle the case where `getSourceFile()` returns `undefined`. This is defensive boilerplate that's repeated identically.

**Recommended fix:** Either:
- Add a helper `getSourceFileOrSkip()` on `CheckContext` that filters files before plugins see them
- Or have the `resolvedFiles` map include pre-fetched `SourceFile` objects instead of just file paths, so the null check happens once during resolution

---

## Finding 12: `readDirectory` Has Implicit Business-Level File Filtering

**Location:** `src/infrastructure/filesystem/filesystem.adapter.ts:55-58`

```typescript
} else if (
  entry.isFile() &&
  (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
  !entry.name.endsWith('.d.ts')
) {
  files.push(fullPath);
}
```

**Problem:** The `FileSystemPort.readDirectory()` interface says "Read all files in a directory" but the adapter silently filters to only `.ts` and `.tsx` files (excluding `.d.ts`). This is a business decision (KindScript only cares about TypeScript source files) encoded in the infrastructure adapter.

The port interface makes no mention of this filtering. A caller reading the port interface would expect all files to be returned.

**Impact:** Currently benign — every caller wants TypeScript files. But the implicit contract is fragile: if a future feature needs to list all files in a directory (e.g., for the "exists" contract checking non-TS assets), the port would need to change.

**Recommended fix (low priority):** Either:
- Document the filtering in the port interface's JSDoc
- Or add an optional `extensions` parameter to `readDirectory` to make the filtering explicit
- Or rename to `readTypeScriptFiles` to make intent clear

---

## Finding 13: `convertToCodeFixAction` Has Unused Parameters

**Location:** `src/apps/plugin/diagnostic-converter.ts:54-59`

```typescript
export function convertToCodeFixAction(
  fix: { fixName: string; description: string },
  _fileName: string,    // unused
  _start: number,       // unused
  _end: number,         // unused
  _typescript: typeof ts // unused
): ts.CodeFixAction {
```

**Problem:** All 4 parameters prefixed with `_` are unused. The function only uses the `fix` parameter. These were presumably added as placeholders for a future milestone (M5.1) where actual text-change code fixes would be generated.

The function currently returns description-only fixes with `changes: []` (line 64), confirming it doesn't implement real code transformations yet.

**Recommended fix:** Remove the unused parameters now. When M5.1 implements real code fixes, the needed parameters can be added back with proper implementations. Keeping placeholder parameters violates YAGNI and misleads readers about what the function actually does.

---

## Finding 14: ASTAdapter Hardcodes `'Kind'` and `'InstanceConfig'` String Literals

**Location:** `src/infrastructure/ast/ast.adapter.ts:25, 97`

```typescript
// Line 25
if (type.typeName.text !== 'Kind') continue;

// Line 97
if (type.typeName.text !== 'InstanceConfig') continue;
```

**Problem:** The adapter matches type names by exact string comparison against `'Kind'` and `'InstanceConfig'`. If a user imports these types under aliases, the adapter silently ignores them:

```typescript
import type { Kind as K, InstanceConfig as IC } from 'kindscript';
type Ctx = K<"Ctx", { domain: D }>;  // Not recognized!
const app = { domain: {} } satisfies IC<Ctx>;  // Not recognized!
```

The adapter does not resolve the type alias back to its origin — it only checks the local name in the source file.

**Impact:** Any user who aliases `Kind` or `InstanceConfig` will get zero classification output with no error message. This is a silent, confusing failure mode.

**Recommended fix:** Either:
- Follow the type reference to its declaration and check if the original type name is `Kind`/`InstanceConfig` (using the TypeChecker)
- Or document clearly that aliases are not supported and emit a warning when no Kind definitions are found despite type aliases being present

---

## Finding 15: ASTAdapter Silently Drops Malformed Input (Multiple Cases)

**Location:** `src/infrastructure/ast/ast.adapter.ts` — multiple lines

The adapter has several places where malformed or unexpected user code is silently ignored, producing empty results with no error feedback:

### 15a: `buildTypeNodeView` only recognizes `true`, not `false` (line 219-222)

```typescript
if (typeNode.kind === ts.SyntaxKind.TrueKeyword ||
    (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.TrueKeyword)) {
  return { kind: 'boolean' };
}
```

If a user writes `pure: false`, the function returns `undefined` instead of `{ kind: 'boolean' }`. The classification service receives no constraint and no error. The user gets no feedback that `pure: false` is meaningless.

### 15b: Unresolved variable references silently dropped (lines 164-168)

```typescript
if (valueExpr && ts.isIdentifier(valueExpr)) {
  const resolved = varMap.get(valueExpr.text);
  if (resolved) { valueExpr = resolved; }
}
// ...
if (valueExpr && ts.isObjectLiteralExpression(valueExpr)) { ... }
```

If an identifier references a variable not found in `varMap` (e.g., imported from another file, or a typo), `valueExpr` stays as an `Identifier` node. The subsequent `isObjectLiteralExpression` check fails silently, and the member value is dropped with no error.

### 15c: Non-string elements in stringList silently filtered (lines 244-248)

```typescript
const values = elements.map(e => this.getStringLiteralFromType(e))
  .filter((s): s is string => s !== undefined);
return { kind: 'stringList', values };
```

If a user writes `noCycles: ["domain", 42, "infra"]`, the `42` is silently dropped from the values array. The constraint proceeds with only `["domain", "infra"]`.

### 15d: Tuples with length != 2 silently dropped (line 272 in `extractTuplePairs`)

The `extractTuplePairs` method only processes tuples with exactly 2 elements. If a user writes `noDependency: [["a", "b", "c"]]`, the triple is silently dropped.

### 15e: Missing InstanceConfig type argument silently skipped (line 107)

```typescript
const kindTypeName = /* ... */;
if (!kindTypeName) continue;
```

If a user writes `satisfies InstanceConfig` without a type argument (or with an empty one), the entire instance declaration is silently ignored.

**Cumulative impact:** All these cases produce empty results with no errors. The user sees "No contracts found" or "All contracts satisfied" when their code is actually malformed. This is the most significant correctness risk in the codebase.

**Recommended fix:** For each case, either:
- Return error strings in the response (ClassifyASTResponse already has an `errors: string[]` field)
- Or handle the edge case correctly (e.g., recognize `false` as a boolean value)

A reasonable first step would be to add a general-purpose error reporting mechanism to the ASTViewPort (an optional `errors` return from `getKindDefinitions` and `getInstanceDeclarations`) or pass errors through the existing ClassifyASTResponse pathway.

---

## Finding 16: Diagnostic `file` Field Has Inconsistent Semantics

**Location:** Multiple contract plugins

The `Diagnostic` entity has a `file: string` field that is supposed to represent a file path. However, different plugins pass different kinds of values:

| Plugin | Diagnostic.file value | Example | Is a file path? |
|---|---|---|---|
| no-dependency | Actual import source file | `src/domain/service.ts` | Yes |
| purity | Actual import source file | `src/domain/pure.ts` | Yes |
| mirrors | Actual file in directory | `src/adapters/user.adapter.ts` | Yes |
| no-cycles | **Symbol name** | `domain` | **No** |
| exists | **Directory path** | `src/domain` | **No** |
| must-implement | **Contract location or `<unknown>`** | `type:CleanContext` or `<unknown>` | **No** |

**Code locations:**
- `no-cycles.plugin.ts:99` — passes `cycle[0]` which is a symbol name like `"domain"`
- `exists.plugin.ts:60` — passes `location` which is a derived directory like `"src/domain"`
- `must-implement.plugin.ts:83` — passes `contract.location || '<unknown>'`

**Impact on CLI output:** The `CLIDiagnosticAdapter` formats diagnostics as `file:line:column - error KSxxxxx: message`. For non-file-path values, this produces output like:

```
domain:0:0 - error KS70004: Circular dependency detected...
src/domain:0:0 - error KS70010: Derived location does not exist...
<unknown>:0:0 - error KS70002: Port 'UserPort' has no corresponding adapter...
```

These aren't clickable file paths in IDEs, and line `0` is meaningless.

**Impact on Plugin:** The `GetPluginDiagnosticsService.isRelevantToFile()` (line 62-65) filters diagnostics by comparing `diagnostic.file` to the requested `fileName`. Diagnostics with non-file-path values will **never match any file**, so they're silently dropped in the plugin context and never shown in the IDE.

**Recommended fix:** Either:
- Standardize `Diagnostic.file` to always be a real file path (or empty string for structural violations)
- Or add a separate `Diagnostic.scope` field for non-file-scoped diagnostics, and update the plugin filter to handle both
- At minimum, update `isRelevantToFile()` to also show project-wide diagnostics (where file isn't a real path) for the currently-open `.k.ts` definition file

---

## Finding 17: Dead Code in Test Helpers

### 17a: `makeDiagnostic()` is unused

**Location:** `tests/helpers/factories.ts:99-113`

The `makeDiagnostic()` factory function is defined but never called anywhere in the test suite. All tests that need `Diagnostic` objects create them directly or receive them from service calls.

### 17b: `copyFixtureToTemp()` is unused

**Location:** `tests/cli/e2e/helpers.ts:35-40`

```typescript
export function copyFixtureToTemp(fixtureName: string): string {
  const src = path.join(FIXTURES_DIR, fixtureName);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ksc-test-'));
  copyDirSync(src, tmpDir);
  return tmpDir;
}
```

This function creates temporary directories but is never called. It also has no cleanup mechanism — callers would need to manually delete the temp directory after use, but there's no `afterEach` hook for this.

**Recommended fix:** Remove both dead code functions.

---

## Finding 18: MockFileSystemAdapter Doesn't Match Real Adapter Filtering

**Location:** `tests/helpers/mocks/mock-filesystem.adapter.ts:105-124` vs `src/infrastructure/filesystem/filesystem.adapter.ts:45-66`

**Problem:** The real `FileSystemAdapter.readDirectory()` filters files to only return `.ts` and `.tsx` files (excluding `.d.ts`). The `MockFileSystemAdapter.readDirectory()` returns **all files** that match the directory path prefix, regardless of extension.

This means unit tests using the mock operate under a different contract than integration tests using the real adapter. If a test adds a `.js` or `.json` file via `mockFs.withFile()`, `readDirectory()` will include it — but the real adapter would not.

Additionally, `MockFileSystemAdapter.relativePath()` (lines 138-144) is oversimplified: it only handles the case where `to` starts with `from` (simple prefix stripping), but doesn't handle paths that go *up* (e.g., `relativePath('/a/b/c', '/a/d')` should return `../../d`).

**Impact:** Tests using these mock methods may pass even if the code has bugs that would manifest with the real adapter. The filtering discrepancy ties directly to Finding 12 (implicit filtering in the real adapter).

**Recommended fix:** Either:
- Add the same `.ts`/`.tsx` filtering to the mock (and update any tests that rely on current behavior)
- Or resolve Finding 12 first (make filtering explicit in the port), then update both adapter and mock together

---

## Finding 19: Weak/Trivial Assertions in Tests

Several test files contain assertions that always pass or are too loose to catch regressions:

### 19a: Always-true assertions

**Location:** `tests/plugin/unit/get-plugin-diagnostics.service.test.ts:83, 148, 223`

```typescript
expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
```

`elapsedMs` is computed as `Date.now() - startTime` which is always >= 0. This assertion provides zero confidence.

### 19b: Loose count assertions

**Location:** `tests/integration/check-contracts.integration.test.ts:81-82`

```typescript
expect(result.violationsFound).toBeGreaterThanOrEqual(1);
expect(result.diagnostics.length).toBeGreaterThanOrEqual(1);
```

Using `toBeGreaterThanOrEqual(1)` instead of `toBe(1)` means the test passes whether there are 1, 5, or 100 violations. If a code change introduces spurious violations, this test won't catch it.

Similar pattern in `tests/application/classify-project.service.test.ts:44`:
```typescript
expect(result.symbols.length).toBeGreaterThanOrEqual(1);
```

### 19c: Loose string matching

**Location:** `tests/integration/check-contracts.integration.test.ts:87`

```typescript
f.includes('domain') && f.includes('service')
```

This could match unintended files like `subdomain/microservice.ts`.

**Recommended fix:** Replace loose assertions with exact values where possible. When exact values aren't stable, use `toBe()` with the known expected count, or assert on specific diagnostic properties (message, code, file).

---

## Finding 20: Test Infrastructure Gaps

### 20a: Performance test title/assertion mismatch

**Location:** `tests/integration/check-contracts.integration.test.ts:142-153`

```typescript
it('performance: completes in under 500ms for fixture projects', () => {
  // ...
  expect(result.elapsedMs).toBeLessThan(2000);  // Says 500ms, asserts 2000ms
});
```

The test title says "under 500ms" but the assertion allows up to 2000ms (4x the stated threshold).

### 20b: Missing E2E test coverage

**Location:** `tests/cli/e2e/cli.e2e.test.ts`

The following CLI paths have no E2E tests:
- `ksc` with no arguments (should print usage)
- `ksc --help` / `ksc -h` (should print usage)
- `ksc unknown-command` (should print error + usage)

These are all handled in `src/apps/cli/main.ts` (lines 24-37) but never exercised by tests.

### 20c: Hardcoded platform-specific path

**Location:** `tests/cli/e2e/cli.e2e.test.ts:33`

```typescript
const result = run(['check', '/tmp/nonexistent-project']);
```

`/tmp` is Unix-specific. On Windows, this path doesn't exist, and the test behavior would differ.

### 20d: E2E tests don't verify stdout

**Location:** `tests/cli/e2e/cli.e2e.test.ts:16-30`

Tests check `result.stderr` for violation messages but never assert on `result.stdout`. If the CLI accidentally wrote to stdout instead of stderr, tests would still pass.

**Recommended fix:** These are individually low-priority but collectively reduce test suite reliability. The platform-specific path (20c) and performance mismatch (20a) are the most actionable.

---

## Additional Observations (Not Actionable Issues)

### The Domain Layer Is Excellent

All 13 domain files have zero external dependencies. No Node.js imports, no TypeScript API imports, no backward compatibility code. The `Program.handle: unknown` opaque pattern is well-executed. All entities are immutable (`readonly` properties), no mutable state. Domain utilities (`path-matching.ts`, `cycle-detection.ts`) are pure functions intentionally implemented without Node.js path module to maintain domain purity.

### Port Granularity Is Good

The `TypeScriptPort` is properly split into `CompilerPort` + `CodeAnalysisPort` sub-ports, and `ClassifyProjectService` only depends on `CompilerPort` (line 24 of classify-project.service.ts) — it doesn't need code analysis. This is correct Interface Segregation.

### The Plugin Safety Pattern Is Solid

The language service proxy in `src/apps/plugin/language-service-proxy.ts` wraps every interception in try/catch and falls back to TypeScript's original results. This is the standard pattern (Angular Language Service uses the same approach) and is correctly implemented.

### The Engine Interface Is Minimal

`Engine` has exactly 4 members: `classifyProject`, `checkContracts`, `fs`, `ts`. The factory in infrastructure creates it. Both apps consume it. No bloat.

### Error Handling Is Consistent

The codebase follows two well-defined patterns:
- **Adapters** return sentinel values (`undefined`, `[]`, `false`, `0`) on I/O errors — appropriate for read operations where "not found" and "error" are semantically equivalent
- **Plugin code** wraps operations in try/catch and falls back to original TypeScript results — correct for the "never crash tsserver" requirement

### Naming Conventions Are Uniform

All use-case interfaces follow `{Feature}UseCase` with an `execute()` method. All types files follow `{Feature}Request`, `{Feature}Response`. All contract plugins follow the same structure. Naming is predictable across the entire codebase.

### No Global/Module-Level Mutable State

All mutable state is instance-scoped (TypeScriptAdapter's `WeakMap`, ClassifyProjectService's `cache`) or local to function calls. No global variables, no static mutable properties.

### Everything Is Synchronous (Correctly)

The entire codebase is synchronous. This is correct for a compile-time tool — TypeScript's compiler API is synchronous, and tsserver plugin protocol expects synchronous responses.

### No Circular Dependencies

Import analysis confirms strictly layered dependencies: domain -> application -> infrastructure -> apps. No cross-layer violations.

### All 21 Fixture Files Are Consistent

Every `.k.ts` fixture file uses the same `import type { Kind, InstanceConfig } from 'kindscript'` pattern. All constraints match the public API in `src/types/index.ts`. No deprecated patterns. Clean/violation fixture pairs are intentional and appropriate.

### Contract Plugin `validate()` Methods Are Consistent

All 6 plugins follow an identical validation pattern: check `args.length`, return `null` on success or a descriptive error string. Message format is uniform.

### Two Contract Plugins Use Inline Dynamic Type Import Syntax

`no-cycles.plugin.ts:27` and `exists.plugin.ts:25` use `import('...').ArchSymbol` inline type syntax instead of a top-level import. This works but is inconsistent with the other 4 plugins which all use normal top-level imports. Cosmetic only.

---

## Source Files Without Dedicated Unit Tests

| Source File | Test Coverage | Note |
|---|---|---|
| `src/infrastructure/engine-factory.ts` | Indirect only | No dedicated test verifying correct wiring |
| `src/apps/cli/adapters/cli-console.adapter.ts` | Indirect only | Only tested via mocks in check-command test |
| `src/apps/plugin/adapters/language-service.adapter.ts` | Indirect only | Only E2E tested via plugin-loading |
| `src/application/services/resolve-symbol-files.ts` | Indirect only | Only used in integration tests, no isolated unit test |
| CLI `--help` and unknown command paths | Not tested | `main.ts` lines 24-27 and 35-37 have no E2E tests |
| `check-contracts.integration.test.ts` | Manual wiring | Creates its own adapters instead of using `createEngine()` or test-pipeline |

---

## Summary of Recommended Actions

**Priority 1 (High Impact — Correctness & Performance):**
1. Move `createEngine()` outside `create()` in plugin entry point (Finding 8) — performance fix, preserves caching
2. Add error reporting for malformed AST input instead of silent drops (Finding 15) — prevents invisible failures
3. Standardize `Diagnostic.file` semantics and fix plugin-side filtering (Finding 16) — no-cycles, exists, and must-implement diagnostics are invisible in the IDE

**Priority 2 (Architecture Improvement):**
4. Extract classify-check orchestration pipeline into application layer (Finding 4) — eliminates duplication, makes apps pure presentation
5. Move `resolveSymbolFiles` into the pipeline (Finding 5) — no longer needs to be exported
6. Break the classification -> enforcement import with a narrow `ConstraintProvider` interface (Finding 1) — eliminates cross-capability coupling
7. Have ConfigAdapter accept FileSystemPort instead of importing `fs` directly (Finding 2) — unifies filesystem access, improves testability
8. Extract shared generator helpers from contract plugins (Finding 10) — eliminates copy-paste across 5 plugins
9. Derive code-fix map from plugin metadata instead of hardcoding (Finding 9) — maintains open-closed principle

**Priority 3 (Cleanup & Test Quality):**
10. Remove dead `findConfigFile` from port, adapter, and mock (Finding 3)
11. Remove dead `makeDiagnostic()` and `copyFixtureToTemp()` from test helpers (Finding 17)
12. Replace silent empty-return with a throw in TypeScriptAdapter (Finding 6)
13. Remove unused parameters from `convertToCodeFixAction` (Finding 13)
14. Handle aliased Kind/InstanceConfig or document the limitation (Finding 14)
15. Align MockFileSystemAdapter.readDirectory() with real adapter filtering (Finding 18)
16. Strengthen weak assertions in integration tests (Finding 19)
17. Fix performance test title/assertion mismatch, add missing E2E paths (Finding 20)
18. Document `readDirectory` file filtering in port JSDoc (Finding 12)
19. Encapsulate `getSourceFile()` null-check to reduce plugin boilerplate (Finding 11)
20. Decide on ConsolePort consistency in main.ts (Finding 7)

---

# Implementation Plan

The plan is organized into 6 phases. Each phase is independently shippable — tests must pass at every phase boundary. Phases are ordered so that earlier phases unblock later ones and simpler changes come before structural refactors.

**Status as of 2026-02-08:** Phases 1–6 have been implemented. 29 test suites, 275 tests, 100% passing.

---

## Phase 1: Dead Code Removal & Backward Compatibility Cleanup ✅ COMPLETE

**Findings addressed:** 3, 13, 17

- Step 1.1 — Removed `findConfigFile` from port, adapter, and mock ✅
- Step 1.2 — Removed unused parameters from `convertToCodeFixAction` ✅
- Step 1.3 — Removed dead `makeDiagnostic()` and `copyFixtureToTemp()` from test helpers ✅

---

## Phase 2: Correctness Fixes ✅ COMPLETE (partial — see gap analysis)

**Findings addressed:** 6, 8, 15a, 15e, 16

- Step 2.1 — Moved `createEngine()` from `create()` to `init()` in plugin ✅
- Step 2.2 — TypeScriptAdapter throws on missing checker association ✅
- Step 2.3 — ASTAdapter recognizes `false` as boolean (Finding 15a) ✅
- Step 2.4 — Added `ASTExtractionResult<T>` wrapper + missing InstanceConfig type arg error (Finding 15e) ✅ **PARTIAL**
  - ⚠️ Findings 15b (unresolved variable references), 15c (non-string stringList elements), 15d (non-pair tuples) were **not implemented**
- Step 2.5 — Added `Diagnostic.scope` field, standardized `file` to empty string for structural violations ✅

---

## Phase 3: Architecture — Extract Orchestration Pipeline ✅ COMPLETE

**Findings addressed:** 4, 5 (partial)

- Step 3.1 — Created `RunPipelineService` ✅
- Step 3.2 — `resolveSymbolFiles` absorbed into pipeline as private dependency ✅ **PARTIAL**
  - ⚠️ `resolveSymbolFiles` file still exists and is still imported by `test-pipeline.ts` and `check-contracts.integration.test.ts`
- Step 3.3 — Wired `RunPipelineService` into Engine ✅
- Step 3.4 — Migrated CLI and Plugin to use pipeline ✅
  - ⚠️ Test files not migrated — `test-pipeline.ts` and `check-contracts.integration.test.ts` still call `resolveSymbolFiles` directly

---

## Phase 4: Architecture — Decouple Classification from Enforcement ✅ COMPLETE

**Findings addressed:** 1

- Step 4.1 — Extracted `ConstraintProvider` interface ✅
- Step 4.2 — Migrated `ClassifyASTService` to use `ConstraintProvider` ✅
- Step 4.3 — Made `ContractPlugin extend ConstraintProvider` ✅

---

## Phase 5: Architecture — ConfigAdapter & Plugin Improvements ✅ COMPLETE

**Findings addressed:** 2, 9, 10, 11

- Step 5.1 — ConfigAdapter accepts `FileSystemPort` via constructor ✅
- Step 5.2 — Extracted `generateFromTuplePairs`/`generateFromStringList` helpers; all 5 plugins updated ✅
- Step 5.3 — Added `getSourceFilesForPaths` helper; 4 plugins updated ✅
- Step 5.4 — Added `codeFix?` to `ContractPlugin`; `GetPluginCodeFixesService` derives fix map from plugins; `plugins` exposed on Engine ✅

---

## Phase 6: Test Quality & Documentation ✅ COMPLETE (partial — see gap analysis)

**Findings addressed:** 7, 12, 14, 18, 19 (partial), 20 (partial)

- Step 6.1 — Aligned `MockFileSystemAdapter.readDirectory()` with real adapter filtering ✅
- Step 6.2 — Strengthened weak assertions in `get-plugin-diagnostics.service.test.ts` and `check-contracts.integration.test.ts` ✅ **PARTIAL**
  - ⚠️ 7 more `toBeGreaterThanOrEqual` assertions remain across other test files (see gap analysis)
- Step 6.3 — Fixed performance test title/assertion mismatch ✅
- Step 6.4 — Added 3 missing E2E test paths (no args, --help, unknown command) ✅
- Step 6.5 — Fixed platform-specific `/tmp` path ✅
- Step 6.6 — Documented `readDirectory` filtering in port JSDoc ✅
- Step 6.7 — Documented Kind/InstanceConfig alias limitation on `ASTAdapter` class JSDoc ✅
  - ⚠️ README.md not updated with alias limitation note
- Step 6.8 — Documented ConsolePort decision in `main.ts` ✅

---

## Phase Summary

| Phase | Status | Tests at Completion |
|---|---|---|
| **1. Dead Code Removal** | ✅ Complete | 271 |
| **2. Correctness Fixes** | ⚠️ Complete with gaps (15b, 15c, 15d) | 272 |
| **3. Pipeline Extraction** | ⚠️ Complete with gaps (test migration) | 272 |
| **4. Decouple Classification** | ✅ Complete | 272 |
| **5. ConfigAdapter & Plugins** | ✅ Complete | 272 |
| **6. Test Quality & Docs** | ⚠️ Complete with gaps (assertions, docs) | 275 |

**Files created:** 5 (`constraint-provider.ts`, `run-pipeline.use-case.ts`, `run-pipeline.service.ts`, `generator-helpers.ts`, plus `getSourceFilesForPaths` in `contract-plugin.ts`)
**Files deleted:** 0 (no files were deleted; `resolve-symbol-files.ts` was retained for test compatibility)
**Dead code removed:** `findConfigFile` (3 locations), `makeDiagnostic()`, `copyFixtureToTemp()`, `copyDirSync()`, 4 unused parameters, hardcoded `KS_FIXES` map

---

# Gap Analysis

> Post-implementation review comparing the plan against the actual codebase state.
> Conducted 2026-02-08 after all 6 phases were implemented.
> 29 test suites, 275 tests, 100% passing.

---

## Category 1: Incomplete Items from the Original Plan

These are items explicitly described in the plan that were not fully implemented.

### Gap 1.1: Silent AST drops not wired (Findings 15b, 15c, 15d)

**Status:** `ASTExtractionResult<T>` wrapper was added to the port and adapter. Errors are plumbed through to `ClassifyASTService`. But only one error case was actually wired:
- ✅ **15e** — Missing InstanceConfig type argument → pushes error
- ✅ **15a** — `false` recognized as boolean (behavior fix, not error reporting)
- ❌ **15b** — Unresolved variable references in `satisfies InstanceConfig` → silently dropped
- ❌ **15c** — Non-string elements in stringList constraints → silently filtered
- ❌ **15d** — Tuples with length != 2 in tuplePairs → silently dropped

**Impact:** Users writing malformed constraints get no feedback. The infrastructure is ready (errors array exists), but the adapter doesn't push errors for these cases.

**Files to change:**
| Location | Error to add |
|---|---|
| `ast.adapter.ts` ~line 164 | When `varMap.get()` returns undefined for an identifier: `"InstanceConfig member '${memberName}': variable '${identifierText}' not resolved."` |
| `ast.adapter.ts` ~line 244 | When `getStringLiteralFromType` returns undefined for an element: `"Constraint '${constraintName}' contains a non-string element."` |
| `ast.adapter.ts` ~line 284 | When inner tuple length != 2: `"Constraint tuple must have exactly 2 elements, got ${length}."` |

### Gap 1.2: `resolveSymbolFiles` not fully absorbed (Finding 5)

**Status:** Production code no longer calls `resolveSymbolFiles` directly — `RunPipelineService` internalizes it. But:
- `tests/helpers/test-pipeline.ts:119` still imports and calls it
- `tests/integration/check-contracts.integration.test.ts:71,98` still imports and calls it

**Impact:** Low — test-only concern. But the file remains as an unnecessary export.

**Fix:** Either inline into `test-pipeline.ts` as a local helper, or refactor the integration test to use `RunPipelineService` instead.

### Gap 1.3: Remaining weak assertions (Finding 19, partial)

**Status:** Plugin diagnostics test and main integration test were strengthened. But 7 `toBeGreaterThanOrEqual` assertions remain:

| File | Line | Assertion |
|---|---|---|
| `tests/application/no-dependency.plugin.test.ts` | 219 | `errors.length >= 1` |
| `tests/application/classify-ast-locate.test.ts` | 44 | `symbols.length >= 1` |
| `tests/integration/tier2-locate.integration.test.ts` | 77 | `existenceDiags.length >= 1` |
| `tests/integration/check-contracts.integration.test.ts` | 174 | `domainFiles.length >= 2` |
| `tests/integration/tier2-contracts.integration.test.ts` | 18, 60, 114 | `violationsFound >= 1` |

**Impact:** These assertions pass for any non-zero count, masking regressions that produce extra violations.

### Gap 1.4: README.md not updated with alias limitation (Finding 14)

**Status:** The `ASTAdapter` class JSDoc was updated. But the plan called for also adding a note to `README.md` or user-facing docs. This was not done.

### Gap 1.5: E2E tests don't verify stdout vs stderr (Finding 20d)

**Status:** Not addressed. The plan mentioned it but didn't include a specific step. Tests check `result.stderr` for violation messages but never assert that `result.stdout` is empty during check commands.

---

## Category 2: Dead Code Discovered Post-Implementation

New dead code found during gap analysis that was not in the original 20 findings.

### Gap 2.1: `isNodeBuiltin()` function is exported but never called

**File:** `src/domain/constants/node-builtins.ts:28`

The function wraps `NODE_BUILTINS.has()` but all production code imports `NODE_BUILTINS` directly and calls `.has()` on it. The function is tested in `domain-coverage.test.ts` but serves no production purpose.

### Gap 2.2: `FIXTURE_NAMES` export is dead code

**File:** `tests/helpers/fixtures.ts:46-67`

`FIXTURE_NAMES` was designed for use with `copyFixtureToTemp()`, which was removed in Phase 1. No test imports `FIXTURE_NAMES`. The JSDoc comment on line 44 still references `copyFixtureToTemp()`.

### Gap 2.3: Unused port methods: `writeFile`, `createDirectory`, `fileExists`, `listSubdirectories`, `basename`

**File:** `src/application/ports/filesystem.port.ts`

Five methods on `FileSystemPort` are defined, implemented in both real and mock adapters, but never called from production code:
- `writeFile()` / `createDirectory()` — comment says "for generator in M7"
- `fileExists()` — no callers
- `listSubdirectories()` — no callers
- `basename()` — no callers

**Impact:** Low — these are forward-looking API surface. But they inflate the port interface and require mock implementations.

### Gap 2.4: Unused port method: `CompilerPort.getDiagnostics()`

**File:** `src/application/ports/typescript.port.ts:34`

Defined on `CompilerPort`, implemented in `TypeScriptAdapter` and `MockTypeScriptAdapter`, but never called from production code. Returns TypeScript pre-emit diagnostics which KindScript doesn't use.

### Gap 2.5: Unused test helper exports

**File:** `tests/helpers/test-pipeline.ts`

`classifyFixture`, `createTestPipeline`, `runFullPipeline`, and `TestPipeline` are all exported but never imported by any test file. Only `runPipeline` (which internally calls `createTestPipeline` and `runFullPipeline`) is imported externally.

---

## Category 3: Documentation Drift

### Gap 3.1: CLAUDE.md is stale

Multiple items need updating:
- **Test count:** Says "271 tests" — actual is 275
- **Directory structure:** Missing `enforcement/run-pipeline/`, `generator-helpers.ts`, `getSourceFilesForPaths`
- **Engine interface:** Doesn't mention `plugins` field or `runPipeline`
- **ContractPlugin interface:** Doesn't mention `codeFix?` property
- **Diagnostic entity:** Doesn't mention `scope` field
- **Key files:** Doesn't list `constraint-provider.ts`, `run-pipeline.service.ts`, `generator-helpers.ts`
- **Recent changes:** Phase 1–6 changes not documented
- **Common patterns:** `import { makeDiagnostic }` example references removed function

### Gap 3.2: README.md references non-existent entities

- **Line ~210, 272:** References `Location` value object — does not exist in `src/domain/value-objects/`
- **Line ~277:** References `ConfigSymbolBuilder` service — was deleted in a previous refactoring
- **Lines ~177-197:** Tier 1 "Adoption Tiers" section describes deleted config-based contract functionality

### Gap 3.3: `tests/README.md` references deleted helpers

- **Line ~129:** Import example includes `makeDiagnostic` — removed in Phase 1
- **Line ~161:** E2E helpers section shows `copyFixtureToTemp` — removed in Phase 1

### Gap 3.4: `docs/README.md` missing entries

The docs index is missing at least 12 design documents that exist in `docs/design/`, including this review doc itself (`CODEBASE_REVIEW_2026_02_08.md`).

### Gap 3.5: Stale docstrings in source code

| File | Issue |
|---|---|
| `src/apps/cli/ports/diagnostic.port.ts:6-7` | Says "defined in the application layer and implemented in the infrastructure layer" — actually lives in apps layer |
| `src/application/ports/config.port.ts:7` | Says "configure architectural contracts" — config-based contracts (Tier 1) were removed |

---

## Category 4: Additional Silent Error Paths in `ast.adapter.ts`

Beyond Findings 15b-d (which have known fixes but weren't implemented), the gap analysis found additional silent paths:

### Gap 4.1: `buildTypeNodeView` returns `undefined` for unrecognized type shapes

**Location:** End of `buildTypeNodeView` method

If a type node is not a boolean, not a type literal, and has no recognizable array/tuple elements, the method returns `undefined`. This means union types, intersection types, numeric literals, template literal types, and other valid TypeScript type constructs are silently dropped with no error.

### Gap 4.2: Object properties with unrecognized value shapes silently excluded

**Location:** `buildTypeNodeView` type literal handling

When iterating over properties of an object type literal, if `buildTypeNodeView` returns `undefined` for a property's value type, that property is silently excluded from the result. If ALL properties return `undefined`, the entire object returns `undefined`.

### Gap 4.3: `getKindDefinitions` never pushes errors

**Location:** `getKindDefinitions` method

The method always returns `errors: []`. If a `Kind<>` type alias has an unexpected structure (wrong number of type arguments, non-literal first argument, etc.), it falls back to defaults silently. The `ASTExtractionResult` wrapper supports errors, but `getKindDefinitions` doesn't use it.

---

## Category 5: Test Consistency Issues

### Gap 5.1: `check-contracts.integration.test.ts` duplicates `test-pipeline.ts`

The file manually wires all adapters and services (lines 26-56) and defines its own `classifyFixture` function, despite `tests/helpers/test-pipeline.ts` exporting equivalent helpers. The tier2 integration tests correctly use the shared helpers.

### Gap 5.2: No dedicated unit tests for new infrastructure

| Source File | Coverage |
|---|---|
| `RunPipelineService` | Indirect only (via check-command and plugin-diagnostics tests) |
| `engine-factory.ts` | Indirect only (via CLI and plugin composition) |
| `generator-helpers.ts` | Indirect only (via plugin tests) |
| `resolve-symbol-files.ts` | Indirect only (via integration tests) |
| `cycle-detection.ts` | Indirect only (via noCycles plugin tests) |
| `filesystem.adapter.ts` | Indirect only (via integration tests) |
| `typescript.adapter.ts` | Indirect only (via integration tests) |

---

## Implementation Plan: Remaining Gaps

**Status:** 🔄 IN PROGRESS — Started 2026-02-08

---

### Phase 7: AST Error Reporting (P1 — Correctness) ✅ COMPLETE

**Gaps addressed:** 1.1 (15b, 15c, 15d), 4.1, 4.2, 4.3

All changes in `src/infrastructure/ast/ast.adapter.ts`. Threaded `errors: string[]` through `buildTypeNodeView`, `extractTuplePairs`, `extractMemberValues`, and `extractMemberValuesFromProps`. Added 7 new tests in `tests/infrastructure/ast.adapter.test.ts`.

- **Step 7.1** — `getKindDefinitions` errors for malformed Kind type aliases ✅
- **Step 7.2** — Unresolved variable references in InstanceConfig ✅
- **Step 7.3** — Non-string elements in stringList constraints ✅
- **Step 7.4** — Non-pair tuples and non-string tuple elements ✅
- **Step 7.5** — 7 new tests added ✅

**Test checkpoint:** 29 suites, 282 tests, 100% passing.

---

### Phase 8: Documentation Updates (P2) ✅ COMPLETE

**Gaps addressed:** 3.1, 3.2, 3.3, 3.4, 3.5

- **Step 8.1** — Updated `CLAUDE.md`: test count, directory structure, Engine/ContractPlugin/Diagnostic descriptions, key files, recent changes, removed stale `makeDiagnostic`/`copyFixtureToTemp` references ✅
- **Step 8.2** — Updated `README.md`: removed Tier 1 section, fixed `Location`→`ContractReference`, removed `ConfigSymbolBuilder`, fixed test count, added alias limitation note ✅
- **Step 8.3** — Updated `tests/README.md`: removed `makeDiagnostic` from import example, removed `copyFixtureToTemp` from E2E helpers, fixed test count ✅
- **Step 8.4** — Updated `docs/README.md`: added 12 missing design documents to index ✅
- **Step 8.5** — Fixed stale docstrings in `diagnostic.port.ts` and `config.port.ts` ✅

**Test checkpoint:** 29 suites, 282 tests, 100% passing.

---

### Phase 9: Test Consistency (P3) ✅ COMPLETE

**Gaps addressed:** 1.3, 1.5, 5.1

- **Step 9.1** — Strengthened 7 weak assertions to exact counts ✅
- **Step 9.2** — Refactored `check-contracts.integration.test.ts` to use `createTestPipeline()` + `runFullPipeline()` from test-pipeline.ts; removed manual wiring, local `classifyFixture`, and `resolveSymbolFiles` import ✅
- **Step 9.3** — Added `expect(result.stdout).toBe('')` assertions to E2E check tests ✅

**Test checkpoint:** 29 suites, 282 tests, 100% passing.

---

### Phase 10: Dead Code Cleanup (P4) ✅ COMPLETE

**Gaps addressed:** 1.2, 2.1, 2.2, 2.3, 2.4, 2.5

- **Step 10.1** — Removed `FIXTURE_NAMES` from `tests/helpers/fixtures.ts` ✅
- **Step 10.2** — Removed `isNodeBuiltin()` from `src/domain/constants/node-builtins.ts`; kept `NODE_BUILTINS` set; updated `domain-coverage.test.ts` to use `NODE_BUILTINS.has()` ✅
- **Step 10.3** — Removed 6 unused methods from `FileSystemPort`, `FileSystemAdapter`, and `MockFileSystemAdapter`: `fileExists`, `listSubdirectories`, `writeFile`, `createDirectory`, `basename`, `relativePath` ✅
- **Step 10.4** — Removed `getDiagnostics` from `CompilerPort` interface, `TypeScriptAdapter`, and `MockTypeScriptAdapter`; removed `withDiagnostic` and `diagnostics` field from mock; removed unused `Diagnostic` imports from all three files ✅
- **Step 10.5** — Removed dead `classifyFixture` function from `test-pipeline.ts` (never called externally). `createTestPipeline`, `runFullPipeline`, and `TestPipeline` remain exported — they are used by `check-contracts.integration.test.ts` (refactored in Step 9.2) ✅
- **Step 10.6** — `resolveSymbolFiles` usage resolved: `check-contracts.integration.test.ts` no longer imports it (Step 9.2). Only `test-pipeline.ts` calls it for manual pipeline orchestration in tests, which is acceptable. Production code uses `RunPipelineService` which internalizes the call. Function stays exported from `resolve-symbol-files.ts` ✅

**Test checkpoint:** 29 suites, 282 tests, 100% passing.

---

### Phase Summary

| Phase | Priority | Gaps | Description | Status |
|---|---|---|---|---|
| **7** | P1 | 1.1, 4.1–4.3 | AST error reporting | ✅ |
| **8** | P2 | 3.1–3.5 | Documentation updates | ✅ |
| **9** | P3 | 1.3, 1.5, 5.1 | Test consistency | ✅ |
| **10** | P4 | 1.2, 2.1–2.5 | Dead code cleanup | ✅ |

**All phases complete. 29 suites, 282 tests, 100% passing.**
