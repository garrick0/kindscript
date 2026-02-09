# Architecture

> System overview, compiler pipeline, layers, and data flow.

---

## Core Concept

KindScript is an architectural enforcement tool that extends TypeScript's compiler pipeline. Just as TypeScript validates values against types, KindScript validates codebases against architectural patterns — dependency rules, purity constraints, port/adapter completeness, and more.

KindScript produces standard `ts.Diagnostic` objects (error codes 70001–70010), so violations appear alongside regular TypeScript errors in your editor and CI pipeline.

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
| Diagnostic format | **Reuse** | `ts.Diagnostic` with codes 70001–70010 |
| IDE integration | **Wrap** | TypeScript Language Service Plugin API |
| KS Binder (Classifier) | **Build** | Classifies Kind definitions and instances |
| Symbol-to-files resolution | **Build** | Maps architectural declarations to filesystem |
| KS Checker (Contracts) | **Build** | Evaluates 6 contract types |

---

## The Four Pipeline Stages

### Stage 1: Orchestration (ClassifyProjectService)

Creates a TypeScript program from `tsconfig.json`, discovers source files, and coordinates the pipeline.

**Input:** Project path
**Output:** `SourceFile[]` + `ts.Program` + settings

### Stage 2: Classification (ClassifyASTService — "the Binder")

Walks the TypeScript AST using the type checker to find:
1. **Kind definitions** — `type X = Kind<"X", Members, Constraints>` type aliases
2. **Instance declarations** — `satisfies InstanceConfig<T>` expressions

For each, it creates `ArchSymbol` objects with derived filesystem locations and `Contract` objects from the constraint type parameters.

**Input:** `SourceFile[]` + `TypeChecker`
**Output:** `ArchSymbol[]` + `Contract[]`

**Key principle:** The binder does NOT query the filesystem. It classifies and records. All validation happens in the checker.

### Stage 2.5: File Resolution (resolveSymbolFiles)

Maps each `ArchSymbol`'s derived location to actual files on disk. Walks the symbol tree and calls `readDirectory()` for each member path.

**Input:** `ArchSymbol[]` + `FileSystemPort`
**Output:** `Map<string, string[]>` (location → file list)

### Stage 3: Checking (CheckContractsService — "the Checker")

Evaluates each contract against the resolved files and import graph. Each contract type is implemented as a `ContractPlugin` that receives pre-resolved data and produces diagnostics.

**Input:** `Contract[]` + `ArchSymbol[]` + resolved files + `TypeScriptPort`
**Output:** `Diagnostic[]`

---

## Layer Architecture

KindScript itself follows strict Clean Architecture:

```
Domain Layer (pure, zero dependencies)
  ↑ depends on
Application Layer (ports + classification + enforcement)
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

Use cases and port interfaces. Organized by capability:

- **Ports:** `TypeScriptPort`, `FileSystemPort`, `ConfigPort`, `ASTPort` — driven port interfaces
- **Classification:** `ClassifyASTService` (AST → ArchSymbol), `ClassifyProjectService` (project-wide)
- **Enforcement:** `CheckContractsService` + 6 contract plugins
- **Engine:** `Engine` interface bundling shared services

### Infrastructure Layer

Shared driven adapters only:

- `TypeScriptAdapter` — wraps `ts.Program` and `ts.TypeChecker`
- `FileSystemAdapter` — wraps Node.js `fs` and `path`
- `ASTAdapter` — wraps `ts.Node` traversal with type checker queries
- `ConfigAdapter` — reads `tsconfig.json`
- `createEngine()` — factory that wires all shared services

### Apps Layer

Product entry points, each with their own ports, adapters, and use cases:

- **CLI** (`apps/cli/`) — `CheckCommand`, `ConsolePort`, `DiagnosticPort`
- **Plugin** (`apps/plugin/`) — TS language service plugin with `GetPluginDiagnostics`, `GetPluginCodeFixes`

---

## Source Layout

```
src/
  types/index.ts                              # Public API (Kind, ConstraintConfig, InstanceConfig, MemberMap)
  domain/                                     # Pure, zero dependencies
    entities/                                 # ArchSymbol, Contract, Diagnostic, Program
    value-objects/                            # ImportEdge, ContractReference
    types/                                    # ArchSymbolKind, ContractType
    constants/                                # DiagnosticCode, NodeBuiltins
    utils/                                    # cycle-detection, path-matching
  application/
    ports/                                    # 4 driven ports
    classification/
      classify-ast/                           # AST → ArchSymbol
      classify-project/                       # Project-wide classification + config
    enforcement/
      check-contracts/                        # Contract validation (plugin per type)
    services/                                 # resolveSymbolFiles
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
interface ArchSymbol {
  readonly name: string;
  readonly symbolKind: ArchSymbolKind;  // KindDefinition | Instance | Member
  readonly declaredLocation?: string;   // derived filesystem path
  readonly members: ArchSymbol[];       // child symbols
  readonly contracts: Contract[];       // from Kind's 3rd type parameter
}
```

### Contract

A constraint declared on a Kind type, ready for evaluation:

```typescript
interface Contract {
  readonly type: ContractType;          // noDependency | mustImplement | purity | ...
  readonly args: ArchSymbol[];          // member symbols this contract references
  readonly sourceSymbol: ArchSymbol;    // the Kind instance that owns this contract
}
```

### Diagnostic

Standard `ts.Diagnostic` format with KindScript-specific codes:

```
KS70001  Forbidden dependency         (noDependency)
KS70002  Missing implementation        (mustImplement)
KS70003  Impure import in pure layer   (purity)
KS70004  Circular dependency           (noCycles)
KS70005  Missing counterpart file      (filesystem.mirrors)
KS70010  Member directory not found    (filesystem.exists)
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
