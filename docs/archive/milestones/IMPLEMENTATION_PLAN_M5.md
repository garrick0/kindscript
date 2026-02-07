# Milestone 5: Implementation Plan

**Goal:** Language Service Plugin — IDE integration with architectural diagnostics
**Duration:** 2 weeks
**Prerequisite:** M4 complete (280 tests passing, `ksc init --detect` working end-to-end, version `0.4.0-m4`)

---

## Overview

M5 delivers a TypeScript language service plugin that surfaces KindScript diagnostics directly inside editors. After M5, architectural violations appear inline as squiggly underlines — in VS Code, Sublime, Vim, WebStorm, and every editor using tsserver — with no editor-specific integration work.

After M5, a user can:

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      { "name": "kindscript" }
    ]
  }
}
```

And immediately see:
- Red squiggly underlines on violating `import` statements
- Hover messages showing the violated contract and its location
- Quick fix code actions (e.g., "Add import exception to contract")

The plugin and CLI **share all contract evaluation logic** — the plugin is a thin infrastructure adapter that delegates to the same `CheckContractsService` and `ClassifyASTService` used by `ksc check`.

> **Architecture Reference:** Implements V4 Part 5 (Language Service Integration — Plugin Architecture). Uses `ts.server.PluginModule` API (not custom LSP), per ecosystem evidence from Angular Language Service, typescript-styled-plugin, and ts-graphql-plugin.

---

## Architecture Decisions

### 1. Plugin API, Not Custom LSP

KindScript operates entirely on `.ts` files. Every project in the ecosystem that operates only on `.ts` files uses the TypeScript plugin API exclusively (Angular, styled-components, ts-graphql). Custom LSP servers are only needed for custom file formats (`.vue`, `.svelte`). The plugin API gives us diagnostic reporting, hover info, and code fixes for free inside tsserver.

### 2. Plugin Adapter Implements DiagnosticPort

The `PluginAdapter` is a new infrastructure adapter, just like `CLIDiagnosticAdapter`. It implements `DiagnosticPort` for the plugin context. However, unlike the CLI adapter (which writes to stderr), the plugin adapter converts domain `Diagnostic` objects to `ts.Diagnostic` objects that tsserver displays inline.

### 3. Proxy Pattern for Language Service Interception

The plugin creates a proxy around the existing `ts.LanguageService`. It delegates all calls to the original service and intercepts only:
- `getSemanticDiagnostics` — appends KindScript diagnostics
- `getCodeFixesAtPosition` — adds KindScript quick fixes

This is the standard pattern used by Angular Language Service and all other TS plugins.

### 4. Separate Entry Point, Shared Logic

The plugin entry point (`src/infrastructure/plugin/index.ts`) is a new composition root that wires the same services as the CLI. The plugin module factory function is exported with `export =` syntax as required by the TypeScript plugin API.

A separate `tsconfig.plugin.json` compiles only the plugin entry point to `dist/plugin/index.js`. The `package.json` `files` field includes this path so users can configure `{ "name": "kindscript" }` as a plugin.

### 5. Caching for Performance (<100ms Target)

The plugin must respond within 100ms per file edit. Contract evaluation is the same logic as the CLI, but the plugin needs to avoid re-evaluating all contracts on every keystroke. Strategy:

- **Cache symbols and contracts** — only re-classify when definition files change
- **Cache file-to-layer mapping** — only invalidate when directory structure changes
- **Per-file dependency check** — only re-check contracts relevant to the edited file
- **Debounce** — the language service naturally debounces (tsserver only calls diagnostics after idle)

### 6. LanguageServicePort — New Port for Plugin-Specific Operations

The plugin needs to interact with tsserver's `PluginCreateInfo` (project config, language service, server host). Rather than polluting `TypeScriptPort`, we add a lightweight `LanguageServicePort` that encapsulates these plugin-specific operations. The real adapter wraps tsserver's `PluginCreateInfo`; a mock enables unit testing.

### 7. Config Discovery from Plugin Context

The CLI reads `kindscript.json` explicitly from a project path. The plugin needs to discover it from the tsserver project root. The existing `ConfigPort.readKindScriptConfig()` works — we just need to find the project root from `info.project.getCurrentDirectory()`.

---

## Implementation Steps

### Step 1: Add LanguageServicePort Interface

**File:** `src/application/ports/language-service.port.ts` (new)

Define the port for plugin-specific operations:

```typescript
export interface LanguageServicePort {
  /** Get the project root directory */
  getProjectRoot(): string;

