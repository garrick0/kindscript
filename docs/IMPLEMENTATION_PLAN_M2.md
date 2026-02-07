# Milestone 2: Implementation Plan

**Goal:** Real Classifier — Parse Kind Definitions from TypeScript AST
**Duration:** 3 weeks
**Prerequisite:** M1 complete (119 tests passing, CLI working end-to-end with config-based symbols)

---

## Overview

M2 replaces the config-based `ConfigSymbolBuilder` (M1's temporary bridge) with a real AST classifier that parses Kind definitions written in TypeScript. After M2, users define their architecture in `.ts` files with full IDE support instead of `kindscript.json` contracts.

After M2, a user can:
```typescript
// architecture.ts
import { Kind, defineContracts } from 'kindscript';

export interface OrderingContext extends Kind<"OrderingContext"> {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {
  entities: string;
  services: string;
}

export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {
  database: string;
}

export const ordering: OrderingContext = {
  kind: "OrderingContext",
  location: "src/ordering",
  domain: {
    kind: "DomainLayer",
    location: "src/ordering/domain",
    entities: "entities",
    services: "services",
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    location: "src/ordering/infrastructure",
    database: "database",
  }
};

export const contracts = defineContracts<OrderingContext>({
  noDependency: [
    ["domain", "infrastructure"]
  ]
});
```

```bash
$ cat kindscript.json
{
  "definitions": ["architecture.ts"]
}

$ npx ksc check
All architectural contracts satisfied. (1 contracts, 5 files)
```

The M1 config-based contract format (`contracts` key in `kindscript.json`) continues to work — M2 adds Tier 2 on top of Tier 1, it does not remove it.

---

## Architecture Decisions

### 1. Runtime Type Exports (`Kind<N>` and `defineContracts`)

Users need to `import { Kind, defineContracts } from 'kindscript'` in their architecture files. These are lightweight runtime/type constructs:

- **`Kind<N>`** — An interface with a `kind: N` discriminant and `location: string` property. The classifier looks for types extending this interface. Members are string properties (leaf locations relative to parent) or nested Kind instances.

- **`defineContracts<T>(config)`** — A no-op identity function at runtime that serves as a marker for the classifier. Its type signature provides autocomplete for contract definitions scoped to `T`'s members.

These live in `src/index.ts` (the package entry point) so users can import them from `'kindscript'`.

### 2. Classifier Lives in Application Layer, AST Walking in Infrastructure

The `ClassifyASTService` (application layer) orchestrates classification using the `TypeScriptPort`. However, the current `TypeScriptPort` doesn't expose AST node traversal methods needed for classification (node type checks, property extraction, etc.).

**Approach:** Add a new `ASTPort` interface in the application layer specifically for AST walking operations. This keeps the `TypeScriptPort` focused on program/import concerns and avoids bloating it. The `TypeScriptAdapter` (or a new `ASTAdapter`) implements `ASTPort` using the real TypeScript API.

The alternative — putting raw `ts.*` calls in a monolithic adapter method — would make the classifier untestable with mocks. By defining the AST operations as a port, we can test `ClassifyASTService` with a `MockASTAdapter` the same way we test `CheckContractsService` with mock adapters.

### 3. Two-Phase Pipeline: Classify then Resolve

Following V4 Part 4.1/4.2, classification and file resolution are separate phases:

1. **Classify** (`ClassifyASTService`): Walk AST → produce `ArchSymbol[]` and `Contract[]`. Does NOT query the filesystem. Does NOT validate locations. Pure syntactic classification.

2. **Resolve** (`ResolveFilesService`): Take symbols with `declaredLocation` → resolve to actual files. Uses `FileSystemPort`. Handles child symbol exclusion.

The checker (from M1) then uses resolved files to evaluate contracts. This separation means the classifier stays pure and fast.

### 4. Backward Compatibility with Tier 1 Config

When `kindscript.json` has a `definitions` array, M2 uses the classifier pipeline. When it only has `contracts`, M1's `ConfigSymbolBuilder` still handles it. Both can coexist — the `CheckCommand` tries Tier 2 first, falls back to Tier 1.

### 5. No ts-morph

Per V4 Part 4.1: the classifier is ~100-150 lines of AST walking. Raw TypeScript compiler API with helper functions keeps it lightweight and fast. ts-morph's ~500KB dependency is not justified.

---

## Implementation Steps

### Step 1: Create Runtime Type Exports (`Kind<N>`, `defineContracts`)

**Files:**
- `src/runtime/kind.ts` (new)
- `src/runtime/define-contracts.ts` (new)
- `src/index.ts` (new — package entry point)

Create the types that users import in their `architecture.ts` files:

```typescript
// src/runtime/kind.ts
export interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

// src/runtime/define-contracts.ts
export interface ContractConfig {
  noDependency?: [string, string][];
  // Future: mustImplement, purity, noCycles, colocated
}

export function defineContracts<T>(config: ContractConfig): ContractConfig {
  return config; // Identity function — just a marker for the classifier
}

// src/index.ts
export { Kind } from './runtime/kind';
export { defineContracts, ContractConfig } from './runtime/define-contracts';
```

The `Kind<N>` interface uses a string literal type parameter so that `kind: "OrderingContext"` is type-checked. Member properties are either `string` (leaf location relative to parent) or nested `Kind` subtypes.

**Key design:** `defineContracts` is a no-op at runtime. Its purpose is to be a syntactic marker the classifier can find in the AST, and to provide TypeScript type checking for the contract config object.

### Step 2: Add ASTPort Interface

**File:** `src/application/ports/ast.port.ts` (new)

Define the port for AST walking operations needed by the classifier:

```typescript
export interface ASTNode {
  kind: number;       // Opaque node kind
  pos: number;
  end: number;
}

export interface ASTPort {
  /** Walk all top-level statements in a source file */
  getStatements(sourceFile: SourceFile): ASTNode[];

  /** Check if a node is an interface declaration */
  isInterfaceDeclaration(node: ASTNode): boolean;

  /** Check if a node is a variable statement */
  isVariableStatement(node: ASTNode): boolean;

  /** Check if a node is a call expression */
  isCallExpression(node: ASTNode): boolean;

  /** Get the name of a declaration node */
  getDeclarationName(node: ASTNode): string | undefined;

  /** Get heritage clauses (extends/implements) of an interface */
  getHeritageTypes(node: ASTNode, checker: TypeChecker): string[];

  /** Get type arguments from a heritage clause (e.g., Kind<"Foo"> → ["Foo"]) */
  getHeritageTypeArguments(node: ASTNode, checker: TypeChecker): string[];

  /** Get properties of an interface or type literal */
  getPropertySignatures(node: ASTNode): Array<{ name: string; typeName?: string }>;

  /** Get variable declarations from a variable statement */
  getVariableDeclarations(node: ASTNode): ASTNode[];

  /** Get the type name of a variable declaration */
  getVariableTypeName(node: ASTNode, checker: TypeChecker): string | undefined;

  /** Get the initializer of a variable declaration */
  getInitializer(node: ASTNode): ASTNode | undefined;

  /** Check if a node is an object literal expression */
  isObjectLiteral(node: ASTNode): boolean;

  /** Get properties from an object literal */
  getObjectProperties(node: ASTNode): Array<{ name: string; value: ASTNode }>;

  /** Get the string value of a node (for string literals) */
  getStringValue(node: ASTNode): string | undefined;

  /** Get the called function name from a call expression */
  getCallExpressionName(node: ASTNode): string | undefined;

  /** Get type arguments from a call expression (e.g., defineContracts<Foo> → ["Foo"]) */
  getCallTypeArguments(node: ASTNode, checker: TypeChecker): string[];

  /** Get the first argument of a call expression */
  getCallArguments(node: ASTNode): ASTNode[];

  /** Get array elements from an array literal */
  getArrayElements(node: ASTNode): ASTNode[];
}
```

This interface is intentionally granular — each method maps to a specific TypeScript AST operation. The classifier composes them to implement the three responsibilities from V4 Part 4.1.

### Step 3: Implement ASTAdapter

**File:** `src/infrastructure/adapters/ast/ast.adapter.ts` (new)

Implements `ASTPort` using the real TypeScript compiler API. Each method is a thin wrapper over `ts.is*()` checks and property access:

```typescript
export class ASTAdapter implements ASTPort {
  isInterfaceDeclaration(node: ASTNode): boolean {
    return ts.isInterfaceDeclaration(node as unknown as ts.Node);
  }

  getHeritageTypes(node: ASTNode, checker: TypeChecker): string[] {
    const tsNode = node as unknown as ts.InterfaceDeclaration;
    if (!tsNode.heritageClauses) return [];
    // ... extract base type names
  }

  // ... etc
}
```

The adapter casts between `ASTNode` (domain-safe opaque type) and `ts.Node` (infrastructure). This is the same pattern used for `Program.handle` in M1.

### Step 4: Create MockASTAdapter

**File:** `src/infrastructure/adapters/testing/mock-ast.adapter.ts` (new)

Mock implementation of `ASTPort` for testing `ClassifyASTService` without the real TypeScript compiler:

```typescript
export class MockASTAdapter implements ASTPort {
  private interfaces: Array<{ name: string; heritage: string[]; ... }> = [];
  private variables: Array<{ name: string; typeName: string; ... }> = [];
  private calls: Array<{ name: string; typeArgs: string[]; ... }> = [];

  // Fluent configuration API
  withInterface(name: string, extendsKind: string): this { ... }
  withVariable(name: string, typeName: string, initializer: object): this { ... }
  withDefineContractsCall(kindName: string, config: object): this { ... }

  // Implement ASTPort interface
  getStatements(sourceFile: SourceFile): ASTNode[] { ... }
  isInterfaceDeclaration(node: ASTNode): boolean { ... }
  // ... etc
}
```

### Step 5: Implement ClassifyASTService

**File:** `src/application/use-cases/classify-ast/classify-ast.service.ts` (new)

Implements `ClassifyASTUseCase`. This is the core M2 logic — the "KindScript Binder" from V4 Part 4.1.

```typescript
export class ClassifyASTService implements ClassifyASTUseCase {
  constructor(
    private readonly tsPort: TypeScriptPort,
    private readonly astPort: ASTPort
  ) {}

  execute(request: ClassifyASTRequest): ClassifyASTResponse {
    const symbols: ArchSymbol[] = [];
    const contracts: Contract[] = [];
    const errors: string[] = [];
    const kindMap = new Map<string, ArchSymbol>();  // kindName → Kind symbol

    for (const sourceFile of request.definitionFiles) {
      // Phase 1: Find Kind definitions (interfaces extending Kind<N>)
      this.findKindDefinitions(sourceFile, request.checker, kindMap, errors);

      // Phase 2: Find Instance declarations (variables typed as Kind types)
      this.findInstances(sourceFile, request.checker, kindMap, symbols, errors);

      // Phase 3: Find Contract descriptors (defineContracts<KindName>(...) calls)
      this.findContracts(sourceFile, request.checker, kindMap, contracts, errors);
    }

    // Also add kind definitions to symbol list
    symbols.push(...kindMap.values());

    return { symbols, contracts, errors };
  }
}
```

**Three responsibilities:**

1. **`findKindDefinitions`**: Walk statements for interface declarations. Check if any heritage clause extends `Kind<N>`. Extract the kind name from the type parameter (e.g., `Kind<"OrderingContext">` → `"OrderingContext"`). Extract member property signatures. Create `ArchSymbol` with `kind: ArchSymbolKind.Kind`, no `declaredLocation` (kinds are templates, instances have locations).

2. **`findInstances`**: Walk statements for variable declarations. Check if the variable's type is a known Kind type. Extract `location` and member locations from the object literal initializer. Create `ArchSymbol` with `kind: ArchSymbolKind.Instance` and `declaredLocation` from the `location` property. Build nested member symbols from the initializer.

3. **`findContracts`**: Walk statements for call expressions named `defineContracts`. Extract the type argument (e.g., `defineContracts<OrderingContext>` → `"OrderingContext"`). Parse the object literal argument. For each contract type key (e.g., `noDependency`), parse the array of pairs. Resolve member names to `ArchSymbol` references from the corresponding instance. Create `Contract` objects.

**Important:** The `ClassifyASTRequest` needs to be updated to include a `TypeChecker` since the classifier needs type information to resolve heritage clauses and variable types. Add `checker: TypeChecker` to the request DTO.

### Step 6: Implement ResolveFilesService

**File:** `src/application/use-cases/resolve-files/resolve-files.service.ts` (new)

Implements `ResolveFilesUseCase`. Resolves an `ArchSymbol` with a `declaredLocation` to actual files on disk.

```typescript
export class ResolveFilesService implements ResolveFilesUseCase {
  constructor(
    private readonly fsPort: FileSystemPort
  ) {}

  execute(request: ResolveFilesRequest): ResolveFilesResponse {
    const { symbol, projectRoot } = request;
    const errors: string[] = [];

    if (!symbol.declaredLocation) {
      return {
        resolved: new ResolvedFiles(symbol, []),
        errors: ['Symbol has no declared location'],
      };
    }

    // Resolve location relative to project root
    const absoluteLocation = this.resolvePath(symbol.declaredLocation, projectRoot);

    if (!this.fsPort.directoryExists(absoluteLocation)) {
      return {
        resolved: new ResolvedFiles(symbol, []),
        errors: [`Directory not found: ${absoluteLocation}`],
      };
    }

    // Get all .ts files recursively
    const allFiles = this.fsPort.readDirectory(absoluteLocation, true);

    // Subtract files claimed by child symbols
    const childFiles = this.collectChildFiles(symbol, projectRoot);
    const ownFiles = allFiles.filter(f => !childFiles.has(f));

    return {
      resolved: new ResolvedFiles(symbol, ownFiles),
      errors,
    };
  }

  private collectChildFiles(symbol: ArchSymbol, projectRoot: string): Set<string> {
    const childFiles = new Set<string>();

    for (const child of symbol.members.values()) {
      if (!child.declaredLocation) continue;

      const childLocation = this.resolvePath(child.declaredLocation, projectRoot);
      if (this.fsPort.directoryExists(childLocation)) {
        for (const file of this.fsPort.readDirectory(childLocation, true)) {
          childFiles.add(file);
        }
      }

      // Recurse into grandchildren
      const grandchildFiles = this.collectChildFiles(child, projectRoot);
      for (const f of grandchildFiles) {
        childFiles.add(f);
      }
    }

    return childFiles;
  }

  private resolvePath(location: string, projectRoot: string): string {
    if (location.startsWith('/')) return location;
    return this.fsPort.resolvePath(projectRoot, location);
  }
}
```

### Step 7: Update ClassifyAST Request/Response Types

**File:** `src/application/use-cases/classify-ast/classify-ast.types.ts` (modify)

Add `checker` to the request and the `definitionFile` source for `location` in the response:

```typescript
export interface ClassifyASTRequest {
  definitionFiles: SourceFile[];
  checker: TypeChecker;     // NEW: needed for type resolution
  projectRoot: string;      // NEW: for resolving relative paths
}
```

The response stays the same — it already returns `symbols`, `contracts`, and `errors`.

### Step 8: Update CheckCommand for Tier 2 Pipeline

**File:** `src/infrastructure/cli/commands/check.command.ts` (modify)

Add the Tier 2 pipeline while keeping Tier 1 backward compatibility:

```typescript
export class CheckCommand {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly configPort: ConfigPort,
    private readonly diagnosticPort: DiagnosticPort,
    private readonly fsPort: FileSystemPort,
    private readonly classifyService?: ClassifyASTUseCase,  // NEW: optional for M2
    private readonly tsPort?: TypeScriptPort,                // NEW: needed for classifier
    private readonly astPort?: ASTPort,                      // NEW: needed for classifier
  ) {}

  execute(projectPath: string): number {
    // ... read config (same as M1) ...

    if (ksConfig.definitions && ksConfig.definitions.length > 0) {
      return this.executeTier2(ksConfig, resolvedPath, compilerOptions, rootFiles);
    }

    return this.executeTier1(ksConfig, resolvedPath, compilerOptions, rootFiles);
  }

  private executeTier1(/* ... */): number {
    // Existing M1 ConfigSymbolBuilder logic (unchanged)
  }

  private executeTier2(/* ... */): number {
    // 1. Create TS program from root files + definition files
    // 2. Get source files for each definition path
    // 3. Run ClassifyASTService to get symbols and contracts
    // 4. Execute CheckContractsService
    // 5. Report diagnostics
  }
}
```

### Step 9: Update Composition Root

**File:** `src/infrastructure/cli/main.ts` (modify)

Wire up the new services:

```typescript
function runCheck(projectPath: string): number {
  const tsAdapter = new TypeScriptAdapter();
  const fsAdapter = new FileSystemAdapter();
  const configAdapter = new ConfigAdapter();
  const diagnosticAdapter = new CLIDiagnosticAdapter();
  const astAdapter = new ASTAdapter();

  const checkContractsService = new CheckContractsService(tsAdapter, fsAdapter);
  const classifyService = new ClassifyASTService(tsAdapter, astAdapter);

  const checkCommand = new CheckCommand(
    checkContractsService,
    configAdapter,
    diagnosticAdapter,
    fsAdapter,
    classifyService,   // NEW
    tsAdapter,          // NEW
    astAdapter,         // NEW
  );

  return checkCommand.execute(projectPath);
}
```

### Step 10: Unit Tests — ClassifyASTService

**File:** `tests/unit/classify-ast.service.test.ts` (new)

Test the classifier in isolation using `MockASTAdapter` and `MockTypeScriptAdapter`:

```typescript
describe('ClassifyASTService', () => {
  // Kind definition parsing
  it('finds interface extending Kind<N>');
  it('extracts kind name from type parameter');
  it('extracts member properties from interface');
  it('creates ArchSymbol with Kind symbolKind');
  it('ignores interfaces not extending Kind');
  it('handles interface with no members');

  // Instance parsing
  it('finds variable declaration typed as Kind type');
  it('extracts location from object literal initializer');
  it('extracts member locations from nested object literals');
  it('creates ArchSymbol with Instance symbolKind');
  it('builds nested member symbol hierarchy');
  it('ignores variables not typed as Kind types');

  // Contract parsing
  it('finds defineContracts call expressions');
  it('extracts type argument from defineContracts<T>');
  it('parses noDependency contract pairs');
  it('resolves member names to ArchSymbol references');
  it('creates Contract objects with correct type');
  it('reports error for unknown member references in contracts');
  it('reports error for defineContracts with no matching kind');

  // Integration within classify
  it('processes multiple definition files');
  it('links contracts to instance member symbols');
  it('handles empty definition files');
  it('reports errors for malformed definitions');
});
```

### Step 11: Unit Tests — ResolveFilesService

**File:** `tests/unit/resolve-files.service.test.ts` (new)

Test file resolution using `MockFileSystemAdapter`:

```typescript
describe('ResolveFilesService', () => {
  it('resolves directory to .ts files');
  it('resolves relative location against project root');
  it('returns empty for symbol with no location');
  it('returns error for nonexistent directory');
  it('excludes files in child symbol directories');
  it('handles nested child exclusion (grandchildren)');
  it('handles symbol with no children');
  it('handles absolute location paths');
});
```

### Step 12: Unit Tests — ASTAdapter

**File:** `tests/unit/ast.adapter.test.ts` (new)

Test the real `ASTAdapter` against small TypeScript snippets parsed by the real TypeScript compiler:

```typescript
describe('ASTAdapter', () => {
  // Parse real TypeScript snippets with ts.createProgram
  // Then verify ASTAdapter correctly wraps ts.* operations
  it('identifies interface declarations');
  it('extracts heritage type names');
  it('extracts heritage type arguments');
  it('extracts property signatures');
  it('identifies variable statements');
  it('extracts variable type names');
  it('extracts object literal properties');
  it('identifies call expressions');
  it('extracts call expression name');
  it('extracts call type arguments');
  it('extracts array elements');
});
```

### Step 13: Integration Tests — Full Tier 2 Pipeline

**Files:**
- `tests/integration/tier2-classify.integration.test.ts` (new)
- `tests/integration/fixtures/tier2-clean-arch/` (new fixture project)

Create a real TypeScript fixture project with Kind definitions, instance declarations, and `defineContracts` calls. Run the full pipeline (classify → resolve → check) against it.

The fixture project structure:
```
tests/integration/fixtures/tier2-clean-arch/
  tsconfig.json
  kindscript.json                    # { "definitions": ["architecture.ts"] }
  architecture.ts                    # Kind defs + instance + contracts
  node_modules/kindscript/index.d.ts # Stubbed Kind<N> and defineContracts types
  src/
    domain/
      entity.ts                     # Clean — no infra imports
      service.ts                    # Clean
    infrastructure/
      database.ts                   # Imports from domain (allowed)
```

And a violation fixture:
```
tests/integration/fixtures/tier2-violation/
  # Same structure but domain/service.ts imports from infrastructure
```

### Step 14: E2E Tests — CLI with Tier 2 Definitions

**File:** `tests/e2e/cli-tier2.e2e.test.ts` (new)

Run the CLI as a subprocess against the Tier 2 fixture projects:

```typescript
describe('CLI Tier 2 E2E', () => {
  it('exits 0 when kind-defined contracts are satisfied');
  it('exits 1 when kind-defined contracts are violated');
  it('falls back to Tier 1 when no definitions key in config');
  it('reports classification errors for malformed definitions');
});
```

### Step 15: Verify Tier 1 Backward Compatibility

Run the full existing M1 test suite to ensure no regressions. The existing fixtures (which use `contracts` in `kindscript.json`, not `definitions`) must continue to work.

### Step 16: Update Package Entry Point

**File:** `package.json` (modify)

Update the `main` and `types` fields to point to the new entry point that exports `Kind` and `defineContracts`:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

These are already set in `package.json` but currently `src/index.ts` doesn't exist. Creating it in Step 1 makes the package importable.

---

## File Structure After M2

```
src/
  index.ts                                  # NEW - package entry point (exports Kind, defineContracts)
  runtime/
    kind.ts                                 # NEW - Kind<N> interface
    define-contracts.ts                     # NEW - defineContracts() function
  domain/                                   # Unchanged from M1
  application/
    ports/
      ast.port.ts                           # NEW - ASTPort interface
      typescript.port.ts                    # Unchanged
      filesystem.port.ts                    # Unchanged
      config.port.ts                        # Unchanged
      diagnostic.port.ts                    # Unchanged
    use-cases/
      classify-ast/
        classify-ast.use-case.ts            # Unchanged (interface)
        classify-ast.types.ts               # MODIFIED (add checker, projectRoot to request)
        classify-ast.service.ts             # NEW - real implementation
      resolve-files/
        resolve-files.use-case.ts           # Unchanged (interface)
        resolve-files.types.ts              # Unchanged
        resolve-files.service.ts            # NEW - real implementation
      check-contracts/                      # Unchanged from M1
    services/
      config-symbol-builder.ts              # Unchanged (still used for Tier 1)
  infrastructure/
    adapters/
      testing/
        mock-typescript.adapter.ts          # Unchanged
        mock-filesystem.adapter.ts          # Unchanged
        mock-ast.adapter.ts                 # NEW - mock for ASTPort
      typescript/
        typescript.adapter.ts               # Unchanged
      ast/
        ast.adapter.ts                      # NEW - real ASTPort implementation
      filesystem/
        filesystem.adapter.ts               # Unchanged
      config/
        config.adapter.ts                   # Unchanged
      cli/
        cli-diagnostic.adapter.ts           # Unchanged
    cli/
      main.ts                               # MODIFIED - wire new services
      commands/
        check.command.ts                    # MODIFIED - Tier 2 pipeline

tests/
  architecture/                             # Unchanged from M0/M1
  unit/
    classify-ast.service.test.ts            # NEW
    resolve-files.service.test.ts           # NEW
    ast.adapter.test.ts                     # NEW
    check-contracts.service.test.ts         # Unchanged
    config-symbol-builder.test.ts           # Unchanged
    cli-diagnostic.adapter.test.ts          # Unchanged
  integration/
    noDependency.integration.test.ts        # Unchanged (Tier 1)
    tier2-classify.integration.test.ts      # NEW
    fixtures/
      clean-arch-valid/                     # Unchanged (Tier 1)
      clean-arch-violation/                 # Unchanged (Tier 1)
      tier2-clean-arch/                     # NEW (Tier 2 fixture)
      tier2-violation/                      # NEW (Tier 2 fixture)
  e2e/
    cli.e2e.test.ts                         # Unchanged (Tier 1)
    cli-subprocess.e2e.test.ts              # Unchanged (Tier 1)
    cli-tier2.e2e.test.ts                   # NEW (Tier 2)
```

---

## Dependency Graph

```
Step 1: Runtime types (Kind, defineContracts)     ← no dependencies
Step 2: ASTPort interface                         ← no dependencies
Step 3: ASTAdapter (real)                         ← depends on Step 2
Step 4: MockASTAdapter                            ← depends on Step 2
Step 5: ClassifyASTService                        ← depends on Steps 2, 7
Step 6: ResolveFilesService                       ← no dependencies (uses existing ports)
Step 7: Update ClassifyAST request types          ← no dependencies
Step 8: Update CheckCommand                       ← depends on Steps 5, 6
Step 9: Update composition root                   ← depends on Steps 3, 8
Step 10: ClassifyAST unit tests                   ← depends on Steps 4, 5
Step 11: ResolveFiles unit tests                  ← depends on Step 6
Step 12: ASTAdapter unit tests                    ← depends on Step 3
Step 13: Integration tests                        ← depends on Steps 1, 9
Step 14: E2E tests                                ← depends on Steps 1, 9 + build
Step 15: Tier 1 backward compat verification      ← depends on Step 8
Step 16: Package entry point                      ← depends on Step 1
```

**Parallelizable work:**
- Steps 1, 2, 6, 7 can all happen first (no interdependencies)
- Steps 3 and 4 can happen in parallel (both depend on Step 2)
- Steps 5 and 6 can happen in parallel
- Steps 10, 11, 12 can happen in parallel
- Steps 13 and 14 depend on everything being wired up

---

## Success Criteria

- [ ] `Kind<N>` and `defineContracts` types are importable from `'kindscript'`
- [ ] Classifier finds interfaces extending `Kind<N>` in definition files
- [ ] Classifier finds instance variable declarations typed as Kind types
- [ ] Classifier extracts `location` and member locations from instance initializers
- [ ] Classifier finds `defineContracts<KindName>(...)` calls and parses contract config
- [ ] Classifier creates proper `ArchSymbol` hierarchy with members
- [ ] Classifier creates `Contract` objects with resolved member references
- [ ] ResolveFilesService resolves symbol locations to files on disk
- [ ] ResolveFilesService excludes files claimed by child symbols
- [ ] Full pipeline works: classify → resolve → check → report
- [ ] Tier 1 (config-based) contracts still work (backward compatible)
- [ ] Full IDE support for definition files (autocomplete, go-to-def) — free from TypeScript
- [ ] All M1 tests still pass (no regressions)
- [ ] New unit tests for ClassifyASTService (15+ tests)
- [ ] New unit tests for ResolveFilesService (8+ tests)
- [ ] New unit tests for ASTAdapter (10+ tests)
- [ ] Integration tests with real TypeScript fixture projects
- [ ] E2E tests running CLI against Tier 2 fixtures
- [ ] Domain/application layers still have zero TypeScript API imports

---

## Limitations at M2

- Only `noDependency` contract type works (other types produce a warning, same as M1)
- No inference engine (can't auto-detect architecture)
- No code generator / scaffolding
- No language service plugin (IDE errors require running `ksc check`)
- Only directory-based symbol resolution (no glob patterns yet)
- No watch mode or incremental checking
- `defineContracts` type parameter doesn't yet constrain member names to `T`'s properties (this type-level refinement can be enhanced later without breaking changes)
