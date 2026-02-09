# Architecture

> System overview, compiler pipeline, layers, and data flow.

---

## Core Concept

KindScript is an architectural enforcement tool that extends TypeScript's compiler pipeline. Just as TypeScript validates values against types, KindScript validates codebases against architectural patterns — dependency rules, purity constraints, port/adapter completeness, and more.

KindScript produces standard `ts.Diagnostic` objects (error codes 70001–70005, 70010, and 70099), so violations appear alongside regular TypeScript errors in your editor and CI pipeline.

---

## Compiler Pipeline

KindScript reuses TypeScript's scanner, parser, and type checker, then adds two new phases:

```
  .ts source files
       |
  +---------+    +---------+    +---------+
  | Scanner |===>| Parser  |===>|TS Binder|     TypeScript's own phases
  +---------+    +---------+    +---------+     (reused as-is)
       |              |              |
    tokens        ts.Node AST    ts.Symbol
                                     |
                              +------+------+
                              | TS Checker  |   TypeScript type checking
                              +------+------+   (reused as-is)
                                     |
                               ts.Diagnostic
                                     |
  ================================== | ======   KindScript phases begin
                                     |
                              +------+------+
                              | KS Binder   |   Classify AST nodes as
                              | (Classifier)|   Kind definitions and
                              +------+------+   instances
                                     |
                                ArchSymbol
                                     |
                              +------+------+
                              | KS Checker  |   Evaluate contracts against
                              | (Contracts) |   resolved files and imports
                              +------+------+
                                     |
                               ts.Diagnostic    (same format as TS errors)
                                     |
                    +----------------+----------------+
                    |                |                |
               CLI output      IDE squiggles    CI exit code
               (ksc check)     (TS plugin)      (process.exit)
```

### What KindScript builds vs reuses

| Component | Approach | Notes |
|-----------|----------|-------|
| Scanner / Parser | **Reuse** | TypeScript's own |
| AST format | **Reuse** | `ts.Node` directly |
| Type checking | **Reuse** | TypeScript's checker |
| Module resolution | **Reuse** | TypeScript's resolver |
| Diagnostic format | **Reuse** | `ts.Diagnostic` with codes 70001–70005, 70010, 70099 |
| IDE integration | **Wrap** | TypeScript Language Service Plugin API |
| KS Binder (Classifier) | **Build** | Classifies Kind definitions and instances |
| Symbol-to-files resolution | **Build** | Maps architectural declarations to filesystem |
| KS Checker (Contracts) | **Build** | Evaluates 6 contract types |

---

## Detailed Pipeline Walkthrough

The pipeline is orchestrated by `PipelineService`, which runs four stages in sequence: **Scan → Parse → Bind → Check**. Each stage's output feeds the next.

```
  projectRoot
       |
  PipelineService (orchestrator) ───────────────────────────────────
       |
       ├─ Read config (kindscript.json + tsconfig.json)
       ├─ Merge compiler options
       ├─ Discover root files
       ├─ Create ts.Program + TypeChecker
       ├─ Check cache (skip to output if fresh)
       |
  Stage 1: SCAN ─────────────────────────────────────────────────────
       |
       ├─ For each source file:
       │   ├─ Extract Kind definitions (type aliases referencing Kind<N>)
       │   └─ Extract Instance declarations (satisfies Instance<T>)
       |
       ▼
  ScanResult { kindDefs, instances, errors }
       |
  Stage 2: PARSE ────────────────────────────────────────────────────
       |
       ├─ Build ArchSymbol trees (Instance + Member hierarchy)
       ├─ Derive filesystem paths from member names
       └─ Resolve files per location (readDirectory)
       |
       ▼
  ParseResult { symbols, kindDefs, resolvedFiles, errors }
       |
  Stage 3: BIND ─────────────────────────────────────────────────────
       |
       ├─ Walk constraint trees → generate Contract[]
       └─ Propagate intrinsic constraints from member Kinds
       |
       ▼
  BindResult { contracts, errors }
       |
  Stage 4: CHECK ────────────────────────────────────────────────────
       |
       ├─ For each contract: validate args
       └─ For each contract: plugin.check() → Diagnostic[]
       |
       ▼
  CheckerResponse { diagnostics, contractsChecked, filesAnalyzed }
```

---

### Pipeline Orchestrator

