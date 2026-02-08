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
                                               } satisfies InstanceConfig<CleanContext>

          TS checks: "does value                KS checks: "does codebase
           match the type?"                      match the architecture?"
```

## How It Works

KindScript extends TypeScript's own compiler pipeline. It reuses the scanner, parser, and type checker, then adds three new phases for architectural analysis:

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

KindScript produces standard `ts.Diagnostic` objects (error codes 70001-70010), so violations appear alongside regular TypeScript errors in your editor and CI pipeline.

## Quick Start

### 1. Install

```bash
npm install kindscript
```

### 2. Define your architecture (`src/context.k.ts`)

```typescript
import type { Kind, ConstraintConfig, InstanceConfig, MemberMap } from 'kindscript';

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
// Root is inferred from this .k.ts file's directory (src/)
export const ordering = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
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

## Contract Types

KindScript enforces six contract types, organized into dependency, behavioral, and filesystem categories:

```
  +------------------------------------------------------------+
  | Contract         | What it checks                          |
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

Each contract type produces a specific diagnostic code:

```
  KS70001  Forbidden dependency         (noDependency)
  KS70002  Missing implementation        (mustImplement)
  KS70003  Impure import in pure layer   (purity)
  KS70004  Circular dependency           (noCycles)
  KS70005  Missing counterpart file      (filesystem.mirrors)
  KS70010  Member directory not found    (filesystem.exists)
```

## Adoption Tiers

KindScript offers a graduated adoption path -- start simple, add complexity only when needed:

```
  Tier 1                     Tier 2
  Config-based contracts     Full Kind definitions
  ========================   =========================

  kindscript.json:           context.k.ts:
  {                          type CleanContext = Kind<
    "contracts": {             "CleanContext", {
      "noDependency": [          domain: DomainLayer;
        ["domain", "infra"]       ...
        ...                   }>
      ]                      }, {
    }                          noDependency: [...];
  }                          }>;
                             { ... } satisfies InstanceConfig<T>
  Good for:
  - Simple dependency rules   Good for:
  - No TypeScript types       - Full IDE support
    needed                    - Type-safe definitions
                              - All contract types
                              - Autocomplete + go-to-def
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
  |   Value Objects:  ImportEdge, Location, ...                           |
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
  |   Ports:                                                              |
  |     TypeScriptPort    FileSystemPort    ConfigPort                    |
  |     ASTPort           DiagnosticPort    LanguageServicePort           |
  |                                                                       |
  |   Use Cases (5):                                                      |
  |     CheckContracts        ClassifyAST          ClassifyProject        |
  |     GetPluginDiagnostics  GetPluginCodeFixes                          |
  |                                                                       |
  +----------------------------------+------------------------------------+
                                     |
                                     | implements ports
                                     |
  +----------------------------------+------------------------------------+
  |                                                                       |
  |   Infrastructure Layer (adapters + entry points)                      |
  |   ======================================================              |
  |                                                                       |
  |   Adapters:                                                           |
  |     TypeScriptAdapter  (wraps ts.Program, ts.TypeChecker)             |
  |     FileSystemAdapter  (wraps Node.js fs + path)                      |
  |     ASTAdapter         (wraps ts.Node traversal)                      |
  |     ConfigAdapter      (reads kindscript.json / tsconfig.json)        |
  |     DiagnosticAdapter  (formats diagnostics for terminal)             |
  |     LanguageServiceAdapter (wraps ts.server.PluginCreateInfo)         |
  |                                                                       |
  |   Entry Points (composition roots):                                   |
  |     CLI  (main.ts)  -----> ksc check                                 |
  |     Plugin (index.ts) ---> TS language service plugin                 |
  |                                                                       |
  +-----------------------------------------------------------------------+
