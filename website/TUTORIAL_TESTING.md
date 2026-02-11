# Tutorial Testing Plan

**Status:** ✅ Implementation Complete
**Date:** 2026-02-11
**Strategy:** Hybrid approach (Unit + Snapshot + E2E)

---

## Overview

This document describes the comprehensive testing strategy for the KindScript interactive tutorial. The goal is to ensure all 15 lessons are correct, executable, and provide the expected user experience.

## Architecture

The tutorial has three testable layers:

1. **Data Layer** - Lesson TypeScript files (`src/lib/lessons/*.ts`)
2. **Runtime Layer** - KindScript CLI execution within WebContainer
3. **UI Layer** - Browser interaction (Monaco, Terminal, Navigation)

Each layer requires different testing approaches.

---

## Testing Strategy: Hybrid Approach

### Phase 1: Unit Tests (Fast Feedback)
**Purpose:** Validate lesson data structure
**Speed:** <1 second
**When:** On every commit

**What we test:**
- All lessons have required fields (`slug`, `title`, `files`, `solution`, `focus`)
- File paths are valid (no `../` escapes, proper `.ts`/`.tsx` extensions)
- Solutions contain all files from starter code
- No duplicate lesson slugs
- Part/lesson numbering is sequential
- Focus file exists in files array

**Location:** `tests/unit/lessons.test.ts`

**Example:**
```typescript
test('All lessons have valid structure', () => {
  lessons.forEach(lesson => {
    expect(lesson.slug).toMatch(/^\d-\d-[a-z-]+$/);
    expect(lesson.files.length).toBeGreaterThan(0);
    expect(lesson.solution.length).toBeGreaterThan(0);
  });
});
```

---

### Phase 2: Snapshot Tests (Correctness Guarantee)
**Purpose:** Verify KindScript CLI behavior
**Speed:** ~5 seconds per lesson (75s total)
**When:** On pull requests

**What we test:**
- Starter code produces expected diagnostic output (violations or clean)
- Solution code always passes (0 violations)
- Diagnostic codes match expectations (KS10001, KS20001, etc.)
- Error messages are helpful

**Location:** `tests/snapshots/lesson-outputs.test.ts`

**Example:**
```typescript
test('Lesson 1-2: Detects noDependency violation', () => {
  const output = runKindScriptOnLesson(lessons[1]);

  expect(output).toContain('KS10001');
  expect(output).toContain('1 violation');
  expect(output).toMatchSnapshot();
});
```

**Key insight:** These tests catch regressions when:
- KindScript CLI output format changes
- Lesson code drifts from intended behavior
- New KindScript versions break examples

---

### Phase 3: E2E Tests (UX Validation)
**Purpose:** Test full user experience in browser
**Speed:** ~90 seconds per test
**When:** Before deployments, manually, or nightly

**What we test:**
- WebContainer boots successfully
- Terminal shows npm install output
- Monaco editor loads with syntax highlighting
- "Run Check" button executes `npx ksc check .`
- Terminal displays correct diagnostic output
- "Show Solution" button loads solution files
- File tree navigation works
- Lesson-to-lesson navigation works

**Location:** `tests/e2e/tutorial.spec.ts`

**Coverage strategy:** Test one lesson per Part (5 tests total)
- Part 1: Lesson 1-2 (noDependency violation)
- Part 2: Lesson 2-1 (purity violation)
- Part 3: Lesson 3-1 (noCycles violation)
- Part 4: Lesson 4-2 (design system)
- Part 5: Lesson 5-2 (molecules)

**Example:**
```typescript
test('Lesson 1-2: Run Check shows violation', async ({ page }) => {
  await page.goto('/tutorial/1-2-catching-violations');

  // Wait for WebContainer boot
  await expect(page.locator('.terminal'))
    .toContainText('npm install', { timeout: 60000 });

  // Click Run Check
  await page.click('button:has-text("Run Check")');

  // Verify output
  await expect(page.locator('.terminal'))
    .toContainText('KS10001', { timeout: 30000 });
  await expect(page.locator('.terminal'))
    .toContainText('1 violation');
});
```

