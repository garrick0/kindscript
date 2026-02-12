# CLAUDE.md - AI Agent Development Guide

> **For Claude and other AI coding assistants working on KindScript**

This document provides context and guidelines for AI agents maintaining and extending KindScript.

---

## Project Overview

**KindScript** is an architectural enforcement tool that extends TypeScript's compiler pipeline. It validates that codebases conform to architectural patterns (Clean Architecture, Hexagonal, etc.) at compile time.

**Core Concept:** Just as TypeScript validates values against types, KindScript validates codebases against architectural patterns.

**Version:** 0.8.0-m8

---

## Architecture

KindScript follows **A+Apps+Pipeline**: onion layers at the top level, an `apps/` directory for products, and a four-stage `pipeline/` inside the application layer aligned with TypeScript's compiler stages.

```
Domain Layer (pure)
  ↑ depends on
Application Layer (ports + pipeline: scan → parse → bind → check)
  ↑ implements
Infrastructure Layer (shared driven adapters only)
Apps Layer (CLI + Plugin — each with own ports, adapters, use cases)
```

### Directory Structure

```
src/
├── types/index.ts                              # Public API (zero-runtime)
├── domain/                                     # (pure, zero dependencies)
│   ├── entities/                               # ArchSymbol, Contract, Diagnostic, Program
│   ├── value-objects/                           # ContractReference, SourceRef
│   ├── types/                                  # ArchSymbolKind, ContractType, CompilerOptions, CarrierExpr (+ carrierKey, hasTaggedAtom)
│   ├── constants/                              # DiagnosticCode, NodeBuiltins
│   └── utils/                                  # cycle-detection
├── application/
│   ├── ports/                                  # 4 driven ports (typescript, filesystem, config, ast)
│   ├── pipeline/                               # Four-stage compiler pipeline
│   │   ├── scan/                               # Stage 1: AST → raw views (Pass 1: Kind defs + instances, Pass 2: wrapped Kind exports)
│   │   │   ├── scan.types.ts                   # ScanRequest, ScanResult, ScanUseCase
│   │   │   └── scan.service.ts                 # ScanService (uses ASTViewPort)
│   │   ├── parse/                              # Stage 2: views → ArchSymbol trees (pure structural)
│   │   │   ├── parse.types.ts                  # ParseResult, ParseUseCase
│   │   │   └── parse.service.ts                # ParseService (no dependencies)
│   │   ├── bind/                               # Stage 3: resolution + constraint trees → Contract[]
│   │   │   ├── bind.types.ts                   # BindResult, BindUseCase
│   │   │   └── bind.service.ts                 # BindService (uses FileSystemPort + ConstraintProvider plugins)
│   │   ├── carrier/                            # Carrier resolution (translates carriers → file sets)
│   │   │   └── carrier-resolver.ts             # CarrierResolver service
│   │   ├── check/                              # Stage 4: contracts × files → Diagnostic[]
│   │   │   ├── checker.service.ts              # CheckerService (dispatcher)
│   │   │   ├── checker.use-case.ts             # CheckerUseCase interface
│   │   │   ├── checker.request.ts              # CheckerRequest
│   │   │   ├── checker.response.ts             # CheckerResponse
│   │   │   ├── import-edge.ts                  # ImportEdge value object
│   │   │   └── intra-file-edge.ts              # IntraFileEdge (declaration-level references)
│   │   ├── plugins/                            # Contract plugin system (shared by bind + check)
│   │   │   ├── constraint-provider.ts          # ConstraintProvider interface + GeneratorResult
│   │   │   ├── contract-plugin.ts              # ContractPlugin interface + helpers
│   │   │   ├── generator-helpers.ts            # Shared generate() helpers
│   │   │   ├── plugin-registry.ts              # createAllPlugins()
│   │   │   ├── no-dependency/                  # noDependencyPlugin (+ intra-file checking)
│   │   │   ├── no-cycles/                      # noCyclesPlugin
│   │   │   ├── purity/                         # purityPlugin
│   │   │   ├── scope/                          # scopePlugin
│   │   │   ├── overlap/                        # overlapPlugin (auto-generated for siblings)
│   │   │   └── exhaustiveness/                 # exhaustivenessPlugin (opt-in exhaustive: true)
│   │   ├── views.ts                            # Pipeline view DTOs (TypeNodeView, KindDefinitionView, AnnotatedExportView, DeclarationView, etc.)
│   │   ├── ownership-tree.ts                   # OwnershipTree, OwnershipNode, buildOwnershipTree()
│   │   ├── program.ts                          # ProgramPort, ProgramFactory, ProgramSetup
│   │   ├── pipeline.types.ts                   # PipelineRequest, PipelineResponse, PipelineUseCase
│   │   └── pipeline.service.ts                 # PipelineService (orchestrator: caching + 4 stages)
│   └── engine.ts                               # Engine interface
├── infrastructure/                             # Shared driven adapters ONLY
│   ├── typescript/typescript.adapter.ts
│   ├── filesystem/filesystem.adapter.ts
│   ├── config/config.adapter.ts
│   ├── ast/ast.adapter.ts
│   ├── path/path-utils.ts                      # Pure path utilities (joinPath, resolvePath, etc.)
│   └── engine-factory.ts                       # createEngine() — wires shared services
└── apps/
    ├── cli/
    │   ├── main.ts                             # CLI entry point + composition root
    │   ├── ports/                              # ConsolePort, DiagnosticPort
    │   ├── adapters/                           # CLIConsoleAdapter, CLIDiagnosticAdapter
    │   └── commands/check.command.ts
    └── plugin/
        ├── index.ts                            # Plugin entry point + composition root
        ├── ports/                              # LanguageServicePort
        ├── adapters/                           # LanguageServiceAdapter
        ├── use-cases/                          # get-plugin-diagnostics/, get-plugin-code-fixes/
        ├── language-service-proxy.ts
        └── diagnostic-converter.ts
```

