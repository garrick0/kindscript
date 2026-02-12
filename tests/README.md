# Test Suite Documentation

## Overview

This directory contains the complete test suite for KindScript, organized to mirror the source directory structure:

- **Domain Tests** (`tests/domain/`) - Pure domain entity tests
- **Application Tests** (`tests/application/`) - Pipeline stage and contract plugin tests
- **Infrastructure Tests** (`tests/infrastructure/`) - Shared adapter tests
- **CLI Tests** (`tests/cli/`) - CLI command tests (unit + E2E)
- **Plugin Tests** (`tests/plugin/`) - Plugin service tests
- **Integration Tests** (`tests/integration/`) - Multi-component tests with real I/O
- **Helpers** (`tests/helpers/`) - Shared utilities, factories, mocks

**Current Stats:** 33 test files, 381 tests, 100% passing
**Test Runner:** Vitest v2.1.0 (migrated from Jest)

---

## Directory Structure

```
tests/
├── helpers/                         # Shared test utilities
│   ├── factories.ts                 # Test data builders (symbols, contracts, etc.)
│   ├── fixtures.ts                  # Fixture path constants
│   ├── test-pipeline.ts             # Integration test pipeline helper
│   └── mocks/                       # 3 mock adapters
│       ├── mock-typescript.adapter.ts
│       ├── mock-filesystem.adapter.ts
│       └── mock-ast.adapter.ts
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
├── infrastructure/                  # 3 files - Shared adapter tests
│   ├── ast.adapter.test.ts
│   ├── config-adapter.test.ts
│   └── path-utils.test.ts
│
├── cli/
│   ├── unit/                        # 2 files - CLI command tests
│   │   ├── check-command.test.ts
│   │   └── cli-diagnostic.adapter.test.ts
│   └── e2e/                         # 2 files - CLI subprocess tests
│       ├── helpers.ts
│       └── cli.e2e.test.ts
│
├── plugin/
│   └── unit/                        # 5 files - Plugin service tests
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
    └── fixtures/                    # See fixtures/README.md
```

---

## Running Tests

KindScript uses [Vitest](https://vitest.dev/) as its test runner.

```bash
# Run all tests (381 tests)
npm test

# Run with coverage report
npm run test:coverage

# Interactive UI mode (recommended for development)
npm run test:ui

# Watch mode (re-runs tests on file changes)
npm run test:watch

# Run specific test file (by name substring)
npm test -- check-contracts-service

# Run tests by layer
npm test -- tests/domain
npm test -- tests/application
npm test -- tests/infrastructure
npm test -- tests/cli
npm test -- tests/plugin
npm test -- tests/integration
```

---

## Test Framework

**Vitest** - Fast, ESM-native test runner with Jest-compatible API.

**Why Vitest:**
- ⚡ 20-40% faster than Jest
- 🎯 Native ESM support
- 🔄 Jest-compatible API (describe, it, expect, etc.)
- 🎨 Interactive UI mode for debugging
- 📊 Fast, accurate V8 coverage

**Mocking:** Use `vi.fn()` and `vi.spyOn()` (Vitest's Jest-compatible mocking API).

**Configuration:** See `vitest.config.ts` for coverage thresholds and test environment settings.

---

## Where to Put New Tests

| What are you testing? | Where |
|-----------------------|-------|
| Domain entity / value object | `tests/domain/` |
| Pipeline stage service (scan, parse, bind, pipeline) | `tests/application/` |
| Contract plugin (checker) | `tests/application/` |
| Shared infrastructure adapter | `tests/infrastructure/` |
| CLI command or CLI adapter | `tests/cli/unit/` |
| Plugin service or plugin adapter | `tests/plugin/unit/` |
| Multiple services with real TS compiler | `tests/integration/` |
| CLI as subprocess | `tests/cli/e2e/cli.e2e.test.ts` |

---

## Shared Utilities

### Test Helpers (`tests/helpers/`)

**factories.ts** - Builders for common test objects:
```typescript
import { makeSymbol, noDependency } from '../helpers/factories';
// or from deeper: import { makeSymbol } from '../../helpers/factories';

const domain = makeSymbol('domain');
const contract = noDependency(domain, infrastructure);
```

**fixtures.ts** - Fixture path constants:
```typescript
import { FIXTURES } from '../helpers/fixtures';

const fixturePath = FIXTURES.CLEAN_ARCH_VIOLATION;
```

**mocks/** - Mock adapters for unit tests:
```typescript
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';
import { MockASTAdapter } from '../helpers/mocks/mock-ast.adapter';
```

### Integration Test Pipeline (`tests/helpers/test-pipeline.ts`)

```typescript
import { runPipeline } from '../helpers/test-pipeline';
import { FIXTURES } from '../helpers/fixtures';

const { classifyResult, checkResult } = runPipeline(FIXTURES.TIER2_CLEAN_ARCH);
```

### E2E Helpers (`tests/cli/e2e/helpers.ts`)

```typescript
import { run } from './helpers';

const result = run(['check', '/path/to/project']);
// Returns: { stdout, stderr, exitCode }
```

---

## Adding New Constraint Types

1. **Domain layer** - Add contract type to `src/domain/types/contract-type.ts`
2. **Domain layer** - Add diagnostic code to `src/domain/constants/diagnostic-codes.ts`
3. **Application layer** - Create plugin in `src/application/pipeline/plugins/<name>/<name>.plugin.ts`
4. **Application layer** - Register plugin in `src/application/pipeline/plugins/plugin-registry.ts` (`createAllPlugins()`)
5. **Tests** - Add unit tests in `tests/application/<name>.plugin.test.ts`
6. **Tests** - Add integration tests in `tests/integration/tier2-contracts.integration.test.ts`
7. **Fixtures** - Create clean + violation fixtures in `tests/integration/fixtures/`
8. **Tests** - Add E2E tests in `tests/cli/e2e/cli.e2e.test.ts`
9. **Helpers** - Add factory function in `tests/helpers/factories.ts`
10. **Documentation** - Update fixture catalog

---

## Coverage Requirements

```javascript
coverageThreshold: {
  'src/domain/': { branches: 75, functions: 90, lines: 90, statements: 90 },
  'src/application/': { branches: 85, functions: 100, lines: 95, statements: 95 }
}
```

Infrastructure adapters are covered via integration/E2E tests without strict thresholds.

---

## File Size Guidelines

- No single test file should exceed 600 lines
- If a file grows too large, split it logically by feature or contract type
- Follow the pattern used in classify-ast splits (3 files by concern)
