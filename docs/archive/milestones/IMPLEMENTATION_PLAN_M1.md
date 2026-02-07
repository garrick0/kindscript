# Milestone 1: Implementation Plan

**Goal:** Single Contract End-to-End
**Duration:** 2 weeks
**Prerequisite:** M0 complete (domain entities, ports, mock adapters, 73 tests passing)

---

## Overview

M1 delivers the first **real, usable tool**: a CLI that reads a `kindscript.json` config, creates a real TypeScript program, checks `noDependency` contracts against actual import graphs, and reports violations to the terminal with exit code 1 for CI.

After M1, a user can:
```bash
$ cat kindscript.json
{
  "contracts": {
    "noDependency": [
      { "from": "src/domain", "to": "src/infrastructure" }
    ]
  }
}

$ npx ksc check
src/domain/service.ts:5:0 - error KS70001: Forbidden dependency: src/domain/service.ts -> src/infrastructure/database.ts

Found 1 architectural violation(s).
```

---

## Architecture Decisions

### 1. Program Entity / ts.Program Bridging

The domain `Program` entity can't import TypeScript (keeps domain pure). The adapter maintains a `WeakMap<Program, ts.Program>` to map domain programs to real TS programs. This is an infrastructure concern, invisible to domain/application layers.

### 2. Config-Based Symbols (No AST Classifier Yet)