  /** Get the current ts.Program from the language service */
  getProgram(): Program | undefined;

  /** Get the original semantic diagnostics for a file */
  getOriginalSemanticDiagnostics(fileName: string): TSDiagnostic[];

  /** Get the original code fixes for a position */
  getOriginalCodeFixes(
    fileName: string,
    start: number,
    end: number,
    errorCodes: readonly number[]
  ): TSCodeFixAction[];

  /** Convert a domain Diagnostic to a TS diagnostic (with source file and span) */
  toTSDiagnostic(diagnostic: Diagnostic, program: Program): TSDiagnostic;

  /** Get all root file paths in the current project */
  getRootFileNames(): string[];
}
```

Where `TSDiagnostic` and `TSCodeFixAction` are domain-safe opaque types:

```typescript
/** Opaque wrapper around ts.Diagnostic for the domain boundary */
export interface TSDiagnostic {
  file?: string;
  start?: number;
  length?: number;
  messageText: string;
  code: number;
  category: number;
}

/** Opaque wrapper around ts.CodeFixAction */
export interface TSCodeFixAction {
  fixName: string;
  description: string;
  changes: unknown[];
}
```

### Step 2: Add GetPluginDiagnostics Use Case

**Directory:** `src/application/use-cases/get-plugin-diagnostics/`

3 files following existing pattern:

**`get-plugin-diagnostics.use-case.ts`** — Interface:
```typescript
export interface GetPluginDiagnosticsUseCase {
  execute(request: GetPluginDiagnosticsRequest): GetPluginDiagnosticsResponse;
}
```

**`get-plugin-diagnostics.types.ts`** — Request and Response:
```typescript
export interface GetPluginDiagnosticsRequest {
  /** The file being checked */
  fileName: string;

  /** The project root path */
  projectRoot: string;
}

export interface GetPluginDiagnosticsResponse {
  /** KindScript diagnostics for this file */
  diagnostics: Diagnostic[];

  /** Processing time in milliseconds (for performance monitoring) */
  elapsedMs: number;
}
```

**`get-plugin-diagnostics.service.ts`** — Implementation:

Service logic:
1. Read `kindscript.json` from project root (via `ConfigPort`)
2. Determine tier (Tier 1 config-based or Tier 2 definitions)
3. If Tier 2: Classify definition files → get symbols + contracts
4. If Tier 1: Build symbols from config via `ConfigSymbolBuilder`
5. Filter contracts to only those relevant to the edited file's layer
6. Run `CheckContractsService` with the filtered scope
7. Return diagnostics with elapsed time

**Caching logic** (inside the service):
- Maintain a `lastClassifyResult` cache keyed by definition file modification hash
- Maintain a `fileToLayerMap` cache keyed by directory structure hash
- Only re-classify when definition files change
- Only re-map files to layers when directory structure changes
- Always re-check the edited file's imports (fast — single file scan)

**Constructor:** `(checkContracts: CheckContractsUseCase, configPort: ConfigPort, classifyService?: ClassifyASTUseCase, tsPort?: TypeScriptPort)`

### Step 3: Add GetPluginCodeFixes Use Case

**Directory:** `src/application/use-cases/get-plugin-code-fixes/`

3 files:

**`get-plugin-code-fixes.use-case.ts`** — Interface:
```typescript
export interface GetPluginCodeFixesUseCase {
  execute(request: GetPluginCodeFixesRequest): GetPluginCodeFixesResponse;
}
```

**`get-plugin-code-fixes.types.ts`** — Request and Response:
```typescript
export interface GetPluginCodeFixesRequest {
  fileName: string;
  start: number;
  end: number;
  errorCodes: readonly number[];
  projectRoot: string;
}

export interface GetPluginCodeFixesResponse {
  fixes: PluginCodeFix[];
}

export interface PluginCodeFix {
  fixName: string;
  description: string;
  /** The diagnostic code this fix addresses */
  diagnosticCode: number;
}
```

**`get-plugin-code-fixes.service.ts`** — Implementation:

Service logic:
1. Filter error codes to KindScript range (70001–70099)
2. For each KindScript error code, generate appropriate fix suggestions:
   - `70001` (forbidden dependency) → "Remove this import" fix description
   - `70003` (impure import) → "Remove this import" fix description
3. Return fix metadata (the actual `ts.TextChanges` are computed in the adapter layer since they require access to `ts.SourceFile` spans)

### Step 4: Implement LanguageServiceAdapter

**File:** `src/infrastructure/adapters/plugin/language-service.adapter.ts` (new)

Implements `LanguageServicePort` by wrapping `ts.server.PluginCreateInfo`:

```typescript
export class LanguageServiceAdapter implements LanguageServicePort {
  constructor(
    private readonly info: ts.server.PluginCreateInfo,
    private readonly typescript: typeof ts
  ) {}

