# Decisions

> Key architectural decisions and their rationale.

Each decision records the context, options considered, and outcome. Entries are ordered chronologically with the most recent first.

---

## Decision Index

| # | Decision | Date | Status |
|---|----------|------|--------|
| D32 | [DeclarationOwnership for TypeKind member attribution](#d32-declarationownership-for-typekind-member-attribution) | 2026-02-11 | Done |
| D31 | [Intrinsic constraint propagation pattern](#d31-intrinsic-constraint-propagation-pattern) | 2026-02-10 | Done |
| D30 | [Pure path utilities extracted to infrastructure](#d30-pure-path-utilities-extracted-to-infrastructure) | 2026-02-10 | Done |
| D29 | [A+Apps architecture — onion core with per-product apps](#d29-aapps-architecture--onion-core-with-per-product-apps) | 2026-02-08 | Done |
| D28 | [Container resolution as separate binder concern](#d28-container-resolution-as-separate-binder-concern) | 2026-02-11 | Done |
| D27 | [Scope plugin and KindConfig.scope for declared instance scope](#d27-scope-plugin-and-kindconfigscope-for-declared-instance-scope) | 2026-02-10 | Done |
| D26 | [ISP split — ports into sub-interfaces](#d26-isp-split--ports-into-sub-interfaces) | 2026-02-07 | Done |
| D25 | [ImportEdge moved from domain to application layer](#d25-importedge-moved-from-domain-to-application-layer) | 2026-02-10 | Done |
| D24 | [Instance\<T, Path\> — explicit location replaces convention-based derivation](#d24-instancet-path--explicit-location-replaces-convention-based-derivation) | 2026-02-10 | Done |
| D23 | [SourceRef value object replacing raw location fields](#d23-sourceref-value-object-replacing-raw-location-fields) | 2026-02-10 | Done |
| D22 | [Intra-file dependency checking for TypeKind members](#d22-intra-file-dependency-checking-for-typekind-members) | 2026-02-11 | Done |
| D21 | [Opt-in exhaustiveness via `exhaustive: true`](#d21-opt-in-exhaustiveness-via-exhaustive-true) | 2026-02-11 | Done |
| D20 | [Auto-generated implicit contracts for overlap detection](#d20-auto-generated-implicit-contracts-for-overlap-detection) | 2026-02-11 | Done |
| D19 | [Ownership tree for recursive instance containment](#d19-ownership-tree-for-recursive-instance-containment) | 2026-02-11 | Done |
| D18 | [Semantic error messages](#d18-semantic-error-messages) | 2026-02-10 | Done |
| D17 | [Remove mustImplement, exists, mirrors plugins](#d17-remove-mustimplement-exists-mirrors-plugins) | 2026-02-10 | Done |
| D16 | [Resolution moves from parser to binder](#d16-resolution-moves-from-parser-to-binder) | 2026-02-10 | Done |
| D15 | [Unified Kind type — TypeKind as sugar](#d15-unified-kind-type--typekind-as-sugar) | 2026-02-10 | Done |
| D14 | [File-scoped leaf instances](#d14-file-scoped-leaf-instances) | 2026-02-08 | Superseded by D24 |
| D13 | [Rename `ConstraintConfig` to `Constraints`, align docs terminology](#d13-rename-constraintconfig-to-constraints) | 2026-02-08 | Done |
| D12 | [Rename `InstanceConfig<T>` to `Instance<T>`](#d12-rename-instanceconfigt-to-instancet) | 2026-02-08 | Done |
| D11 | [Pipeline cleanup — separation of concerns](#d11-pipeline-cleanup--separation-of-concerns) | 2026-02-08 | Done |
| D10 | [Four-stage pipeline alignment](#d10-four-stage-pipeline-alignment) | 2026-02-08 | Done |
| D9 | [Drop `.k.ts`, piggyback on TypeScript type checker](#d9-drop-kts-piggyback-on-typescript-type-checker) | 2026-02-08 | Done |
| D8 | [Remove `ContractConfig<T>` (additive instance constraints)](#d8-remove-contractconfigt) | 2026-02-07 | Done |
| D7 | [Flatten `src/runtime/` → `src/types/index.ts`](#d7-flatten-srcruntime) | 2026-02-08 | Done |
| D6 | [Remove standard library packages](#d6-remove-standard-library-packages) | 2026-02-07 | Done |
| D5 | [Self-registering contract plugins](#d5-self-registering-contract-plugins) | 2026-02-07 | Done |
| D4 | [Use `satisfies` instead of `locate()` / `defineContracts()`](#d4-use-satisfies-instead-of-runtime-markers) | 2026-02-07 | Done |
| D3 | [Use `type` alias instead of `interface extends`](#d3-type-alias-instead-of-interface-extends) | 2026-02-07 | Done |
| D2 | [No ts-morph dependency](#d2-no-ts-morph) | 2026-02-07 | Done |
| D1 | [Language Service Plugin instead of custom LSP](#d1-language-service-plugin-instead-of-custom-lsp) | 2026-02-07 | Done |

---

## D32: DeclarationOwnership for TypeKind Member Attribution

**Date:** 2026-02-11
**Status:** Done

### Context

With TypeKind instances, multiple typed exports can coexist in the same source file, each belonging to different architectural units. For example, a file might contain both a `DeciderFn` (pure logic) and a `CommandHandler` (application layer), classified by their type annotations rather than their file location.

When the `noDependencyPlugin` detects cross-file imports between TypeKind members, it needs to handle the case where both members share the same file. In such cases, checking file-level imports is insufficient — the plugin needs declaration-level granularity to determine if a specific function/class in the file depends on another specific function/class that belongs to a different architectural unit.

### Decision

Introduce `declarationOwnership` as a new binder output — a nested map structure `Map<file, Map<declarationName, symbolId>>` that records which TypeKind member "owns" each top-level declaration within a file.

The binder populates this map during TypeKind resolution by:
1. Reading typed exports from each TypeKind member's resolved files
2. Extracting the declaration name (function/class/variable name)
3. Mapping `file → declarationName → symbolId` (the TypeKind member's ArchSymbol.id)

The checker passes `declarationOwnership` to contract plugins via `CheckerRequest`, alongside `containerFiles` and existing import graph data.

### Rationale

**Alternatives considered:**

1. **File-level checking only** — would fail to detect forbidden references between TypeKind members in the same file
2. **Compute ownership in checker** — violates separation of concerns; the binder is already the authority for name resolution
3. **Store ownership on ArchSymbol** — would couple domain entities to TypeScript-specific file analysis

**Why this approach:**

- **Binder is resolution authority** — consistent with D16 (resolution moves from parser to binder); the binder resolves all names, so it's natural for it to record declaration ownership
- **Enables declaration-level noDependency** — essential for D22 (intra-file dependency checking); without ownership data, the plugin cannot attribute declarations to members
- **Testable in isolation** — binder tests verify ownership maps are built correctly; checker tests can use mock ownership data
- **Clean separation** — binder does resolution (what belongs where), checker does analysis (what depends on what)

### Impact

- `BindResult` gains `declarationOwnership: Map<string, Map<string, string>>` field
- `BindService.resolveTypeKindMembers()` now calls `extractDeclarationOwnership()` for each resolved file
- `CheckerRequest` constructor takes `declarationOwnership` parameter
- `CheckerService` passes `declarationOwnership` through to plugin `check()` calls
- `noDependencyPlugin.check()` uses ownership map to filter intra-file edges (see D22)
- 3 new tests in `bind.service.test.ts` verify ownership extraction
- 343 tests passing, no behavioral changes to existing file-level checking

---

## D31: Intrinsic Constraint Propagation Pattern

**Date:** 2026-02-10
**Status:** Done

### Context

Kind hierarchies are common — a parent Kind has members that reference child Kinds. For example, a `CleanArchitecture` Kind might have a `domain` member that references a `DomainLayer` Kind. If `DomainLayer` declares `pure: true`, it's natural to expect that constraint to propagate automatically to the parent's `domain` member.

Without propagation, users must redeclare every child constraint on the parent:

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  app: AppLayer;
  infra: InfraLayer;
}, {
  noDependency: [['domain', 'app'], ['domain', 'infra'], ['app', 'infra']];
  pure: ['domain'];  // ❌ Must redeclare purity
}>;
```

This is error-prone (easy to forget) and violates DRY (the constraint is already declared on `DomainLayer`).

### Decision

Add an `intrinsic` extension point to `ConstraintProvider`:

```typescript
interface ConstraintProvider {
  readonly constraintName: string;
  generate?(args: TypeNodeView[], parent: ArchSymbol): GeneratorResult;
  intrinsic?: {
    detect(childConstraints: TypeNodeView): boolean;
    propagate(member: ArchSymbol, childKind: ArchSymbol): Contract;
  };
}
```

When a constraint declares `intrinsic`, the binder automatically generates contracts for parent members that reference child Kinds with that constraint:

1. For each member in a Kind instance
2. If the member references a child Kind (detected via `kindMemberReferences`)
3. Check if the child Kind has constraints
4. For each `intrinsicPlugin`, call `plugin.intrinsic.detect(childConstraints)`
5. If detected, call `plugin.intrinsic.propagate(member, childKind)` to generate the contract

Implemented by `purityPlugin` — when a member references a child Kind with `pure: true`, the binder generates a purity contract for that member without requiring explicit declaration.

### Rationale

**Alternatives considered:**

1. **Manual redeclaration only** — verbose, error-prone, violates DRY
2. **Automatic propagation for all constraints** — would break noDependency (siblings shouldn't inherit each other's dependency rules)
3. **Constraint-specific binder logic** — would violate Open-Closed Principle; adding a new intrinsic constraint requires modifying the binder

**Why this approach:**

- **Opt-in per constraint** — only purity uses intrinsic today; noDependency and noCycles don't, preserving their semantics
- **Plugin extension point** — follows D5 (self-registering plugins); adding intrinsic propagation for a new constraint doesn't modify the binder
- **Clear protocol** — `detect` (does this child have the constraint?) + `propagate` (generate the contract for the parent member)
- **Testable** — 5 tests in `purity.plugin.test.ts` verify intrinsic detection and propagation

**Why purity is intrinsic:**

Purity is a property that naturally propagates upward. If a child layer is pure, any parent member containing that layer must also be pure (you can't have impure code in a pure container). This is different from noDependency (which is about relationships between siblings, not parent-child) and noCycles (which is about the member set as a whole).

### Impact

- `ConstraintProvider` interface gains optional `intrinsic` field
- `BindService` gains `intrinsicPlugins` list (filtered from all plugins)
- `BindService.bind()` walks intrinsic plugins for each member with child Kind references
- `purityPlugin` implements `intrinsic.detect()` and `intrinsic.propagate()`
- Public API unchanged (propagation is automatic, invisible to users)
- 5 new tests verify intrinsic purity propagation
- 298 tests passing after implementation

---

## D30: Pure Path Utilities Extracted to Infrastructure

**Date:** 2026-02-10
**Status:** Done

### Context

Path operations like `isFileInSymbol`, `joinPath`, `dirnamePath`, and `resolvePath` were scattered across domain entities, adapters, and service classes. Some were in `domain/utils/path-matching.ts`, others inline in parser logic. They had no runtime dependencies (pure string manipulation), but they dealt with filesystem path semantics.

With the introduction of explicit `Instance<T, Path>` (D24), the parser needed more sophisticated path resolution — resolving relative paths like `'./ordering'` and `'./handlers.ts'` against the declaration file's directory.

### Decision

Extract all pure path operations into `infrastructure/path/path-utils.ts`. Implement them using only string manipulation (no Node.js `path` module). Expose 6 functions:

```typescript
export function isFileInSymbol(file: string, symbolRoot: string): boolean;
export function joinPath(base: string, relative: string): string;
export function dirnamePath(file: string): string;
export function resolvePath(from: string, to: string): string;
export function relativePath(from: string, to: string): string;
export function normalizePathSeparators(path: string): string;
```

Functions use forward slashes internally and normalize separators on input/output.

### Rationale

**Layer placement:**

Domain layer requires purity (zero dependencies, no external concepts). While these functions are pure (no Node.js dependencies), they encode filesystem path semantics — a platform/infrastructure concern. Placing them in infrastructure acknowledges that path manipulation is a technical detail, not a domain concept.

**No Node.js `path` module:**

Node's `path` module has platform-specific behavior (`path.sep`, `path.win32` vs `path.posix`). Using it would introduce platform variance in domain/application logic. Pure string manipulation with forward slash normalization ensures consistent behavior across platforms and makes the functions trivially testable without mocking Node.js modules.

**Alternative considered:**

Keep in domain layer as pure utilities. Rejected because path semantics are not architecture-agnostic — they're specific to how filesystems work, which is an infrastructure detail.

### Impact

- Created `infrastructure/path/path-utils.ts` with 6 exported functions
- Moved `isFileInSymbol` from `domain/utils/path-matching.ts`
- Removed inline path manipulation from `ParseService` and adapters
- Added 12 tests in `infrastructure/path-utils.test.ts`
- All services import from `infrastructure/path/path-utils`
- 298 tests passing after extraction

---

## D29: A+Apps Architecture — Onion Core with Per-Product Apps

**Date:** 2026-02-08
**Status:** Done

### Context

The codebase was initially organized as flat layers (`src/domain/`, `src/application/`, `src/infrastructure/`, `src/cli/`, `src/plugin/`). This structure had two issues:

1. **Ports at wrong level** — `src/application/ports/` contained all ports, including product-specific ones (`DiagnosticPort` for CLI, `LanguageServicePort` for Plugin). This violated dependency inversion — the application layer shouldn't know about products.

2. **No clear composition roots** — Each product (CLI and Plugin) scattered its adapters, ports, and use cases across multiple top-level directories. It was unclear where each product's dependency graph was wired together.

The four-stage pipeline (D10) organized the application layer's internal structure, but the top-level organization still mixed core services with product-specific concerns.

### Decision

Reorganize into "A+Apps+Pipeline":

```
src/
├── types/index.ts          # Public API
├── domain/                 # Pure domain entities
├── application/            # Core services (pipeline/)
├── infrastructure/         # Shared driven adapters (TypeScript, FileSystem, Config, AST)
└── apps/                   # Per-product composition roots
    ├── cli/                # CLI product
    │   ├── main.ts         # Entry point + DI composition
    │   ├── ports/          # ConsolePort, DiagnosticPort
    │   ├── adapters/       # CLIConsoleAdapter, CLIDiagnosticAdapter
    │   └── commands/       # CheckCommand
    └── plugin/             # Language service plugin product
        ├── index.ts        # Entry point + DI composition
        ├── ports/          # LanguageServicePort
        ├── adapters/       # LanguageServiceAdapter
        └── use-cases/      # GetPluginDiagnosticsService
```

**Key principles:**

1. **Onion core** — Domain → Application → Infrastructure form a layered core with shared services
2. **Apps depend inward only** — Each app depends on the core but not on other apps
3. **Per-product composition** — Each app has its own `main.ts`/`index.ts` that wires dependencies
4. **Minimal Engine interface** — Core exports `Engine = { pipeline, plugins }` via `createEngine()`
5. **Product-specific ports in apps** — `ConsolePort` belongs to CLI, `LanguageServicePort` belongs to Plugin

### Rationale

**Alternatives considered:**

1. **Hexagonal/Ports+Adapters** — all adapters at top level. Rejected: doesn't distinguish between shared infrastructure adapters (TypeScript, FileSystem) and product-specific adapters (CLI console, LSP proxy).

2. **Feature slices** — organize by feature (`check-contracts/`, `classify-ast/`). Rejected: KindScript's pipeline stages have clear dependencies; slicing would obscure the data flow.

3. **Monorepo with packages** — split CLI and Plugin into separate npm packages. Rejected: premature for a project with 2 products that share 95% of code.

**Why A+Apps:**

- **Clear ownership** — new CLI-specific code goes in `apps/cli/`, new plugin-specific code in `apps/plugin/`
- **Testable in isolation** — each app's ports can be mocked independently
- **Minimal coupling** — apps depend on `Engine` interface, not on concrete classes
- **Industry precedent** — matches NestJS modules, Nx app workspace, and Go's cmd/ convention

### Impact

- Moved `src/cli/` → `apps/cli/` (added ports/, adapters/, kept commands/)
- Moved `src/plugin/` → `apps/plugin/` (added ports/, kept use-cases/)
- Created `application/engine.ts` (Engine interface) and `infrastructure/engine-factory.ts`
- Removed product-specific ports from `application/ports/` (only 4 shared ports remain: ASTPort, TypeScriptPort, FileSystemPort, ConfigPort)
- Each app's entry point calls `createEngine()` then wires product-specific adapters
- Mock adapters moved from `infrastructure/` to `tests/helpers/mocks/`
- 29 test files reorganized to match new structure
- 277 tests passing after restructure

---

## D28: Container Resolution as Separate Binder Concern

**Date:** 2026-02-11
**Status:** Done

### Context

The binder resolves instance locations to files (`resolvedFiles: Map<symbolId, string[]>`) for dependency checking — these are the files "owned" by each member. The exhaustiveness plugin (D21) needs to detect unassigned files — files within an instance's scope that aren't assigned to any member.

Computing "all files in scope" is a resolution problem (filesystem enumeration + filtering), not a checking problem (graph analysis). However, putting it in the checker would duplicate resolution logic and violate D16 (resolution moves from parser to binder).

### Decision

Add `containerFiles` as a second resolution output in the binder, alongside `resolvedFiles`:

- **resolvedFiles** — maps each member to files it owns (used for dependency checking)
- **containerFiles** — maps each instance root to ALL files within its scope (used for exhaustiveness checking)

The binder computes `containerFiles` in a separate `resolveContainers()` pass after member resolution:

1. For each instance in the program
2. Resolve its location path to filesystem scope (directory or file)
3. Use `FileSystemPort.readDirectory()` to enumerate all files within that scope
4. Store as `containerFiles.set(instance.id, allFiles)`

The checker receives both maps via `CheckerRequest` and passes them to plugins. The exhaustiveness plugin computes unassigned files as `containerFiles[instance] - union(resolvedFiles[member] for all members)`.

### Rationale

**Alternatives considered:**

1. **Compute in exhaustiveness plugin** — checker calls `readDirectory()` directly. Rejected: violates D16; checker should operate on resolved data, not perform I/O.

2. **Merge into resolvedFiles** — add synthetic "container" keys. Rejected: conflates two different concepts (member ownership vs. total scope); would complicate other plugins.

3. **Derive from resolvedFiles at check time** — compute union of member files. Rejected: doesn't work if members use file-level instances (only 1 file per member, but container has many files).

**Why separate resolution:**

- **Binder owns resolution** — consistent with D16; the binder is the single authority for "which files are where"
- **Different semantics** — resolvedFiles is about member ownership (used by noDependency, purity, noCycles); containerFiles is about total scope (used only by exhaustiveness)
- **Clear separation** — checker receives pre-resolved data, focuses on analysis
- **Testable** — binder tests verify both resolution outputs; checker tests can mock both

### Impact

- `BindResult` gains `containerFiles: Map<string, string[]>` field
- `BindService.bind()` calls `resolveContainers()` after member resolution
- `CheckerRequest` constructor takes `containerFiles` parameter
- `CheckerService` passes `containerFiles` to plugin `check()` calls
- `exhaustivenessPlugin.check()` uses containerFiles to find unassigned files
- 2 new tests in `bind.service.test.ts` verify container resolution
- 343 tests passing, no changes to existing plugins

---

## D27: Scope Plugin and KindConfig.scope for Declared Instance Scope

**Date:** 2026-02-10
**Status:** Done

### Context

With `Instance<T, Path>` (D24), instance locations are explicitly declared. A path like `'./ordering'` could resolve to either:
- A directory: `src/ordering/`
- A file: `src/ordering.ts`

Both are valid instance locations, but some Kind authors want to enforce granularity. For example, a `Microservice` Kind should always be a directory (containing multiple files), never a single file. Conversely, a `ConfigFile` Kind should always be a file, never a directory.

Without declarative scope constraints, the only way to enforce this is runtime validation in application logic — checking resolved paths against filesystem queries. This scatters architectural rules across the codebase.

### Decision

Add `scope?: 'folder' | 'file'` to `KindConfig` and create a new `scopePlugin`:

```typescript
type KindConfig = {
  wraps?: unknown;
  scope?: 'folder' | 'file';
};

type Kind<N, M, C, _Config extends KindConfig = {}> = ...;
```

When a Kind declares a scope, the binder generates scope contracts for each instance. The checker validates that the instance's resolved location matches the expected granularity:

- `scope: 'folder'` — resolved location must be a directory
- `scope: 'file'` — resolved location must end in `.ts`/`.tsx`

This is the first constraint generated from Kind metadata (`KindConfig`) rather than from the `Constraints` type parameter.

### Rationale

**Why a new constraint category:**

Scope is fundamentally different from the three core constraints (noDependency, purity, noCycles):
- **Structural vs. behavioral** — scope validates location granularity, not code relationships
- **Single instance, not members** — checks the instance root, not relationships between members
- **Metadata-driven** — comes from Kind config, not from Constraints type parameter

**Why in KindConfig:**

Scope is a property of the Kind's structure, not a relationship constraint. It describes what a valid instance looks like, similar to how `wraps` describes the declaration type. Putting it in `KindConfig` makes this clear.

**Alternative considered:**

Add `scope` to `Constraints` type parameter. Rejected: would conflate structural validation with behavioral constraints, and scope doesn't take arguments like the other constraints do.

### Impact

- `KindConfig` type gains optional `scope` field
- `Kind` type's 4th parameter uses `KindConfig` (already true since D15)
- Created `scopePlugin` (ContractType.Scope, DiagnosticCode.ScopeMismatch KS70005)
- `BindService` generates scope contracts from Kind metadata (new code path)
- `ScanService` extracts scope from Kind definition's 4th type parameter
- Public API: `scope` field added to `Constraints` type (JSDoc: "Enforce that instances of this Kind are folders or files")
- 10 new tests in `scope.plugin.test.ts`
- 2 new integration fixtures (scope-folder-clean, scope-file-violation)
- 298 tests passing

---

## D26: ISP Split — Ports into Sub-Interfaces

**Date:** 2026-02-07
**Status:** Done

### Context

KindScript's port interfaces (`ASTPort`, `TypeScriptPort`) grew as features were added. By the time of the comprehensive architecture review (commit `635dde0`), they had become large interfaces with 8-10 methods each, and different services only used subsets:

- `ProgramFactory` only needed program creation (`createProgram`, `getSourceFiles`)
- `ScanService` only needed AST extraction methods
- `CheckerService` only needed import analysis (`getImports`, `getImportModuleSpecifiers`)

Services depending on the full interfaces violated the Interface Segregation Principle (ISP) — they depended on methods they never called. This made testing harder (mocks had to implement unused methods) and obscured actual dependencies.

### Decision

Split both large ports into focused sub-interfaces:

**ASTPort split (4 sub-interfaces):**

```typescript
interface KindDefinitionExtractor {
  extractKindDefinitions(sourceFile: SourceFile): ASTExtractionResult<KindDefinitionView[]>;
}

interface InstanceDeclarationExtractor {
  extractInstanceDeclarations(sourceFile: SourceFile): ASTExtractionResult<InstanceDeclarationView[]>;
}

interface TypedExportExtractor {
  extractTypedExports(sourceFile: SourceFile, typeNames: string[]): ASTExtractionResult<TypedExportView[]>;
}

interface DeclarationExtractor {
  extractDeclarations(sourceFile: SourceFile): ASTExtractionResult<DeclarationView[]>;
}

interface ASTViewPort extends
  KindDefinitionExtractor,
  InstanceDeclarationExtractor,
  TypedExportExtractor,
  DeclarationExtractor {}
```

**TypeScriptPort split (2 sub-interfaces):**

```typescript
interface CompilerPort {
  createProgram(options: CompilerOptions): Program;
  getSourceFile(program: Program, fileName: string): SourceFile | undefined;
  getSourceFiles(program: Program): readonly SourceFile[];
  getTypeChecker(program: Program): TypeChecker;
}

interface CodeAnalysisPort {
  getImports(sourceFile: SourceFile): ImportEdge[];
  getIntraFileReferences(sourceFile: SourceFile): IntraFileEdge[];
  getImportModuleSpecifiers(program: Program, file: string): string[];
}

interface TypeScriptPort extends CompilerPort, CodeAnalysisPort {}
```

Services depend on narrow interfaces:
- `ProgramFactory` → `CompilerPort`
- `ScanService` → `ASTViewPort` (specific extractors)
- `CheckerService` → `CodeAnalysisPort`

Full composite interfaces (`ASTViewPort`, `TypeScriptPort`) remain for backward compatibility and adapter implementation.

### Rationale

**Why split:**

- **ISP compliance** — clients depend only on methods they actually call
- **Clear contracts** — `ProgramFactory` signature signals "I only do program creation"
- **Simpler mocks** — test mocks implement 2-3 methods instead of 8-10
- **Extension points** — new services can depend on just the sub-interface they need

**Why preserve composites:**

- **Adapter simplicity** — `TypeScriptAdapter` implements one interface, not multiple fragments
- **Backward compatibility** — existing code using full interfaces doesn't break
- **Convenient imports** — `import { TypeScriptPort }` still works for code that needs everything

**Alternative considered:**

Create role-based ports like `ProgramProvider`, `ImportAnalyzer`. Rejected: would introduce new names and fragment the adapter implementations unnecessarily.

### Impact

- `ASTViewPort` split into 4 sub-interfaces, remains as composite
- `TypeScriptPort` split into `CompilerPort` + `CodeAnalysisPort`, remains as composite
- `ProgramFactory` constructor takes `CompilerPort` (was `TypeScriptPort`)
- `CheckerService` constructor takes `CodeAnalysisPort` (was `TypeScriptPort`)
- Test mocks implement narrow interfaces (smaller, more focused)
- All 263 tests passing after refactor

---

## D25: ImportEdge Moved from Domain to Application Layer

**Date:** 2026-02-10
**Status:** Done

### Context

`ImportEdge` was originally a domain value object in `src/domain/value-objects/import-edge.ts`. It represented a directed edge in the import graph between two source files. The domain layer contained `ImportEdge.fromFile`, `ImportEdge.toFile`, `ImportEdge.line`, and `ImportEdge.equals()`.

As KindScript evolved, the architectural layering principles became clearer:
- **Domain layer** — pure, technology-agnostic entities (ArchSymbol, Contract, Diagnostic)
- **Application layer** — use case orchestration and technology-specific models (pipeline, ports)
- **Infrastructure layer** — adapters to external systems (TypeScript compiler, filesystem)

Import edges are specific to how TypeScript's module system works. They are extracted by the TypeScript adapter parsing `import` declarations and `import()` expressions. They are not a universal architectural concept — other languages have different import semantics (e.g., Go's package imports, Python's module imports).

With the introduction of `IntraFileEdge` (D22) for declaration-level references, it became clear that both edge types are pipeline-internal data structures used by the checker, not domain concepts that apply universally.

### Decision

Move `ImportEdge` from `src/domain/value-objects/` to `src/application/pipeline/check/import-edge.ts`. When `IntraFileEdge` was created in the same commit, it was placed directly in `application/pipeline/check/` without ever being considered for the domain layer.

### Rationale

**Why not domain:**

- **Technology-specific** — import edges are TypeScript/JavaScript-specific. Other languages (Go, Rust, Python) have different module systems. Domain entities should be architecture-universal.
- **Pipeline-internal** — import edges are created by the TypeScript adapter and consumed by the checker. They never leave the application layer. Domain entities like `Contract` and `Diagnostic` are referenced across all layers.
- **Not a domain concept** — the domain is "architectural symbols and constraints." Import edges are an implementation detail of how we detect violations.

**Why application layer:**

- **Used by checker stage** — import edges are constructed by `TypeScriptAdapter.getImports()` and consumed by checker plugins (noDependency, noCycles). They are pipeline data.
- **Alongside IntraFileEdge** — intra-file edges were never considered for domain placement. Both edge types serve the same role (dependency detection) and belong together.
- **Matches TypeScript compiler** — TypeScript's own compiler doesn't treat imports as domain concepts; they're intermediate data in the binding phase.

**Alternative considered:**

Keep ImportEdge in domain but move it to `domain/pipeline-models/`. Rejected: would create a new category within domain for "kind of domain, kind of not" concepts, which violates layer purity.

### Impact

- `src/domain/value-objects/import-edge.ts` deleted
- `src/application/pipeline/check/import-edge.ts` created with identical implementation
- All import statements updated (`domain/value-objects/import-edge` → `application/pipeline/check/import-edge`)
- No logic changes, no test changes
- `IntraFileEdge` placed in same directory (`application/pipeline/check/intra-file-edge.ts`)
- 298 tests passing after move

---

## D24: Instance\<T, Path\> — Explicit Location Replaces Convention-Based Derivation

**Date:** 2026-02-10
**Status:** Done
**Supersedes:** D14

### Context

Previously, instance locations were derived from the declaring file's position and the Kind's structure:
- **Leaf Kinds** (no members) — instance location = declaring file itself (D14)
- **Composite Kinds** (with members) — instance location = parent directory of declaring file

This convention had problems:

1. **Implicit and surprising** — `satisfies Instance<MyKind>` in `src/foo/context.ts` meant "everything in src/foo/" (not obvious from reading the code)
2. **Limited expressiveness** — couldn't declare instances in sibling directories, parent directories, or arbitrary paths
3. **Heuristic brittleness** — the presence/absence of members determined location behavior (a structural detail affecting semantic meaning)
4. **Blocked multi-instance** — couldn't have multiple instances of the same Kind in different directories without moving definition files around

### Decision

Change `Instance<T>` to `Instance<T, Path>` where `Path` is a required string literal type parameter specifying the instance's location **relative to the declaring file's directory**.

**Path syntax:**

- **Current directory:** `'.'` — instance is the directory containing the declaring file
- **Relative folder:** `'./ordering'` — instance is a subdirectory
- **Relative file:** `'./helpers.ts'` — instance is a single file
- **Sub-file scope:** `'./handlers.ts#validate'` — instance is a specific declaration within a file (enables declaration-level architectural boundaries)

The parser resolves paths at bind time using `resolvePath(declaringFileDir, relativePath)`.

**Examples:**

```typescript
// src/context.ts
export const shopContext = {
  ordering: {} satisfies Instance<Microservice, './ordering'>,
  billing: {} satisfies Instance<Microservice, './billing'>,
} satisfies Instance<System, '.'>;

// src/ordering/ordering.ts
export const decider = () => {...} satisfies Instance<Decider, './ordering.ts#decider'>;
```

### Rationale

**Why explicit paths:**

- **Readability** — location is obvious from reading the code, no mental model of heuristics required
- **Flexibility** — supports sibling instances, parent-relative paths, explicit file/folder choice
- **Sub-file scope** — enables TypeKind-style boundaries within a single file (declaration-level)
- **Multi-instance** — same Kind can be instantiated multiple times with different paths from same definition file

**Why relative paths:**

- **Portability** — projects can be moved/renamed without breaking instance declarations
- **Locality** — paths are relative to the declaring file, which is visible in the same file
- **Natural fit** — matches how developers think about project structure ("the ordering directory")

**Alternative considered:**

Keep convention-based derivation, add explicit path override. Rejected: creates two ways to do the same thing, implicit rule still surprising for newcomers.

**Trade-offs:**

- **Verbosity** — `Instance<T, '.'>` is longer than `Instance<T>`. Accepted: explicitness over conciseness.
- **Type-level requirement** — Path must be a string literal type. Accepted: compile-time validation is a feature.

### Impact

- Public API: `Instance<T>` → `Instance<T, Path extends string>`
- `InstanceDeclarationView` gains `path: string` field (extracted by AST adapter)
- `ParseService` uses explicit path instead of deriving from members/file location
- D14's structural derivation rule (members → directory scope) no longer applies
- 22 integration fixtures updated to use explicit paths
- `'.'` is the most common path (replaces the old "parent directory" default)
- `'./subdir'` used for multi-instance scenarios
- `'./file.ts#name'` used for sub-file TypeKind instances
- 298 tests passing after migration

### Supersession of D14

D14 (file-scoped leaf instances) established that Kinds without members should default to file-level scope. With explicit paths, this heuristic is no longer needed — users write `Instance<T, './file.ts'>` when they want file scope. D14's research on directory vs. file scope remains valid (informed the path syntax design), but the decision's implementation is superseded by explicit paths.

---

## D23: SourceRef Value Object Replacing Raw Location Fields

**Date:** 2026-02-10
**Status:** Done

### Context

Entities like `Diagnostic`, `Contract`, and `ArchSymbol` tracked source locations using raw `file`, `line`, and `column` fields. This created problems:

1. **Structural duplication** — every entity repeated `file: string; line: number; column: number`
2. **Inconsistent nullability** — some entities had `file?: string`, others `file: string`, depending on context
3. **Two location types conflated** — some diagnostics pointed to specific file locations (e.g., "violation at src/domain/service.ts:15:8"), while others described project-wide issues (e.g., "cycle detected: domain → infra → domain"). The raw fields couldn't distinguish between these.

### Decision

Introduce `SourceRef` as a domain value object with two factory methods:

```typescript
class SourceRef {
  static at(file: string, line: number, column: number): SourceRef;
  static structural(scope?: string): SourceRef;

  get file(): string | undefined;
  get line(): number | undefined;
  get column(): number | undefined;
  get scope(): string | undefined;
}
```

**Two location types:**

- **File-scoped** — `SourceRef.at(file, line, column)` for violations at specific code positions
- **Structural** — `SourceRef.structural(scope?)` for project-wide or scope-wide violations (no file pointer)

All entities now have `source: SourceRef` instead of raw fields. The `Diagnostic` constructor takes `SourceRef` directly:

```typescript
new Diagnostic(
  'Forbidden dependency: domain → infrastructure',
  DiagnosticCode.ForbiddenDependency,
  SourceRef.structural('domain'),
  relatedContract
);
```

### Rationale

**Why a value object:**

- **Single responsibility** — encapsulates location logic (file-scoped vs. structural, nullability rules)
- **Type safety** — distinguishes between two location semantics at the type level
- **Consistency** — all entities use the same location representation

**Why two factory methods:**

- **Clarity** — `SourceRef.at(...)` vs `SourceRef.structural(...)` makes intent explicit in calling code
- **Validation** — factory methods enforce invariants (file-scoped requires all three fields; structural requires none)

**Why remove backward-compat getters:**

Initially added `Diagnostic.file`, `.line`, `.column` getters delegating to `.source.*` for backward compatibility. Removed in commit `209c6f5` to force consumers to use `.source.*` directly. This two-phase approach (add SourceRef → remove getters) prevented a massive one-shot refactor while still achieving a clean final API.

**Alternative considered:**

Union type `Location = FileLocation | StructuralLocation`. Rejected: adds boilerplate (`if ('file' in location)` checks everywhere); value object encapsulates this.

### Impact

- Created `src/domain/value-objects/source-ref.ts`
- `Diagnostic` constructor changed from `(message, code, file, line, column, scope?, related?)` to `(message, code, source, related?)`
- All diagnostic creation sites updated to use `SourceRef.at()` or `SourceRef.structural()`
- Backward-compat getters added in commit `f6d4dc5`, removed in `209c6f5`
- All apps and adapters updated to access `.source.file`, `.source.line`, `.source.column`
- 15 tests updated for new constructor signature
- 298 tests passing after SourceRef introduction, 343 passing after getter removal

---

## D22: Intra-File Dependency Checking for TypeKind Members

**Date:** 2026-02-11
**Status:** Done

### Context

The `noDependencyPlugin` checks that members of one Kind don't import from members of another Kind. It works by:
1. Getting the import graph (file-level: `ImportEdge[]`)
2. For each contract `noDependency(from, to)`, checking if any file in `from` imports any file in `to`

This works well when architectural units are directories or files. However, with TypeKind (D15), architectural units can be typed exports within a single file. For example:

```typescript
// handlers.ts
export const validateOrder: DeciderFn = (...) => {...};  // Pure logic
export const handleOrder: CommandHandler = (...) => {...};  // Application layer
```

If a Kind declares `noDependency(['Decider', 'CommandHandler'])`, the plugin should detect if `handleOrder` references `validateOrder` (or vice versa) — even though both are in the same file.

File-level import checking can't handle this. The plugin needs **declaration-level granularity** to attribute references to the correct TypeKind member.

### Decision

Extend `noDependencyPlugin` to check intra-file references when source and target files are the same:

1. Add `getIntraFileReferences()` to `CodeAnalysisPort`:
   ```typescript
   getIntraFileReferences(sourceFile: SourceFile): IntraFileEdge[];
   ```
   Returns edges between top-level declarations in the same file (e.g., `handleOrder` → `validateOrder`).

2. Create `IntraFileEdge` value object:
   ```typescript
   class IntraFileEdge {
     constructor(
       public readonly fromDeclaration: string,
       public readonly toDeclaration: string,
       public readonly line: number,
       public readonly column: number
     ) {}
   }
   ```

3. Use `declarationOwnership` (D32) to map declarations to members:
   ```typescript
   const fromMember = declarationOwnership.get(file)?.get(edge.fromDeclaration);
   const toMember = declarationOwnership.get(file)?.get(edge.toDeclaration);
   if (fromMember === sourceId && toMember === targetId) {
     // Violation: declaration in source member references declaration in target member
   }
   ```

4. In `noDependencyPlugin.check()`:
   - First, check file-level imports (existing logic)
   - Then, for each shared file, check intra-file edges

### Rationale

**Why extend noDependency:**

Intra-file checking is a natural extension of the same constraint — "members shouldn't depend on each other." The plugin already handles cross-file dependencies; adding intra-file dependencies keeps the logic centralized.

**Why declaration-level:**

TypeKind members are defined by their type annotations, not their file locations. To attribute dependencies correctly, the checker needs to know which declarations belong to which members. File-level checking would report false positives (all TypeKind members in a file would appear to depend on each other).

**Why IntraFileEdge:**

Separate from `ImportEdge` because:
- Different structure (declaration names, not file paths)
- Different source (TypeScript's call graph analysis, not import statement parsing)
- Different semantics (usage reference, not import declaration)

**Alternative considered:**

Create a unified `DependencyEdge` type with variants. Rejected: would complicate the import graph logic and conflate two different concepts (imports vs. references).

### Impact

- `CodeAnalysisPort` gains `getIntraFileReferences()` method
- `TypeScriptAdapter` implements intra-file reference extraction using type checker call graph
- Created `src/application/pipeline/check/intra-file-edge.ts`
- `noDependencyPlugin.check()` adds intra-file checking loop (27 new lines)
- `CheckerRequest` passes `declarationOwnership` to plugins (prerequisite: D32)
- 8 new tests in `no-dependency.plugin.test.ts` for intra-file violations
- 2 new integration tests for TypeKind with shared files
- 343 tests passing

---

## D21: Opt-In Exhaustiveness via `exhaustive: true`

**Date:** 2026-02-11
**Status:** Done

### Context

KindScript validates architectural constraints by checking relationships between members: noDependency (cross-member imports), purity (external imports), noCycles (circular dependencies). These constraints assume that **if a file isn't assigned to any member, that's acceptable** — the file is outside the architectural scope.

This assumption fails for container-style Kinds where every file **must** belong to some member. For example, a Clean Architecture Kind with domain/application/infrastructure members expects all files in the project to fall into one of these layers. An "orphan" file (e.g., `src/utils.ts` not in any layer) represents a design flaw, not a deliberate omission.

Without exhaustiveness checking, orphaned files are invisible — KindScript never reports them.

### Decision

Add `exhaustive?: true` to the `Constraints` type, enabling opt-in exhaustiveness checking:

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: Domain;
  app: Application;
  infra: Infrastructure;
}, {
  noDependency: [['domain', 'app'], ['domain', 'infra'], ['app', 'infra']];
  exhaustive: true;  // All files must belong to some member
}>;
```

Create `exhaustivenessPlugin` (ContractType.Exhaustiveness, DiagnosticCode.UnassignedFile KS70007):

1. The binder generates exhaustiveness contracts for instances with `exhaustive: true`
2. The checker computes unassigned files as:
   ```typescript
   const allFiles = containerFiles.get(instanceId);
   const assignedFiles = union(resolvedFiles.get(memberId) for all members);
   const unassigned = allFiles - assignedFiles;
   ```
3. Each unassigned file produces a diagnostic

**Hardcoded exclusions:**

- `context.ts` (architectural definition file, not application code)
- `*.test.ts`, `*.spec.ts` (test files)
- `**/__tests__/**` (test directories)

### Rationale

**Why opt-in:**

Not all architectural patterns need exhaustiveness. A `DesignSystem` Kind with versioned atoms (`v1.0.0`, `v2.0.0`) deliberately allows unversioned files (e.g., shared utilities). Making exhaustiveness mandatory would force artificial member assignments.

**Why in Constraints:**

Exhaustiveness is a constraint on the Kind's member set, similar to how `noDependency` constrains relationships between members. It belongs in the `Constraints` type parameter, not in `KindConfig`, because it's an opt-in rule, not a structural property of the Kind.

**Why hardcoded exclusions:**

- **Simplicity** — avoids adding a configuration API for exclusion patterns
- **Sensible defaults** — 95% of projects want to exclude test files and context files
- **Fail-safe** — users can always refactor exclusions into a dedicated member if needed (e.g., `tests: TestSuite`)

**Alternative considered:**

Add `exclude: string[]` parameter to exhaustiveness. Rejected: premature complexity; hardcoded patterns cover the common case, and we can add configurability later if needed.

**Why different from noDependency/purity/noCycles:**

- **Completeness vs. relationships** — checks that all files are covered, not how members relate
- **Single instance, not pairs** — operates on the instance as a whole, not on member pairs
- **Uses containerFiles** — requires D28 (container resolution) to compute total scope

### Impact

- `Constraints` type gains optional `exhaustive?: true` field
- Created `exhaustivenessPlugin` in `src/application/pipeline/plugins/exhaustiveness/`
- Plugin registered in `plugin-registry.ts`
- `BindService` generates exhaustiveness contracts from `exhaustive: true` constraints
- `CheckerRequest` includes `containerFiles` (prerequisite: D28)
- 13 tests in `exhaustiveness.plugin.test.ts`
- 2 integration fixtures (exhaustiveness-clean, exhaustiveness-violation)
- 2 E2E tests in `cli.e2e.test.ts`
- 343 tests passing

---

## D20: Auto-Generated Implicit Contracts for Overlap Detection

**Date:** 2026-02-11
**Status:** Done

### Context

Kind members are supposed to be disjoint — each file belongs to exactly one member. If two members claim the same file, architectural boundaries break down. For example, if both `domain/` and `infrastructure/` members include `src/logger.ts`, which layer does the logger belong to? Dependency rules become ambiguous.

Manual overlap constraints would be verbose (`overlap: [['domain', 'app'], ['domain', 'infra'], ...]` for every pair) and error-prone (easy to forget a pair when adding a new member). Overlap is a structural invariant of the Kind system itself, not a user-declared rule.

### Decision

Introduce `overlapPlugin` as the first **implicit constraint** — the binder automatically generates overlap contracts for every pair of sibling members, without requiring user declaration:

1. For each instance with 2+ members
2. For each unique pair of members `(A, B)` where `A < B` (lexicographically)
3. Skip pairs where one is a folder member and the other is a TypeKind member (see rationale)
4. Generate `Contract(Overlap, [A, B], instance)`

The checker validates that `resolvedFiles(A)` and `resolvedFiles(B)` are disjoint. Any shared file produces a diagnostic (DiagnosticCode.OverlappingMembers KS70006).

**Folder-TypeKind exclusion:**

If member A is a folder-based Kind and member B is a TypeKind, their "overlap" is intentional composition, not a violation:

```typescript
type System = Kind<"System", {
  ordering: Microservice;        // Folder: src/ordering/
  deciders: Decider;             // TypeKind: any file with `export const x: DeciderFn`
}>;
```

A file like `src/ordering/decider.ts` belongs to both members by design — it's in the ordering microservice AND contains a decider function. Folder members classify by location; TypeKind members classify by annotation. They operate on orthogonal axes.

### Rationale

**Why implicit:**

- **Universal invariant** — overlap is never desirable for same-axis members (two folders, two TypeKinds)
- **Zero configuration** — users don't need to learn or declare this constraint
- **Fail-safe** — can't be accidentally omitted (no "forgot to add overlap check" bugs)

**Why folder-TypeKind exclusion:**

- **Different classification axes** — folder = location-based, TypeKind = type-based
- **Intentional composition** — a file can be in a folder member AND have a typed export member
- **Real-world pattern** — common in projects with both structural layers (domain/) and cross-cutting classifications (pure functions, commands, queries)

**Alternative considered:**

Make overlap explicit in `Constraints`. Rejected: verbose, error-prone, and overlap is not optional — it's always wrong for same-axis members.

**Precedent:**

This is the first auto-generated constraint in KindScript. Previous constraints (noDependency, purity, noCycles, scope, exhaustiveness) are all explicitly declared. Overlap is different because it's a structural integrity check, not a user-defined rule.

### Impact

- Created `overlapPlugin` in `src/application/pipeline/plugins/overlap/`
- Plugin registered in `plugin-registry.ts`
- `BindService.generateImplicitContracts()` generates overlap contracts for all instances
- `BindService.skipOverlapCheck()` detects folder-TypeKind pairs
- `BindResult.contracts` includes auto-generated overlap contracts
- 12 tests in `overlap.plugin.test.ts`
- 4 tests verify folder-TypeKind exclusion
- 2 integration fixtures (overlap-clean, overlap-violation)
- 2 E2E tests in `cli.e2e.test.ts`
- 343 tests passing

---

## D19: Ownership Tree for Recursive Instance Containment

**Date:** 2026-02-11
**Status:** Done

### Context

With explicit instance locations (D24), instances can be nested — a parent instance's scope can contain child instances. For example:

```typescript
// src/context.ts
export const shop = {
  ordering: {} satisfies Instance<Microservice, './ordering'>,
  billing: {} satisfies Instance<Microservice, './billing'>,
} satisfies Instance<System, '.'>;

// src/ordering/context.ts
export const orderingCtx = {
  domain: {} satisfies Instance<Layer, './domain'>,
  app: {} satisfies Instance<Layer, './application'>,
} satisfies Instance<Microservice, '.'>;
```

Here, `ordering` (scope: `src/ordering/`) is contained within `shop` (scope: `src/`). This containment relationship is important for two reasons:

1. **Overlap detection** (D20) — when checking if two members overlap, we only care about sibling members, not parent-child pairs. `ordering` and `billing` are siblings (both children of `shop`); checking overlap between `shop` and `ordering` would be nonsensical (parent always "overlaps" child by definition).

2. **Exhaustiveness checking** (D21) — when checking if all files are assigned, we only check files within the instance's scope, excluding files owned by child instances.

Without a structured representation of parent-child relationships, plugins would need to recompute containment from scopes repeatedly, and the logic would be scattered.

### Decision

Introduce `OwnershipTree` and `OwnershipNode` as a new intermediate representation, computed between bind and check stages:

```typescript
interface OwnershipNode {
  instanceSymbol: ArchSymbol;
  scope: string;
  parent: OwnershipNode | null;
  children: OwnershipNode[];
  memberOf?: string;
}

interface OwnershipTree {
  roots: OwnershipNode[];
  nodeByInstanceId: Map<string, OwnershipNode>;
}
```

The tree is built by `buildOwnershipTree()` in `PipelineService`:

1. Sort all instances by scope path length (longest first)
2. For each instance, find its parent — the instance with the narrowest scope that contains this instance's scope
3. Assign parent-child relationships
4. Build a lookup map `nodeByInstanceId` for O(1) access

The checker receives `ownershipTree` via `CheckerRequest` and uses it to:
- Get siblings for overlap checking: `node.parent.children`
- Exclude child scopes for exhaustiveness: `containerFiles - union(child.scope for all children)`

### Rationale

**Why a tree structure:**

- **Natural representation** — instance containment forms a tree (each instance has at most one parent by scope containment)
- **Efficient lookup** — `nodeByInstanceId` provides O(1) access by symbol ID
- **Clear semantics** — parent/child/sibling relationships are explicit, not derived on the fly

**Why derive from scope paths:**

- **Automatic** — no need to declare parent-child relationships; they're inferred from filesystem paths
- **Consistent** — follows the same "location determines structure" principle as member resolution
- **Testable** — tree building is a pure function from instances → tree

**Why between bind and check:**

- **After bind** — requires resolved instance locations (bind output)
- **Before check** — used by multiple plugins (overlap, exhaustiveness); computing once avoids duplication

**Alternative considered:**

Add `parent` field to `ArchSymbol`. Rejected: would couple domain entities to parent-child relationships, which are pipeline-specific (not all architectural systems have nested instances).

### Impact

- Created `src/application/pipeline/ownership-tree.ts` with `buildOwnershipTree()` function
- `PipelineService.execute()` calls `buildOwnershipTree()` after bind stage
- `CheckerRequest` constructor takes `ownershipTree: OwnershipTree` parameter
- `CheckerService` passes `ownershipTree` to plugin `check()` calls
- `overlapPlugin` uses `ownershipTree` to get sibling pairs for checking
- `exhaustivenessPlugin` uses `ownershipTree` to exclude child scopes
- 7 tests in `ownership-tree.test.ts` verify tree construction
- 12 tests in overlap/exhaustiveness plugins use ownership tree
- 343 tests passing

---

## D18: Semantic Error Messages

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript's diagnostic messages reported violations using raw file paths:

```
Forbidden dependency: src/domain/service.ts -> src/infra/database.ts
Impure import in pure layer: 'fs' in src/domain/service.ts
```

Users think in terms of architectural symbols ("domain", "infrastructure"), not file paths. The messages forced users to mentally map paths back to symbols.

### Decision

Include symbol names in all diagnostic messages, keeping file paths as supporting context:

```
Forbidden dependency: domain → infrastructure (src/domain/service.ts → src/infra/database.ts)
Impure import in 'domain': 'fs'
Circular dependency detected: domain → infrastructure → domain
```

### Rationale

- **Matches mental model** — users think "domain depends on infrastructure", not "this file depends on that file"
- **Actionable** — symbol names tell you which architectural rule is violated; file paths tell you where to fix it
- **Consistent** — all three plugins now lead with semantic context
- **Backwards-compatible** — messages still contain file paths, so existing `.toContain()` assertions in tests still pass

### Impact

- `noDependencyPlugin`: `Forbidden dependency: ${from} → ${to} (${sourceFile} → ${targetFile})`
- `purityPlugin`: `Impure import in '${symbol}': '${module}'`
- `noCyclesPlugin`: already used symbol names — no change
- All 263 tests passing, no test changes required

---

## D17: Remove mustImplement, exists, mirrors Plugins

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript had 6 constraint types: `noDependency`, `mustImplement`, `purity`, `noCycles`, `filesystem.exists`, and `filesystem.mirrors`. Three of them (`mustImplement`, `filesystem.exists`, `filesystem.mirrors`) had limited real-world value and added complexity:

- **mustImplement** — checked that every exported interface in one layer had an implementing class in another. Useful in theory, but in practice classes often implement interfaces from unrelated packages or use patterns (abstract classes, partial implementations) that the simple "has `implements` clause" check didn't handle well.
- **filesystem.exists** — checked that member directories existed on disk. Redundant: if a directory is missing, dependency checks simply pass (no files to violate). The constraint only caught the case where a user declared members they never created — a trivially fixable setup issue.
- **filesystem.mirrors** — checked that every file in one directory had a counterpart in another (e.g., every component has a test). Brittle in practice: test file naming conventions vary, colocated tests break the pattern, and the check produced false positives on stories, fixtures, and helpers.

### Decision

Remove all three plugins and focus on the 3 core constraints: `noDependency`, `purity`, `noCycles`. These three are compositional, behavioral, and universally applicable.

### Rationale

- **Focus** — 3 constraints that compose well are more valuable than 6 that each cover a narrow case
- **Simpler mental model** — users only need to learn 3 constraint types
- **Less maintenance surface** — 3 plugin implementations instead of 6
- **No real-world loss** — the removed constraints had workarounds (mustImplement → TypeScript's own type checking; exists → visual inspection; mirrors → test coverage tools)
- **Principled** — the remaining 3 constraints are all import-graph analysis, which is KindScript's core competency

### Impact

- Deleted `src/application/pipeline/plugins/must-implement/`, `exists/`, `mirrors/`
- Deleted 3 test files, 3 sets of integration fixtures, related E2E tests
- Removed `ContractType` enum values, `DiagnosticCode` constants, factory functions
- Removed `filesystem.exists`/`filesystem.mirrors` from all notebooks and documentation
- 26 test files, 263 tests, 100% passing

---

## D16: Resolution Moves from Parser to Binder

**Date:** 2026-02-10
**Status:** Done

### Context

The parser (`ParseService`) had two responsibilities: building ArchSymbol trees from scan output (structural) and resolving those symbols to actual files on disk (I/O). This meant the parser depended on `FileSystemPort`, which violated its role as a structural transformation stage. It also meant resolution logic was split between parser (filesystem resolution) and binder (TypeKind declaration resolution), making the data flow harder to follow.

### Decision

Move all name resolution from the parser to the binder. The parser becomes purely structural (no I/O dependencies). The binder performs unified resolution using a three-strategy approach:

1. **TypeKind declaration resolution** — scan for typed exports within the parent scope
2. **Folder resolution** — `readDirectory()` on the derived path
3. **File resolution** — single file check

### Rationale

- **Parser purity** — the parser is now a pure function from scan output to ArchSymbol trees, with zero I/O
- **Unified resolution** — all three resolution strategies live in one place (the binder), making the data flow clear
- **Aligned with TypeScript's model** — TypeScript's binder is where names are resolved to declarations
- **Single source of `resolvedFiles`** — `BindResult.resolvedFiles` is the one authoritative map; `ParseResult` no longer carries it

### Impact

- `ParseService`: constructor takes zero arguments (was `FileSystemPort`); removed `resolveSymbolFiles()` and `resolveTypeKindFiles()`
- `ParseResult`: removed `resolvedFiles` field
- `BindService`: constructor takes `(plugins, fsPort)`; new `resolveMembers()` method
- `BindResult`: now includes `resolvedFiles: Map<string, string[]>`
- `PipelineService`: uses `bindResult.resolvedFiles` directly (no merge)
- `engine-factory.ts`: `new ParseService()` (no args), `new BindService(plugins, fs)`
- All 263 tests passing, 5 test files updated for new constructors

---

## D15: Unified Kind Type — TypeKind as Sugar

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript had two separate type-level primitives: `Kind<N, Members, Constraints>` for directory/file-based architectural units, and `TypeKind<N, T>` for declaration-based units. At the type level, they were unrelated types. This created a conceptual split — users had to learn two different systems — and a practical problem: `Members extends Record<string, KindRef>` needed `KindRef` to be a shared marker, but `Kind` and `TypeKind` had no common base.

Additionally, `TypeKind` only took 2 type parameters — it couldn't carry standalone constraints (like `pure: true`), limiting its expressiveness.

### Decision

Make `Kind` a conditional type with a 4th parameter `_Config extends KindConfig`:

```typescript
type KindConfig = { wraps?: unknown; scope?: 'folder' | 'file' };

type Kind<N, Members, _Constraints, _Config> =
  _Config extends { wraps: infer T }
    ? T & { readonly __kindscript_brand?: N }  // TypeKind shape
    : { kind: N; location: string } & Members; // structural shape

type TypeKind<N, T, C = {}> = Kind<N, {}, C, { wraps: T }>;  // sugar
```

`TypeKind<N, T, C>` is now literally `Kind<N, {}, C, { wraps: T }>` — not a separate concept, but a convenience alias. Both produce `KindRef`-compatible types.

### Rationale

- **One concept, not two** — Kind and TypeKind are the same thing configured differently (directory scope vs. declaration scope)
- **TypeKind gains constraints** — `TypeKind<"Decider", DeciderFn, { pure: true }>` enables standalone purity enforcement on typed exports
- **Shared `KindRef`** — both branches satisfy the phantom marker, so `Members extends Record<string, KindRef>` works naturally
- **`KindConfig` consolidates** — the previous 4th parameter `_Scope` (from D14) and the new `wraps` live together in one config type
- **Minimal API expansion** — 2 new exports (`KindConfig`, `KindRef`), 1 parameter added to `TypeKind`

### Impact

- `src/types/index.ts`: `Kind` is now a conditional type; `TypeKind` gains 3rd parameter; `KindConfig` and `KindRef` exported
- Public API: 6 types (`Kind`, `TypeKind`, `Instance`, `Constraints`, `KindConfig`, `KindRef`)
- Scanner: extracts `constraints` from TypeKind's 3rd type parameter via `TypeKindDefinitionView.constraints`
- Binder: generates standalone TypeKind contracts from `typeKindDefs` with constraints
- 2 new integration fixtures (typekind-purity-clean, typekind-purity-violation)
- 2 new E2E tests for TypeKind standalone purity
- 26 test files, 263 tests, 100% passing

---

## D14: File-Scoped Leaf Instances

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript's parser unconditionally derived instance locations from the parent directory of the declaring file (`dirnamePath(sourceFileName)`). This meant a `satisfies Instance<AtomSource>` declaration in `Button.tsx` was interpreted as "everything in Button.tsx's directory is an AtomSource" — not "Button.tsx is an AtomSource."

This prevented file-level architectural enforcement. In a design system where `Button.tsx`, `Button.stories.tsx`, and `Button.test.tsx` are colocated in the same directory, you couldn't constrain the source file differently from stories or tests.

### Industry Research

Surveyed 12 systems (Go, Rust, Bazel, Java JPMS, Python, C#, ArchUnit, eslint-plugin-boundaries, dependency-cruiser, Nx, Node.js exports, TypeScript project references). Key findings:

1. **Every directory-scoped system eventually needs file-level escape hatches.** Go added `_test.go`. Bazel has per-file targets. ArchUnit has `SliceAssignment`.
2. **The industry trend is toward file-level as default.** Node.js deprecated directory-level exports. dependency-cruiser and eslint-boundaries default to file scope.
3. **Systems with one clear default + minimal exceptions (Go) succeed.** Systems supporting both equally (Rust) create ongoing confusion.

Full research in `.working/FILE_VS_DIRECTORY_SCOPE_RESEARCH.md`.

### Decision

Use the presence of members as the structural indicator for scope:

- **Leaf Kind** (no members): instance location = the declaring file itself
- **Composite Kind** (has members): instance location = parent directory of the declaring file

### Rationale

- **Members structurally require directories** — they map to subdirectories, so directory scope is justified by necessity
- **Leaf instances describe themselves** — a file declaring `satisfies Instance<AtomSource>` with no members is naturally saying "I am an AtomSource"
- **Follows Go's playbook** — one clear default (file), structural escape (members create directory scope)
- **No new API types or syntax** — the rule is purely structural
- **Backwards compatible** — all existing instances use composite Kinds with members; no behavior changes for them

### Impact

- `parse.service.ts`: root derivation now conditional on `kindDef.members.length > 0`
- `resolveSymbolFiles`: handles file locations (single-file resolution) alongside directories
- `FileSystemPort`: added `fileExists(path): boolean`
- `FileSystemAdapter` + `MockFileSystemAdapter`: implement `fileExists`
- 5 new tests in `classify-ast-locate.test.ts`
- 284 tests, 29 files, 100% passing
- No existing test changes required

---

## D13: Rename `ConstraintConfig` to `Constraints`

**Date:** 2026-02-08
**Status:** Done

### Context

The public API type `ConstraintConfig<Members>` carried a `Config` suffix that was a leftover from the `ContractConfig` era (D8). With `Kind` and `Instance` as clean one-word nouns, `ConstraintConfig` was the odd one out — the suffix implied runtime configuration rather than a type-level schema.

Additionally, user-facing documentation led with "contracts" (internal domain model terminology) rather than "constraints" (what users actually write). Users declare constraints on Kind types; they never interact with `Contract` domain entities. The terminology mismatch made the docs harder to navigate.

### Decision

1. Rename `ConstraintConfig<Members>` to `Constraints<Members>` in the public API.
2. Rename `docs/03-contracts.md` to `docs/03-constraints.md` and update user-facing headings from "Contract Types" to "Constraint Types."
3. Add plugin registry validation tests (uniqueness of constraint names, contract types, diagnostic codes).
4. Keep internal domain model names unchanged: `Contract`, `ContractType`, `ContractPlugin` remain as-is.

### Rationale

- `Constraints<Members>` aligns with `Kind` and `Instance` — clean, one-word nouns
- `Kind<"X", Members, Constraints<Members>>` reads naturally
- Users write constraints, not contracts — docs should match user vocabulary
- Internal domain model doesn't need renaming — "contract" is correct for bound, evaluable rules
- Plugin registry validation tests prevent silent collisions (duplicate names, types, or codes)

### Impact

- Public API: `Kind`, `Instance<T>`, `Constraints<Members>` (3 user-facing types)
- `docs/03-contracts.md` → `docs/03-constraints.md` (file rename)
- User-facing headings updated: "Contract Types" → "Constraint Types"
- Plugin registry: 3 new uniqueness tests
- All tests passing, no behavioral changes

---

## D12: Rename `InstanceConfig<T>` to `Instance<T>`

**Date:** 2026-02-08
**Status:** Done

### Context

The public API type `InstanceConfig<T>` served as the projection from a Kind type to its instance value shape (used with `satisfies`). The name was verbose and the type-theoretic relationship was indirect — users had to understand `Kind`, `InstanceConfig`, and `MemberMap` as three separate concepts.

Research across Haskell (class/instance), Scala (trait/given), Rust (trait/impl), OCaml (module type/structure), and TypeScript ecosystem tools (Zod, Effect-TS, Vite) confirmed that every system uses a schema→instance projection, and most call the instance side "instance."

### Decision

Rename `InstanceConfig<T>` to `Instance<T>`. Keep `MemberMap<T>` as an internal implementation detail (still exported for cross-module use, but not documented as part of the public API).

### Rationale

- `Instance<T>` communicates the type-theoretic relationship clearly: "this value satisfies Instance of OrderingContext"
- Mirrors naming conventions across Haskell (`class`/`instance`), Scala (`trait`/`given`), Rust (`trait`/`impl`)
- Reduces public API surface from 4 types to 3 user-facing types: `Kind`, `Instance`, `Constraints`
- `MemberMap` becomes an internal projection mechanism, not a concept users need to learn
- No deprecated alias — pre-1.0 with no external users, clean break preferred
- Mechanical rename with no logic changes

### Impact

- Public API: `Kind`, `Instance<T>`, `Constraints` (3 user-facing types)
- AST adapter: detection string changed from `'InstanceConfig'` to `'Instance'`
- ~355 occurrences renamed across ~58 files (source, tests, fixtures, docs, notebooks)
- All 276 tests passing, no behavioral changes

---

## D11: Pipeline Cleanup — Separation of Concerns

**Date:** 2026-02-08
**Status:** Done

### Context

After the four-stage pipeline alignment (D10), several cross-cutting concerns remained entangled: view DTOs lived in port files, contract plugins were split across `bind/` and `check/`, `PipelineService` handled both program setup and stage orchestration, and the `Engine` interface exposed infrastructure details (`fs`, `ts`) that no app consumed.

### Decision

Five targeted changes to improve separation of concerns:

1. **Extract view types** — Move `TypeNodeView`, `KindDefinitionView`, etc. from `ast.port.ts` into `pipeline/views.ts`. The port re-exports them for adapter compatibility.
2. **Extract plugins** — Move `ConstraintProvider`, `ContractPlugin`, plugin registry, and all 6 plugin implementations into a neutral `pipeline/plugins/` directory (shared by bind + check stages).
3. **Add use-case interfaces** — Each stage (scan, parse, bind) gets a use-case interface (`ScanUseCase`, `ParseUseCase`, `BindUseCase`). `PipelineService` depends on interfaces, not concrete classes.
4. **Extract ProgramFactory** — Config reading, file discovery, and TS program creation move from `PipelineService` into `ProgramFactory` behind a `ProgramPort` interface.
5. **Slim Engine** — Remove unused `fs` and `ts` from `Engine` interface. Apps only use `pipeline` and `plugins`.

### Rationale

- **View types in port files** — violated Interface Segregation; pipeline stages needed AST port just for DTOs
- **Plugins split across stages** — `ContractPlugin extends ConstraintProvider` created a cross-stage dependency; neutral `plugins/` directory resolves this
- **Concrete stage dependencies** — made `PipelineService` hard to test without real services; interfaces enable mock injection
- **PipelineService doing too much** — program setup is independent of stage orchestration; extracting it follows Single Responsibility
- **Engine surface area** — `fs` and `ts` were never consumed by any app; removing them reduces coupling

### Impact

- 276 tests, 29 files, 100% passing
- No public API changes
- `PipelineService` constructor: 6 interface-typed dependencies
- `Engine` interface: `{ pipeline, plugins }` only

---

## D10: Four-Stage Pipeline Alignment

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript's application layer was organized by capability (`classification/` + `enforcement/`), but `ClassifyASTService.execute()` was doing three distinct jobs in one method: extracting raw AST views (scanning), building ArchSymbol trees (parsing), and generating Contracts from constraint trees (binding). This entanglement made it hard to reason about, test, and extend each concern independently.

### Decision

Decompose the application layer into four explicit pipeline stages aligned with TypeScript's compiler terminology: **Scanner → Parser → Binder → Checker**. Replace `classification/` + `enforcement/` + `services/` with a single `pipeline/` directory.

### Rationale

- **TypeScript alignment** — using the same stage names (scan, parse, bind, check) makes the architecture immediately recognizable to TypeScript compiler contributors and readers
- **Single Responsibility** — each stage has one job with clear input/output types (`ScanResult` → `ParseResult` → `BindResult` → `CheckerResponse`)
- **Testability** — stages can be tested independently with mock inputs; the three classify-ast test files naturally map to scan, parse, and bind
- **Simplified orchestration** — `PipelineService` absorbs `ClassifyProjectService` + `RunPipelineService` into one orchestrator that owns config, program creation, caching, and the stage chain
- **Simpler Engine** — the `Engine` interface shrinks from `{ classifyProject, checkContracts, runPipeline, plugins, fs, ts }` to `{ pipeline, plugins }` (further slimmed in D11)

### Impact

- Deleted `classification/`, `enforcement/`, `services/` directories
- Created `pipeline/scan/`, `pipeline/parse/`, `pipeline/bind/`, `pipeline/check/`
- Renamed `CheckContractsService` → `CheckerService`
- Merged `ClassifyProjectService` + `RunPipelineService` → `PipelineService`
- Absorbed `resolveSymbolFiles()` into `ParseService` as a private method
- All 29 test files, 277 tests updated and passing

---

## D9: Drop `.k.ts`, Piggyback on TypeScript Type Checker

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript used a `.k.ts` file extension as a convention to identify definition files. The classifier used `fileName.endsWith('.k.ts')` to filter which files to analyze. The AST extraction itself already worked on any TypeScript file.

### Decision

Drop the `.k.ts` extension entirely. Use TypeScript's type checker (`checker.getSymbolAtLocation()` + `getAliasedSymbol()`) to discover Kind definitions and Instance declarations. This makes KindScript invisible — definitions live in regular `.ts` files with no special extension, no config file, and no naming convention.

### Rationale

- The `.k.ts` extension was unfamiliar and made KindScript feel like a separate language
- The AST extraction logic was already extension-agnostic
- TypeScript's type checker already resolves all imports, aliases, and re-exports — piggybacking on it is more robust than string matching
- Dropping `.k.ts` means zero artifacts in a project beyond `import type` statements
- Discovery through the type checker handles aliased imports (`import { Kind as K }`) correctly

### Impact

- All `.k.ts` fixture files renamed to `.ts`
- 4 extension filters removed from source
- `ASTAdapter` rewritten to use type checker for Kind/Instance identification
- ~5 lines of code changed in the core pipeline

---

## D8: Remove `ContractConfig<T>`

**Date:** 2026-02-07
**Status:** Done

### Context

The V2 redesign introduced `ContractConfig<T>` as an "additive escape hatch" — instances could declare additional constraints beyond what the Kind type specified.

### Decision

Remove `ContractConfig<T>`. All constraints must be declared on the Kind type's 3rd type parameter. The Kind type is the single source of truth for all architectural rules.

### Rationale

- Breaks the "abstractions as types" metaphor — in TypeScript, types fully describe their contract; values don't add new type rules
- Created ambiguity in multi-instance scenarios
- Required a third classification phase in the AST classifier
- Confused where to look for the authoritative set of constraints

### Impact

- Simpler mental model: read the Kind definition to understand all rules
- Different constraints require different Kinds (by design)
- Classifier simplified to 2 phases (Kind definitions + instances)
- `ContractConfig` removed from public API

---

## D7: Flatten `src/runtime/`

**Date:** 2026-02-08
**Status:** Done

### Context

`src/runtime/` contained ~65 lines of type-only exports (`Kind`, `Constraints`, `MemberMap`, `Instance`). The name "runtime" was a leftover from when it contained actual runtime functions (`locate()`, `defineContracts()`).

### Decision

Move all types to `src/types/index.ts`. Delete `src/runtime/`.

### Rationale

- ~65 lines of type-only code doesn't need its own directory
- The name "runtime" contradicted KindScript's "zero runtime footprint" value proposition
- Research across 14 tools (Zod, Vite, Rollup, ESLint, etc.) showed no tool separates user-facing types into a subfolder

---

## D6: Remove Standard Library Packages

**Date:** 2026-02-07
**Status:** Done

### Context

KindScript originally planned to ship pre-built architectural patterns as `@kindscript/*` npm packages (`@kindscript/clean-architecture`, `@kindscript/hexagonal`, etc.).

### Decision

Remove standard library packages. Users define patterns inline in their own `.ts` files.

### Rationale

- Added complexity (package resolution service, config plumbing, branching codegen logic, extra test fixtures)
- Marginal value — defining a Kind type is ~10 lines of code
- Premature optimization — the user base doesn't exist yet to justify pre-built patterns
- Patterns defined inline are easier to customize and understand

---

## D5: Self-Registering Contract Plugins

**Date:** 2026-02-07
**Status:** Done

### Context

Contract checking was a monolithic ~322-line `CheckContractsService` with a `switch` statement dispatching to private methods.

### Decision

Extract each contract type into a self-contained `ContractPlugin` object. A `plugin-registry.ts` file creates all plugins. `CheckContractsService` becomes a thin dispatcher.

### Rationale

- Open-Closed Principle — adding a new contract type means adding a new plugin, not modifying the dispatcher
- Each plugin declares its own type, constraint name, diagnostic code, validation, and checking logic
- Plugins can be tested independently
- The dispatcher is ~60 lines with no contract-specific knowledge

### Plugin Interface

```typescript
interface ContractPlugin extends ConstraintProvider {
  readonly type: ContractType;
  readonly diagnosticCode: number;

  validate(args: ArchSymbol[]): string | null;
  check(contract: Contract, ctx: CheckContext): CheckResult;

  codeFix?: { fixName: string; description: string };
}
```

Where `ConstraintProvider` provides `constraintName`, optional `generate()`, and optional `intrinsic` (detect + propagate).

---

## D4: Use `satisfies` Instead of Runtime Markers

**Date:** 2026-02-07
**Status:** Done

### Context

Users previously wrote `locate<T>("root", { ... })` and `defineContracts<T>({ ... })` — runtime function calls that were identity no-ops. KindScript's classifier matched them syntactically but never executed them.

### Decision

Replace all runtime markers with `satisfies` expressions and `import type`. Instances use `{ ... } satisfies Instance<T>`. Constraints move to the Kind type's 3rd parameter. All imports become `import type` (fully erased from output).

### Rationale

- `locate()` and `defineContracts()` required `kindscript` as a real dependency (not just `devDependencies`)
- The runtime no-ops shipped in production bundles if definition files were accidentally included
- `satisfies` is valid TypeScript with zero runtime cost
- `import type` is fully erased — KindScript becomes a devDependency only
- The Kind syntax change (D3) was already breaking, so the incremental cost of also changing instance syntax was near zero

---

## D3: Type Alias Instead of `interface extends`

**Date:** 2026-02-07
**Status:** Done

### Context

Kind definitions originally used `interface X extends Kind<"X"> { members }`.

### Decision

Change to `type X = Kind<"X", { members }, { constraints }>`.

### Rationale

- Eliminated redundant name (`interface DomainLayer extends Kind<"DomainLayer">`)
- No empty `{}` for leaf kinds (`type DomainLayer = Kind<"DomainLayer">`)
- Constraints as 3rd type parameter is cleaner than `extends Kind` plus separate `defineContracts()`
- `extends` implied OOP inheritance; `type` is a pure type-level concept
- All three pieces of a Kind (name, members, constraints) live in one declaration

---

## D2: No ts-morph

**Date:** 2026-02-07
**Status:** Done

### Context

ts-morph provides a higher-level API over TypeScript's compiler API, making AST operations more ergonomic.

### Decision

Use the raw TypeScript compiler API throughout. Do not add ts-morph as a dependency.

### Rationale

- The classifier is ~100-150 lines of straightforward AST walking
- ts-morph adds ~500KB and version coupling to TypeScript
- Performance matters in the plugin context (runs on every keystroke)
- The original use case for ts-morph (code generation/scaffolding) was removed from KindScript
- Clean helper functions provide sufficient ergonomics for the remaining use cases

---

## D1: Language Service Plugin Instead of Custom LSP

**Date:** 2026-02-07
**Status:** Done

### Context

The original architecture proposed a custom LSP server for IDE integration.

### Decision

Use TypeScript's Language Service Plugin API instead.

### Rationale

**Ecosystem evidence:**

| Project | Plugin or LSP? | File Types |
|---------|---------------|------------|
| Angular Language Service | Plugin | `.ts` only |
| typescript-styled-plugin | Plugin | `.ts` with tagged templates |
| ts-graphql-plugin | Plugin | `.ts` with tagged templates |
| Vue Language Tools | Both | `.vue` (LSP) + `.ts` (plugin) |
| Svelte Language Tools | Both | `.svelte` (LSP) + `.ts` (plugin) |

**Pattern:** Projects operating on `.ts` files only use the plugin API exclusively. KindScript operates entirely on `.ts` files.

**Benefits:**
- Eliminates entire LSP server implementation
- Zero editor-specific integration work — every tsserver-based editor works immediately
- Native diagnostic display alongside TypeScript errors
- Code actions, hover info, and squiggly underlines work out of the box

**Trade-offs:**
- Contracts must be fast (sub-100ms per file) since the plugin runs in tsserver's event loop
- Complex analysis belongs in the CLI (`ksc check`), not the plugin

---

## Build / Wrap / Skip Framework

The decisions above follow a consistent framework:

**BUILD (genuinely new):**
1. Classifier — AST → ArchSymbol (no equivalent in TS ecosystem)
2. Symbol-to-files resolution — maps type declarations to filesystem
3. Contract evaluation — behavioral checking against codebase structure

**WRAP (delegate to TypeScript):**
1. Import graph — thin query over ts.Program
2. Diagnostic format — use ts.Diagnostic directly (codes 70000–79999)
3. Language service — plugin API
4. Filesystem access — ts.sys + small extensions
5. Config parsing — ts.readConfigFile

**SKIP (TypeScript handles natively):**
1. Scanner / Parser
2. AST format (ts.Node)
3. Structural type checking
4. LSP server (plugin runs inside tsserver)
