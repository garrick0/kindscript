# KindScript

> **TypeScript for Architecture** -- Define architectural patterns as types, enforce them at compile time.

KindScript is an architectural enforcement tool that plugs into the TypeScript compiler. Just as TypeScript validates that values conform to types, KindScript validates that codebases conform to architectural patterns -- dependency rules, purity constraints, port/adapter completeness, and more.

```
                 TypeScript                            KindScript
          ========================             ========================

          type User = {                        type CleanContext = Kind<
            name: string;                          "CleanContext", {
            age: number;                             domain: DomainLayer;
          }                                          application: ApplicationLayer;
                                                     infrastructure: InfrastructureLayer;
                                                 }>

          const user: User = {                 export const ordering = {
            name: "Alice",                       domain: { ... },
            age: 30,                             application: { ... },
          }                                      infrastructure: { ... },
                                               } satisfies Instance<CleanContext>

          TS checks: "does value                KS checks: "does codebase
           match the type?"                      match the architecture?"
```

## How It Works

KindScript extends TypeScript's own compiler pipeline. It reuses the scanner, parser, and type checker, then adds four new stages for architectural analysis:

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
  ================================== | ======   KindScript stages begin
                                     |
                              +------+------+
                              | KS Scanner  |   Extract Kind definitions
                              +------+------+   and instance declarations
                                     |
                                 ScanResult
                                     |
                              +------+------+
                              | KS Parser   |   Build ArchSymbol trees,
                              +------+------+   resolve file locations
                                     |
                                ParseResult
                                     |
                              +------+------+
                              | KS Binder   |   Generate Contracts from
                              +------+------+   constraint trees
                                     |
                                 BindResult
                                     |
                              +------+------+
                              | KS Checker  |   Evaluate contracts against
                              +------+------+   resolved files and imports
                                     |
                               ts.Diagnostic    (same format as TS errors)
                                     |
                    +----------------+----------------+
                    |                |                |
               CLI output      IDE squiggles    CI exit code
               (ksc check)     (TS plugin)      (process.exit)
```

KindScript produces standard `ts.Diagnostic` objects (error codes 70001-70010), so violations appear alongside regular TypeScript errors in your editor and CI pipeline.

## Quick Start

### 1. Install

```bash
npm install kindscript
```

### 2. Define your architecture (`src/context.ts`)

```typescript
import type { Kind, Constraints, Instance, MemberMap } from 'kindscript';

// Define the pattern (normative -- what the architecture MUST look like)
export type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
export type ApplicationLayer = Kind<"ApplicationLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "infrastructure"],  // domain cannot import from infrastructure
    ["domain", "application"],     // domain cannot import from application
  ];
  mustImplement: [["domain", "infrastructure"]];
}>;

// Declare the instance (descriptive -- where the code ACTUALLY lives)
// Root is inferred from this file's directory (src/)
export const ordering = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<OrderingContext>;
```

### 3. Check contracts

```bash
$ ksc check
src/ordering/domain/service.ts:12:1 - error KS70001: Forbidden dependency: domain -> infrastructure

  12 import { Db } from '../../infrastructure/database';
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 1 architectural violation.
```

### 4. Enable the IDE plugin (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "kindscript" }]
  }
}
```

Violations now appear inline in VS Code, Vim, Emacs, WebStorm -- any editor using tsserver.

## CLI Commands

```
ksc check [path]                   Check architectural contracts
```

**`ksc check`** -- Validates all contracts against the codebase. Returns exit code 1 on violations (CI-ready).

## Constraint Types

KindScript enforces six constraint types, organized into dependency, behavioral, and filesystem categories:

```
  +------------------------------------------------------------+
  | Constraint       | What it checks                          |
  |------------------+-----------------------------------------|
  | noDependency     | Layer A cannot import from Layer B      |
  | mustImplement    | Every port interface has an adapter      |
  | purity           | Layer has no side-effect imports         |
  |                  | (no fs, http, crypto, etc.)              |
  | noCycles         | No circular dependencies between layers  |
  | filesystem.exists| Member directories exist on disk         |
  | filesystem.mirrors| Related files exist in parallel dirs    |
  |                  | (e.g. every component has a test)        |
  +------------------------------------------------------------+
```

Each constraint type produces a specific diagnostic code:

```
  KS70001  Forbidden dependency         (noDependency)
  KS70002  Missing implementation        (mustImplement)
  KS70003  Impure import in pure layer   (purity)
  KS70004  Circular dependency           (noCycles)
  KS70005  Missing counterpart file      (filesystem.mirrors)
  KS70010  Member directory not found    (filesystem.exists)
```

