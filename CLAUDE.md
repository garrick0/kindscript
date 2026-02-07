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
│   ├── kind.ts                      # Kind<N> base interface
│   ├── locate.ts                    # locate<T>() + MemberMap<T>
│   └── define-contracts.ts          # defineContracts<T>() marker
├── domain/
│   ├── entities/                    # ArchSymbol, Contract, Diagnostic
│   ├── value-objects/               # ImportEdge, Location
│   ├── types/                       # ArchSymbolKind, ContractType
│   └── constants/                   # DiagnosticCode
├── application/
│   ├── ports/                       # TypeScriptPort, FileSystemPort, ASTPort
│   ├── services/                    # ConfigSymbolBuilder
│   └── use-cases/
│       ├── check-contracts/         # Contract validation (5 types)
│       ├── classify-ast/            # AST → ArchSymbol classification
│       ├── resolve-files/           # ArchSymbol → filesystem files
│       ├── detect-architecture/     # Pattern detection
│       ├── infer-architecture/      # Generate architecture.ts
│       ├── generate-project-refs/   # TypeScript project references
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

**Current Stats:** 30 test files, ~360 tests, 100% passing

### Test Layers

```
tests/
├── helpers/                         # 4 files - Shared utilities
│   ├── factories.ts                 # Test object builders
│   ├── fixtures.ts                  # Fixture path constants
│   ├── test-pipeline.ts             # Integration test pipeline helper
│   └── (E2E helpers in tests/e2e/helpers.ts)
│
├── unit/                            # 26 files - Fast isolated tests
│   ├── arch-symbol.test.ts          # Domain entities
│   ├── contract.test.ts
│   ├── diagnostic.test.ts
│   ├── classify-ast-*.test.ts       # Service tests (split into 3)
│   ├── check-contracts-*.test.ts    # Service tests (split into 3)
│   └── ...                          # All other services & adapters
│
├── integration/                     # 4 files - Multi-component tests
│   ├── check-contracts.integration.test.ts
│   ├── tier2-contracts.integration.test.ts
│   ├── tier2-locate.integration.test.ts
│   ├── infer-and-detect.integration.test.ts
│   └── fixtures/                    # 26 fixture directories
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

### Key Test Files (Recently Split)

**classify-ast** tests split into 3 files:
- `classify-ast-kind-parsing.test.ts` (80 lines, 4 tests) - Kind definition parsing
- `classify-ast-contracts.test.ts` (570 lines, 34 tests) - Contract parsing & validation
- `classify-ast-locate.test.ts` (370 lines, 20 tests) - locate<T>() & multi-file

**check-contracts** tests split into 3 files:
- `check-contracts-dependency.test.ts` (296 lines, 17 tests) - noDependency + noCycles
- `check-contracts-implementation.test.ts` (177 lines, 14 tests) - mustImplement + colocated
- `check-contracts-purity.test.ts` (260 lines, 15 tests) - purity + existence + general

**E2E tests** consolidated into 1 file:
- `cli.e2e.test.ts` (424 lines, 33 tests) - All CLI commands organized by command

### Test Documentation

**PRIMARY:** [tests/README.md](tests/README.md) - Complete testing guide
- How to run tests
- When to use each test layer
- Writing new tests
- Common patterns
- Debugging tips

**FIXTURES:** [tests/integration/fixtures/README.md](tests/integration/fixtures/README.md) - Fixture catalog
- All 26 fixtures documented
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
3. **Application layer** - Implement validation in `src/application/use-cases/check-contracts/`
4. **Tests** - Add unit tests in `tests/unit/check-contracts-*.test.ts`
5. **Tests** - Add integration tests in `tests/integration/tier2-contracts.integration.test.ts`
6. **Fixtures** - Create clean + violation fixtures
7. **Tests** - Add E2E tests in `tests/e2e/cli.e2e.test.ts`
8. **Helpers** - Add factory function in `tests/helpers/factories.ts`
9. **Documentation** - Update README.md with contract description

#### 5. Running Tests

```bash
# Full suite (should always pass)
npm test

# Specific layer
npm test -- tests/unit
npm test -- tests/integration
npm test -- tests/e2e

# Specific file
npm test -- check-contracts-dependency

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

## Recent Changes (Phase 2C)

**Date:** 2026-02-07

**Summary:** Major test file splits completed
- Split `classify-ast.service.test.ts` (1,034 lines) → 3 focused files
- Split `check-contracts.service.test.ts` (686 lines) → 3 focused files
- All ~360 tests passing, 100% pass rate maintained
- Largest file reduced from 1,034 to 570 lines (-45%)

**Impact for agents:**
- Test organization is now optimal (no file over 600 lines)
- Tests grouped by feature/contract type for easy navigation
- All shared helpers extracted and documented

**See:** [docs/archive/test-consolidation/TEST_CONSOLIDATION_PHASE2_SUMMARY.md](docs/archive/test-consolidation/TEST_CONSOLIDATION_PHASE2_SUMMARY.md)

---

## Key Files to Know

### Source Code

- `src/index.ts` - Public API (Kind, locate, defineContracts)
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
| See known issues and tech debt | `docs/status/CODEBASE_REVIEW.md` |
| See remaining cleanup tasks | `docs/status/CLEANUP_PLAN.md` |
| Explore a future design direction | `docs/design/` (4 exploration docs) |
| Look at old architecture versions | `docs/archive/architecture/` |
| Look at completed milestone plans | `docs/archive/milestones/` |

### When Making Documentation Changes

| Action | Where |
|---|---|
| Architectural decision changes | Update `docs/architecture/` |
| Implementation progress updates | Update `docs/status/DONE_VS_TODO.md` |
| New tech debt or issues found | Update `docs/status/CODEBASE_REVIEW.md` |
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

**Last Updated:** 2026-02-07
**Test Suite Status:** 30 files, ~360 tests, 100% passing
