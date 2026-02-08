# Codebase Review — 2026-02-07

**Scope:** Full codebase review of KindScript v0.8.0-m8
**Test suite:** 25 suites, 278 tests, 100% passing
**Build:** Clean (`tsc --noEmit` and `npm run build` both zero errors)

---

## Critical Issues

### 1. Multi-instance contract binding bug — FIXED

**Location:** `src/application/use-cases/classify-ast/classify-ast.service.ts:43, 93`

When two instances share the same Kind type (e.g., `payments` and `orders` both `satisfies InstanceConfig<BoundedContext>`), the classifier stores instance-to-Kind mappings in a `Map<string, ArchSymbol>` keyed by Kind type name. The second instance **overwrites** the first. Contracts only bind to the **last** declared instance.

**Impact:** In the multi-instance pattern — the primary use case for bounded contexts — all instances except the last are silently unchecked. Documented in notebook 04 as a known bug.

#### Root Cause Analysis

The bug spans three locations in `classify-ast.service.ts`:

**1. The Map declaration (line 43):**
```typescript
const instanceSymbols = new Map<string, ArchSymbol>(); // kindName → instance ArchSymbol
```

**2. The overwrite (line 93, inside Phase 2 loop):**
```typescript
instanceSymbols.set(kindName, result.symbol); // kindName is e.g. "BoundedContext"
```

When processing `payments satisfies InstanceConfig<BoundedContext>` then `orders satisfies InstanceConfig<BoundedContext>`, the Map key `"BoundedContext"` is identical — the second `.set()` overwrites the first.

**3. Contract generation only sees one instance (line 275):**
```typescript
const instanceSymbol = instanceSymbols.get(kindName); // Gets only "orders"
if (!instanceSymbol) continue;
```

`generateTypeLevelContracts()` iterates Kind definitions and looks up instance symbols by Kind name. Since only `orders` remains in the Map, contracts are only generated for `orders`. The `payments` symbol IS in the output `symbols[]` array (line 89 correctly pushes it), so existence checking works for both — but contract checking doesn't.

**The same bug also affects:**
- **Purity dedup** (lines 301-305): Checks `c.args[0].name === prop.name` without distinguishing which instance the contract belongs to. With the multi-instance fix, a purity contract for `payments.domain` could prevent `orders.domain` from getting one.

#### Fix Options

**Option A: Fan-out with `Map<string, ArchSymbol[]>` (recommended)**

Change the Map to store arrays. Each Kind type maps to all its instances. Contract generation loops over all instances per Kind.

Changes required:
- Line 43: `Map<string, ArchSymbol[]>`
- Line 93: Push to array instead of set
- Lines 268-312: `generateTypeLevelContracts` loops over `instances[]`
- Lines 301-305: Purity dedup must also compare instance identity (e.g., `c.args[0] === memberSymbol` or compare `declaredLocation`)

Pros: Minimal structural change, backward compatible, correct behavior.
Cons: None significant (the former `ContractConfig<T>` ambiguity concern is eliminated since additive contracts have been removed).

**Option B: Instance-keyed map**

Use the instance variable name (e.g., `"payments"`, `"orders"`) as the Map key instead of the Kind type name. Maintain a separate `kindName → instanceNames[]` index.

Changes required:
- Line 43: `Map<string, ArchSymbol>` keyed by instance name
- New: `Map<string, string[]>` mapping kindName → instance names
- Line 93: `instanceSymbols.set(instanceName, result.symbol)` + push instanceName to kind index
- Lines 268-312: Look up all instance names for each Kind, generate contracts for each
Pros: More explicit, no ambiguity for lookups by instance name.
Cons: More maps to maintain, slightly more complex.

**Option C: Duplicate Kind definitions per instance**

When a second instance of the same Kind is found, clone the KindDefinition and create a synthetic unique Kind name (e.g., `"BoundedContext@payments"`, `"BoundedContext@orders"`).

Pros: No map changes needed, existing contract generation works unchanged.
Cons: Hacky, makes Kind names non-stable, complicates error messages.

**Recommendation:** Option A. It's the smallest change with correct behavior. (The former ambiguity around additive `ContractConfig<T>` is no longer relevant since additive contracts have been removed -- all constraints are on the Kind type.)

---

## Bugs

### 2. LanguageServiceAdapter `messageText` handling is incorrect

**Location:** `src/infrastructure/adapters/plugin/language-service.adapter.ts:63`