---

## Test Suite Organization

**Current Stats:** 31 test files, 342 tests, 100% passing

### Test Layers

```
tests/
├── helpers/                         # Shared utilities
│   ├── factories.ts                 # Test object builders
│   ├── fixtures.ts                  # Fixture path constants
│   ├── test-pipeline.ts             # Integration test pipeline helper
│   └── mocks/                       # 3 mock adapters (moved from src/)
│
├── domain/                          # 5 files - Domain entity tests
│   ├── arch-symbol.test.ts
│   ├── contract.test.ts
│   ├── diagnostic.test.ts
│   ├── domain-coverage.test.ts
│   └── source-ref.test.ts
│
├── application/                     # 12 files - Application layer tests
│   ├── classify-ast-kind-parsing.test.ts
│   ├── classify-ast-contracts.test.ts
│   ├── classify-ast-locate.test.ts
│   ├── classify-project.service.test.ts
│   ├── check-contracts-service.test.ts
│   ├── no-dependency.plugin.test.ts
│   ├── no-cycles.plugin.test.ts
│   ├── purity.plugin.test.ts
│   ├── scope.plugin.test.ts
│   ├── overlap.plugin.test.ts
│   ├── exhaustiveness.plugin.test.ts
│   └── ownership-tree.test.ts
│
├── infrastructure/                  # 3 files - Adapter tests
│   ├── ast.adapter.test.ts
│   ├── config-adapter.test.ts
│   └── path-utils.test.ts
│
├── cli/
│   ├── unit/                        # 2 files
│   │   ├── check-command.test.ts
│   │   └── cli-diagnostic.adapter.test.ts
│   └── e2e/                         # 2 files
│       ├── helpers.ts
│       └── cli.e2e.test.ts
│
├── plugin/
│   └── unit/                        # 5 files
│       ├── get-plugin-diagnostics.service.test.ts
│       ├── get-plugin-code-fixes.service.test.ts
│       ├── plugin-loading.test.ts
│       ├── diagnostic-converter.test.ts
│       └── language-service-proxy.test.ts
│
└── integration/                     # 3 test files + 24 fixture dirs
    ├── check-contracts.integration.test.ts
    ├── tier2-contracts.integration.test.ts
    ├── tier2-locate.integration.test.ts
    └── fixtures/
```

### Key Test Files

**classify-ast** tests (3 files in `tests/application/`):
- `classify-ast-kind-parsing.test.ts` - Kind definition parsing
- `classify-ast-contracts.test.ts` - Constraint parsing + multi-instance
- `classify-ast-locate.test.ts` - Instance<T, Path>, multi-file, explicit path resolution, file-scoped instances