---

## Implementation Plan

### Phase 1: Unit Tests ✅ (1 hour)

**Setup:**
```bash
npm install -D vitest @vitest/ui
```

**Files:**
- `vitest.config.ts` - Vitest configuration
- `tests/unit/lessons.test.ts` - Lesson data validation tests

**Run:**
```bash
npm run test:unit         # Run once
npm run test:unit:watch   # Watch mode
npm run test:unit:ui      # Visual UI
```

**Exit criteria:**
- All 15 lessons pass validation
- Tests run in <1 second
- Added to package.json scripts

---

### Phase 2: Snapshot Tests ✅ (2 hours)

**Setup:**
- Reuse Vitest from Phase 1
- Build KindScript CLI locally

**Files:**
- `tests/snapshots/lesson-outputs.test.ts` - CLI output validation
- `tests/snapshots/__snapshots__/` - Snapshot files (auto-generated)

**Run:**
```bash
npm run test:snapshots           # Run and compare
npm run test:snapshots:update    # Update snapshots
```

**Key decisions:**
- Use temp directories for each test (isolated file systems)
- Install KindScript as devDependency in website/package.json
- Snapshot the full terminal output for each lesson

**Exit criteria:**
- All 15 lessons have starter + solution snapshots (30 snapshots total)
- Snapshots contain expected diagnostic codes
- Tests run in <2 minutes

---

### Phase 3: E2E Tests ✅ (4 hours)

**Setup:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Files:**
- `playwright.config.ts` - Playwright configuration
- `tests/e2e/tutorial.spec.ts` - Browser interaction tests
- `tests/e2e/helpers.ts` - Shared utilities (waitForWebContainer, etc.)

**Run:**
```bash
npm run test:e2e       # Headless
npm run test:e2e:ui    # Interactive UI
npm run test:e2e:debug # Debug mode
```

