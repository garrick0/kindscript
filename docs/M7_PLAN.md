# M7 Implementation Plan: Generator (Scaffolding)

## Context

M6 delivered the Inference Engine (`ksc infer`) with 359 tests, version 0.6.0-m6. M7 adds `ksc scaffold` — a code generator that reads Kind definitions from `architecture.ts`, computes a set of filesystem operations (Plan), then optionally applies them (Apply). This completes the adoption loop: `ksc infer` goes Code → Spec, `ksc scaffold` goes Spec → Code.

Implements V4 Part 4.5 (Generator — Spec to Code) and BUILD_PLAN Milestone 7.

**Design precedent:** Nx generators and Angular schematics both use the Plan + Apply pattern. Compute operations first, then execute. This enables preview, dry-run, and IDE integration.

---

## Design Decisions

### Non-interactive CLI (deviation from BUILD_PLAN)

The BUILD_PLAN shows interactive prompting (instance selection, confirmation dialog). The existing CLI is fully synchronous and non-interactive — `InferCommand`, `InitCommand`, and `CheckCommand` all return `number` (exit code) and use `--write` for side effects. M7 follows this proven pattern:

- **Default:** dry-run (shows scaffold plan, does not execute)
- **`--write`:** executes the scaffold plan
- **`--instance <name>`:** selects which instance to scaffold (if multiple exist)
- If multiple instances exist and no `--instance` flag provided, print available instances and exit with instructions

This avoids introducing async/readline complexity and keeps the CLI testable with `spawnSync`.

### Skip-on-conflict (not overwrite)

When `--write` encounters an existing directory or file:
- **Existing directory:** skip silently (already scaffolded)
- **Existing file:** skip with warning (preserves user work)

This is safer than overwriting and matches the conservative approach used by `ksc infer --write` for kindscript.json.

### Location resolution

Instance `declaredLocation` values in `architecture.ts` are relative paths (e.g., `"src/domain"`). The scaffold service resolves these against `projectRoot` to create absolute filesystem paths for operations.

---

## Step 1: Domain value objects — Operation, ScaffoldPlan, ScaffoldResult

### `src/domain/value-objects/scaffold-operation.ts`

```typescript
export enum OperationType {
  CreateDirectory = 'createDirectory',
  CreateFile = 'createFile',
}

export class ScaffoldOperation {
  private constructor(
    public readonly type: OperationType,
    public readonly path: string,
    public readonly content?: string,
  ) {}

  static createDirectory(path: string): ScaffoldOperation {
    return new ScaffoldOperation(OperationType.CreateDirectory, path);
  }

  static createFile(path: string, content: string): ScaffoldOperation {
    return new ScaffoldOperation(OperationType.CreateFile, path, content);
  }

  toString(): string {
    return `${this.type}: ${this.path}`;
  }

  equals(other: ScaffoldOperation): boolean {
    return this.type === other.type
      && this.path === other.path
      && this.content === other.content;
  }
}
```

### `src/domain/value-objects/scaffold-plan.ts`

```typescript
export class ScaffoldPlan {
  constructor(
    public readonly operations: ScaffoldOperation[],
    public readonly instanceName: string,
    public readonly kindName: string,
  ) {}

  get directoryCount(): number {
    return this.operations.filter(o => o.type === OperationType.CreateDirectory).length;
  }

  get fileCount(): number {
    return this.operations.filter(o => o.type === OperationType.CreateFile).length;
  }

  toString(): string { ... }
  equals(other: ScaffoldPlan): boolean { ... }
}
```

### `src/domain/value-objects/scaffold-result.ts`

```typescript
export class OperationResult {
  private constructor(
    public readonly operation: ScaffoldOperation,
    public readonly success: boolean,
    public readonly skipped: boolean,
    public readonly error?: string,
  ) {}

  static success(op: ScaffoldOperation): OperationResult {
    return new OperationResult(op, true, false);
  }

  static skipped(op: ScaffoldOperation, reason: string): OperationResult {
    return new OperationResult(op, true, true, reason);
  }

  static failure(op: ScaffoldOperation, error: string): OperationResult {
    return new OperationResult(op, false, false, error);
  }
}

export class ScaffoldResult {
  constructor(
    public readonly results: OperationResult[],
  ) {}

  get successCount(): number { ... }
  get skippedCount(): number { ... }
  get failureCount(): number { ... }
  get allSucceeded(): boolean { ... }
}
```