**Per-contract plugin tests** (6 files in `tests/application/` + 1 dispatcher):
- `no-dependency.plugin.test.ts` (21 tests) - noDependencyPlugin (check + intra-file + generate + validate)
- `no-cycles.plugin.test.ts` (12 tests) - noCyclesPlugin (check + generate + validate)
- `purity.plugin.test.ts` (14 tests) - purityPlugin (check + intrinsic + validate)
- `scope.plugin.test.ts` (10 tests) - scopePlugin (check + validate)
- `overlap.plugin.test.ts` (12 tests) - overlapPlugin (check + validate)
- `exhaustiveness.plugin.test.ts` (13 tests) - exhaustivenessPlugin (check + generate + validate)
- `check-contracts-service.test.ts` (3 tests) - Dispatcher validation + aggregation

**E2E tests** consolidated into 1 file:
- `tests/cli/e2e/cli.e2e.test.ts` - All CLI commands organized by command (check only)

### Test Documentation

**PRIMARY:** [tests/README.md](tests/README.md) - Complete testing guide
- How to run tests
- When to use each test layer
- Writing new tests
- Common patterns
- Debugging tips

**FIXTURES:** [tests/integration/fixtures/README.md](tests/integration/fixtures/README.md) - Fixture catalog
- All 20 fixtures documented
- Purpose and contents
- Usage matrix
- Adding new fixtures

---

## Guidelines for AI Agents

### When Making Changes

#### 1. Respect the Architecture

✅ **Do:**
- Keep domain layer pure (no external dependencies)
- Add new contract plugins in `src/application/pipeline/plugins/<name>/`
- Add scanning logic in `src/application/pipeline/scan/`
- Add parsing logic in `src/application/pipeline/parse/`
- Add binding logic in `src/application/pipeline/bind/`
- Add shared adapters in `src/infrastructure/`
- Add CLI-specific code in `src/apps/cli/`
- Add plugin-specific code in `src/apps/plugin/`

❌ **Don't:**
- Import TypeScript API in domain layer
- Import Node.js modules in domain layer
- Put business logic in infrastructure or apps
- Mix layers
- Put CLI-only or plugin-only ports in `src/application/ports/`

#### 2. Writing Tests

**ALWAYS write tests for new functionality.** Use this decision tree:

| What are you testing? | Test Location |
|-----------------------|------------|
| Domain entities/value-objects | `tests/domain/` |
| Application services (pipeline stages + contract plugins) | `tests/application/` |
| Infrastructure adapters | `tests/infrastructure/` |
| CLI commands/adapters | `tests/cli/unit/` |
| Plugin services/adapters | `tests/plugin/unit/` |
| Multiple services + real TS compiler | `tests/integration/` |
| CLI command as subprocess | `tests/cli/e2e/cli.e2e.test.ts` |

**Use shared utilities:**
```typescript
// Import test builders
import { makeSymbol, noDependency, makeCheckRequest } from '../helpers/factories';
import { FIXTURES } from '../helpers/fixtures';
import { runPipeline } from '../helpers/test-pipeline';

// Import mock adapters
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';

// Import E2E utilities
import { run } from './helpers';
```

**Coverage requirements:**
- Domain: 90% lines/functions, 75% branches
- Application: 95% lines, 100% functions, 85% branches
- Run `npm test -- --coverage` to check

#### 3. Test Maintenance Rules

**File size limits:**
- No test file should exceed 600 lines
- If a file grows too large, split it logically by feature/contract type

**Naming conventions:**
- Domain: `tests/domain/{entity-name}.test.ts`
- Application: `tests/application/{service-name}.test.ts`
- Infrastructure: `tests/infrastructure/{adapter-name}.test.ts`
- CLI: `tests/cli/unit/{component-name}.test.ts`
- Plugin: `tests/plugin/unit/{component-name}.test.ts`
- Integration: `tests/integration/{workflow-name}.integration.test.ts`
- E2E: Add to `tests/cli/e2e/cli.e2e.test.ts` in appropriate describe block

**Fixtures:**
- `*-clean` - Satisfies all contracts
- `*-violation` - Violates contracts
- Add new fixtures to `tests/integration/fixtures/`
- Update `tests/helpers/fixtures.ts` with new fixture paths
- Document in `tests/integration/fixtures/README.md`