**Service:** `PipelineService`
**Purpose:** Chain the four pipeline stages with caching. Delegates program setup to `ProgramFactory`.

#### Program setup (ProgramFactory)

`PipelineService` delegates config reading, file discovery, and TS program creation to a `ProgramPort` (implemented by `ProgramFactory`):

1. **Read config** — reads `kindscript.json` (optional) and `tsconfig.json`
2. **Merge compiler options** — KindScript options override TypeScript options
3. **Discover root files** — from `tsconfig.json` `files` array, or `readDirectory(rootDir, recursive=true)`
4. **Create ts.Program** — `tsPort.createProgram(rootFiles, compilerOptions)` + `getTypeChecker()`
5. **Get source files** — filtered to exclude `node_modules` and `.d.ts` files

Returns `ProgramSetup { program, sourceFiles, checker, config }` or `{ error: string }`.

**Early exit:** Returns error if no TypeScript files or no source files are found.

#### Cache check

The orchestrator maintains a cache keyed on source file paths and their modification timestamps:

```
cacheKey = sourceFiles
  .map(sf => `${sf.fileName}:${fsPort.getModifiedTime(sf.fileName)}`)
  .sort()
  .join('|')
```

If the key matches the previous run, the cached result is returned immediately. This is critical for the IDE plugin, where the pipeline runs on every keystroke.

**If cache hits → skip directly to output. All four stages are skipped.**

---

### Stage 1: Scan

**Service:** `ScanService`
**Purpose:** Extract raw `KindDefinitionView` and `InstanceDeclarationView` from source files via the `ASTViewPort`.

The scanner iterates every source file and makes two calls per file:

#### Extract Kind definitions

`astPort.getKindDefinitions(sourceFile, checker)` walks each file's top-level statements looking for type alias declarations whose type reference resolves to `Kind` (verified via the TypeChecker using `isSymbolNamed()`, which handles import aliases like `import { Kind as K }`).

For each match, it extracts a `KindDefinitionView`:

```
KindDefinitionView {
  typeName:        string           ← the type alias name (e.g., "CleanContext")
  kindNameLiteral: string           ← first type arg (string literal, e.g., "CleanContext")
  members:         Array<{          ← second type arg (type literal properties)
    name: string;                     property name
    typeName?: string;                type reference name (e.g., "DomainLayer")
  }>
  constraints?:    TypeNodeView     ← third type arg (recursive structural view)
}
```

The constraint extraction is **structural inference** — `buildTypeNodeView()` determines shape from AST node types, not from property names:

| AST node type | TypeNodeView |
|---|---|
| `TrueKeyword` / `FalseKeyword` | `{ kind: 'boolean' }` |
| `TupleTypeNode` with string literals | `{ kind: 'stringList', values: [...] }` |
| `TupleTypeNode` with nested tuples | `{ kind: 'tuplePairs', values: [[a,b], ...] }` |
| `TypeLiteralNode` with properties | `{ kind: 'object', properties: [...] }` (recursive) |

#### Extract Instance declarations

`astPort.getInstanceDeclarations(sourceFile, checker)` finds `satisfies Instance<T>` expressions.

The ASTAdapter:
1. Builds a `varMap` of all variable declarations in the file (for resolving identifier references)
2. Finds variable declarations with `satisfies` expressions
3. Uses `isSymbolNamed()` to verify the type reference is `Instance`
4. Extracts the Kind type name from the type argument

For each match, it extracts an `InstanceDeclarationView`:

```
InstanceDeclarationView {
  variableName: string              ← the variable name (e.g., "app")
  kindTypeName: string              ← the type argument (e.g., "CleanContext")
  members:      MemberValueView[]   ← recursively-resolved member values
}

MemberValueView {
  name:      string                 ← property key
  children?: MemberValueView[]      ← nested object properties
}
```

The adapter resolves identifier references via `varMap` — `{ domain: x }` where `x` is a previously declared variable gets resolved to `x`'s value expression.

#### Scan output

```
ScanResult {
  kindDefs:  Map<string, KindDefinitionView>   // typeName → definition
  instances: ScannedInstance[]                  // { view, sourceFileName }
  errors:    string[]                           // extraction errors
}
```

---

### Stage 2: Parse

**Service:** `ParseService`
**Purpose:** Build ArchSymbol trees from scanner output and resolve filesystem locations.

#### Build member tree (ArchSymbol hierarchy)

For each instance declaration, the parser:

1. **Looks up the Kind definition** from the `kindDefs` map using `kindTypeName`
2. **Computes the root location** — `dirnamePath(sourceFile.fileName)`, the directory containing the definition file
3. **Builds the member tree** via `buildMemberTree()`:

```
buildMemberTree(kindDef, parentPath, memberValues, kindDefs):
  For each member defined in the Kind:
    memberPath = joinPath(parentPath, memberName)     // always derived, no overrides
    Look up child Kind definition (if member has a typeName)
    Recurse if child Kind has members AND instance value has children
    Create ArchSymbol(name, Member, memberPath, childMembers, kindTypeName, locationDerived=true)
```

The resulting ArchSymbol tree mirrors the Kind definition structure, with filesystem paths derived by concatenating member names:

```
ArchSymbol: "app" (Instance, location: /project/src/)
  ├─ ArchSymbol: "domain" (Member, location: /project/src/domain/)
  ├─ ArchSymbol: "application" (Member, location: /project/src/application/)
  │   ├─ ArchSymbol: "ports" (Member, location: /project/src/application/ports/)
  │   └─ ArchSymbol: "services" (Member, location: /project/src/application/services/)
  └─ ArchSymbol: "infrastructure" (Member, location: /project/src/infrastructure/)
```

**Key principle:** Locations are always derived from `parentPath + memberName`. There are no path overrides. The parser never queries the filesystem for Kind/Instance discovery — it constructs the model purely from scan output.

#### Resolve symbol files

After building the symbol tree, the parser resolves each member's derived location to actual files on disk:

```
For each unique declaredLocation across all symbols:
  if fsPort.directoryExists(location):
    files = fsPort.readDirectory(location, recursive=true)
    resolved.set(location, files)
```

Locations that don't exist on disk are silently omitted. This is intentional — `resolvedFiles.has(location)` later serves as the existence check for the `exists` contract plugin.

#### Parse output

```
ParseResult {
  symbols:           ArchSymbol[]                // Kind definitions + instance trees
  kindDefs:          Map<string, KindDefinitionView>  // passed through for the Binder
  instanceSymbols:   Map<string, ArchSymbol[]>   // kindTypeName → instance symbols
  resolvedFiles:     Map<string, string[]>       // location → file list
  instanceTypeNames: Map<string, string>         // "app" → "CleanContext"
  errors:            string[]                    // non-fatal parse errors
}
```

**Early exit (in orchestrator):** If `symbols.length === 0`, returns `{ ok: false, error: 'No Kind definitions found.' }`.

---

### Stage 3: Bind

**Service:** `BindService`
**Purpose:** Generate `Contract[]` from Kind constraint trees via `ConstraintProvider` plugins.

#### Generate contracts from explicit constraints

For each Kind that has instances, the binder calls `walkConstraints()` on the Kind's constraint `TypeNodeView`.

`walkConstraints()` recursively traverses the constraint tree, building **dotted property names** as it descends:

```
walkConstraints(view, instanceSymbol, ..., namePrefix=""):
  For each property in the object view:
    fullName = namePrefix ? namePrefix + "." + prop.name : prop.name

    If value is 'object' → RECURSE with fullName as new prefix
      e.g., { filesystem: { exists: [...] } }
        → recurse into "filesystem" → find "exists" → fullName = "filesystem.exists"

    If value is leaf → look up plugin by fullName
      → pluginsByName.get("filesystem.exists") → existsPlugin
      → plugin.generate(value, instanceSymbol, kindName, location) → Contract[]
```

Each plugin's `generate()` function resolves member names from the constraint value to actual `ArchSymbol` objects via `instanceSymbol.findByPath()` and creates `Contract` objects.

Two shared helper functions handle the common patterns:
- `generateFromTuplePairs()` — for `[["a", "b"]]` style constraints (noDependency, mustImplement, mirrors)
- `generateFromStringList()` — for `["a", "b"]` style constraints (noCycles, exists)

**Special case:** Intrinsic-only constraints (those with `intrinsic` but no `generate` on the plugin, like `pure`) are **skipped** here — they're handled in the propagation phase.

#### Propagate intrinsic constraints

After generating explicit contracts, the binder propagates **intrinsic constraints** from member Kinds to their parent instances.