---

## Step 2: ScaffoldService use case

**Directory:** `src/application/use-cases/scaffold/`

3 files following existing use-case pattern:

### `scaffold.use-case.ts`

```typescript
export interface ScaffoldUseCase {
  plan(request: ScaffoldRequest): ScaffoldPlanResponse;
  apply(plan: ScaffoldPlan): ScaffoldResult;
}
```

**Note:** Unlike other use cases which have a single `execute()`, ScaffoldUseCase exposes two methods matching the Plan + Apply pattern. This is the architectural decision from V4 4.5 — separation between planning (pure computation) and application (side effects).

### `scaffold.types.ts`

```typescript
export interface ScaffoldRequest {
  instanceSymbol: ArchSymbol;
  projectRoot: string;
}

export interface ScaffoldPlanResponse {
  plan: ScaffoldPlan;
  warnings: string[];
}
```

### `scaffold.service.ts`

**Constructor:** `(fsPort: FileSystemPort)`

**`plan(request)` flow:**

1. Validate instance symbol has members and declaredLocation
2. Create root directory operation: `ScaffoldOperation.createDirectory(resolved(instance.declaredLocation))`
3. For each member of the instance:
   - `ScaffoldOperation.createDirectory(resolved(member.declaredLocation))`
   - `ScaffoldOperation.createFile(resolved(member.declaredLocation) + '/index.ts', stubContent)`
   - Recurse into sub-members (if any — for nested Kind hierarchies)
4. Return `ScaffoldPlan` with operations + instance/kind name
5. Warnings for members without `declaredLocation`

**`apply(plan)` flow:**

1. For each operation in plan:
   - `CreateDirectory`: check `directoryExists()`, if exists → skip, else → `createDirectory()`
   - `CreateFile`: check `fileExists()`, if exists → skip with warning, else → `writeFile()`
2. Collect `OperationResult` per operation
3. Return `ScaffoldResult`

**Stub content generation:**

