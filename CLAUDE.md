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

KindScript follows **strict Clean Architecture**. The domain layer has **zero external dependencies** (no TypeScript API, no Node.js, nothing).

```
Domain Layer (pure)
  ↑ depends on
Application Layer (ports + use cases)
  ↑ implements
Infrastructure Layer (adapters + entry points)
```

### Directory Structure

```
src/
├── index.ts                         # Public API exports
├── runtime/
│   ├── kind.ts                      # Kind<N, Members, Constraints> + ConstraintConfig<Members>
│   └── locate.ts                    # MemberMap<T> + InstanceConfig<T>
├── domain/
│   ├── entities/                    # ArchSymbol, Contract, Diagnostic
│   ├── value-objects/               # ImportEdge, Location
│   ├── types/                       # ArchSymbolKind, ContractType
│   └── constants/                   # DiagnosticCode
├── application/
│   ├── ports/                       # TypeScriptPort, FileSystemPort, ASTPort
│   ├── services/                    # ConfigSymbolBuilder, resolveSymbolFiles
│   └── use-cases/
│       ├── check-contracts/         # Contract validation (vertical slices per type)
│       ├── classify-ast/            # AST → ArchSymbol classification
│       ├── classify-project/        # Project-wide classification + config
│       ├── get-plugin-diagnostics/  # Plugin integration
│       └── get-plugin-code-fixes/   # Quick-fix suggestions
└── infrastructure/
    ├── adapters/                    # Real + mock implementations
    │   ├── typescript/              # TypeScriptAdapter (wraps ts.Program)
    │   ├── filesystem/              # FileSystemAdapter (wraps fs)
    │   ├── ast/                     # ASTAdapter (wraps ts.Node traversal)
    │   ├── config/                  # ConfigAdapter (reads configs)
    │   └── testing/                 # Mock* adapters for unit tests
    ├── cli/                         # CLI entry point + commands
    └── plugin/                      # TS language service plugin
```

---

## Test Suite Organization

**Current Stats:** 29 test files, 278 tests, 100% passing

### Test Layers

```
tests/
├── helpers/                         # 4 files - Shared utilities
│   ├── factories.ts                 # Test object builders
│   ├── fixtures.ts                  # Fixture path constants
│   ├── test-pipeline.ts             # Integration test pipeline helper
│   └── (E2E helpers in tests/e2e/helpers.ts)
│
├── unit/                            # 24 files - Fast isolated tests
│   ├── arch-symbol.test.ts          # Domain entities
│   ├── contract.test.ts
│   ├── diagnostic.test.ts
│   ├── classify-ast-*.test.ts       # AST classification (3 files)
│   ├── no-dependency.checker.test.ts # Per-contract checker tests (6 files)
│   ├── no-cycles.checker.test.ts
│   ├── purity.checker.test.ts
│   ├── must-implement.checker.test.ts
│   ├── exists.checker.test.ts
│   ├── mirrors.checker.test.ts
│   ├── check-contracts-service.test.ts # Dispatcher tests
│   └── ...                          # All other services & adapters
│
├── integration/                     # 3 files - Multi-component tests
│   ├── check-contracts.integration.test.ts
│   ├── tier2-contracts.integration.test.ts
│   ├── tier2-locate.integration.test.ts
│   └── fixtures/                    # 18 fixture directories
│       ├── clean-arch-valid/
│       ├── clean-arch-violation/
│       ├── tier2-clean-arch/
│       ├── locate-*/
│       └── ... (see fixtures/README.md)
│
└── e2e/                             # 1 file - CLI subprocess tests
    ├── helpers.ts                   # E2E utilities (run, copyFixtureToTemp)
    └── cli.e2e.test.ts              # All CLI commands consolidated
```

### Key Test Files

**classify-ast** tests (3 files):
- `classify-ast-kind-parsing.test.ts` - Kind definition parsing
- `classify-ast-contracts.test.ts` - Type-level contract parsing (filesystem.exists, filesystem.mirrors) + multi-instance
- `classify-ast-locate.test.ts` - InstanceConfig<T> & multi-file

**Per-contract checker tests** (6 files + 1 dispatcher):
- `no-dependency.checker.test.ts` (11 tests) - NoDependencyChecker
- `no-cycles.checker.test.ts` (7 tests) - NoCyclesChecker
- `purity.checker.test.ts` (9 tests) - PurityChecker
- `must-implement.checker.test.ts` (8 tests) - MustImplementChecker
- `exists.checker.test.ts` (4 tests) - ExistsChecker
- `mirrors.checker.test.ts` (4 tests) - MirrorsChecker
- `check-contracts-service.test.ts` (3 tests) - Dispatcher validation + aggregation

**E2E tests** consolidated into 1 file:
- `cli.e2e.test.ts` - All CLI commands organized by command (check only)

### Test Documentation

**PRIMARY:** [tests/README.md](tests/README.md) - Complete testing guide
- How to run tests
- When to use each test layer
- Writing new tests
- Common patterns
- Debugging tips