#### 4. Adding New Constraint Types

Follow this checklist:

1. **Domain layer** - Add contract type to `src/domain/types/contract-type.ts`
2. **Domain layer** - Add diagnostic code to `src/domain/constants/diagnostic-codes.ts`
3. **Application layer** - Create plugin in `src/application/pipeline/plugins/<name>/<name>.plugin.ts`
4. **Application layer** - Register plugin in `src/application/pipeline/plugins/plugin-registry.ts` (`createAllPlugins()`)
5. **Tests** - Add unit tests in `tests/application/<name>.plugin.test.ts`
6. **Tests** - Add integration tests in `tests/integration/tier2-contracts.integration.test.ts`
7. **Fixtures** - Create clean + violation fixtures
8. **Tests** - Add E2E tests in `tests/cli/e2e/cli.e2e.test.ts`
9. **Helpers** - Add factory function in `tests/helpers/factories.ts`
10. **Documentation** - Update README.md with contract description

#### 5. Running Tests

```bash
# Full suite (should always pass)
npm test

# Specific layer
npm test -- tests/domain
npm test -- tests/application
npm test -- tests/infrastructure
npm test -- tests/cli
npm test -- tests/plugin
npm test -- tests/integration

# Specific file
npm test -- no-dependency.plugin

# Watch mode during development
npm test -- --watch

# Coverage check
npm test -- --coverage
```

**Before committing:** Always run `npm test` and ensure 100% pass rate.

---

## Common Patterns

### Creating Test Objects

```typescript
// Use factories, don't create manually
import { makeSymbol, noDependency } from '../helpers/factories';

const domain = makeSymbol('domain');
const infra = makeSymbol('infrastructure');
const contract = noDependency(domain, infra);
```

### Testing Contracts (All Three Layers)

```typescript
// Unit test - plugin validation
it('validates noDependency args', () => {
  const result = noDependencyPlugin.validate([domain, infra]);
  expect(result).toBeNull();
});

// Integration test - real pipeline
it('detects violation', () => {
  const { checkResult } = runPipeline(FIXTURES.CLEAN_ARCH_VIOLATION);
  expect(checkResult.violationsFound).toBe(1);
});

// E2E test - subprocess
it('exits 1 on violation', () => {
  const result = run(['check', FIXTURES.CLEAN_ARCH_VIOLATION]);
  expect(result.exitCode).toBe(1);
});
```

### Using Integration Test Pipeline

```typescript
import { runPipeline } from '../helpers/test-pipeline';
import { FIXTURES } from '../helpers/fixtures';

it('checks contracts', () => {
  const { classifyResult, checkResult } = runPipeline(FIXTURES.TIER2_CLEAN_ARCH);

  expect(classifyResult.errors).toHaveLength(0);
  expect(checkResult.violationsFound).toBe(0);
});
```

---

## Recent Changes

**Date:** 2026-02-11

**Summary:** Carrier-based resolution — replaced runtime path probing with algebraic carriers
- Introduced `CarrierExpr` type and `carrierKey()` / `hasTaggedAtom()` domain functions
- Replaced `symbol.id` with `symbol.carrier` (algebraic expression, not string)
- Added `CarrierResolver` service for translating carriers to file sets via filesystem probing and tagged export filtering
- Binder now uses carrier-based dispatch (no more runtime `isWrappedKind()` or `isFileInSymbol()` probing)
- Removed `isFileInSymbol()` from path-utils (replaced by set membership on resolved files)
- Carrier algebra: `path`, `tagged`, `union`, `exclude`, `intersect` (scoped tagged carriers expressed as `intersect(tagged, path)`)

**Previous:** Unified Kind model — eliminated TypeKind in favor of `wrapsTypeName` + direct Kind annotations
- Removed `TypeKind<N, T, C>` from public API; wrapped Kinds now use `Kind<N, {}, C, { wraps: T }>`
- Wrapped Kind exports use direct type annotation (e.g., `export const x: Decider = ...`)
- Scanner uses two passes: Pass 1 extracts Kind definitions + instances, Pass 2 extracts wrapped Kind exports
- Removed `TypeKindDefinitionView`, `TypeKindInstanceView`, `ScannedTypeKindInstance` view DTOs
- Renamed fixtures: `typekind-*` to `wrapped-kind-*`, `TYPEKIND_*` to `WRAPPED_KIND_*`