M1 does NOT parse Kind definitions from TypeScript AST (that's M2). Instead, symbols are built from the `kindscript.json` config file directly:
- Each entry in `noDependency` becomes a pair of `ArchSymbol` objects with `declaredLocation` pointing to the directory
- The `ConfigAdapter` parses the JSON and the `CheckCommand` builds symbols from it

### 3. Import Resolution Strategy

The TypeScript adapter uses `ts.createProgram` + type checker to resolve imports to absolute file paths. It walks import declarations in each source file and resolves module specifiers via the checker's symbol resolution.

### 4. Path Normalization

All paths are normalized to forward slashes and relative to the project root for consistent comparison between symbol locations and resolved file paths.

---

## Implementation Steps

### Step 1: Extend Program Entity for ts.Program Bridging

**File:** `src/domain/entities/program.ts` (modify)

Add an opaque `handle` field to Program so the TypeScript adapter can associate a real ts.Program. The domain layer sees it as `unknown`, keeping purity intact.

### Step 2: Real TypeScript Adapter

**File:** `src/infrastructure/adapters/typescript/typescript.adapter.ts` (new)

Implements `TypeScriptPort` using real TypeScript compiler API:
- `createProgram()` → calls `ts.createProgram()`, stores mapping
- `getSourceFile()` → delegates to `ts.Program.getSourceFile()`
- `getSourceFiles()` → delegates to `ts.Program.getSourceFiles()`, filters out node_modules/.d.ts
- `getTypeChecker()` → delegates to `ts.Program.getTypeChecker()`
- `getImports()` → walks AST for `ImportDeclaration` nodes, resolves via checker
- `getDiagnostics()` → wraps `ts.getPreEmitDiagnostics()`

Key: uses `ts.resolveModuleName()` or checker symbol resolution to get absolute paths for import targets.

### Step 3: Real FileSystem Adapter

**File:** `src/infrastructure/adapters/filesystem/filesystem.adapter.ts` (new)

Implements `FileSystemPort` using Node's `fs` and `path` modules:
- `fileExists()` / `directoryExists()` → `fs.existsSync()` + `fs.statSync()`
- `readFile()` → `fs.readFileSync()`
- `readDirectory()` → recursive `fs.readdirSync()` with `withFileTypes`, filters `.ts` files
- `writeFile()` → `fs.writeFileSync()` with `mkdirSync({ recursive: true })`
- `createDirectory()` → `fs.mkdirSync({ recursive: true })`
- Path operations → `path.resolve()`, `path.relative()`, `path.dirname()`, `path.basename()`

### Step 4: Real Config Adapter

**File:** `src/infrastructure/adapters/config/config.adapter.ts` (new)

Implements `ConfigPort` using `fs.readFileSync` + `JSON.parse`:
- `readKindScriptConfig()` → reads `kindscript.json` from project path
- `readTSConfig()` → reads `tsconfig.json`, uses `ts.readConfigFile()` + `ts.parseJsonConfigFileContent()` for proper extends/path resolution
- `findConfigFile()` → walks up directory tree looking for named file

### Step 5: CLI Diagnostic Adapter

**File:** `src/infrastructure/adapters/cli/cli-diagnostic.adapter.ts` (new)

Implements `DiagnosticPort` for terminal output:
- `reportDiagnostics()` → writes formatted diagnostics to stderr
- `formatDiagnostic()` → TypeScript-style format: `file:line:col - error KScode: message`
- `formatWithContext()` → includes source line with caret pointer

### Step 6: CheckContracts Service Implementation

**File:** `src/application/use-cases/check-contracts/check-contracts.service.ts` (new)

Implements `CheckContractsUseCase`:
- Takes `TypeScriptPort` and `FileSystemPort` via constructor injection
- `execute()` loops over contracts, dispatches by type
- `checkNoDependency()`:
  1. Resolve files for `from` symbol via `FileSystemPort.readDirectory()`
  2. Resolve files for `to` symbol (build a Set for O(1) lookup)
  3. Create TS program from all relevant files
  4. For each `from` file, get imports via `TypeScriptPort.getImports()`
  5. Check if any import targets are in the `to` file set
  6. Create `Diagnostic.forbiddenDependency()` for violations

### Step 7: Config-to-Symbols Builder

**File:** `src/application/services/config-symbol-builder.ts` (new)

Utility that converts `kindscript.json` contracts into domain objects:
- Reads `noDependency` entries → creates pairs of `ArchSymbol` (kind=Layer) + `Contract` objects
- Returns `{ symbols: ArchSymbol[], contracts: Contract[] }`

This is a temporary bridge until M2 adds real AST classification.

### Step 8: CLI Entry Point & Check Command

**Files:**
- `src/infrastructure/cli/main.ts` (new) - Entry point, composition root
- `src/infrastructure/cli/commands/check.command.ts` (new) - Check command

The composition root wires up all real adapters:
1. Parse CLI args
2. Read config (kindscript.json + tsconfig.json)
3. Build symbols from config
4. Create TS program
5. Execute CheckContractsUseCase
6. Report diagnostics
7. Exit with code 0 (clean) or 1 (violations)

### Step 9: Package Configuration

**Files to modify:**
- `package.json` - Add `bin` field, add `typescript` as runtime dependency
- `tsconfig.json` - Include CLI entry point in build

### Step 10: Unit Tests

**New test files:**
- `tests/unit/check-contracts.service.test.ts` - Tests CheckContractsService with mock adapters
- `tests/unit/config-symbol-builder.test.ts` - Tests config-to-symbol conversion
- `tests/unit/cli-diagnostic.adapter.test.ts` - Tests diagnostic formatting

### Step 11: Integration Tests

**New test files:**
- `tests/integration/noDependency.integration.test.ts` - Creates real TS programs from fixture files, runs full check pipeline
- `tests/integration/fixtures/` - Small TypeScript projects with known violations

### Step 12: End-to-End Test

**New test file:**
- `tests/e2e/cli.e2e.test.ts` - Runs the built CLI binary against fixture projects, asserts on stdout/stderr/exit code

---

## File Structure After M1

```
src/
  domain/                           # Unchanged from M0 (except Program.handle)
  application/
    ports/                          # Unchanged from M0
    use-cases/
      check-contracts/
        check-contracts.service.ts  # NEW - real implementation
        ...                         # existing interfaces
    services/
      config-symbol-builder.ts      # NEW - config → symbols
  infrastructure/
    adapters/
      testing/                      # Unchanged from M0
      typescript/
        typescript.adapter.ts       # NEW - real TS adapter
      filesystem/
        filesystem.adapter.ts       # NEW - real FS adapter
      config/
        config.adapter.ts           # NEW - real config adapter
      cli/
        cli-diagnostic.adapter.ts   # NEW - terminal output
    cli/
      main.ts                       # NEW - entry point
      commands/
        check.command.ts            # NEW - check command

tests/
  architecture/                     # Unchanged from M0
  unit/
    check-contracts.service.test.ts # NEW
    config-symbol-builder.test.ts   # NEW
    cli-diagnostic.adapter.test.ts  # NEW
  integration/
    noDependency.integration.test.ts # NEW
    fixtures/
      clean-arch-valid/             # NEW - no violations
      clean-arch-violation/         # NEW - has violations
  e2e/
    cli.e2e.test.ts                 # NEW
```

---

## Success Criteria

- [ ] `npx ksc check` runs on a real project
- [ ] Detects real `noDependency` violations in real codebases
- [ ] Uses real TypeScript compiler API (ts.createProgram)
- [ ] Uses real filesystem (Node fs)
- [ ] Reads `kindscript.json` config file
- [ ] Exit code 1 on violations, 0 on clean
- [ ] Domain/application layers still have zero TypeScript API imports
- [ ] All M0 tests still pass (no regressions)
- [ ] New unit tests for CheckContractsService (10+ tests)
- [ ] Integration test with real TS fixture projects
- [ ] E2E test running CLI binary

### Step 13: Fix Path Handling False Positives

**File:** `src/application/use-cases/check-contracts/check-contracts.service.ts` (modify)

The `isFileInSymbol` method uses string `includes`/`startsWith` which can false-positive on paths like `src/domain-extensions` matching symbol `src/domain`. Fix to enforce `/` path boundary delimiters.

### Step 14: Warn on Unsupported Contract Types

**File:** `src/application/services/config-symbol-builder.ts` (modify)

The builder silently ignores contract types other than `noDependency`. Add warnings in the `errors` array when config contains contract types not yet implemented (e.g. `mustImplement`, `purity`).

### Step 15: Add --version Flag and Remove Unused resolveJsonModule

**Files:**
- `src/infrastructure/cli/main.ts` (modify) - Add `--version`/`-v` handling
- `tsconfig.json` (modify) - Remove unused `resolveJsonModule: true`

### Step 16: Make CLI Runnable and Add Subprocess E2E Test

**Files:**
- Build step: `npm run build` produces `dist/` with compiled JS
- `tests/e2e/cli-subprocess.e2e.test.ts` (new) - Runs `node dist/infrastructure/cli/main.js check <path>` as a real child process, asserts on stdout/stderr/exit code
- Ensures `bin.ksc` in package.json actually works end-to-end

---

## Success Criteria

- [x] `npx ksc check` runs on a real project
- [x] Detects real `noDependency` violations in real codebases
- [x] Uses real TypeScript compiler API (ts.createProgram)
- [x] Uses real filesystem (Node fs)
- [x] Reads `kindscript.json` config file
- [x] Exit code 1 on violations, 0 on clean
- [x] Domain/application layers still have zero TypeScript API imports
- [x] All M0 tests still pass (no regressions)
- [x] New unit tests for CheckContractsService (10+ tests)
- [x] Integration test with real TS fixture projects
- [x] E2E test running CLI binary
- [x] Path matching uses strict boundary checks (no false positives)
- [x] Unsupported contract types produce warnings
- [x] `ksc --version` works
- [x] Real subprocess E2E test for the built CLI binary

---

## Limitations at M1

- Only `noDependency` contract type works (other types produce a warning)
- Symbols come from config file, not AST classification (no Kind<N> parsing)
- No watch mode
- No incremental checking
- No caching
- No language service plugin