**FIXTURES:** [tests/integration/fixtures/README.md](tests/integration/fixtures/README.md) - Fixture catalog
- All 18 fixtures documented
- Purpose and contents
- Usage matrix
- Adding new fixtures

---

## Guidelines for AI Agents

### When Making Changes

#### 1. Respect the Architecture

✅ **Do:**
- Keep domain layer pure (no external dependencies)
- Add new contracts in domain/entities/
- Add new use cases in application/use-cases/
- Add new adapters in infrastructure/adapters/

❌ **Don't:**
- Import TypeScript API in domain layer
- Import Node.js modules in domain layer
- Put business logic in infrastructure
- Mix layers

#### 2. Writing Tests

**ALWAYS write tests for new functionality.** Use this decision tree:

| What are you testing? | Test Layer |
|-----------------------|------------|
| Single class/function with mocks | Unit |
| Multiple services + real TS compiler | Integration |
| CLI command as subprocess | E2E |

**Test file organization:**
- Unit tests go in `tests/unit/`
- Integration tests go in `tests/integration/`
- E2E tests go in `tests/e2e/cli.e2e.test.ts` (consolidated file)

**Use shared utilities:**
```typescript
// Import test builders
import { makeSymbol, noDependency, makeCheckRequest } from '../helpers/factories';
import { FIXTURES } from '../helpers/fixtures';
import { runPipeline } from '../helpers/test-pipeline';

// Import E2E utilities
import { run, copyFixtureToTemp } from './helpers';
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
- Unit: `{component-name}.test.ts`
- Integration: `{workflow-name}.integration.test.ts`
- E2E: Add to `cli.e2e.test.ts` in appropriate describe block

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
3. **Application layer** - Create checker in `src/application/use-cases/check-contracts/<name>/<name>.checker.ts`
4. **Application layer** - Create generator in `src/application/use-cases/check-contracts/<name>/<name>.generator.ts`
5. **Application layer** - Register checker in `create-checkers.ts` and generator in `generator-registry.ts`
6. **Tests** - Add unit tests in `tests/unit/<name>.checker.test.ts`
7. **Tests** - Add integration tests in `tests/integration/tier2-contracts.integration.test.ts`
8. **Fixtures** - Create clean + violation fixtures
9. **Tests** - Add E2E tests in `tests/e2e/cli.e2e.test.ts`
10. **Helpers** - Add factory function in `tests/helpers/factories.ts`
11. **Documentation** - Update README.md with contract description

#### 5. Running Tests

```bash
# Full suite (should always pass)
npm test

# Specific layer
npm test -- tests/unit
npm test -- tests/integration
npm test -- tests/e2e

# Specific file
npm test -- no-dependency.checker

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
import { makeSymbol, noDependency, makeDiagnostic } from '../helpers/factories';

