# Test Fixtures Catalog

This directory contains 26 fixture directories used for integration and E2E testing. Each fixture represents a complete KindScript project with specific architectural characteristics.

---

## Fixture Categories

### Basic Clean Architecture
Foundational fixtures for testing the noDependency contract.

| Fixture | Purpose | Key Files | Contracts |
|---------|---------|-----------|-----------|
| `clean-arch-valid` | ✅ Compliant clean architecture | architecture.ts, kindscript.json, src/{domain,infrastructure}/ | noDependency satisfied |
| `clean-arch-violation` | ❌ Domain imports infrastructure | architecture.ts (domain → infrastructure import) | noDependency violated |

**Used by:** check-contracts.integration, cli-check.e2e, cli-subprocess.e2e

---

### Architecture Detection
Fixtures for testing automatic pattern recognition.

| Fixture | Purpose | Detected Pattern | Layers |
|---------|---------|------------------|--------|
| `detect-clean-arch` | Clean architecture detection | CleanArchitecture | domain, application, infrastructure |
| `detect-clean-arch-impure` | Clean arch with impure imports | CleanArchitecture | Same as above, but domain imports 'fs' |
| `detect-hexagonal` | Hexagonal architecture detection | Hexagonal | domain, ports, adapters |
| `detect-unknown` | Unrecognized pattern | Unknown | No architectural layers |

**Used by:** detect-architecture.integration, infer-architecture.integration, cli-infer.e2e, cli-init-detect.e2e

---

### Inference & Stdlib
Fixtures for testing code generation and package integration.

| Fixture | Purpose | Has node_modules/ | Package Used |
|---------|---------|-------------------|--------------|
| `infer-with-stdlib` | Tests import-based code generation | ✅ | @kindscript/clean-architecture |
| `stdlib-clean-arch` | Clean project with stdlib | ✅ | @kindscript/clean-architecture |
| `stdlib-clean-arch-violation` | Violation with stdlib | ✅ | @kindscript/clean-architecture |
| `stdlib-missing-pkg` | Tests graceful package-not-found | ❌ | (references non-existent package) |

**Used by:** infer-architecture.integration, stdlib-packages.integration, cli-infer.e2e, cli-stdlib.e2e

---

### Tier 2 (Kind-Based Definitions)
Fixtures using Kind type definitions instead of inferred patterns.

| Fixture | Purpose | architecture.ts | Violation |
|---------|---------|----------------|-----------|
| `tier2-clean-arch` | Kind-based clean architecture | ✅ Uses `locate<CleanContext>` | None |
| `tier2-violation` | Kind-based with noDependency violation | ✅ | domain → infrastructure |

**Used by:** tier2-classify.integration, tier2-contracts.integration, cli-tier2.e2e, cli-tier2-contracts.e2e

---

### Contract-Specific Fixtures
Each contract type has dedicated fixtures.

#### Purity Contract

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `purity-clean` | Domain with no Node.js imports | None |
| `purity-violation` | Domain imports 'fs' | ❌ Impure import (KS70003) |

**Used by:** tier2-contracts.integration, cli-tier2-contracts.e2e

---

#### NoCycles Contract

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `no-cycles-violation` | Circular dependency between domain & infrastructure | ❌ Circular dependency (KS70004) |

**Used by:** tier2-contracts.integration, cli-tier2-contracts.e2e

---

#### MustImplement Contract

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `must-implement-clean` | All ports have adapters | None |
| `must-implement-violation` | Port without adapter implementation | ❌ Missing implementation (KS70002) |

**Used by:** tier2-contracts.integration, cli-tier2-contracts.e2e

---

#### Colocated Contract

| Fixture | Purpose | Violation |
|---------|---------|-----------|
| `colocated-clean` | All components have test counterparts | None |
| `colocated-violation` | Component without test file | ❌ Not colocated (KS70005) |

**Used by:** tier2-contracts.integration, cli-tier2-contracts.e2e

---

### locate<T>() Feature Fixtures
Test the location derivation mechanism.

| Fixture | Purpose | Tests |
|---------|---------|-------|
| `locate-clean-arch` | Basic locate() with derived locations | Member location derivation |
| `locate-violation` | locate() with contract violation | noDependency on derived paths |
| `locate-existence` | Tests existence checking for derived locations | Missing derived location diagnostic |
| `locate-nested` | Multi-level Kind tree | Nested member path derivation (src/domain/entities) |
| `locate-standalone-member` | Standalone variable references | Variable resolution in locate members |
| `locate-path-override` | Custom path via `path` property | Path override: `{ path: "value-objects" }` |
| `locate-multi-instance` | Two locate() calls in one file | Multi-instance classification |

**Used by:** tier2-locate.integration

---

## Fixture Structure

### Standard Fixture Layout

```
fixture-name/
├── architecture.ts         # Kind definitions, instances, contracts
├── kindscript.json        # Configuration (definitions, packages)
├── tsconfig.json          # TypeScript config
└── src/                   # Source code
    ├── domain/
    │   ├── entity.ts
    │   └── service.ts
    ├── application/       # (if present)
    └── infrastructure/    # (if present)
```

### Special Cases

- **node_modules/** - Only in stdlib fixtures (infer-with-stdlib, stdlib-*)
- **No architecture.ts** - Only in detect-* fixtures (to be generated)

---

## Fixture Usage Matrix

| Fixture | Integration Tests | E2E Tests | Total Uses |
|---------|-------------------|-----------|------------|
| `clean-arch-valid` | 2 | 3 | 5 |
| `clean-arch-violation` | 2 | 4 | 6 |
| `detect-clean-arch` | 2 | 2 | 4 |
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
import { FIXTURE_NAMES } from '../helpers/fixtures';

// Using full path
const result = run(['check', path.join(FIXTURES_DIR, 'clean-arch-violation')]);

// Using copyFixtureToTemp for --write tests
const tmpDir = copyFixtureToTemp(FIXTURE_NAMES.DETECT_CLEAN_ARCH);
```

---

## Adding New Fixtures

1. **Create fixture directory** in `tests/integration/fixtures/`
2. **Add required files**: architecture.ts, kindscript.json, tsconfig.json, src/
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

✅ **Do:**
- Keep fixtures minimal (only what's needed to test the feature)
- Use consistent file naming across fixtures
- Document violations clearly in comments
- Ensure kindscript.json is valid JSON

❌ **Don't:**
- Add unnecessary files or dependencies
- Modify fixtures shared by multiple tests without checking impact
- Commit node_modules to fixtures (except stdlib-* for testing)
- Leave fixtures in broken state

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
| colocated | colocated-clean | colocated-violation | KS70005 |

---

## Questions?

See main test documentation: [tests/README.md](../README.md)
