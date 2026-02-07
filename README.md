# KindScript

> **TypeScript for Architecture** -- Define architectural patterns as types, enforce them at compile time.

KindScript is an architectural enforcement tool that plugs into the TypeScript compiler. Just as TypeScript validates that values conform to types, KindScript validates that codebases conform to architectural patterns -- dependency rules, purity constraints, port/adapter completeness, and more.

```
                 TypeScript                            KindScript
          ========================             ========================

          type User = {                        interface CleanContext
            name: string;                        extends Kind<"CleanContext"> {
            age: number;                           domain: DomainLayer;
          }                                        application: ApplicationLayer;
                                                   infrastructure: InfrastructureLayer;
                                                 }

          const user: User = {                 const ordering: CleanContext = {
            name: "Alice",                       kind: "CleanContext",
            age: 30,                             location: "src/ordering",
          }                                      domain: { ... },
                                                 application: { ... },
                                               }

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
                              | (Classifier)|   Kind definitions, instances,
                              +------+------+   and contracts
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

KindScript produces standard `ts.Diagnostic` objects (error codes 70001-70005), so violations appear alongside regular TypeScript errors in your editor and CI pipeline.

## Quick Start

### 1. Install

```bash
npm install kindscript
```

### 2. Define your architecture (`architecture.ts`)

```typescript
import { Kind, defineContracts } from 'kindscript';

// Define the pattern (normative -- what the architecture MUST look like)
export interface OrderingContext extends Kind<"OrderingContext"> {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}
export interface DomainLayer extends Kind<"DomainLayer"> {}
export interface ApplicationLayer extends Kind<"ApplicationLayer"> {}
export interface InfrastructureLayer extends Kind<"InfrastructureLayer"> {}

// Declare the instance (descriptive -- where the code ACTUALLY lives)
export const ordering: OrderingContext = {
  kind: "OrderingContext",
  location: "src/ordering",
  domain:         { kind: "DomainLayer",         location: "src/ordering/domain" },
  application:    { kind: "ApplicationLayer",    location: "src/ordering/application" },
  infrastructure: { kind: "InfrastructureLayer", location: "src/ordering/infrastructure" },
};

// Define behavioral contracts
export const contracts = defineContracts<OrderingContext>({
  noDependency: [
    ["domain", "infrastructure"],  // domain cannot import from infrastructure
    ["domain", "application"],     // domain cannot import from application
  ],
  purity: ["domain"],              // domain cannot use Node.js built-ins (fs, http, etc.)
  mustImplement: [
    ["domain", "infrastructure"],  // every interface in domain must have an implementation
  ],
});
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
ksc init --detect [--write]        Detect architecture, generate project references
ksc infer [path] [--write]         Infer Kind definitions from existing codebase
```

**`ksc check`** -- Validates all contracts against the codebase. Returns exit code 1 on violations (CI-ready).

**`ksc init --detect`** -- Analyzes directory structure and import graph, detects architectural patterns (Clean Architecture, Hexagonal, Layered), and generates `tsconfig.json` files with TypeScript project references for immediate boundary enforcement.

**`ksc infer`** -- Walks filesystem structure, analyzes imports, pattern-matches architecture, and generates a complete `architecture.ts` draft with Kind definitions and contracts.

## Contract Types

KindScript enforces five contract types:

```
  +------------------------------------------------------------+
  | Contract         | What it checks                          |
  |------------------+-----------------------------------------|
  | noDependency     | Layer A cannot import from Layer B      |
  | mustImplement    | Every port interface has an adapter      |
  | purity           | Layer has no side-effect imports         |
  |                  | (no fs, http, crypto, etc.)              |
  | noCycles         | No circular dependencies between layers  |
  | colocated        | Related files exist in parallel dirs     |
  |                  | (e.g. every component has a test)        |
  +------------------------------------------------------------+
```

Each contract type produces a specific diagnostic code:

```
  KS70001  Forbidden dependency         (noDependency)
  KS70002  Missing implementation        (mustImplement)
  KS70003  Impure import in pure layer   (purity)
  KS70004  Circular dependency           (noCycles)
  KS70005  Missing colocated file        (colocated)
```

## Adoption Tiers

KindScript offers a graduated adoption path -- start simple, add complexity only when needed:

```
  Tier 0.5                   Tier 1                     Tier 2
  Zero-config boundaries     Config-based contracts     Full Kind definitions
  ========================   ========================   =========================

  $ ksc init --detect        kindscript.json:           architecture.ts:
                             {                          interface CleanContext
  Generates tsconfig.json      "contracts": {             extends Kind<"..."> {
  with project references.       "noDependency": [          domain: DomainLayer;
  TypeScript enforces              ["domain", "infra"]       ...
  directory-level deps             ...                   }
  natively.                      ]                      defineContracts<...>({
                               }                          noDependency: [...],
  Good for:                  }                            purity: [...],
  - Quick start                                         })
  - Directory-aligned        Good for:
    boundaries               - Simple dependency rules   Good for:
  - No definitions needed    - No TypeScript types       - Full IDE support
                               needed                    - Type-safe definitions
                                                         - All contract types
                                                         - Autocomplete + go-to-def