  getProjectRoot(): string {
    return this.info.project.getCurrentDirectory();
  }

  getProgram(): Program | undefined {
    const tsProgram = this.info.languageService.getProgram();
    if (!tsProgram) return undefined;
    const rootFiles = tsProgram.getRootFileNames();
    return new Program(rootFiles, {}, tsProgram);
  }

  getOriginalSemanticDiagnostics(fileName: string): TSDiagnostic[] {
    return this.info.languageService.getSemanticDiagnostics(fileName)
      .map(d => this.wrapDiagnostic(d));
  }

  toTSDiagnostic(diagnostic: Diagnostic, program: Program): TSDiagnostic {
    const tsProgram = program.handle as ts.Program;
    const sourceFile = tsProgram.getSourceFile(diagnostic.file);
    // Convert line/column to character offset for ts.Diagnostic
    // ...
  }

  getRootFileNames(): string[] {
    return this.info.project.getFileNames();
  }
}
```

### Step 5: Implement Plugin Entry Point

**File:** `src/infrastructure/plugin/index.ts` (new)

The plugin module factory — composition root for the plugin context:

```typescript
import type * as ts from 'typescript/lib/tsserverlibrary';

function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      // Wire up adapters
      const fsAdapter = new FileSystemAdapter();
      const configAdapter = new ConfigAdapter();
      const tsAdapter = new TypeScriptAdapter();
      const astAdapter = new ASTAdapter();
      const lsAdapter = new LanguageServiceAdapter(info, modules.typescript);

      // Wire up services
      const checkService = new CheckContractsService(tsAdapter, fsAdapter);
      const classifyService = new ClassifyASTService(astAdapter);
      const diagnosticsService = new GetPluginDiagnosticsService(
        checkService, configAdapter, classifyService, tsAdapter
      );
      const codeFixesService = new GetPluginCodeFixesService();

      // Create proxy
      return createLanguageServiceProxy(
        info, modules.typescript, lsAdapter, diagnosticsService, codeFixesService, fsAdapter
      );
    }
  };
}