```typescript
private generateStubContent(memberName: string): string {
  return `// ${memberName} layer\n// Generated by KindScript\n\nexport {};\n`;
}
```

**Path resolution:**

```typescript
private resolvePath(relativePath: string, projectRoot: string): string {
  return this.fsPort.resolvePath(projectRoot, relativePath);
}
```

The service does NOT depend on ClassifyAST or TypeScript — it receives pre-classified `ArchSymbol` objects. The CLI command is responsible for running the classifier.

---

## Step 3: ScaffoldCommand

**`src/infrastructure/cli/commands/scaffold.command.ts`**

Follows existing command pattern — synchronous, returns exit code.

**Constructor:**
```typescript
constructor(
  private readonly scaffoldService: ScaffoldUseCase,
  private readonly classifyService: ClassifyASTUseCase,
  private readonly tsPort: TypeScriptPort,
  private readonly configPort: ConfigPort,
  private readonly fsPort: FileSystemPort,
)
```

**`execute(projectPath: string, options: { write: boolean; instance?: string }): number`**

**Execution flow:**

1. Resolve project path
2. Read `kindscript.json` via `configPort.readKindScriptConfig()`
3. If no config or no `definitions` key → exit 1 with error ("No kindscript.json found" or "No definitions found. Run `ksc infer --write` first.")
4. Resolve definition file paths relative to project root
5. Create TS program via `tsPort.createProgram()` with definition files
6. Get type checker, get source files for definitions
7. Classify via `classifyService.execute()` to extract symbols
8. Filter instances: `symbols.filter(s => s.kind === ArchSymbolKind.Instance)`
9. If no instances → exit 1 ("No instances found in definition files")
10. Select instance:
    - If `--instance <name>` provided, find matching instance by name
    - If only 1 instance exists, auto-select it
    - If multiple instances and no `--instance` flag, print available instances and exit 1
11. Generate plan via `scaffoldService.plan({ instanceSymbol: selected, projectRoot })`
12. Print plan summary to stdout:
    ```
    Scaffold plan for 'app' (CleanArchitectureContext):

      createDirectory: src
      createDirectory: src/domain
      createFile:      src/domain/index.ts
      createDirectory: src/application
      createFile:      src/application/index.ts
      createDirectory: src/infrastructure
      createFile:      src/infrastructure/index.ts

    3 directories, 3 files
    ```
13. Print warnings to stderr
14. If `--write`:
    - Apply plan via `scaffoldService.apply(plan)`
    - Print results:
      ```
      Scaffold complete:
        created  src
        created  src/domain
        created  src/domain/index.ts
        skipped  src/application (already exists)
        ...

      Next steps:
        - Implement your domain logic in src/domain/
        - Run 'ksc check' to verify contracts
      ```
    - Return 0 if all succeeded, 1 if any failures
15. Else:
    - Print "Dry run complete. Use --write to execute scaffold."
    - Return 0

---

## Step 4: CLI wiring

**`src/infrastructure/cli/main.ts`** — Modifications:

1. Add import for `ScaffoldCommand` and `ScaffoldService`

2. Add `scaffold` command dispatch after `infer` block:
   ```typescript
   if (command === 'scaffold') {
     const restArgs = args.slice(1);
     const write = restArgs.includes('--write');
     const instanceIdx = restArgs.indexOf('--instance');
     const instance = instanceIdx >= 0 ? restArgs[instanceIdx + 1] : undefined;
     const projectPath = restArgs.find(a => !a.startsWith('--') && (instanceIdx < 0 || a !== restArgs[instanceIdx + 1])) || process.cwd();
     const exitCode = runScaffold(projectPath, { write, instance });
     process.exit(exitCode);
   }
   ```

3. Add `runScaffold()` composition root function:
   ```typescript
   function runScaffold(projectPath: string, options: { write: boolean; instance?: string }): number {
     const tsAdapter = new TypeScriptAdapter();
     const fsAdapter = new FileSystemAdapter();
     const configAdapter = new ConfigAdapter();
     const astAdapter = new ASTAdapter();

     const classifyService = new ClassifyASTService(astAdapter);
     const scaffoldService = new ScaffoldService(fsAdapter);

     const scaffoldCommand = new ScaffoldCommand(
       scaffoldService, classifyService, tsAdapter, configAdapter, fsAdapter
     );
     return scaffoldCommand.execute(projectPath, options);
   }
   ```

4. Update `printUsage()` to include:
   ```
   scaffold [path] [--write] [--instance name]   Scaffold directories from Kind definitions
   ```

5. Update version string to `0.7.0-m7`

---

## Step 5: Unit tests — ScaffoldOperation, ScaffoldPlan, ScaffoldResult

**`tests/unit/scaffold-value-objects.test.ts`**

- `ScaffoldOperation.createDirectory()` sets correct type and path
- `ScaffoldOperation.createFile()` sets correct type, path, and content
- `ScaffoldOperation.toString()` returns readable format
- `ScaffoldOperation.equals()` — true for identical, false for different
- `ScaffoldPlan.directoryCount` and `fileCount` return correct counts
- `ScaffoldPlan.equals()` — true for identical plans
- `OperationResult.success()`, `.skipped()`, `.failure()` factory methods
- `ScaffoldResult.successCount`, `.skippedCount`, `.failureCount`, `.allSucceeded`

---

## Step 6: Unit tests — ScaffoldService

**`tests/unit/scaffold.service.test.ts`**

Using `MockFileSystemAdapter`:

### plan() tests:

1. **Plans correct operations for a 3-layer instance** — clean arch instance with domain/application/infrastructure → root dir + 3 layer dirs + 3 index.ts files = 7 operations total
2. **Plans correct operations for 2-layer instance** — hexagonal with domain/adapters → root + 2 dirs + 2 files = 5 operations
3. **Resolves relative paths against projectRoot** — `"src/domain"` with projectRoot `/project` → `/project/src/domain`
4. **Generates correct stub content** — each index.ts contains layer name comment and `export {}`
5. **Handles nested members (sub-layers)** — instance with `domain.entities` and `domain.ports` → creates subdirectories and their index.ts stubs
6. **Warns when member has no declaredLocation** — member without location → warning, no operation generated
7. **Returns empty plan for instance with no members** — instance with 0 members → 1 operation (root dir only) + warning
8. **Operation order: directories before files for same layer** — createDirectory for `src/domain` appears before createFile for `src/domain/index.ts`

### apply() tests:

9. **Creates directories and files when none exist** — all operations succeed
10. **Skips existing directories** — mockFS pre-populated with directory → skipped result
11. **Skips existing files** — mockFS pre-populated with file → skipped result with "already exists" reason
12. **Reports failure on write error** — (simulate by overriding writeFile to throw) → failure result with error message
13. **Mixed results: some created, some skipped** — partial pre-existing structure → correct counts in ScaffoldResult
14. **Files written with correct content** — verify mockFS contains stub content after apply

---

## Step 7: Integration test fixture

**`tests/integration/fixtures/scaffold-clean-arch/`**

A fixture representing a project with an `architecture.ts` and `kindscript.json` but NO source directories yet — the scaffold will create them.

```
scaffold-clean-arch/
  architecture.ts       → Kind definitions for Clean Architecture (3 layers)
  kindscript.json       → { "definitions": ["architecture.ts"] }
  tsconfig.json         → minimal config