## Architecture

KindScript itself follows strict Clean Architecture. The domain layer has zero external dependencies -- no TypeScript compiler API, no Node.js `fs`, nothing.

```
  +-----------------------------------------------------------------------+
  |                                                                       |
  |   Domain Layer (pure business logic, zero dependencies)               |
  |   =====================================================               |
  |                                                                       |
  |   Entities:       ArchSymbol, Contract, Diagnostic, Program           |
  |   Value Objects:  ImportEdge, ContractReference, ...                  |
  |   Types:          ArchSymbolKind, ContractType                        |
  |                                                                       |
  +----------------------------------+------------------------------------+
                                     |
                                     | depends on (inward only)
                                     |
  +----------------------------------+------------------------------------+
  |                                                                       |
  |   Application Layer (use cases + port interfaces)                     |
  |   ===================================================                 |
  |                                                                       |
  |   Ports (shared):                                                     |
  |     TypeScriptPort    FileSystemPort    ConfigPort    ASTPort         |
  |                                                                       |
  |   Pipeline (4 stages):                                                |
  |     Scanner → Parser → Binder → Checker (6 plugins)                  |
  |   PipelineService (orchestrator)                                     |
  |   Engine interface (bundles shared services)                          |
  |                                                                       |
  +----------------------------------+------------------------------------+
                                     |
                                     | implements ports
                                     |
  +----------------------------------+------------------------------------+
  |                                                                       |
  |   Infrastructure Layer (shared adapters)                              |
  |   ======================================================              |
  |                                                                       |
  |   Adapters:                                                           |
  |     TypeScriptAdapter  (wraps ts.Program, ts.TypeChecker)             |
  |     FileSystemAdapter  (wraps Node.js fs + path)                      |
  |     ASTAdapter         (wraps ts.Node traversal)                      |
  |     ConfigAdapter      (reads kindscript.json / tsconfig.json)        |
  |   Engine Factory (wires all shared adapters + services)               |
  |                                                                       |
  +----------------------------------+------------------------------------+
                                     |
                                     | used by
                                     |
  +----------------------------------+------------------------------------+
  |                                                                       |
  |   Apps (product entry points)                                         |
  |   ======================================================              |
  |                                                                       |
  |   CLI (apps/cli/):                                                    |
  |     ConsolePort, DiagnosticPort, CheckCommand                         |
  |   Plugin (apps/plugin/):                                              |
  |     LanguageServicePort, GetPluginDiagnostics, GetPluginCodeFixes     |
  |                                                                       |
  +-----------------------------------------------------------------------+
```

### Source Layout

```
src/
  types/index.ts                  Public API (Kind, Constraints, Instance, MemberMap)

  domain/
    entities/                     ArchSymbol, Contract, Diagnostic, ...
    value-objects/                ImportEdge, ContractReference, ...
    types/                       ArchSymbolKind, ContractType, ...

  application/
    ports/                       TypeScriptPort, FileSystemPort, ConfigPort, ASTPort
    pipeline/
      scan/                      AST extraction (Kind defs + instances)
      parse/                     ArchSymbol tree construction + file resolution
      bind/                      Contract generation from constraint trees
      check/                     Contract evaluation (dispatcher)
      plugins/                   Contract plugin system (6 plugins, shared by bind + check)
      views.ts                   Pipeline view DTOs (TypeNodeView, KindDefinitionView, etc.)
      program.ts                 ProgramPort, ProgramFactory (config + program setup)
      pipeline.service.ts        Orchestrator (caching + 4 stages)
    engine.ts                    Engine interface (shared services)

  infrastructure/                Shared driven adapters only
    typescript/                  TypeScriptAdapter (wraps ts.Program)
    filesystem/                  FileSystemAdapter (wraps fs)
    config/                      ConfigAdapter (reads configs)
    ast/                         ASTAdapter (wraps ts.Node traversal)
    engine-factory.ts            Creates Engine with all shared wiring

  apps/
    cli/                         CLI entry point + commands
      ports/                     ConsolePort, DiagnosticPort
      adapters/                  CLIConsoleAdapter, CLIDiagnosticAdapter
      commands/                  CheckCommand
    plugin/                      TS language service plugin
      ports/                     LanguageServicePort
      adapters/                  LanguageServiceAdapter
      use-cases/                 GetPluginDiagnostics, GetPluginCodeFixes

tests/
  domain/                        Domain entity tests (5 files)
  application/                   Classification + enforcement tests (11 files)
  infrastructure/                Shared adapter tests (2 files)
  cli/unit/                      CLI command tests (2 files)
  cli/e2e/                       CLI subprocess tests (1 file)
  plugin/unit/                   Plugin service tests (5 files)
  integration/                   Multi-component tests with 19 fixtures
  helpers/                       Shared test utilities and builders
```