export = init;
```

### Step 6: Implement Language Service Proxy

**File:** `src/infrastructure/plugin/language-service-proxy.ts` (new)

Creates the proxied `ts.LanguageService` that intercepts diagnostic and code fix methods:

```typescript
export function createLanguageServiceProxy(
  info: ts.server.PluginCreateInfo,
  typescript: typeof ts,
  lsAdapter: LanguageServiceAdapter,
  diagnosticsService: GetPluginDiagnosticsUseCase,
  codeFixesService: GetPluginCodeFixesUseCase,
  fsPort: FileSystemPort
): ts.LanguageService {
  const proxy = Object.create(null) as ts.LanguageService;
  const oldService = info.languageService;

  // Proxy all methods from original service
  for (const k of Object.keys(oldService) as Array<keyof ts.LanguageService>) {
    const method = oldService[k];
    if (typeof method === 'function') {
      (proxy as any)[k] = (...args: any[]) => (method as Function).apply(oldService, args);
    }
  }

  // Intercept getSemanticDiagnostics
  proxy.getSemanticDiagnostics = (fileName: string): ts.Diagnostic[] => {
    const tsDiags = oldService.getSemanticDiagnostics(fileName);

    try {
      const projectRoot = lsAdapter.getProjectRoot();
      const result = diagnosticsService.execute({ fileName, projectRoot });

      // Convert domain diagnostics to ts.Diagnostic
      const program = lsAdapter.getProgram();
      if (!program) return tsDiags;

      const ksDiags = result.diagnostics.map(d =>
        convertToTSDiagnostic(d, program, typescript)
      );

      return [...tsDiags, ...ksDiags];
    } catch {
      // Never crash tsserver — silently return only TS diagnostics
      return tsDiags;
    }
  };

  // Intercept getCodeFixesAtPosition
  proxy.getCodeFixesAtPosition = (
    fileName: string,
    start: number,
    end: number,
    errorCodes: readonly number[],
    formatOptions: ts.FormatCodeSettings,
    preferences: ts.UserPreferences
  ): readonly ts.CodeFixAction[] => {
    const tsFixes = oldService.getCodeFixesAtPosition(
      fileName, start, end, errorCodes, formatOptions, preferences
    );

    try {
      const projectRoot = lsAdapter.getProjectRoot();
      const result = codeFixesService.execute({
        fileName, start, end, errorCodes, projectRoot
      });

      const ksFixes = result.fixes.map(f =>
        convertToCodeFixAction(f, fileName, start, end, typescript)
      );

      return [...tsFixes, ...ksFixes];
    } catch {
      return tsFixes;
    }
  };

  return proxy;
}
```

Key design: every interception is wrapped in try/catch. A plugin must **never** crash tsserver. On any error, we silently return only the original TypeScript results.

### Step 7: Plugin Build Configuration

**File:** `tsconfig.plugin.json` (new)

Separate tsconfig for the plugin entry point:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

The existing `tsconfig.json` already compiles everything under `src/` to `dist/`, so the plugin entry point at `src/infrastructure/plugin/index.ts` will compile to `dist/infrastructure/plugin/index.js`. No separate tsconfig is actually needed — the existing build already covers it.

**File:** `package.json` (modify)

Add the plugin entry point to `files` and update version:

```json
{
  "version": "0.5.0-m5",
  "files": [
    "dist/"
  ]
}
```

Update `scripts`:
```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest"
  }
}
```

Add a `typescriptServerPlugins` field so VS Code auto-discovers the plugin:

```json
{
  "contributes": {
    "typescriptServerPlugins": [
      { "name": "kindscript", "enableForWorkspaceTypeScriptVersions": true }
    ]
  }
}
```

### Step 8: MockLanguageServiceAdapter

**File:** `src/infrastructure/adapters/testing/mock-language-service.adapter.ts` (new)

Mock implementation for testing plugin use cases:

```typescript
export class MockLanguageServiceAdapter implements LanguageServicePort {
  private projectRoot: string = '/project';
  private program: Program | undefined;
  private diagnostics = new Map<string, TSDiagnostic[]>();
  private rootFiles: string[] = [];

  // Fluent API
  withProjectRoot(root: string): this { ... }
  withProgram(program: Program): this { ... }
  withOriginalDiagnostics(fileName: string, diags: TSDiagnostic[]): this { ... }
  withRootFiles(files: string[]): this { ... }

  // Implement LanguageServicePort
  getProjectRoot(): string { return this.projectRoot; }
  getProgram(): Program | undefined { return this.program; }
  // ...
}
```

### Step 9: Diagnostic Conversion Utilities

**File:** `src/infrastructure/plugin/diagnostic-converter.ts` (new)

Utility functions to convert between domain `Diagnostic` objects and `ts.Diagnostic` objects:

```typescript
export function convertToTSDiagnostic(
  diagnostic: Diagnostic,
  program: Program,
  typescript: typeof ts
): ts.Diagnostic {
  const tsProgram = program.handle as ts.Program;
  const sourceFile = tsProgram.getSourceFile(diagnostic.file);

  let start: number | undefined;
  let length: number | undefined;

  if (sourceFile && diagnostic.line > 0) {
    // Convert 1-based line/column to character offset
    const lineStarts = sourceFile.getLineStarts();
    const lineIndex = diagnostic.line - 1;
    if (lineIndex < lineStarts.length) {
      start = lineStarts[lineIndex] + diagnostic.column;
      // Length: find the import statement length on this line
      const lineEnd = lineIndex + 1 < lineStarts.length
        ? lineStarts[lineIndex + 1]
        : sourceFile.getEnd();
      const lineText = sourceFile.text.substring(lineStarts[lineIndex], lineEnd);
      length = lineText.trimEnd().length;
    }
  }

  return {
    file: sourceFile,
    start,
    length,
    messageText: diagnostic.message,
    category: typescript.DiagnosticCategory.Error,
    code: diagnostic.code,
    source: 'kindscript',
  };
}