```
For each Kind definition with instances:
  For each member property of the Kind:
    Look up the member's own Kind definition
    If that Kind has constraints:
      For each plugin with an intrinsic handler:
        If plugin.intrinsic.detect(memberKindConstraints) → true:
          Find the member's ArchSymbol in the instance tree
          Call plugin.intrinsic.propagate(memberSymbol, memberName, location)
          Deduplicate: skip if identical contract already exists
          Add resulting Contract to the list
```

Currently only `purityPlugin` has intrinsic behavior:
- `detect()` checks if the constraint tree has a `pure: boolean` property
- `propagate()` creates a `Purity` contract targeting the specific member symbol

This is how `pure: true` on a leaf Kind (like `DomainLayer`) automatically applies purity checking to every instance that uses it as a member.

#### Bind output

```
BindResult {
  contracts: Contract[]   // all generated contracts
  errors:    string[]     // non-fatal binding errors
}
```

---

### Stage 4: Check

**Service:** `CheckerService`
**Purpose:** Evaluate each contract against the resolved project and produce diagnostics.

#### Build CheckContext

The service builds a shared context that all plugins receive:

```
CheckContext {
  tsPort:        TypeScriptPort                // for import resolution, interface analysis
  program:       Program                       // the ts.Program from the orchestrator
  checker:       TypeChecker                   // from tsPort.getTypeChecker(program)
  resolvedFiles: Map<string, string[]>         // from Stage 2 (Parse)
}
```

#### Contract validation

For each contract, the dispatcher:

1. **Looks up the plugin** by `contract.type` from a `Map<ContractType, ContractPlugin>`
2. **Validates the args** by calling `plugin.validate(contract.args)`
   - Returns `null` if valid, or an error message string
   - If invalid, emits an `InvalidContract` diagnostic (code 70099) and skips checking

#### Contract checking

For valid contracts, the dispatcher calls `plugin.check(contract, context)`.

Each plugin implements its own checking logic using the `CheckContext`. The shared helper `getSourceFilesForPaths()` resolves file paths to `SourceFile` objects from the TypeScript program.

**How each plugin uses the context:**

| Plugin | resolvedFiles | tsPort methods | Domain utils |
|---|---|---|---|
| `noDependency` | Get files for both symbols | `getImports(sf, checker)` — compiler-resolved import edges | `isFileInSymbol()` — path containment check |
| `purity` | Get files for the symbol | `getImportModuleSpecifiers(program, sf)` — raw specifier strings | `NODE_BUILTINS` set membership |
| `noCycles` | Get files for all symbols | `getImports(sf, checker)` — build dependency graph | `findCycles()` — cycle detection algorithm |
| `mustImplement` | Get files for both symbols | `getExportedInterfaceNames(program, sf)` + `hasClassImplementing(program, sf, name)` | — |
| `exists` | `resolvedFiles.has(location)` | — | — |
| `mirrors` | Get files for both symbols | — | `relativePath()` — compare path structures |

Each plugin returns:

```
CheckResult {
  diagnostics:   Diagnostic[]     // violations found
  filesAnalyzed: number           // count of files inspected
}
```

#### Check output

The dispatcher aggregates results from all plugins:

```
CheckerResponse {
  diagnostics:      Diagnostic[]   // all violations
  contractsChecked: number         // total contracts evaluated
  violationsFound:  number         // diagnostics.length
  filesAnalyzed:    number         // sum across all plugins
}
```

---

### Pipeline Output

`PipelineService` aggregates errors from all four stages and returns a discriminated union:

```
PipelineSuccess {
  ok:                    true
  diagnostics:           Diagnostic[]
  contractsChecked:      number
  filesAnalyzed:         number
  classificationErrors:  string[]     // aggregated from scan + parse + bind
}

PipelineError {
  ok:    false
  error: string
}
```

Both the CLI and the IDE plugin delegate to `PipelineService`. The apps layer only handles presentation:
- **CLI** — formats diagnostics for terminal output, sets exit code
- **Plugin** — filters diagnostics for the currently open file, converts to `ts.Diagnostic` format

---

## Layer Architecture

KindScript itself follows strict Clean Architecture:

```
Domain Layer (pure, zero dependencies)
  ↑ depends on
Application Layer (ports + pipeline: scan → parse → bind → check)
  ↑ implements
Infrastructure Layer (shared driven adapters only)
Apps Layer (CLI + Plugin — each with own ports, adapters, use cases)
```

### Domain Layer