```

**`architecture.ts` content:** (reuse the existing tier2-clean-arch pattern)

```typescript
interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {}
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
  },
  application: {
    kind: "ApplicationLayer",
    location: "src/application",
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    location: "src/infrastructure",
  },
};

export const contracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
  ],
});
```

**`tests/integration/fixtures/scaffold-multi-instance/`**

A fixture with multiple instances to test `--instance` selection.

```
scaffold-multi-instance/
  architecture.ts       → Two context kinds + two instances (ordering, billing)
  kindscript.json       → { "definitions": ["architecture.ts"] }
  tsconfig.json
```

---

## Step 8: Integration tests

**`tests/integration/scaffold.integration.test.ts`**

Using real adapters against fixture projects, copying to temp directories so scaffold can write:

1. **Plans correct operations from clean-arch fixture** — reads architecture.ts, classifies, plans → correct operations for 3 layers (root + 3 dirs + 3 files)
2. **Apply creates directories and files** — copies fixture to temp, runs plan + apply → verifies directories and index.ts files exist on disk with correct content
3. **Apply skips existing directories** — pre-creates a directory in temp → that operation is skipped, others succeed
4. **Plans correct operations for multi-instance fixture (specific instance)** — selects 'ordering' instance → operations only for ordering's layers
5. **Plans handle nested members** — fixture with sub-layers → operations include sub-directories

Each test:
- Copies fixture to `os.tmpdir()` temp directory
- Creates real `TypeScriptAdapter`, `FileSystemAdapter`, `ConfigAdapter`, `ASTAdapter`
- Creates `ClassifyASTService`, `ScaffoldService`
- Reads config, creates program, classifies, plans/applies
- Cleans up temp directory in `afterEach`

---

## Step 9: E2E tests

**`tests/e2e/cli-scaffold.e2e.test.ts`**

Subprocess tests following the existing pattern:

1. **`ksc scaffold` on clean-arch fixture exits 0 with plan output** — stdout contains "Scaffold plan", "createDirectory", "createFile", "src/domain", "src/application", "src/infrastructure", "Dry run"
2. **`ksc scaffold --write` creates directories and files** — copy fixture to temp, run with --write, verify exit 0, verify directories/files exist on disk
3. **`ksc scaffold` with no kindscript.json exits 1** — run on empty directory → exit 1, stderr contains error
4. **`ksc scaffold` with no definitions in config exits 1** — kindscript.json without "definitions" key → exit 1, stderr contains error about definitions
5. **`ksc scaffold --instance ordering` on multi-instance fixture** — selects correct instance, stdout contains "ordering" but not "billing"
6. **`ksc scaffold` on multi-instance fixture without --instance** — lists available instances and exits 1 with instructions
7. **`ksc --version` outputs 0.7.0-m7** — version check

---

## Step 10: Version bump and build

- `package.json`: `0.6.0-m6` → `0.7.0-m7`
- `src/infrastructure/cli/main.ts`: version string → `0.7.0-m7`
- `tests/e2e/cli-subprocess.e2e.test.ts`: version assertion → `0.7.0-m7`
- `tests/e2e/cli-init-detect.e2e.test.ts`: version assertion → `0.7.0-m7`
- `tests/e2e/cli-infer.e2e.test.ts`: version assertion → `0.7.0-m7`
- `npm run build` → clean compilation
- `npx jest --coverage` → all tests pass, thresholds met

---

## Implementation Order

1. Step 1 (ScaffoldOperation, ScaffoldPlan, ScaffoldResult value objects) — pure domain, no dependencies
2. Step 5 (Value object unit tests) — validate domain objects
3. Step 2 (ScaffoldService) — core Plan + Apply logic
4. Step 6 (ScaffoldService unit tests) — validate service with mocks
5. Step 3 (ScaffoldCommand) — CLI command
6. Step 4 (CLI wiring) — main.ts integration
7. Step 7 (Integration fixtures) — create test fixtures
8. Step 8 (Integration tests) — real adapter tests
9. Step 9 (E2E tests) — subprocess tests
10. Step 10 (Version bump, build, verify)

---

## Files Created (10 new files)

### Domain layer:
1. `src/domain/value-objects/scaffold-operation.ts`
2. `src/domain/value-objects/scaffold-plan.ts`
3. `src/domain/value-objects/scaffold-result.ts`

### Application layer:
4. `src/application/use-cases/scaffold/scaffold.use-case.ts`
5. `src/application/use-cases/scaffold/scaffold.types.ts`
6. `src/application/use-cases/scaffold/scaffold.service.ts`

### Infrastructure layer:
7. `src/infrastructure/cli/commands/scaffold.command.ts`

### Tests:
8. `tests/unit/scaffold-value-objects.test.ts`
9. `tests/unit/scaffold.service.test.ts`
10. `tests/integration/scaffold.integration.test.ts`
11. `tests/e2e/cli-scaffold.e2e.test.ts`

### Test fixtures:
12. `tests/integration/fixtures/scaffold-clean-arch/architecture.ts`
13. `tests/integration/fixtures/scaffold-clean-arch/kindscript.json`
14. `tests/integration/fixtures/scaffold-clean-arch/tsconfig.json`
15. `tests/integration/fixtures/scaffold-multi-instance/architecture.ts`
16. `tests/integration/fixtures/scaffold-multi-instance/kindscript.json`
17. `tests/integration/fixtures/scaffold-multi-instance/tsconfig.json`

## Files Modified (5 existing)

18. `src/infrastructure/cli/main.ts` — add `scaffold` command, `runScaffold()`, update version + usage
19. `package.json` — version bump to `0.7.0-m7`
20. `tests/e2e/cli-subprocess.e2e.test.ts` — version assertion update
21. `tests/e2e/cli-init-detect.e2e.test.ts` — version assertion update
22. `tests/e2e/cli-infer.e2e.test.ts` — version assertion update

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Plan + Apply pattern** | V4 4.5 design. Enables dry-run, preview, and IDE integration. Validated by Nx/Angular. |
| **Non-interactive CLI** | Matches existing `--write` pattern. Keeps CLI synchronous, testable with `spawnSync`. |
| **`--instance <name>` flag** | Replaces interactive instance selection. Auto-selects when only 1 instance exists. |
| **Skip-on-conflict** | Never overwrites existing files. Safer than force-overwrite. Matches conservative approach. |
| **ScaffoldService takes ArchSymbol** | Decoupled from ClassifyAST/TypeScript. Service is pure Plan+Apply; CLI does classification. |
| **3 value objects (Operation, Plan, Result)** | Clean separation. Plan is immutable, Result tracks per-operation outcomes. |
| **Stub content: comment + `export {}`** | Minimal viable file. Valid TypeScript. User fills in real exports. |
| **Relative paths in plan display, absolute in execution** | User sees `src/domain`, filesystem gets `/absolute/path/src/domain`. |

---

## Verification

1. `npx tsc --noEmit` — clean compilation
2. `npx jest --coverage` — all tests pass, coverage thresholds met
3. Existing 359+ tests continue passing (no regressions)
4. `node dist/infrastructure/cli/main.js scaffold tests/integration/fixtures/scaffold-clean-arch` → exit 0, stdout shows scaffold plan with 3 layers
5. `node dist/infrastructure/cli/main.js scaffold --write <temp-copy>` → creates directories and index.ts files
6. `node dist/infrastructure/cli/main.js --version` → `0.7.0-m7`
7. Round-trip: `ksc infer --write` → `ksc scaffold --write` → `ksc check` → validates contracts on scaffolded structure