```typescript
messageText: typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText,
```

TypeScript's `DiagnosticMessageChain` is a recursive structure with `next?: DiagnosticMessageChain[]`. Accessing `.messageText` only gets the top-level message and discards chain details. The TypeScriptAdapter correctly uses `ts.flattenDiagnosticMessageText()` (line 104 of `typescript.adapter.ts`), but the LanguageServiceAdapter doesn't have access to this utility and uses a naive fallback.

**Impact:** Plugin diagnostics with chained messages will lose detail. Won't crash, but error messages will be incomplete.

### 3. Cache key doesn't include file content hashes

**Location:** `src/application/use-cases/classify-project/classify-project.service.ts:70-74`

```typescript
const definitionKey = [...definitionPaths].sort().join('|');
if (this.cache && this.cache.definitionKey === definitionKey) {
  return this.cache.result;
}
```

The cache key is based only on definition file paths, not their contents. If a user modifies `architecture.ts` without changing its filename, the cache returns stale results.

**Impact:** In plugin context, users would see stale architectural violations until VSCode is restarted or the file list changes. Not an issue for CLI (single-shot execution).

### 4. ~~Hardcoded path separator in `checkColocated`~~ — RESOLVED

Resolved — `checkColocated` was removed and replaced by `checkMirrors` as part of the filesystem constraint redesign (`colocated` → `filesystem: { mirrors: [...] }`). The new `checkMirrors` method uses `this.fsPort.relativePath()` for path matching.

---

## Dead Code

### 5. `DependencyRule` class is unused

**Location:** `src/domain/value-objects/dependency-rule.ts`

Never imported anywhere in the codebase (src or tests). Its functionality has been superseded by `isFileInSymbol` in `src/domain/utils/path-matching.ts` and the `checkNoDependency` method in `CheckContractsService`.

### 6. Call expression methods on ASTPort are unused

**Location:** `src/application/ports/ast.port.ts:33, 59-61`

Four methods are defined in the port, implemented in both adapters (real + mock), and tested — but never called by any use case:

- `isCallExpression(node: ASTNode): boolean`
- `getCallExpressionName(node: ASTNode): string | undefined`
- `getCallTypeArgumentNames(node: ASTNode): string[]`
- `getCallArguments(node: ASTNode): ASTNode[]`

These were part of the old `defineContracts()` function-call parsing pipeline. The V2 redesign eliminated function calls in favor of type-level constraints and `satisfies` expressions, making these methods dead code.

**Related:** `tests/unit/ast.adapter.test.ts:170-194` tests these dead methods using `defineContracts()` strings, creating false confidence.

### 7. `CLIDiagnosticAdapter.formatWithContext` is unused in production

**Location:** `src/infrastructure/adapters/cli/cli-diagnostic.adapter.ts`

The `formatWithContext()` method is implemented but:
- Not called by `CheckCommand`
- Not part of the `DiagnosticPort` interface
- Only referenced in mock adapter

### 8. `mergeKindScriptConfig` serves no current use case

**Location:** `src/application/ports/config.port.ts:84`, `config.adapter.ts`, `mock-config.adapter.ts`

This method is defined on the port and implemented in both adapters, but no use case calls it. The `init` and `infer` commands that used it were removed.

---

## Port/Interface Inconsistencies

### 9. `DiagnosticPort` interface is too narrow

**Location:** `src/application/ports/diagnostic.port.ts`

The port only defines `reportDiagnostics()`, but both the real adapter (`CLIDiagnosticAdapter`) and mock (`MockDiagnosticAdapter`) implement additional methods (`formatDiagnostic`, `formatWithContext`) that aren't part of the interface. This violates the dependency inversion principle — infrastructure code has capabilities invisible to the application layer.

### 10. Mock adapters diverge from real behavior

**`MockFileSystemAdapter.relativePath()`** (`mock-filesystem.adapter.ts:128-134`) uses a simplified string prefix check:
```typescript
if (to.startsWith(from)) {
  return to.substring(from.length + 1);
}
return to;
```
This doesn't handle backtracking (`../`), which Node's `path.relative()` does. Tests could pass with mock but fail with real adapter in edge cases.

**`MockTypeScriptAdapter.getTypeChecker()`** returns `{} as TypeChecker` — an empty object. Any test that exercises actual type checking would fail silently.

---

## Stale Documentation