Pure business logic with zero external dependencies — no TypeScript compiler API, no Node.js `fs`.

- **Entities:** `ArchSymbol`, `Contract`, `Diagnostic`, `Program`
- **Value Objects:** `ImportEdge`, `ContractReference`
- **Types:** `ArchSymbolKind`, `ContractType`, `CompilerOptions`
- **Constants:** `DiagnosticCode`, `NodeBuiltins`
- **Utilities:** cycle detection, path matching

### Application Layer

Use cases and port interfaces. Organized as a four-stage pipeline:

- **Ports:** `CompilerPort` + `CodeAnalysisPort` (= `TypeScriptPort`), `FileSystemPort`, `ConfigPort`, `ASTViewPort` — driven port interfaces
- **Pipeline:**
  - `ScanService` — AST extraction via `ASTViewPort`
  - `ParseService` — ArchSymbol tree construction + file resolution
  - `BindService` — Contract generation via `ConstraintProvider` plugins
  - `CheckerService` — Contract evaluation via `ContractPlugin` implementations
  - `PipelineService` — orchestrator (caching + stage chaining, delegates program setup to `ProgramFactory`)
  - `ProgramFactory` — config reading, file discovery, TS program creation (behind `ProgramPort` interface)
- **Engine:** `Engine` interface bundling shared services (`pipeline` + `plugins`)

### Infrastructure Layer

Shared driven adapters only:

- `TypeScriptAdapter` — wraps `ts.Program` and `ts.TypeChecker`
- `FileSystemAdapter` — wraps Node.js `fs` and `path`
- `ASTAdapter` — wraps `ts.Node` traversal with type checker queries
- `ConfigAdapter` — reads `tsconfig.json` and `kindscript.json`
- `createEngine()` — factory that wires all shared services

### Apps Layer

Product entry points, each with their own ports, adapters, and use cases:

- **CLI** (`apps/cli/`) — `CheckCommand`, `ConsolePort`, `DiagnosticPort`
- **Plugin** (`apps/plugin/`) — TS language service plugin with `GetPluginDiagnostics`, `GetPluginCodeFixes`

---

## Source Layout

```
src/
  types/index.ts                              # Public API (Kind, Constraints, Instance, MemberMap)
  domain/                                     # Pure, zero dependencies
    entities/                                 # ArchSymbol, Contract, Diagnostic, Program
    value-objects/                            # ImportEdge, ContractReference
    types/                                    # ArchSymbolKind, ContractType
    constants/                                # DiagnosticCode, NodeBuiltins
    utils/                                    # cycle-detection, path-matching
  application/
    ports/                                    # 4 driven ports
    pipeline/
      scan/                                   # Stage 1: AST extraction
        scan.service.ts
        scan.types.ts                         # ScanRequest, ScanResult, ScanUseCase
      parse/                                  # Stage 2: ArchSymbol trees + file resolution
        parse.service.ts
        parse.types.ts                        # ParseResult, ParseUseCase
      bind/                                   # Stage 3: Contract generation
        bind.service.ts
        bind.types.ts                         # BindResult, BindUseCase
      check/                                  # Stage 4: Contract evaluation
        checker.service.ts
        checker.use-case.ts                   # CheckerUseCase interface
        checker.request.ts
        checker.response.ts
      plugins/                                # Contract plugin system (shared by bind + check)
        constraint-provider.ts                # ConstraintProvider interface
        contract-plugin.ts                    # ContractPlugin interface + helpers
        plugin-registry.ts                    # createAllPlugins()
        generator-helpers.ts                  # Shared generate() helpers
        no-dependency/                        # noDependencyPlugin
        purity/                               # purityPlugin (intrinsic)
        no-cycles/                            # noCyclesPlugin
        must-implement/                       # mustImplementPlugin
        exists/                               # existsPlugin
        mirrors/                              # mirrorsPlugin
      views.ts                                # Pipeline view DTOs (TypeNodeView, etc.)
      program.ts                              # ProgramPort, ProgramFactory, ProgramSetup
      pipeline.service.ts                     # Orchestrator (caching + 4 stages)
      pipeline.types.ts                       # PipelineUseCase, PipelineResponse
    engine.ts                                 # Engine interface
  infrastructure/                             # Shared driven adapters only
    typescript/typescript.adapter.ts
    filesystem/filesystem.adapter.ts
    config/config.adapter.ts
    ast/ast.adapter.ts
    engine-factory.ts                         # createEngine()
  apps/
    cli/                                      # CLI entry point + commands
      ports/                                  # ConsolePort, DiagnosticPort
      adapters/                               # CLIConsoleAdapter, CLIDiagnosticAdapter
      commands/check.command.ts
    plugin/                                   # TS language service plugin
      ports/                                  # LanguageServicePort
      adapters/                               # LanguageServiceAdapter
      use-cases/                              # GetPluginDiagnostics, GetPluginCodeFixes
      language-service-proxy.ts
      diagnostic-converter.ts
```