const domain = makeSymbol('domain');
const infra = makeSymbol('infrastructure');
const contract = noDependency(domain, infra);
```

### Testing Contracts (All Three Layers)

```typescript
// Unit test - mocked dependencies
it('validates contract', () => {
  const contract = noDependency(domain, infra);
  expect(contract.validate()).toBeNull();
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

**Summary:** Vertical slices for contract system
- Extracted 6 checker classes from `CheckContractsService` into per-contract directories
- Extracted 6 generator functions from `ClassifyASTService.walkConstraintView()` into per-contract directories
- `CheckContractsService` is now a thin dispatcher (~60 lines) using `ContractChecker` interface
- `ClassifyASTService` uses `GENERATORS` registry and imported `hasIntrinsicPure`/`propagatePurity`
- Tests reorganized: 6 per-contract test files + 1 dispatcher test (was 3 grouped files)
- Directory structure: `check-contracts/{no-dependency,purity,no-cycles,must-implement,exists,mirrors}/`

**Previous:** Filesystem constraints (exists + mirrors) replace colocated + implicit existence
- Replaced `colocated` contract with two new contracts: `filesystem.exists` and `filesystem.mirrors`
- `ConstraintConfig` now has `filesystem?: { exists?, mirrors? }` instead of `colocated?`
- Existence checking is now opt-in via `filesystem.exists` (was previously implicit for all derived members)
- `mirrors` uses relative path matching (fixes old `colocated` basename-only matching bug)
- Fixture directories renamed: `colocated-clean` → `mirrors-clean`, `colocated-violation` → `mirrors-violation`
- Diagnostic code 70005 renamed from `NotColocated` to `MirrorMismatch`
- `Diagnostic.notColocated()` renamed to `Diagnostic.mirrorMismatch()`

**Previous:** Distributed `.k.ts` definitions + root inference
- Definition files now use `.k.ts` extension and are auto-discovered (no `kindscript.json` `definitions` field)
- `InstanceConfig<T>` no longer requires `root` — root is inferred from the `.k.ts` file's directory
- `kindscript.json` is optional (settings-only, no `definitions` field)
- Fixtures restructured: `architecture.ts` → `src/context.k.ts` (moved into `src/`)
- Multi-instance fixture split into separate `.k.ts` files per bounded context

**Earlier:** V2 Contracts & Location Redesign + detect/infer removal
- Replaced `locate<T>()` and `defineContracts<T>()` with type-level alternatives
- Public API is now zero-runtime (`export type` only)
- Removed `detect-architecture`, `infer-architecture`, `generate-project-refs` use cases
- Removed `ContractConfig<T>` (additive instance-level constraints) -- all constraints must be declared on the Kind type's third parameter
- CLI has only one command: `ksc check`

**Impact for agents:**
- `colocated` contract type no longer exists — use `filesystem: { mirrors: [...] }` in ConstraintConfig
- Implicit existence checking removed — use `filesystem: { exists: [...] }` for opt-in existence checking
- Fixture directories renamed: `mirrors-clean`, `mirrors-violation` (not `colocated-*`)
- Factory helpers: `exists()` and `mirrors()` (not `colocated()`)
- Definition files use `.k.ts` extension (e.g., `src/context.k.ts`)
- No `root` property in `InstanceConfig` — root is the `.k.ts` file's directory
- `kindscript.json` is optional, has no `definitions` field
- Fixtures have `.k.ts` files under `src/`, no `kindscript.json`

---

## Key Files to Know

### Source Code

- `src/index.ts` - Public API (Kind, ConstraintConfig, InstanceConfig, MemberMap)
- `src/domain/entities/arch-symbol.ts` - Core domain entity
- `src/application/use-cases/check-contracts/` - Contract validation logic
- `src/application/use-cases/classify-ast/` - AST classification logic
- `src/infrastructure/cli/main.ts` - CLI entry point

### Tests

- `tests/helpers/factories.ts` - Test object builders (USE THESE)
- `tests/helpers/fixtures.ts` - Fixture path constants (USE THESE)
- `tests/helpers/test-pipeline.ts` - Integration test helper (USE THIS)
- `tests/README.md` - Complete testing guide (READ THIS FIRST)
- `tests/integration/fixtures/README.md` - Fixture catalog

### Documentation

See the [Documentation](#documentation-organization) section below for the full guide.

---

## Documentation Organization

The `docs/` directory is organized into four subdirectories. **Do not put docs in the flat `docs/` root** — use the appropriate subdirectory.

```
docs/
├── README.md              # Index — start here
├── architecture/          # Core reference (the "what" and "why")
├── status/                # Current state (the "where are we now")
├── design/                # Active design explorations (the "what if")
└── archive/               # Historical — do not use for implementation
```

### Where to Find Things

| I need to... | Read this |
|---|---|
| Understand how a component works | `docs/architecture/COMPILER_ARCHITECTURE.md` (the V4 spec) |
| Understand why a decision was made | `docs/architecture/DESIGN_DECISIONS.md` |
| See the milestone roadmap | `docs/architecture/BUILD_PLAN.md` |
| Check what's done vs remaining | `docs/status/DONE_VS_TODO.md` |
| See known issues and tech debt | `docs/status/CODEBASE_REVIEW_2026_02_07.md` |
| See remaining cleanup tasks | `docs/status/CLEANUP_PLAN.md` |
| Explore a future design direction | `docs/design/` (8 exploration docs) |
| Look at old architecture versions | `docs/archive/architecture/` |
| Look at completed milestone plans | `docs/archive/milestones/` |

### When Making Documentation Changes

| Action | Where |
|---|---|
| Architectural decision changes | Update `docs/architecture/` |
| Implementation progress updates | Update `docs/status/DONE_VS_TODO.md` |
| New tech debt or issues found | Update `docs/status/CODEBASE_REVIEW_2026_02_07.md` |
| New design exploration | Add to `docs/design/` |
| Completed a milestone or initiative | Move planning docs to `docs/archive/` |
| New cleanup items identified | Add to `docs/status/CLEANUP_PLAN.md` |

### Rules

- **Never reference archived docs for implementation decisions.** They contain outdated information.
- **Keep `docs/status/` current.** Update DONE_VS_TODO.md when completing significant work.
- **Design docs are exploratory, not authoritative.** Only `docs/architecture/` contains the source of truth.
- **Update this CLAUDE.md** if you add or move documentation files, so paths stay correct.
- **Update `docs/README.md`** if you add new docs or change the directory structure.

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
5. **Clear organization** - Tests grouped by feature, not scattered
6. **Documentation** - Update tests/README.md when adding new patterns

---

## Questions?

Read these in order:
1. [tests/README.md](tests/README.md) - Testing guide
2. [README.md](README.md) - Project overview
3. [docs/architecture/COMPILER_ARCHITECTURE.md](docs/architecture/COMPILER_ARCHITECTURE.md) - Deep dive

If still unclear, ask the user for clarification rather than guessing.

---

**Last Updated:** 2026-02-08
**Test Suite Status:** 29 files, 278 tests, 100% passing
