# Scaffold Removal Plan

> Remove the `ksc scaffold` command and all supporting code.

## Rationale

Scaffolding is a peripheral convenience feature that generates empty directories and stub `export {};` files. It is:

- **Not part of the core enforcement pipeline** (check/classify/infer/detect)
- **Not exported in the public API** (`src/index.ts` has no scaffold exports)
- **High overhead for low value** — 338 lines of source, 684 lines of tests, 3 fixture directories, 3 domain value objects... all to run the equivalent of `mkdir -p`
- **Rarely useful in practice** — most adopters already have project structures in place

Removing it cuts ~1,000 lines of code+tests with zero impact on validation functionality.

---

## Phase 1: Delete Scaffold-Only Files

Delete these outright — they exist solely for scaffolding.

### Source (8 files, ~340 lines)

| File | Lines |
|------|-------|
| `src/application/use-cases/scaffold/scaffold.service.ts` | 105 |
| `src/application/use-cases/scaffold/scaffold.use-case.ts` | 9 |
| `src/application/use-cases/scaffold/scaffold.types.ts` | 14 |
| `src/infrastructure/cli/commands/scaffold.command.ts` | 130 |
| `src/domain/value-objects/scaffold-operation.ts` | 31 |
| `src/domain/value-objects/scaffold-plan.ts` | 30 |
| `src/domain/value-objects/scaffold-result.ts` | 45 |

Then delete the now-empty directory: `src/application/use-cases/scaffold/`

### Tests (3 files, ~684 lines)

| File | Lines |
|------|-------|
| `tests/unit/scaffold.service.test.ts` | 273 |
| `tests/unit/value-objects.test.ts` | 181 |
| `tests/integration/scaffold.integration.test.ts` | 230 |

### Fixtures (3 directories)

| Directory |
|-----------|
| `tests/integration/fixtures/scaffold-clean-arch/` |
| `tests/integration/fixtures/scaffold-multi-instance/` |
| `tests/integration/fixtures/scaffold-nested/` |

---

## Phase 2: Edit Files That Reference Scaffold

### Source (2 files)

1. **`src/infrastructure/cli/main.ts`**
   - Remove `ScaffoldCommand` and `ScaffoldService` imports
   - Remove `if (command === 'scaffold')` handler block
   - Remove `runScaffold()` function
   - Remove `scaffold` from help text output

2. **`src/application/use-cases/classify-project/classify-project.use-case.ts`**
   - Update comment that says "Used by CLI commands (check, scaffold)" → remove "scaffold"

### Tests (2 files)

3. **`tests/e2e/cli.e2e.test.ts`**
   - Delete the entire `describe('ksc scaffold', ...)` block (~126 lines)

4. **`tests/helpers/fixtures.ts`**
   - Remove `SCAFFOLD_CLEAN_ARCH`, `SCAFFOLD_MULTI_INSTANCE`, `SCAFFOLD_NESTED` constants

### Test Documentation (2 files)

5. **`tests/README.md`**
   - Remove scaffold from test layer descriptions
   - Update test file counts

6. **`tests/integration/fixtures/README.md`**
   - Remove the 3 scaffold fixture entries from the catalog
   - Update fixture count

---

## Phase 3: Update Documentation

### Project root (2 files)

7. **`README.md`** — Remove `ksc scaffold` from command list and any workflow references

8. **`CLAUDE.md`** — Remove scaffold from:
   - Directory structure listing
   - Test suite organization
   - Test file counts / stats
   - Common patterns / examples
   - Fixture references

### Architecture docs (4 files)

9. **`docs/architecture/COMPILER_ARCHITECTURE.md`** — Remove scaffold use case from architecture description

10. **`docs/architecture/BUILD_PLAN.md`** — Remove scaffold milestone items and code examples

11. **`docs/architecture/DESIGN_DECISIONS.md`** — Remove the ts-morph scaffolder decision entry

12. **`docs/status/DONE_VS_TODO.md`** — Remove scaffold line items from done/todo lists

### Design docs (3 files)

13. **`docs/design/KIND_DERIVED_LOCATIONS.md`** — Remove scaffold references

14. **`docs/design/MEMBER_KIND_TYPES.md`** — Remove scaffold references

15. **`docs/design/FILESYSTEM_CONSTRAINTS.md`** — Remove scaffold references

### Notebooks (3 files)

16. **`notebooks/01-quickstart.ipynb`** — Remove scaffold workflow cells/sections

17. **`notebooks/02-contracts.ipynb`** — Remove scaffold references

18. **`notebooks/04-bounded-contexts.ipynb`** — Remove scaffold references

### Archive docs (light touch)

19. **`docs/archive/`** — Leave as-is. These are historical records. Editing archived docs to remove scaffold references would be revisionist. A note in the archive index is sufficient.

---

## Phase 4: Validate

1. `npm run build` — no TypeScript errors
2. `npm test` — all remaining tests pass
3. `npm test -- --coverage` — coverage thresholds still met
4. Verify `ksc --help` no longer lists `scaffold`

---

## Impact Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Source files | ~50 | ~43 | -7 |
| Source lines | ~3,400 | ~3,060 | -340 |
| Test files | 33 | 30 | -3 |
| Test lines | ~5,000 | ~4,300 | -700 |
| Fixture dirs | 29 | 26 | -3 |
| Domain VOs | ~8 | ~5 | -3 |
| CLI commands | 5 | 4 | -1 |
| Use cases | ~9 | ~8 | -1 |

**Total lines removed: ~1,040 (source + tests)**
**Files deleted: 10 files + 3 directories**
**Files edited: ~19**

Zero impact on the core pipeline: check, classify, infer, detect all untouched.
