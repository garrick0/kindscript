# Test Fixtures Catalog

This directory contains 18 fixture directories used for integration and E2E testing. Each fixture represents a complete KindScript project with specific architectural characteristics.

**Convention:** Definition files use the `.k.ts` extension and are auto-discovered. Root is inferred from the `.k.ts` file's directory — no `root` property or `kindscript.json` needed.

---

## Fixture Categories

### Basic Clean Architecture
Foundational fixtures for testing the noDependency contract.

| Fixture | Purpose | Key Files | Contracts |
|---------|---------|-----------|-----------|
| `clean-arch-valid` | Compliant clean architecture | src/context.k.ts, src/{domain,infrastructure}/ | noDependency satisfied |
| `clean-arch-violation` | Domain imports infrastructure | src/context.k.ts (domain -> infrastructure import) | noDependency violated |

**Used by:** check-contracts.integration, cli-check.e2e

---

### Tier 2 (Kind-Based Definitions)
Fixtures using Kind type definitions.

| Fixture | Purpose | Definition File | Violation |
|---------|---------|----------------|-----------|
| `tier2-clean-arch` | Kind-based clean architecture | src/context.k.ts | None |
| `tier2-violation` | Kind-based with noDependency violation | src/context.k.ts | domain -> infrastructure |

**Used by:** tier2-contracts.integration, cli.e2e

---

### Contract-Specific Fixtures
Each contract type has dedicated fixtures.

#### Purity Contract

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `purity-clean` | Domain with no Node.js imports | None |
| `purity-violation` | Domain imports 'fs' | Impure import (KS70003) |

**Used by:** tier2-contracts.integration, cli.e2e

---

#### NoCycles Contract

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `no-cycles-violation` | Circular dependency between domain & infrastructure | Circular dependency (KS70004) |

**Used by:** tier2-contracts.integration, cli.e2e

---

#### MustImplement Contract

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `must-implement-clean` | All ports have adapters | None |
| `must-implement-violation` | Port without adapter implementation | Missing implementation (KS70002) |

**Used by:** tier2-contracts.integration, cli.e2e

---

#### Mirrors Contract (filesystem.mirrors)

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `mirrors-clean` | All components have test counterparts | None |
| `mirrors-violation` | Component without test file | Missing counterpart (KS70005) |

**Used by:** tier2-contracts.integration, cli.e2e

---

### InstanceConfig<T> Feature Fixtures
Test the location derivation mechanism.

| Fixture | Purpose | Tests |
|---------|---------|-------|
| `locate-clean-arch` | Basic InstanceConfig with derived locations | Member location derivation |
| `locate-violation` | InstanceConfig with contract violation | noDependency on derived paths |
| `locate-existence` | Tests existence checking for derived locations | Missing derived location diagnostic |
| `locate-nested` | Multi-level Kind tree | Nested member path derivation (src/domain/entities) |
| `locate-standalone-member` | Standalone variable references | Variable resolution in instance members |
| `locate-path-override` | Custom path via `path` property | Path override: `{ path: "value-objects" }` |
| `locate-multi-instance` | Two .k.ts files in separate directories | Multi-instance classification |

**Used by:** tier2-locate.integration

---

## Fixture Structure

### Standard Fixture Layout

```
fixture-name/
├── tsconfig.json          # TypeScript config
└── src/                   # Source code
    ├── context.k.ts       # Kind definitions + InstanceConfig (root = src/)
    ├── domain/
    │   ├── entity.ts
    │   └── service.ts
    ├── application/       # (if present)
    └── infrastructure/    # (if present)
```

### Multi-Instance Layout (locate-multi-instance)

```
locate-multi-instance/
├── tsconfig.json
└── src/
    ├── ordering/
    │   ├── ordering.k.ts  # OrderingContext (root = src/ordering/)
    │   ├── domain/
    │   └── infrastructure/
    └── billing/
        ├── billing.k.ts   # BillingContext (root = src/billing/)
        ├── domain/
        └── adapters/
```

### Notes

- All fixtures have `.k.ts` definition files inside `src/` (no `kindscript.json` needed)
- Root is inferred from the `.k.ts` file's directory

---

## Fixture Usage Matrix

| Fixture | Integration Tests | E2E Tests | Total Uses |
|---------|-------------------|-----------|------------|
| `clean-arch-valid` | 2 | 3 | 5 |
| `clean-arch-violation` | 2 | 4 | 6 |
| `tier2-clean-arch` | 2 | 2 | 4 |
| `purity-violation` | 1 | 1 | 2 |
| `locate-*` (7 fixtures) | 1 each | 0 | 1 each |
| (Others) | 1-2 | 0-1 | 1-3 |

Most-used fixtures: `clean-arch-violation` (6 uses), `clean-arch-valid` (5 uses)

---

## Accessing Fixtures in Tests

### Integration Tests

```typescript
import { FIXTURES } from '../../helpers/fixtures';

const fixturePath = FIXTURES.CLEAN_ARCH_VIOLATION;
const result = checkService.execute({ ... });
```

### E2E Tests

```typescript
import { run, FIXTURES_DIR } from './helpers';

// Using full path
const result = run(['check', path.join(FIXTURES_DIR, 'clean-arch-violation')]);
```

---

## Adding New Fixtures

1. **Create fixture directory** in `tests/integration/fixtures/`
2. **Add required files**: `src/context.k.ts` (Kind definitions + instance), `tsconfig.json`, source files under `src/`
3. **Add to constants** in `tests/helpers/fixtures.ts`:
   ```typescript
   export const FIXTURES = {
     // ...existing
     MY_NEW_FIXTURE: path.join(FIXTURES_BASE, 'my-new-fixture'),
   };

   export const FIXTURE_NAMES = {
     // ...existing
     MY_NEW_FIXTURE: 'my-new-fixture',
   };
   ```
4. **Write tests** using the new fixture
5. **Update this README** with fixture description

---

## Fixture Maintenance

### Guidelines

- Keep fixtures minimal (only what's needed to test the feature)
- Use consistent file naming across fixtures
- Document violations clearly in comments
- Place `.k.ts` definition files inside `src/` so root is inferred correctly

### Verification

Run fixture validation:
```bash
npm test -- tests/integration
```

Check for unused fixtures:
```bash
grep -r "FIXTURES\." tests/ | sort | uniq
```

---

## Fixture Reference Sheet

| Contract Type | Clean Fixture | Violation Fixture | Error Code |
|---------------|---------------|-------------------|------------|
| noDependency | clean-arch-valid | clean-arch-violation | KS70001 |
| mustImplement | must-implement-clean | must-implement-violation | KS70002 |
| purity | purity-clean | purity-violation | KS70003 |
| noCycles | (none) | no-cycles-violation | KS70004 |
| filesystem.mirrors | mirrors-clean | mirrors-violation | KS70005 |
| filesystem.exists | (none) | locate-existence | KS70010 |

---

## Questions?

See main test documentation: [tests/README.md](../README.md)