export function convertToCodeFixAction(
  fix: PluginCodeFix,
  fileName: string,
  start: number,
  end: number,
  typescript: typeof ts
): ts.CodeFixAction {
  return {
    fixName: fix.fixName,
    description: fix.description,
    changes: [],  // M5 provides description-only fixes; M5.1 can add text changes
    fixId: fix.fixName,
    fixAllDescription: undefined,
  };
}
```

### Step 10: Unit Tests — GetPluginDiagnosticsService

**File:** `tests/unit/get-plugin-diagnostics.service.test.ts` (new)

Using `MockFileSystemAdapter`, `MockTypeScriptAdapter`, `MockConfigAdapter`:

```
- Returns diagnostics for a file violating noDependency contract
- Returns empty diagnostics for a file with no violations
- Returns empty diagnostics when no kindscript.json found
- Handles Tier 1 config-based contracts
- Handles Tier 2 definition-based contracts
- Reports elapsed time in response
- Caches classify result across calls for same definition files
- Re-classifies when definition files change
- Does not crash on malformed config
- Filters diagnostics to only those relevant to the requested file
```

### Step 11: Unit Tests — GetPluginCodeFixesService

**File:** `tests/unit/get-plugin-code-fixes.service.test.ts` (new)

```
- Returns fix for KS70001 (forbidden dependency) error code
- Returns fix for KS70003 (impure import) error code
- Returns empty for non-KindScript error codes
- Returns empty when no KindScript codes in error list
- Ignores unknown KindScript error codes gracefully
```

### Step 12: Unit Tests — Language Service Proxy

**File:** `tests/unit/language-service-proxy.test.ts` (new)

These test the proxy creation and interception logic using mocks:

```
- Proxies all original language service methods
- Appends KindScript diagnostics to original diagnostics
- Returns only original diagnostics when KindScript throws
- Appends KindScript code fixes to original fixes
- Returns only original fixes when KindScript throws
- Does not modify original diagnostics (non-destructive append)
```

### Step 13: Unit Tests — Diagnostic Converter

**File:** `tests/unit/diagnostic-converter.test.ts` (new)

```
- Converts domain Diagnostic to ts.Diagnostic with correct fields
- Sets source to 'kindscript'
- Sets category to Error
- Computes start offset from line and column
- Handles missing source file gracefully
- Preserves diagnostic code (70001, 70003, etc.)
```

### Step 14: Integration Test — Plugin with Real Adapters

**File:** `tests/integration/plugin-diagnostics.integration.test.ts` (new)

Using real `FileSystemAdapter`, `TypeScriptAdapter`, `ConfigAdapter` against existing fixtures:

```
- Detects violation in clean-arch-violation fixture via plugin diagnostics service
- Reports no violations for clean-arch-valid fixture
- Handles Tier 2 definitions via plugin diagnostics service
- Performance: completes in under 500ms for fixture projects (relaxed from 100ms target for integration tests)
```

### Step 15: E2E Test — Plugin Loading

**File:** `tests/e2e/plugin-loading.e2e.test.ts` (new)

Verify the plugin module can be loaded and initialized without errors:

```
- Plugin module exports a function
- Plugin factory returns an object with create method
- Plugin create produces a LanguageService with getSemanticDiagnostics
- Plugin create produces a LanguageService with getCodeFixesAtPosition
- Plugin does not throw when initialized
```

These tests import the built plugin module directly and call it with mock `PluginCreateInfo` objects, verifying that the composition root wires up correctly.

### Step 16: E2E Test — CLI Compatibility

**File:** `tests/e2e/cli-subprocess.e2e.test.ts` (modify)

Update version expectation:

```
- ksc --version outputs 0.5.0-m5
```

### Step 17: Version Bump and Build

- `package.json`: `0.4.0-m4` → `0.5.0-m5`
- `src/infrastructure/cli/main.ts`: version string → `0.5.0-m5`
- `tests/e2e/cli-subprocess.e2e.test.ts`: version assertion → `0.5.0-m5`
- `npm run build` → clean compilation
- `npx jest --coverage` → all tests pass, thresholds met

---

## File Structure After M5

```
src/
  application/
    ports/
      language-service.port.ts              # NEW — plugin-specific port
      typescript.port.ts                    # Unchanged
      filesystem.port.ts                    # Unchanged
      config.port.ts                        # Unchanged
      diagnostic.port.ts                    # Unchanged
      ast.port.ts                           # Unchanged
    use-cases/
      get-plugin-diagnostics/
        get-plugin-diagnostics.use-case.ts  # NEW — interface
        get-plugin-diagnostics.types.ts     # NEW — request/response
        get-plugin-diagnostics.service.ts   # NEW — implementation with caching
      get-plugin-code-fixes/
        get-plugin-code-fixes.use-case.ts   # NEW — interface
        get-plugin-code-fixes.types.ts      # NEW — request/response
        get-plugin-code-fixes.service.ts    # NEW — implementation
      check-contracts/                      # Unchanged
      classify-ast/                         # Unchanged
      detect-architecture/                  # Unchanged
      generate-project-refs/                # Unchanged
      resolve-files/                        # Unchanged
    services/
      config-symbol-builder.ts              # Unchanged
  domain/                                   # Unchanged from M4
  infrastructure/
    adapters/
      plugin/
        language-service.adapter.ts         # NEW — wraps ts.server.PluginCreateInfo
      testing/
        mock-language-service.adapter.ts    # NEW — mock for LanguageServicePort
        mock-typescript.adapter.ts          # Unchanged
        mock-filesystem.adapter.ts          # Unchanged
        mock-ast.adapter.ts                 # Unchanged
        mock-config.adapter.ts              # Unchanged
        mock-diagnostic.adapter.ts          # Unchanged
      typescript/                           # Unchanged
      filesystem/                           # Unchanged
      ast/                                  # Unchanged
      config/                               # Unchanged
      cli/                                  # Unchanged
    plugin/
      index.ts                              # NEW — plugin entry point (export = init)
      language-service-proxy.ts             # NEW — proxy creation logic
      diagnostic-converter.ts              # NEW — Diagnostic ↔ ts.Diagnostic
    cli/
      main.ts                               # MODIFIED — version bump
      commands/
        check.command.ts                    # Unchanged
        init.command.ts                     # Unchanged
  runtime/                                  # Unchanged
  index.ts                                  # Unchanged