### 11-12. Stale documentation statistics — FIXED

All test counts and fixture counts in `README.md`, `CLAUDE.md`, `tests/README.md`, and `DONE_VS_TODO.md` have been updated to reflect the current state: 25 test files, 272 tests, 21 unit test files, 18 fixture directories.

### 13. `tests/unit/ast.adapter.test.ts` tests dead code paths

**Location:** `tests/unit/ast.adapter.test.ts:170-194`

Four tests use `defineContracts()` strings to exercise call expression methods that are no longer used by any use case. These tests pass but provide false confidence.

---

## Missing Configuration

### 14. No ESLint configuration

**Location:** Project root

`package.json` has a `lint` script (`"lint": "eslint src/"`) but no `.eslintrc*` or `eslint.config.*` file exists at the project root. Running `npm run lint` fails.

### 15. No `"exports"` field in `package.json`

**Location:** `package.json`

The `"main"` and `"types"` fields are set correctly, but the modern `"exports"` field is missing. This is a best practice for Node.js packages, especially for dual CJS/ESM support.

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "default": "./dist/index.js"
  }
}
```

---

## Design Concerns

### 16. Silent error swallowing in plugin diagnostics

**Location:** `src/application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts:24-36`

The `execute()` method catches all exceptions and returns empty diagnostics. While intentional (plugins must never crash the editor), this makes it very difficult to debug plugin issues since errors are completely silenced with no logging.

### 17. Windows path handling in `resolveLocation` — RESOLVED

The `resolveLocation` method was removed as part of the `ContractConfig<T>` removal. No longer applicable.

---

## Summary by Severity

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | ~~Multi-instance contract binding bug~~ | ~~Critical~~ Fixed | ~~Bug~~ |
| 2 | LanguageServiceAdapter messageText | Medium | Bug |
| 3 | Cache ignores file content changes | Medium | Bug (plugin only) |
| 4 | ~~Hardcoded `/` in colocated diagnostic~~ | ~~Low~~ Resolved | ~~Bug~~ |
| 5 | DependencyRule class unused | Low | Dead code |
| 6 | ASTPort call expression methods unused | Medium | Dead code |
| 7 | formatWithContext unused in production | Low | Dead code |
| 8 | mergeKindScriptConfig serves no use case | Low | Dead code |
| 9 | DiagnosticPort too narrow | Low | Interface mismatch |
| 10 | Mock adapters diverge from real behavior | Low | Test quality |
| 11-12 | Stale doc statistics | ~~Medium~~ Fixed | ~~Stale docs~~ |
| 13 | Tests exercise dead code paths | Medium | Test quality |
| 14 | No ESLint configuration | Low | Missing config |
| 15 | No `exports` field in package.json | Low | Missing config |
| 16 | Plugin silently swallows all errors | Low | Design concern |
| 17 | ~~Windows absolute path detection~~ | ~~Low~~ Resolved | ~~Portability~~ (code removed) |

---

## Implementation Plan

Items grouped into batches by dependency and effort. Each batch can be done as a single commit.

### Batch 1: Fix multi-instance contract binding — DONE

**Fix applied:** Changed `instanceSymbols` from `Map<string, ArchSymbol>` to `Map<string, ArchSymbol[]>`. Contract generation now iterates all instances per Kind type. Purity dedup uses identity comparison (`===`) instead of name comparison. 3 new unit tests added in `classify-ast-contracts.test.ts` covering noDependency, purity, and noCycles with shared Kind types. All 272 tests passing.

### Batch 2: Dead code removal

**Effort:** Small
**Files to change:**
- `src/domain/value-objects/dependency-rule.ts` — delete file
- `src/application/ports/ast.port.ts` — remove 4 methods (lines 33, 59-61)
- `src/infrastructure/adapters/ast/ast.adapter.ts` — remove implementations
- `src/infrastructure/adapters/testing/mock-ast.adapter.ts` — remove implementations
- `tests/unit/ast.adapter.test.ts` — remove lines 170-194 (the `defineContracts` tests)
- `src/application/ports/config.port.ts` — remove `mergeKindScriptConfig` (line 84)
- `src/infrastructure/adapters/config/config.adapter.ts` — remove implementation
- `src/infrastructure/adapters/testing/mock-config.adapter.ts` — remove implementation
- `src/infrastructure/adapters/cli/cli-diagnostic.adapter.ts` — remove `formatWithContext`
- `src/infrastructure/adapters/testing/mock-diagnostic.adapter.ts` — remove `formatWithContext`

**Steps:**
1. Delete `dependency-rule.ts`
2. Remove 4 call expression methods from ASTPort, both adapters, and tests
3. Remove `mergeKindScriptConfig` from ConfigPort and both adapters
4. Remove `formatWithContext` from both diagnostic adapters
5. Run full test suite — all remaining tests must pass
6. Run `npm run build` — verify no compile errors

### Batch 3: Bug fixes (small, independent)

**Effort:** Small
**Files to change:**
- `src/infrastructure/adapters/plugin/language-service.adapter.ts` — fix messageText
- ~~`src/application/use-cases/check-contracts/check-contracts.service.ts` — fix colocated path~~ (resolved — `checkColocated` replaced by `checkMirrors`)

**Steps:**
1. **messageText fix (item #2):** The LanguageServiceAdapter constructor receives `typescript: typeof ts`. Store it as a field and use `this.typescript.flattenDiagnosticMessageText(d.messageText, '\n')` in `wrapDiagnostic()`. Currently `_typescript` is unused (underscore prefix) — rename to `typescript` and save.
2. ~~**Colocated path fix (item #4):**~~ Resolved — `checkColocated` replaced by `checkMirrors` with `relativePath()` matching.
3. ~~**Windows path fix (item #17):**~~ Resolved — `resolveLocation` removed with `ContractConfig<T>`.

### Batch 4: Plugin cache invalidation (item #3)

**Effort:** Medium
**Files to change:**
- `src/application/use-cases/classify-project/classify-project.service.ts`
- `src/application/ports/filesystem.port.ts` (if adding `getModifiedTime`)
- Adapter + mock implementations

**Steps:**
1. Add `getModifiedTime(path: string): number` to FileSystemPort (returns `fs.statSync(path).mtimeMs`)
2. Implement in FileSystemAdapter and MockFileSystemAdapter
3. In `ClassifyProjectService`, build the cache key from paths + modification times: `definitionPaths.map(p => p + ':' + this.fsPort.getModifiedTime(p)).sort().join('|')`
4. Add unit test for cache invalidation when file mtime changes

### Batch 5: Stale documentation fixes — DONE

All test counts updated across `README.md`, `CLAUDE.md`, `tests/README.md`, and `DONE_VS_TODO.md` to reflect 25 files / 272 tests / 18 fixtures.

### Batch 6: Configuration and cleanup

**Effort:** Small
**Files to change:**
- `package.json` — add `"exports"` field
- `.eslintrc.json` or `eslint.config.js` — create ESLint config (or remove lint script)

**Steps:**
1. Add `"exports"` field to `package.json`:
   ```json
   "exports": {
     ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
   }
   ```
2. Either create a minimal ESLint flat config (`eslint.config.js`) with `@typescript-eslint`, or remove the `"lint"` script from package.json if linting is not desired.

### Batch 7: Interface cleanup (optional)

**Effort:** Small
**Files to change:**
- `src/application/ports/diagnostic.port.ts`
- Adapter implementations

**Steps:**
1. Either add `formatDiagnostic` to DiagnosticPort (if it should be part of the contract) or remove it from adapters (if it's truly unused).
2. Verify no code depends on the extra methods via the port type.

### Not planned (acceptable as-is)

| # | Issue | Rationale |
|---|-------|-----------|
| 10 | Mock adapter divergence | Mocks are intentionally simplified; complexity should match what tests need |
| 16 | Silent plugin error swallowing | Intentional — plugins must not crash the editor. Logging can be added later when a logging port exists |

---

## Batch Execution Order

```
Batch 5 (stale docs)      ─── DONE
Batch 1 (multi-instance)   ─── DONE
Batch 2 (dead code)        ─── no dependencies, mechanical
Batch 3 (small bug fixes)  ─── no dependencies, isolated
Batch 6 (config)           ─── no dependencies, isolated
Batch 4 (cache)            ─── needs FileSystemPort change
Batch 7 (interfaces)       ─── optional cleanup
```

Batches 2, 3, and 6 are independent and can be done in any order or in parallel.

---

**Overall Assessment:** The codebase is well-architected with genuine Clean Architecture layering. Domain purity is verified (zero external dependencies). The critical multi-instance bug has been fixed. The main cleanup areas are dead code from the V2 redesign (call expression methods, DependencyRule).
