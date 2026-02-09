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

KindScript follows **A+Apps+Features**: onion layers at the top level, an `apps/` directory for products, and `classification/`+`enforcement/` grouping inside the application layer.

```
Domain Layer (pure)
  ↑ depends on
Application Layer (ports + classification + enforcement)
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
│   ├── value-objects/                           # ImportEdge, ContractReference
│   ├── types/                                  # ArchSymbolKind, ContractType, CompilerOptions
│   ├── constants/                              # DiagnosticCode, NodeBuiltins
│   └── utils/                                  # cycle-detection, path-matching
├── application/
│   ├── ports/                                  # 4 driven ports (typescript, filesystem, config, ast)
│   ├── classification/                         # Capability: understanding code
│   │   ├── classify-ast/                       # AST → ArchSymbol classification
│   │   │   └── constraint-provider.ts          # ConstraintProvider (narrow interface for plugins)
│   │   └── classify-project/                   # Project-wide classification + config
│   ├── enforcement/                            # Capability: checking rules
│   │   ├── check-contracts/                    # Contract validation (plugin per type)
│   │   │   ├── contract-plugin.ts              # ContractPlugin interface + getSourceFilesForPaths helper
│   │   │   ├── generator-helpers.ts            # Shared generate() helpers (tuplePairs/stringList)
│   │   │   └── plugin-registry.ts              # createAllPlugins()
│   │   └── run-pipeline/                       # Orchestration pipeline (classify→resolve→check)
│   │       ├── run-pipeline.use-case.ts
│   │       └── run-pipeline.service.ts
│   ├── services/                               # resolveSymbolFiles
│   └── engine.ts                               # Engine interface
├── infrastructure/                             # Shared driven adapters ONLY
│   ├── typescript/typescript.adapter.ts
│   ├── filesystem/filesystem.adapter.ts
│   ├── config/config.adapter.ts
│   ├── ast/ast.adapter.ts
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

**Current Stats:** 29 test files, 277 tests, 100% passing

### Test Layers

```
tests/
├── helpers/                         # Shared utilities
│   ├── factories.ts                 # Test object builders
│   ├── fixtures.ts                  # Fixture path constants
│   ├── test-pipeline.ts             # Integration test pipeline helper
│   └── mocks/                       # 4 mock adapters (moved from src/)
│
├── domain/                          # 5 files - Domain entity tests
│   ├── arch-symbol.test.ts
│   ├── contract.test.ts
│   ├── diagnostic.test.ts
│   ├── domain-coverage.test.ts
│   └── path-matching.test.ts
│
├── application/                     # 11 files - Application layer tests
│   ├── classify-ast-kind-parsing.test.ts
│   ├── classify-ast-contracts.test.ts
│   ├── classify-ast-locate.test.ts
│   ├── classify-project.service.test.ts
│   ├── check-contracts-service.test.ts
│   ├── no-dependency.plugin.test.ts
│   ├── no-cycles.plugin.test.ts
│   ├── purity.plugin.test.ts
│   ├── must-implement.plugin.test.ts
│   ├── exists.plugin.test.ts
│   └── mirrors.plugin.test.ts
│
├── infrastructure/                  # 2 files - Adapter tests
│   ├── ast.adapter.test.ts
│   └── config-adapter.test.ts
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
└── integration/                     # 3 test files + 19 fixture dirs
    ├── check-contracts.integration.test.ts
    ├── tier2-contracts.integration.test.ts
    ├── tier2-locate.integration.test.ts
    └── fixtures/