---

## Key Data Types

### ArchSymbol

The core domain entity — a named architectural unit classified from the AST:

```typescript
class ArchSymbol {
  readonly name: string;                       // symbol name (e.g., "domain", "app")
  readonly kind: ArchSymbolKind;               // Kind | Instance | Member
  readonly declaredLocation?: string;          // derived filesystem path
  readonly members: Map<string, ArchSymbol>;   // child symbols (hierarchical)
  readonly kindTypeName?: string;              // the Kind type this instantiates
  readonly locationDerived?: boolean;          // true if location was derived, not explicit
}
```

Key methods: `findMember(name)`, `findByPath("a.b.c")`, `descendants()` (generator), `getAllMembers()`.

### Contract

A constraint declared on a Kind type, ready for evaluation:

```typescript
class Contract {
  readonly type: ContractType;    // NoDependency | MustImplement | Purity | NoCycles | Exists | Mirrors
  readonly name: string;          // human-readable label, e.g., "noDependency(domain -> infrastructure)"
  readonly args: ArchSymbol[];    // member symbols this contract references
  readonly location?: string;     // where this contract was defined (for error messages)
}
```

### Diagnostic

KindScript's violation format, compatible with TypeScript diagnostics:

```typescript
class Diagnostic {
  readonly message: string;                    // human-readable error
  readonly code: number;                       // 70001–70099
  readonly file: string;                       // file path (empty string for structural violations)
  readonly line: number;                       // 1-indexed (0 for structural)
  readonly column: number;                     // 0-indexed
  readonly relatedContract?: ContractReference;
  readonly scope?: string;                     // scope label for structural violations
}
```

Diagnostic codes:

```
KS70001  Forbidden dependency         (noDependency)
KS70002  Missing implementation        (mustImplement)
KS70003  Impure import in pure layer   (purity)
KS70004  Circular dependency           (noCycles)
KS70005  Missing counterpart file      (filesystem.mirrors)
KS70010  Member directory not found    (filesystem.exists)
KS70099  Invalid contract              (malformed constraint)
```

### TypeNodeView

The structural view of constraint type arguments, extracted from the AST:

```typescript
type TypeNodeView =
  | { kind: 'boolean' }                                              // true / false
  | { kind: 'stringList'; values: string[] }                         // ["a", "b"]
  | { kind: 'tuplePairs'; values: [string, string][] }               // [["a", "b"]]
  | { kind: 'object'; properties: Array<{ name: string; value: TypeNodeView }> }  // { x: ... }
```

### ContractPlugin

The full plugin interface for contract enforcement:

```typescript
interface ContractPlugin extends ConstraintProvider {
  readonly type: ContractType;
  readonly diagnosticCode: number;
  validate(args: ArchSymbol[]): string | null;
  check(contract: Contract, ctx: CheckContext): CheckResult;
  codeFix?: { fixName: string; description: string };
}
```

Extends `ConstraintProvider` (used by the bind stage):

```typescript
interface ConstraintProvider {
  readonly constraintName: string;                       // e.g., "noDependency", "filesystem.exists"
  generate?: (value, instanceSymbol, ...) => GeneratorResult;
  intrinsic?: {
    detect(view: TypeNodeView): boolean;
    propagate(memberSymbol, memberName, location): Contract;
  };
}
```

---

## IDE Integration

KindScript uses the TypeScript Language Service Plugin API — not a custom LSP server. The plugin intercepts `getSemanticDiagnostics` and `getCodeFixesAtPosition` to add architectural diagnostics alongside type errors.

**Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "plugins": [{ "name": "kindscript" }]
  }
}
```

Every editor using tsserver (VS Code, Vim, Emacs, WebStorm) gets KindScript support immediately with zero editor-specific integration.

The CLI (`ksc check`) provides the same checks for CI pipelines.