```

### Source Layout

```
src/
  index.ts                        Public API (exports Kind, ConstraintConfig, InstanceConfig, MemberMap)
  runtime/
    kind.ts                       Kind<N, Members, Constraints> + ConstraintConfig<Members>
    locate.ts                     MemberMap<T> + InstanceConfig<T>

  domain/
    entities/                     ArchSymbol, Contract, Diagnostic, ...
    value-objects/                ImportEdge, Location, ...
    types/                       ArchSymbolKind, ContractType, ...

  application/
    ports/                       TypeScriptPort, FileSystemPort, ...
    services/                    ConfigSymbolBuilder, resolveSymbolFiles
    use-cases/
      check-contracts/           Contract evaluation (all 6 types)
      classify-ast/              AST -> ArchSymbol classification
      classify-project/          Project-wide classification + config
      get-plugin-diagnostics/    Plugin diagnostic integration
      get-plugin-code-fixes/     Plugin quick-fix suggestions

  infrastructure/
    adapters/                    Real implementations + mock test doubles
    cli/                         CLI entry point + commands
    plugin/                      TS language service plugin

tests/
  unit/                          Domain entity, service, and adapter unit tests
  integration/                   Multi-component tests with 18 fixtures
  e2e/                           Full CLI subprocess tests
  helpers/                       Shared test utilities and builders
```

## Development

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript
npm test                 # Run all tests (29 test files, 278 tests)
npm run test:coverage    # Run with coverage report
npm run test:watch       # Watch mode
npm run lint             # ESLint

# Run specific test layers
npm test -- tests/unit         # Unit tests only (fast)
npm test -- tests/integration  # Integration tests only
npm test -- tests/e2e          # E2E tests only

# Run specific test file
npm test -- no-dependency.checker
```

### Testing

KindScript has a comprehensive test suite achieving **100% pass rate**:

```
  tests/
    unit/             24 files - Component tests with mocked dependencies
    integration/      3 files  - Multi-component tests with 18 fixtures
    e2e/              1 file   - Full CLI subprocess tests
    helpers/          4 files  - Shared test utilities and builders
```

**Test Organization:**
- **Unit tests** - Fast, isolated tests for domain entities, services, and adapters
- **Integration tests** - Real TypeScript compiler + file system with fixture directories
- **E2E tests** - Complete CLI workflows via subprocess invocation

**Coverage thresholds** are strictly enforced:
- Domain layer: 90% lines/functions, 75% branches
- Application layer: 95% lines, 100% functions, 85% branches

See **[tests/README.md](tests/README.md)** for complete testing documentation, including how to run tests, write new tests, and use shared utilities.

### Interactive Notebooks

Jupyter notebooks in `notebooks/` provide interactive walkthroughs:

```
01-quickstart.ipynb       From zero to enforced architecture (define, check)
02-contracts.ipynb        All 6 contract types with examples
```

## Why KindScript?

Architectural rules typically live in documentation, wiki pages, and senior engineers' heads. They drift. New developers violate them unknowingly. PR reviews catch some violations, after the code is already written.

KindScript moves architectural rules into the compiler:

- Violations caught in the IDE, before commit
- Refactoring-safe -- rename a layer and all violations surface
- Self-documenting -- `.k.ts` files are the source of truth
- Gradual adoption -- works on existing codebases, two tiers of investment
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

All core functionality is implemented and tested. See [DONE_VS_TODO.md](docs/status/DONE_VS_TODO.md) for the detailed breakdown.

**What's working:**
- All 6 contract types (noDependency, mustImplement, purity, noCycles, filesystem.exists, filesystem.mirrors)
- CLI with 1 command (check)
- TypeScript language service plugin (inline diagnostics + code fix suggestions)
- AST classifier (Kind definitions and instances)
- 29 test suites, 100% passing

**What's next:**
- Watch mode and incremental compilation (`.ksbuildinfo` caching)
- Plugin code fix auto-application (currently description-only)
- Diagnostic `relatedInformation` linking to contract definitions
- npm publishing pipeline

## Documentation

- [Architecture V4](docs/architecture/COMPILER_ARCHITECTURE.md) -- Full architectural specification
- [Status: Done vs TODO](docs/status/DONE_VS_TODO.md) -- Implementation progress
- [Build Plan](docs/architecture/BUILD_PLAN.md) -- Milestone roadmap
- [Design Decisions](docs/architecture/DESIGN_DECISIONS.md) -- Build/Wrap/Skip rationale

## License

MIT