```

### Key Test Files

**classify-ast** tests (3 files in `tests/application/`):
- `classify-ast-kind-parsing.test.ts` - Kind definition parsing
- `classify-ast-contracts.test.ts` - Type-level contract parsing (filesystem.exists, filesystem.mirrors) + multi-instance
- `classify-ast-locate.test.ts` - InstanceConfig<T> & multi-file

**Per-contract plugin tests** (6 files in `tests/application/` + 1 dispatcher):
- `no-dependency.plugin.test.ts` (15 tests) - noDependencyPlugin (check + generate + validate)
- `no-cycles.plugin.test.ts` (12 tests) - noCyclesPlugin (check + generate + validate)
- `purity.plugin.test.ts` (15 tests) - purityPlugin (check + intrinsic + validate)
- `must-implement.plugin.test.ts` (14 tests) - mustImplementPlugin (check + generate + validate)
- `exists.plugin.test.ts` (8 tests) - existsPlugin (check + generate + validate)
- `mirrors.plugin.test.ts` (11 tests) - mirrorsPlugin (check + generate + validate)
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
- All 19 fixtures documented
- Purpose and contents
- Usage matrix
- Adding new fixtures

---

## Guidelines for AI Agents

### When Making Changes

#### 1. Respect the Architecture

✅ **Do:**
- Keep domain layer pure (no external dependencies)
- Add new contracts in `src/application/enforcement/check-contracts/`
- Add classification logic in `src/application/classification/`
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
| Application services (classification/enforcement) | `tests/application/` |
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

#### 4. Adding New Contract Types

Follow this checklist:

1. **Domain layer** - Add contract type to `src/domain/types/contract-type.ts`
2. **Domain layer** - Add diagnostic code to `src/domain/constants/diagnostic-codes.ts`
3. **Application layer** - Create plugin in `src/application/enforcement/check-contracts/<name>/<name>.plugin.ts`
4. **Application layer** - Register plugin in `plugin-registry.ts` (`createAllPlugins()`)
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

**Date:** 2026-02-08

**Summary:** TypeScript piggybacking — invisible KindScript
- Dropped `.k.ts` extension — Kind definitions and instances live in regular `.ts`/`.tsx` files
- Removed path overrides (`{ path: "..." }` in MemberMap/InstanceConfig) — instances never specify paths
- Rewrote `ASTAdapter` to piggyback on TypeScript's type checker for `Kind`/`InstanceConfig` discovery
- Added `isSymbolNamed()` method: resolves type names through import aliases via `checker.getSymbolAtLocation()` + `getAliasedSymbol()`, with string matching fallback
- `ASTViewPort` methods now accept `TypeChecker` parameter
- `ClassifyProjectService` passes all source files to classifier (no extension filter)
- Renamed all 20 fixture `.k.ts` files to `.ts`; deleted `locate-path-override` fixture
- Restructured design-system fixtures: members map directly to `src/` subdirectories (no `components/` nesting)

**Key entities:**
- `Engine` interface: `{ classifyProject, checkContracts, runPipeline, plugins, fs, ts }`
- `ContractPlugin` interface: `{ type, constraintName, diagnosticCode, validate, check, generate?, intrinsic?, codeFix? }`
- `ConstraintProvider` interface: `{ constraintName, generate?, intrinsic? }` — narrow type used by classification
- `Diagnostic` entity: has `scope?: string` field for structural violations (file is empty string)
- `ASTExtractionResult<T>`: `{ data: T, errors: string[] }` — wraps AST port results

**Previous:** Codebase review (RunPipelineService, ConstraintProvider, codeFix, Diagnostic.scope), A+Apps+Features restructure, self-registering contract plugins

---

## Key Files to Know

### Source Code

- `src/types/index.ts` - Public API (Kind, ConstraintConfig, InstanceConfig, MemberMap)
- `src/domain/entities/arch-symbol.ts` - Core domain entity
- `src/application/enforcement/check-contracts/` - Contract validation logic
- `src/application/enforcement/check-contracts/contract-plugin.ts` - ContractPlugin interface + helpers
- `src/application/classification/classify-ast/constraint-provider.ts` - ConstraintProvider interface
- `src/application/enforcement/check-contracts/generator-helpers.ts` - Shared generate() helpers
- `src/application/enforcement/run-pipeline/run-pipeline.service.ts` - Orchestration pipeline
- `src/application/classification/classify-ast/` - AST classification logic
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

## Documentation Organization

Documentation is organized as 5 maintained chapter files (checked in) plus a gitignored scratchpad for active explorations:

```
docs/                                # Source of truth (checked in)
├── README.md                        # Index + reading order (start here)
├── 01-architecture.md               # System overview, pipeline, layers, data flow
├── 02-kind-system.md                # Kind syntax, instances, location derivation, discovery
├── 03-contracts.md                  # All 6 contract types, plugin architecture
├── 04-decisions.md                  # Key decisions log (Build/Wrap/Skip, etc.)
├── 05-examples.md                   # Real-world modeling examples
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
| Understand contracts or add a new one | `docs/03-contracts.md` |
| Understand why a decision was made | `docs/04-decisions.md` |
| See real-world modeling examples | `docs/05-examples.md` |
| Look at old architecture versions | `docs/archive/architecture/` |

### When Making Documentation Changes

| Action | Where |
|---|---|
| Architecture, contracts, or Kind system changes | Update the relevant chapter file |
| New architectural decision | Add entry to `docs/04-decisions.md` |
| New design exploration | Create in `.working/` (not checked in) |
| Completed an exploration | Uplift findings into `docs/` chapters, then move working doc to `.working/archive/` |

### Rules

- **Chapters are the source of truth.** The 5 chapter files in `docs/` are the authoritative documentation.
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

**Last Updated:** 2026-02-08
**Test Suite Status:** 29 files, 277 tests, 100% passing