tests/
  unit/
    get-plugin-diagnostics.service.test.ts  # NEW
    get-plugin-code-fixes.service.test.ts   # NEW
    language-service-proxy.test.ts          # NEW
    diagnostic-converter.test.ts            # NEW
    detect-architecture.service.test.ts     # Unchanged
    generate-project-refs.service.test.ts   # Unchanged
    check-contracts.service.test.ts         # Unchanged
    classify-ast.service.test.ts            # Unchanged
    config-symbol-builder.test.ts           # Unchanged
    ast.adapter.test.ts                     # Unchanged
    cli-diagnostic.adapter.test.ts          # Unchanged
    resolve-files.service.test.ts           # Unchanged
  integration/
    plugin-diagnostics.integration.test.ts  # NEW
    detect-architecture.integration.test.ts # Unchanged
    noDependency.integration.test.ts        # Unchanged
    tier2-classify.integration.test.ts      # Unchanged
    tier2-contracts.integration.test.ts     # Unchanged
    fixtures/                               # Unchanged (reuses existing fixtures)
  e2e/
    plugin-loading.e2e.test.ts              # NEW
    cli-init-detect.e2e.test.ts             # Unchanged
    cli-subprocess.e2e.test.ts              # MODIFIED — version bump
    cli.e2e.test.ts                         # Unchanged
    cli-tier2.e2e.test.ts                   # Unchanged
    cli-tier2-contracts.e2e.test.ts         # Unchanged
  architecture/                             # Unchanged