```

## Standard Library

Pre-built pattern packages so you don't have to write definitions from scratch:

```bash
npm install @kindscript/clean-architecture
npm install @kindscript/hexagonal
npm install @kindscript/onion
```

Usage with a standard library package:

```typescript
import { CleanContext, cleanArchitectureContracts } from '@kindscript/clean-architecture';

export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain:         { kind: "DomainLayer",         location: "src/ordering/domain" },
  application:    { kind: "ApplicationLayer",    location: "src/ordering/application" },
  infrastructure: { kind: "InfrastructureLayer", location: "src/ordering/infrastructure" },
};

// Contracts are pre-configured:
//   noDependency: domain -> infrastructure, domain -> application, application -> infrastructure
//   purity: domain
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
  |   Types:          ArchSymbolKind, ContractType, ArchitecturePattern   |
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
  |   Use Cases (8):                                                      |
  |     CheckContracts        ClassifyAST          ResolveFiles           |
  |     DetectArchitecture    InferArchitecture    GenerateProjectRefs    |
  |     GetPluginDiagnostics  GetPluginCodeFixes                         |
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
  |     CLI  (main.ts)  -----> ksc check | init | infer                  |
  |     Plugin (index.ts) ---> TS language service plugin                 |
  |                                                                       |
  +-----------------------------------------------------------------------+
```

### Source Layout

```
src/
  index.ts                        Public API (exports Kind, defineContracts)
  runtime/
    kind.ts                       Kind<N> base interface
    define-contracts.ts           defineContracts<T>() marker function

  domain/
    entities/                     ArchSymbol, Contract, Diagnostic, ...
    value-objects/                ImportEdge, Location, ...
    types/                       ArchSymbolKind, ContractType, ...

  application/
    ports/                       TypeScriptPort, FileSystemPort, ...
    services/                    ConfigSymbolBuilder
    use-cases/
      check-contracts/           Contract evaluation (all 5 types)
      classify-ast/              AST -> ArchSymbol classification
      resolve-files/             ArchSymbol -> filesystem files
      detect-architecture/       Pattern detection from structure
      infer-architecture/        Generate architecture.ts drafts
      generate-project-refs/     TypeScript project reference generation
      get-plugin-diagnostics/    Plugin diagnostic integration
      get-plugin-code-fixes/     Plugin quick-fix suggestions

  infrastructure/
    adapters/                    Real implementations + mock test doubles
    cli/                         CLI entry point + commands
    plugin/                      TS language service plugin

packages/
  clean-architecture/            @kindscript/clean-architecture
  hexagonal/                     @kindscript/hexagonal
  onion/                         @kindscript/onion

tests/
  architecture/                  Domain entity + layer validation tests
  unit/                          Service + adapter unit tests
  integration/                   End-to-end contract validation (23 fixtures)
  e2e/                           Full CLI + plugin workflow tests
```

## Development

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript
npm test                 # Run all tests (33 test files, 392 tests)
npm run test:coverage    # Run with coverage report
npm run test:watch       # Watch mode
npm run lint             # ESLint

# Run specific test layers
npm test -- tests/unit         # Unit tests only (fast)
npm test -- tests/integration  # Integration tests only
npm test -- tests/e2e          # E2E tests only

# Run specific test file
npm test -- check-contracts-dependency
```

### Testing

KindScript has a comprehensive test suite with **392 tests across 33 files**, achieving **100% pass rate**:

```
  tests/
    unit/             28 files - Component tests with mocked dependencies
    integration/      5 files  - Multi-component tests with 29 fixtures
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
01-quickstart.ipynb       From zero to enforced architecture (infer, check)
02-contracts.ipynb        All 5 contract types + existence checking, with examples
03-stdlib-and-ci.ipynb    Standard library packages and CI integration
```

## Why KindScript?

Architectural rules typically live in documentation, wiki pages, and senior engineers' heads. They drift. New developers violate them unknowingly. PR reviews catch some violations, after the code is already written.

KindScript moves architectural rules into the compiler:

- Violations caught in the IDE, before commit
- Refactoring-safe -- rename a layer and all violations surface
- Self-documenting -- `architecture.ts` is the source of truth
- Gradual adoption -- works on existing codebases, three tiers of investment
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
- All 5 contract types (noDependency, mustImplement, purity, noCycles, colocated)
- CLI with 3 commands (check, init, infer)
- TypeScript language service plugin (inline diagnostics + code fix suggestions)
- AST classifier (Kind definitions, instances, contracts)
- Architecture inference from existing codebases
- 3 standard library packages (clean-architecture, hexagonal, onion)
- 45 test files across architecture/unit/integration/e2e layers

**What's next:**
- Watch mode and incremental compilation (`.ksbuildinfo` caching)
- Plugin code fix auto-application (currently description-only)
- Diagnostic `relatedInformation` linking to contract definitions
- `@kindscript/modular-monolith` standard library package
- npm publishing pipeline

## Documentation

- [Architecture V4](docs/architecture/COMPILER_ARCHITECTURE.md) -- Full architectural specification
- [Status: Done vs TODO](docs/status/DONE_VS_TODO.md) -- Implementation progress
- [Build Plan](docs/architecture/BUILD_PLAN.md) -- Milestone roadmap
- [Design Decisions](docs/architecture/DESIGN_DECISIONS.md) -- Build/Wrap/Skip rationale

## License

MIT