## Development

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript
npm test                 # Run all tests (29 test files, 276 tests)
npm run test:coverage    # Run with coverage report
npm run test:watch       # Watch mode
npm run lint             # ESLint

# Run specific test layers
npm test -- tests/domain        # Domain tests only
npm test -- tests/application   # Application tests only
npm test -- tests/integration   # Integration tests only
npm test -- tests/cli           # CLI tests (unit + E2E)
npm test -- tests/plugin        # Plugin tests only

# Run specific test file
npm test -- no-dependency.plugin
```

### Testing

KindScript has a comprehensive test suite achieving **100% pass rate**:

```
  tests/
    domain/           5 files  - Domain entity tests
    application/      11 files - Classification + enforcement tests
    infrastructure/   2 files  - Shared adapter tests
    cli/unit/         2 files  - CLI command tests
    cli/e2e/          1 file   - CLI subprocess tests
    plugin/unit/      5 files  - Plugin service tests
    integration/      3 files  - Multi-component tests with 19 fixtures
    helpers/          4 files  - Shared test utilities and builders
```

**Test Organization:**
- **Domain tests** - Pure domain entity tests (no external dependencies)
- **Application tests** - Classification and enforcement service tests
- **Infrastructure tests** - Shared adapter tests
- **CLI tests** - CLI command unit tests + E2E subprocess tests
- **Plugin tests** - Plugin service tests
- **Integration tests** - Real TypeScript compiler + file system with fixture directories

**Coverage thresholds** are strictly enforced:
- Domain layer: 90% lines/functions, 75% branches
- Application layer: 95% lines, 100% functions, 85% branches

See **[tests/README.md](tests/README.md)** for complete testing documentation, including how to run tests, write new tests, and use shared utilities.

### Interactive Notebooks

Jupyter notebooks in `notebooks/` provide interactive walkthroughs:

```
01-quickstart.ipynb          From zero to enforced architecture (define, check)
02-contracts.ipynb           All 6 constraint types with examples
04-bounded-contexts.ipynb    Multi-instance Kinds for bounded contexts
05-design-system.ipynb       Real-world enforcement on a design system codebase
```

## Why KindScript?

Architectural rules typically live in documentation, wiki pages, and senior engineers' heads. They drift. New developers violate them unknowingly. PR reviews catch some violations, after the code is already written.

KindScript moves architectural rules into the compiler:

- Violations caught in the IDE, before commit
- Refactoring-safe -- rename a layer and all violations surface
- Self-documenting -- definition files are the source of truth
- Gradual adoption -- works on existing codebases
- Zero runtime overhead -- compile-time only

**Comparison:**

```
  +---------------------+--------------------------+---------------------------+
  | Tool                | Approach                 | KindScript difference     |
  |---------------------+--------------------------+---------------------------|
  | ArchUnit (Java)     | Runtime reflection       | Compile-time, type-safe   |
  | dependency-cruiser  | Config-based rules       | Type-safe defs, IDE       |
  | Nx boundaries       | ESLint + tags            | TS-native, behavioral     |
  | Madge               | Visualization only       | Enforcement + validation  |
  +---------------------+--------------------------+---------------------------+
```

## Project Status

**Version:** `0.8.0-m8`

All core functionality is implemented and tested.

**What's working:**
- All 6 constraint types (noDependency, mustImplement, purity, noCycles, filesystem.exists, filesystem.mirrors)
- CLI with 1 command (check)
- TypeScript language service plugin (inline diagnostics + code fix suggestions)
- AST classifier (Kind definitions and instances)
- 29 test suites, 276 tests, 100% passing

**What's next:**
- Watch mode and incremental compilation (`.ksbuildinfo` caching)
- Plugin code fix auto-application (currently description-only)
- Diagnostic `relatedInformation` linking to contract definitions
- npm publishing pipeline

## Documentation

- [Architecture](docs/01-architecture.md) -- System overview, pipeline, layers
- [Kind System](docs/02-kind-system.md) -- Kind syntax, instances, discovery
- [Constraints](docs/03-constraints.md) -- All 6 constraint types
- [Decisions](docs/04-decisions.md) -- Build/Wrap/Skip rationale
- [Examples](docs/05-examples.md) -- Real-world modeling
- [CLAUDE.md](CLAUDE.md) -- Development guide for AI agents and contributors

## License

MIT