**Previous:** Recursive ownership model complete — all 7 phases implemented + cleanup
- All 7 phases (0-6) complete: explicit locations, container resolution, overlap, exhaustiveness, ownership tree, declaration containment, intra-file deps
- Removed backward-compat Diagnostic getters (`.file`, `.line`, `.column`, `.scope`) — consumers now use `.source.*` directly
- Added `exhaustive?: true` to `Constraints` type in public API
- 6 registered plugins: noDependency, purity, noCycles, scope, overlap, exhaustiveness

**Key entities:**
- `Engine` interface: `{ pipeline, plugins }` — minimal surface for app composition roots
- `ProgramPort` / `ProgramFactory`: encapsulates config reading, file discovery, TS program creation
- `PipelineService`: orchestrates scan → parse → bind → check with caching (delegates program setup to ProgramPort)
- `ContractPlugin` interface: `{ type, constraintName, diagnosticCode, validate, check, generate?, intrinsic?, codeFix? }`
- `ConstraintProvider` interface: `{ constraintName, generate?, intrinsic? }` — narrow type used by Binder
- `SourceRef` value object: `{ file, line, column, scope? }` — `at()` for file-scoped, `structural()` for project-wide
- `Diagnostic` entity: constructor takes `(message, code, source: SourceRef, relatedContract?)` — access location via `.source.file`, `.source.line`, `.source.column`, `.source.scope`
- `ASTExtractionResult<T>`: `{ data: T, errors: string[] }` — wraps AST port results
- `OwnershipTree`: `{ roots, nodeByInstanceId }` — parent-child instance relationships built from scope containment
- `OwnershipNode`: `{ instanceSymbol, scope, parent, children, memberOf? }` — tree node
- `DeclarationView`: `{ name, kind, exported, line, column }` — top-level declaration in a source file
- `IntraFileEdge`: `{ fromDeclaration, toDeclaration, line, column }` — reference between declarations in the same file
- `ImportEdge`: cross-file import edge (moved from domain to application layer)
- `CarrierExpr` type: algebraic expression describing what code a symbol operates over — atoms: `path`, `tagged`; operations: `union`, `exclude`, `intersect`
- `carrierKey(carrier)`: deterministic string serialization of a CarrierExpr, usable as a Map key (returns raw path string for path carriers)
- `hasTaggedAtom(carrier)`: checks if a carrier contains a tagged atom (replaces `isWrappedKind` pattern)
- `ArchSymbol`: `carrier?: CarrierExpr` (not `id: string`) — carrier expression, not opaque identifier

---

## Key Files to Know

### Source Code

- `src/types/index.ts` - Public API (Kind, Constraints, Instance<T, Path>, MemberMap, KindConfig, KindRef)
- `src/domain/entities/arch-symbol.ts` - Core domain entity
- `src/domain/types/carrier.ts` - CarrierExpr type, carrierKey(), hasTaggedAtom()
- `src/application/pipeline/scan/scan.service.ts` - Stage 1: AST extraction
- `src/application/pipeline/parse/parse.service.ts` - Stage 2: ArchSymbol tree building (pure structural, no I/O)
- `src/application/pipeline/bind/bind.service.ts` - Stage 3: Member resolution + contract generation
- `src/application/pipeline/carrier/carrier-resolver.ts` - CarrierResolver service (translates carriers to file sets)
- `src/application/pipeline/plugins/constraint-provider.ts` - ConstraintProvider interface
- `src/application/pipeline/check/checker.service.ts` - Stage 4: Contract checking (dispatcher)
- `src/application/pipeline/plugins/contract-plugin.ts` - ContractPlugin interface + helpers
- `src/application/pipeline/plugins/generator-helpers.ts` - Shared generate() helpers
- `src/application/pipeline/plugins/plugin-registry.ts` - createAllPlugins()
- `src/application/pipeline/views.ts` - Pipeline view DTOs (TypeNodeView, KindDefinitionView, AnnotatedExportView, etc.)
- `src/application/pipeline/program.ts` - ProgramPort, ProgramFactory, ProgramSetup
- `src/application/pipeline/pipeline.service.ts` - Pipeline orchestrator (caching + 4 stages)
- `src/application/pipeline/pipeline.types.ts` - PipelineRequest/Response/UseCase
- `src/application/engine.ts` - Engine interface
- `src/infrastructure/engine-factory.ts` - Shared wiring factory
- `src/apps/cli/main.ts` - CLI entry point
- `src/apps/plugin/index.ts` - Plugin entry point