**Key decisions:**
- Only test 5 representative lessons (one per Part)
- Use generous timeouts for WebContainer boot (60s)
- Run against `npm run dev` server (http://localhost:3000)
- Use Playwright's auto-waiting features
- Take screenshots on failure

**Exit criteria:**
- 5 critical lessons tested end-to-end
- Tests handle WebContainer boot timing
- Tests verify terminal output correctness
- Added to pre-deployment checklist

---

## Directory Structure

```
website/
├── tests/
│   ├── unit/
│   │   └── lessons.test.ts              # Phase 1: Data validation
│   ├── snapshots/
│   │   ├── lesson-outputs.test.ts       # Phase 2: CLI output
│   │   └── __snapshots__/               # Auto-generated snapshots
│   └── e2e/
│       ├── tutorial.spec.ts             # Phase 3: Browser tests
│       └── helpers.ts                   # Shared E2E utilities
├── vitest.config.ts
├── playwright.config.ts
└── package.json                          # Test scripts
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-tutorial.yml
name: Test Tutorial

on:
  push:
    paths:
      - 'website/**'
  pull_request:
    paths:
      - 'website/**'

jobs:
  unit-tests:
    name: Unit Tests (Lesson Data)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: cd website && npm ci
      - run: cd website && npm run test:unit

  snapshot-tests:
    name: Snapshot Tests (KindScript Output)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build                # Build KindScript CLI
      - run: cd website && npm ci
      - run: cd website && npm run test:snapshots

  e2e-tests:
    name: E2E Tests (Browser)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - run: cd website && npm ci
      - run: cd website && npx playwright install --with-deps chromium
      - run: cd website && npm run dev &
      - run: npx wait-on http://localhost:3000
      - run: cd website && npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-screenshots
          path: website/test-results/
```

### When Tests Run

| Test Type | Trigger | Duration | Blocks Merge? |
|-----------|---------|----------|---------------|
| Unit | Every commit | <1s | Yes |
| Snapshot | Pull requests | ~2min | Yes |
| E2E | Before deploy | ~8min | No (manual gate) |

---

## Maintenance

### Adding a New Lesson

1. **Create lesson files:**
   - `src/lib/lessons/X-Y-name.ts` (data)
   - `src/content/lessons/X-Y-name.mdx` (prose)

2. **Run unit tests:**
   ```bash
   npm run test:unit
   ```
   - Should auto-pass if structure is correct

3. **Generate snapshots:**
   ```bash
   npm run test:snapshots:update
   ```
   - Review snapshot output for correctness

4. **Optional: Add E2E test** (if lesson introduces new UI)

### Updating KindScript Version

When KindScript CLI output format changes:

1. Update snapshots:
   ```bash
   npm run test:snapshots:update
   ```

2. Review changes:
   ```bash
   git diff tests/snapshots/__snapshots__/
   ```

3. Verify changes are intentional (not regressions)

4. Commit updated snapshots

### Debugging Failed Tests

**Unit test failure:**
```bash
npm run test:unit:ui  # Visual inspector
```

**Snapshot mismatch:**
```bash
npm run test:snapshots -- --reporter=verbose
# Check diff in terminal
```

**E2E test failure:**
```bash
npm run test:e2e:debug
# Opens Playwright Inspector with time-travel debugging
```

---

## Success Metrics

### Coverage Goals

- ✅ **100% of lessons** have unit tests (data validation)
- ✅ **100% of lessons** have snapshot tests (CLI output)
- ✅ **33% of lessons** have E2E tests (5 out of 15, one per Part)

### Quality Goals

- ✅ Unit tests run in <1 second
- ✅ Snapshot tests run in <2 minutes
- ✅ E2E tests run in <10 minutes
- ✅ Zero flaky tests (>99% pass rate in CI)

### Process Goals

- ✅ All tests documented in this file
- ✅ Test failures block merges (unit + snapshot)
- ✅ E2E tests run before production deploys
- ✅ Snapshots reviewed in PRs (not auto-approved)

---

## Future Enhancements

### Potential Additions

1. **Visual regression testing** (Percy, Chromatic)
   - Screenshot each lesson
   - Catch CSS/layout regressions

2. **Performance testing**
   - WebContainer boot time benchmarks
   - File operation latency

3. **Accessibility testing** (axe-core)
   - ARIA labels
   - Keyboard navigation
   - Screen reader compatibility

4. **Load testing**
   - Concurrent WebContainer instances
   - Terminal output buffering

5. **Content linting**
   - MDX prose style guide
   - Code example formatting
   - Terminology consistency

### Not Planned

- ❌ Unit testing Monaco/Terminal components (covered by E2E)
- ❌ 100% E2E coverage (too slow, diminishing returns)
- ❌ Mutation testing (not worth complexity)

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [WebContainer API](https://webcontainers.io/api)
- [KindScript CLI Reference](../README.md)

---

## Appendix: Test Naming Convention

```typescript
// Unit tests
describe('Lesson Data Validation', () => {
  test('All lessons have required fields', () => {});
  test('File paths are valid', () => {});
  test('Solutions contain all starter files', () => {});
});

// Snapshot tests
describe('Lesson Outputs', () => {
  test('Lesson 1-1: starter (clean)', () => {});
  test('Lesson 1-1: solution (clean)', () => {});
  test('Lesson 1-2: starter (violation)', () => {});
  test('Lesson 1-2: solution (clean)', () => {});
});

// E2E tests
describe('Tutorial - Part 1 (noDependency)', () => {
  test('Lesson 1-2: Run Check shows violation', async ({ page }) => {});
  test('Lesson 1-2: Show Solution fixes violation', async ({ page }) => {});
});
```

---

**Last Updated:** 2026-02-11
**Implemented:** Phase 1 ✅, Phase 2 ✅, Phase 3 ✅