```

---

## Dependency Graph

```
Step 1:  LanguageServicePort interface           ← no dependencies
Step 2:  GetPluginDiagnostics use case           ← depends on Step 1
Step 3:  GetPluginCodeFixes use case             ← no dependencies
Step 4:  LanguageServiceAdapter (real)           ← depends on Step 1
Step 5:  Plugin entry point                      ← depends on Steps 2, 3, 4, 6
Step 6:  Language service proxy                  ← depends on Steps 2, 3, 9
Step 7:  Plugin build configuration             ← depends on Step 5
Step 8:  MockLanguageServiceAdapter              ← depends on Step 1
Step 9:  Diagnostic converter utilities          ← no dependencies
Step 10: GetPluginDiagnostics unit tests         ← depends on Steps 2, 8
Step 11: GetPluginCodeFixes unit tests           ← depends on Step 3
Step 12: Language service proxy unit tests       ← depends on Steps 6, 8
Step 13: Diagnostic converter unit tests         ← depends on Step 9
Step 14: Integration tests                       ← depends on Steps 2, 4
Step 15: Plugin loading E2E tests                ← depends on Steps 5, 7
Step 16: CLI E2E version update                  ← depends on Step 17
Step 17: Version bump and build                  ← depends on all above
```

**Parallelizable work:**
- Steps 1, 3, 9 can all happen first (no interdependencies)
- Steps 2, 4, 8 can happen in parallel after Step 1
- Steps 10, 11, 12, 13 can happen in parallel (all unit tests)
- Steps 14, 15 depend on everything being wired up

---

## Implementation Order

1. Step 1 (LanguageServicePort) — pure interface, no dependencies
2. Step 9 (diagnostic converter) — pure utilities, no dependencies
3. Step 3 (GetPluginCodeFixes use case) — no dependencies
4. Step 2 (GetPluginDiagnostics use case) — depends on Step 1
5. Step 8 (MockLanguageServiceAdapter) — depends on Step 1
6. Step 4 (LanguageServiceAdapter) — depends on Step 1
7. Step 6 (language service proxy) — depends on Steps 2, 3, 9
8. Step 5 (plugin entry point) — depends on Steps 2, 3, 4, 6
9. Steps 10-13 (unit tests) — alongside or after services
10. Step 7 (build config) — verify plugin compiles
11. Step 14 (integration tests) — full pipeline
12. Step 15 (E2E tests) — plugin loading
13. Steps 16-17 (version bump, build, verify)

---

## Key Risk: tsserverlibrary Types

The plugin imports `typescript/lib/tsserverlibrary` for type definitions. This is a peer dependency — the user's TypeScript installation provides it at runtime. For compilation and testing, we import it as a `devDependency` (already present as `typescript: ^5.3.0`).

The `import type * as ts from 'typescript/lib/tsserverlibrary'` pattern ensures no runtime import of TypeScript — the plugin receives the `typescript` module from tsserver at initialization via the `modules` parameter.

---

## Performance Budget

| Operation | Target | Notes |
|---|---|---|
| Plugin initialization | < 200ms | One-time cost on project open |
| First diagnostic check | < 500ms | Cold cache, full classify + check |
| Subsequent checks (same file) | < 100ms | Warm cache, only re-check imports |
| Subsequent checks (different file) | < 100ms | Warm cache, cached symbol mapping |
| Code fix generation | < 50ms | Simple pattern matching |

The 100ms target applies to the common case (warm cache, single file edit). Cold starts are allowed to be slower.

---

## Success Criteria

- [ ] Plugin loads in tsserver without errors
- [ ] `getSemanticDiagnostics` returns KindScript diagnostics alongside TS diagnostics
- [ ] Diagnostics have correct file, line, column, message, and code
- [ ] `getCodeFixesAtPosition` returns KindScript fixes for KS error codes
- [ ] Plugin never crashes tsserver (all interceptions wrapped in try/catch)
- [ ] Supports both Tier 1 (config) and Tier 2 (definitions) contract sources
- [ ] Warm-cache diagnostics complete in < 100ms (measured in integration tests)
- [ ] All existing 280+ tests continue passing (no regressions)
- [ ] New unit tests for plugin services (25+ tests)
- [ ] Integration test against existing fixtures via plugin pipeline
- [ ] E2E test verifying plugin module loads correctly
- [ ] `ksc --version` outputs `0.5.0-m5`
- [ ] Domain/application layers still have zero TypeScript API imports

---

## Limitations at M5

- No hover information (contract details on hover) — deferred to M5.1
- No code lens ("✓ 5 contracts passing") — deferred to M5.1
- Code fixes are description-only (no auto-applied text changes) — deferred to M5.1
- No watch mode for structural changes (new/deleted files) — deferred to M5.2
- No incremental `.ksbuildinfo` caching — deferred to M5.2
- No VS Code extension wrapper (users configure plugin manually in tsconfig.json) — deferred to M5.1
- Performance not validated in large real-world projects (only fixture-scale) — validated in M5.1 with customer projects

---

## Verification

1. `npx tsc --noEmit` — clean compilation
2. `npx jest --coverage` — all tests pass, coverage thresholds met
3. Existing 280+ tests continue passing (no regressions)
4. `node -e "const p = require('./dist/infrastructure/plugin/index'); console.log(typeof p)"` → `function`
5. `node dist/infrastructure/cli/main.js --version` → `0.5.0-m5`
6. Manual smoke test: configure plugin in a test project's tsconfig.json, open in VS Code with "TypeScript: Select TypeScript Version" → "Use Workspace Version", verify diagnostics appear