### Tests

- `tests/helpers/factories.ts` - Test object builders (USE THESE)
- `tests/helpers/fixtures.ts` - Fixture path constants (USE THESE)
- `tests/helpers/test-pipeline.ts` - Integration test helper (USE THIS)
- `tests/helpers/mocks/` - Mock adapters for unit tests
- `tests/README.md` - Complete testing guide (READ THIS FIRST)
- `tests/integration/fixtures/README.md` - Fixture catalog

### Documentation

See the [Documentation](#documentation-organization) section below for the full guide.

---

## Interactive Tutorial

An interactive browser-based tutorial lives in `tutorial/` (TutorialKit + Astro). It provides 7 lessons covering the 3 user-declared constraints (`noDependency`, `purity`, `noCycles`).

### Key Paths

- `tutorial/README.md` - Setup and usage instructions
- `tutorial/src/content/tutorial/` - Lesson content (markdown + `_files/` + `_solution/`)
- `tutorial/src/templates/default/` - Shared template (package.json, tsconfig, local kindscript package)
- `tutorial/scripts/sync-kindscript.sh` - Syncs compiled dist/ into the template

### When to update the tutorial

- **Changed CLI output or diagnostic codes** - Update lesson `content.md` prose that references error messages
- **Changed public API types** (`src/types/index.ts`) - Update `context.ts` files in lesson `_files/` and `_solution/`
- **Bumped version** - Run `bash tutorial/scripts/sync-kindscript.sh` to rebuild and re-sync the template
- **Added a new constraint** - Consider adding a new part with lessons demonstrating it

### Running locally

```bash
bash tutorial/scripts/sync-kindscript.sh   # Build + sync KindScript into template
cd tutorial && npm install && npm start     # Dev server at localhost:4321
```

---

## Website and Deployment

The KindScript documentation website lives in this repository at `website/`:

**Live Site:** https://kindscript.ai
**Local Path:** `~/dev/kindscript/website/`

The website is a Next.js application that combines:
- KindScript OSS documentation (from `docs/` - same repo)
- Interactive tutorial with WebContainer + Monaco editor
- Agent product pages
- Company/about pages

### Website Structure

```
website/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── docs/              # Documentation (Nextra)
│   │   ├── tutorial/          # Interactive tutorial
│   │   ├── agent/             # Agent product page
│   │   ├── about/             # About page
│   │   └── privacy/           # Privacy page
│   ├── components/
│   │   └── tutorial/          # WebContainer components
│   └── lib/
│       └── lessons/           # Tutorial lessons (21 total)
├── public/
│   └── lessons/               # Lesson MDX files
├── tests/                     # Test suite (76 tests)
├── scripts/
│   └── generate-lessons.mjs   # Lesson index generator
└── vercel.json                # Vercel config (CORS headers)
```

### Deployment

**Workflow:** `.github/workflows/deploy-website.yml`

The website deploys automatically to Vercel when:
- Changes are pushed to `website/`
- Changes are pushed to `docs/`
- Changes are pushed to `src/types/index.ts`
- Manual workflow dispatch

No content pipeline or cross-repo triggers needed — everything is in the same repo.

### Working with the Website

```bash
# Development
cd website
npm run dev              # Starts dev server (generates lessons first)

# Testing
npm test                 # Run all tests (76 tests)
npm run test:e2e        # Run E2E tests

# Building
npm run build            # Build for production (generates lessons first)
npm run generate:lessons # Manually regenerate lesson index
```

### Tutorial Lessons

The website includes 21 interactive tutorial lessons organized in 8 parts:
- Part 1: noDependency (3 lessons)
- Part 2: purity (2 lessons)
- Part 3: noCycles (2 lessons)
- Part 4: Design System - Atoms (4 lessons)
- Part 5: Design System - Molecules (4 lessons)
- Part 6: Wrapped Kinds (3 lessons)
- Part 7: Scaling Your Architecture (2 lessons)
- Part 8: Real-World Capstone (1 lesson)

---

## Documentation Organization

Documentation is organized as 6 maintained chapter files (checked in) plus a gitignored scratchpad for active explorations:

```
docs/                                # Source of truth (checked in)
├── README.md                        # Index + reading order (start here)
├── 01-architecture.md               # System overview, pipeline, layers, data flow
├── 02-kind-system.md                # Kind syntax, wrapped Kinds, instances, location resolution, scope validation, discovery
├── 03-constraints.md                # All 3 constraint types, plugin architecture
├── decisions/                       # Architecture Decision Records (ADRs)
├── 05-examples.md                   # Real-world modeling examples
├── 06-tutorial.md                   # Progressive tutorial (static walkthrough + real-world narrative)
└── archive/                         # Historical — do not use for implementation

.working/                            # Working docs (gitignored, NOT checked in)
├── *.md                             # Active design explorations
└── archive/                         # Completed working docs
```

### Where to Find Things

| I need to... | Read this |
|---|---|
| Understand the pipeline / architecture | `docs/01-architecture.md` |
| Understand Kind syntax and instances | `docs/02-kind-system.md` |
| Understand constraints or add a new one | `docs/03-constraints.md` |
| Understand why a decision was made | `docs/decisions/` (35 ADRs) |
| See real-world modeling examples | `docs/05-examples.md` |
| Walk through KindScript step by step | `docs/06-tutorial.md` |
| Try the interactive tutorial | `tutorial/` ([README](tutorial/README.md)) |
| Look at old architecture versions | `docs/archive/architecture/` |

### When Making Documentation Changes

| Action | Where |
|---|---|
| Architecture, contracts, or Kind system changes | Update the relevant chapter file |
| New architectural decision | Create new file in `docs/decisions/` using `template.md` |
| New design exploration | Create in `.working/` (not checked in) |
| Completed an exploration | Uplift findings into `docs/` chapters, then move working doc to `.working/archive/` |

### Rules

- **Chapters are the source of truth.** The 6 chapter files in `docs/` are the authoritative documentation.
- **Working docs are scratchpads.** `.working/` is gitignored and never the source of truth. Once a design is decided, reflect it in the chapter files.
- **Never reference archived docs for implementation decisions.** They contain outdated information.
- **Update this CLAUDE.md** if you add or move documentation files, so paths stay correct.
- **Update `docs/README.md`** if chapters are added or reorganized.

---

## Coverage Requirements (Jest Config)

```javascript
// jest.config.js
coverageThreshold: {
  'src/domain/': {
    branches: 75,
    functions: 90,
    lines: 90,
    statements: 90
  },
  'src/application/': {
    branches: 85,
    functions: 100,
    lines: 95,
    statements: 95
  }
}
```

Infrastructure adapters are covered via integration/E2E tests without strict thresholds.

---

## Debugging Tips

### Test Failures

```bash
# Run single test
npm test -- -t "test name substring"

# Verbose output
npm test -- --verbose

# Show full error details
npm test -- --no-coverage
```

### TypeScript Errors

```bash
# Check types without running tests
npm run build

# Clean build
rm -rf dist && npm run build
```

### When Tests are Flaky

- Check if test modifies global state
- Verify mocks are reset in `afterEach`
- Check for race conditions in async tests
- Ensure temp directories are cleaned up

---

## Important Principles

1. **Domain purity** - Domain layer must have zero dependencies
2. **Test coverage** - All new code must have tests
3. **100% pass rate** - Never commit with failing tests
4. **Shared utilities** - Always use helpers/factories
5. **Clear organization** - Tests grouped by layer, mirroring source structure
6. **Documentation** - Update tests/README.md when adding new patterns

---

## Questions?

Read these in order:
1. [tests/README.md](tests/README.md) - Testing guide
2. [README.md](README.md) - Project overview
3. [docs/01-architecture.md](docs/01-architecture.md) - Architecture deep dive

If still unclear, ask the user for clarification rather than guessing.

---

**Last Updated:** 2026-02-11
**Test Suite Status:** 31 files, 342 tests, 100% passing
