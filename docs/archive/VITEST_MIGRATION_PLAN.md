# Vitest + ESM Migration Plan

**Status:** Planning
**Created:** 2026-02-12
**Estimated Effort:** 2-3 hours

---

## Executive Summary

Migrate KindScript from Jest + CommonJS to Vitest + ESM. This aligns with modern Node.js best practices, reduces dependencies, and brings consistency with the website's test infrastructure.

**Key Benefits:**
- ⚡ Faster test execution (Vitest uses Vite under the hood)
- 🎯 Better TypeScript integration (native ESM support)
- 🔄 Consistency with website (already using Vitest)
- 📦 Smaller dependency footprint
- 🚀 Modern JavaScript ecosystem alignment

---

## Current State Analysis

### Test Infrastructure

**Current Setup:**
- Test runner: Jest v29.5.0 + ts-jest v29.1.0
- Test files: 31 files, 342 tests
- Coverage: Custom thresholds (domain 90%, application 95%)
- Test organization: By layer (domain, application, infrastructure, cli, plugin, integration)

**Module System:**
- TypeScript: `"module": "commonjs"` (outputs CJS)
- Package type: Not specified (defaults to CJS)
- Only 3 files use CJS explicitly:
  1. `jest.config.js` - uses `module.exports`
  2. `src/apps/cli/main.ts:19` - uses `require()` for package.json
  3. `tests/plugin/unit/plugin-loading.test.ts` - uses `require()` for dynamic plugin loading

**Dependencies to Remove:**
```json
"@types/jest": "^29.5.0",
"jest": "^29.5.0",
"ts-jest": "^29.1.0"
```

**Dependencies to Add:**
```json
"vitest": "^2.1.0",
"@vitest/ui": "^2.1.0"  // Optional but useful
```

### Website Reference

The website already uses Vitest successfully with identical project structure:
- `website/vitest.config.ts` - clean, minimal config
- `website/package.json` - includes `"type": "module"`
- All test scripts use vitest commands
- 76 tests passing with full coverage

---

## Migration Strategy

### Phase 1: Module System (ESM)

**Goal:** Convert all CommonJS to ESM

#### 1.1 Update package.json

Add `"type": "module"` to enable ESM:

```json
{
  "name": "kindscript",
  "version": "2.0.0",
  "type": "module",  // <-- ADD THIS
  "description": "Architectural enforcement for TypeScript",
  // ...
}
```

#### 1.2 Update TypeScript Config

Change `tsconfig.json` to output ESM:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",        // <-- CHANGE from "commonjs"
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "bundler",  // <-- CHANGE from "node"

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Note:** Use `"moduleResolution": "bundler"` for modern ESM + TypeScript 5.x

#### 1.3 Convert CJS Usage to ESM

**File 1: `jest.config.js` → `vitest.config.ts`**

Delete `jest.config.js` and create `vitest.config.ts` (covered in Phase 2)

**File 2: `src/apps/cli/main.ts:19`**

Replace `require()` with dynamic `import()`:

```typescript
// BEFORE (line 19)
const pkg = require('../../../package.json');

// AFTER
const pkg = await import('../../../package.json', { assert: { type: 'json' } });
```

**Alternative:** Use `createRequire()` for Node.js compatibility:

```typescript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../../package.json');
```

**Recommendation:** Use the dynamic import approach for cleaner ESM.

**File 3: `tests/plugin/unit/plugin-loading.test.ts`**

Replace all `require()` calls (5 occurrences) with dynamic `import()`:

```typescript
// BEFORE
const pluginInit = require(PLUGIN_PATH);

// AFTER
const pluginInit = await import(PLUGIN_PATH).then(m => m.default);
```

**Note:** Tests using dynamic import must be `async`:

```typescript
// BEFORE
it('plugin module exports a function', () => {
  const pluginInit = require(PLUGIN_PATH);
  expect(typeof pluginInit).toBe('function');
});

// AFTER
it('plugin module exports a function', async () => {
  const module = await import(PLUGIN_PATH);
  const pluginInit = module.default;
  expect(typeof pluginInit).toBe('function');
});
```

#### 1.4 Update Package Exports

Ensure `package.json` exports are ESM-compatible:

```json
{
  "main": "dist/types/index.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js",      // <-- ADD "import" key
      "default": "./dist/types/index.js"
    },
    "./plugin": {
      "import": "./dist/apps/plugin/index.js", // <-- ADD "import" key
      "default": "./dist/apps/plugin/index.js"
    },
    "./dist/*": null,
    "./src/*": null
  }
}
```

---

### Phase 2: Test Runner (Vitest)

**Goal:** Replace Jest with Vitest while maintaining all test functionality

#### 2.1 Install Vitest

```bash
npm uninstall jest ts-jest @types/jest
npm install --save-dev vitest @vitest/ui
```

#### 2.2 Create vitest.config.ts

Create `vitest.config.ts` at the project root:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,              // Enable Jest-compatible globals (describe, it, expect)
    environment: 'node',        // Node.js test environment
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'website'],

    // Coverage configuration (matches Jest thresholds)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/**/*.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/apps/cli/main.ts',  // Exclude CLI entry point (tested via E2E)
      ],
      thresholds: {
        // Domain layer
        'src/domain/**/*.ts': {
          branches: 75,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        // Application layer
        'src/application/**/*.ts': {
          branches: 85,
          functions: 100,
          lines: 95,
          statements: 95,
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Key Differences from Jest:**
- `globals: true` enables `describe`, `it`, `expect` without imports
- `provider: 'v8'` is faster than Istanbul (Jest's default)
- `thresholds` use glob patterns instead of directory strings
- Coverage config is nested under `test.coverage`

#### 2.3 Update package.json Scripts

Replace Jest scripts with Vitest:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",                    // <-- CHANGE from "jest"
    "test:watch": "vitest",                  // <-- CHANGE from "jest --watch"
    "test:ui": "vitest --ui",                // <-- NEW (optional)
    "test:coverage": "vitest run --coverage", // <-- CHANGE from "jest --coverage"
    "lint": "eslint src tests --ext .ts",
    "clean": "rm -rf dist"
  }
}
```

#### 2.4 Test Compatibility Audit

Vitest is mostly Jest-compatible, but review these areas:

**✅ Compatible (No Changes Needed):**
- `describe`, `it`, `expect` syntax
- `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
- `jest.fn()` → Works with `globals: true`
- Matchers: `.toBe()`, `.toEqual()`, `.toHaveLength()`, etc.
- Async tests: `async/await` syntax
- Coverage collection

**⚠️ May Need Changes:**
- `jest.mock()` → Use `vi.mock()` (but with `globals: true`, `jest.mock()` works)
- `jest.spyOn()` → Use `vi.spyOn()` (but with `globals: true`, `jest.spyOn()` works)
- Manual mocks in `__mocks__/` → Vitest doesn't auto-discover these (rare in this codebase)

**Review Test Files:**

None of the current 31 test files use:
- `jest.mock()` - Manual mocks not used
- `__mocks__/` directory - Doesn't exist
- Jest-specific timers - Not used

**Conclusion:** With `globals: true`, all tests should work without modification except for the `require()` changes in phase 1.3.

#### 2.5 Delete jest.config.js

```bash
rm jest.config.js
```

---

### Phase 3: Validation & Rollout

**Goal:** Ensure 100% test pass rate and coverage parity

#### 3.1 Pre-Migration Baseline

```bash
# Capture Jest baseline
npm test -- --coverage > jest-baseline.txt

# Count tests
npm test -- --listTests | wc -l
# Expected: 33 test files
```

#### 3.2 Execute Migration

Run phases 1-2 in sequence:

1. Add `"type": "module"` to `package.json`
2. Update `tsconfig.json` module settings
3. Convert CJS → ESM in 3 files
4. Uninstall Jest, install Vitest
5. Create `vitest.config.ts`
6. Update npm scripts
7. Delete `jest.config.js`

#### 3.3 Rebuild & Test

```bash
# Clean build
npm run clean
npm run build

# Run tests
npm test

# Check coverage
npm run test:coverage
```

**Success Criteria:**
- ✅ 342/342 tests passing
- ✅ Domain coverage: ≥90% lines/functions, ≥75% branches
- ✅ Application coverage: ≥95% lines, 100% functions, ≥85% branches
- ✅ CLI executable works: `./dist/apps/cli/main.js --version`
- ✅ Plugin loads: Test in fixture project

#### 3.4 Compare Coverage

```bash
# Generate coverage report
npm run test:coverage

# Compare line counts
diff jest-baseline.txt coverage/coverage-summary.json
```

**Expected:** Coverage percentages should be within ±1% (V8 vs Istanbul differences)

#### 3.5 CI/CD Update (if applicable)

If there's a CI pipeline, update the workflow files:

```yaml
# .github/workflows/test.yml (example)
- name: Run tests
  run: npm test  # Already correct, npm scripts handle the change
```

No changes needed if using `npm test` (recommended).

---

## Rollback Plan

If migration fails, rollback steps:

```bash
# 1. Revert package.json changes
git checkout package.json package-lock.json

# 2. Revert tsconfig.json
git checkout tsconfig.json

# 3. Revert source code changes
git checkout src/apps/cli/main.ts tests/plugin/unit/plugin-loading.test.ts

# 4. Reinstall Jest
npm install

# 5. Revert config file
git checkout jest.config.js
rm vitest.config.ts

# 6. Verify rollback
npm test
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests fail after migration | Low | High | Use `globals: true` for Jest compatibility; test on branch first |
| Coverage drops | Low | Medium | Vitest V8 coverage is comparable; verify baseline first |
| Dynamic imports break | Low | Medium | Test CLI and plugin loading explicitly |
| Build output changes | Medium | Medium | Use `"module": "ES2020"` for modern output; verify dist/ structure |
| Breaking change for consumers | Medium | High | Use `"exports"` field correctly; test in fixture project |

**Overall Risk:** Low-Medium. Vitest is battle-tested and Jest-compatible.

---

## Timeline

| Phase | Estimated Time | Checkpoint |
|-------|----------------|------------|
| Phase 1: ESM Migration | 1 hour | All builds succeed, no CJS usage |
| Phase 2: Vitest Setup | 30 minutes | Config created, deps installed |
| Phase 3: Validation | 30-60 minutes | All tests pass, coverage matches |
| Phase 4: PR Creation | 15-30 minutes | PR created, all checks pass |
| **Total** | **2.5-3.5 hours** | PR ready for review |

---

## Success Metrics

**Before Migration:**
- 31 test files
- 342 tests passing
- Jest v29.5.0 + ts-jest
- CommonJS output
- Domain: 90%+ coverage
- Application: 95%+ coverage

**After Migration:**
- 31 test files (same)
- 342 tests passing (same)
- Vitest v2.1.0
- ESM output
- Domain: 90%+ coverage (maintained)
- Application: 95%+ coverage (maintained)
- Faster test execution (expected 20-40% improvement)

---

## Phase 4: PR Creation & Complete Jest Removal

**Goal:** Create pull request with comprehensive Jest removal verification

### 4.1 Complete Jest Removal Checklist

Before creating the PR, verify all Jest artifacts are removed:

**Files to Delete:**
```bash
# Config files
rm jest.config.js

# Check for any remaining Jest references
grep -r "jest" package.json package-lock.json
grep -r "@types/jest" package.json package-lock.json
grep -r "ts-jest" package.json package-lock.json
```

**package.json Verification:**
- ✅ No `jest` in dependencies
- ✅ No `@types/jest` in devDependencies
- ✅ No `ts-jest` in devDependencies
- ✅ No `jest` in scripts (replaced with `vitest`)
- ✅ Has `"type": "module"`
- ✅ Has `vitest` in devDependencies

**Code Verification:**
- ✅ No `require()` calls in source code (except test fixtures if any)
- ✅ No `module.exports` in source code
- ✅ No Jest-specific types imported (`@types/jest`)
- ✅ All test files use ESM imports

**Build Verification:**
```bash
# Verify clean build
npm run clean
npm run build
ls -la dist/  # Check output structure

# Verify no .cjs files in dist/
find dist/ -name "*.cjs" | wc -l  # Should be 0
```

**Test Verification:**
```bash
# All tests pass
npm test  # Should show 342 passing

# Coverage thresholds met
npm run test:coverage  # Should meet all thresholds

# CLI works
node dist/apps/cli/main.js --version  # Should print version
node dist/apps/cli/main.js check tests/integration/fixtures/clean-arch-valid  # Should pass
```

**Lock File Verification:**
```bash
# Check package-lock.json for Jest remnants
grep -i "jest" package-lock.json | wc -l  # Should be 0 or minimal (indirect deps only)
```

### 4.2 Git Commit Strategy

Create logical commits for the migration:

```bash
# Commit 1: Update module system to ESM
git add package.json tsconfig.json
git commit -m "chore: migrate to ESM module system

- Add \"type\": \"module\" to package.json
- Update TypeScript to output ES2020 modules
- Update moduleResolution to \"bundler\"
"

# Commit 2: Convert CJS usage to ESM
git add src/apps/cli/main.ts tests/plugin/unit/plugin-loading.test.ts
git commit -m "refactor: convert CJS require() to ESM imports

- Replace require() with dynamic import in CLI main.ts
- Convert plugin-loading.test.ts to async with dynamic imports
"

# Commit 3: Migrate from Jest to Vitest
git add package.json package-lock.json vitest.config.ts
git rm jest.config.js
git commit -m "chore: migrate from Jest to Vitest

- Remove Jest, ts-jest, @types/jest dependencies
- Add Vitest and @vitest/ui dependencies
- Create vitest.config.ts with equivalent coverage thresholds
- Delete jest.config.js
- Update test scripts to use Vitest
"

# Commit 4: Update documentation
git add docs/VITEST_MIGRATION_PLAN.md CLAUDE.md tests/README.md
git commit -m "docs: update documentation for Vitest migration

- Add complete migration plan
- Update CLAUDE.md with Vitest commands
- Update tests/README.md with new test runner info
"
```

### 4.3 Create Pull Request

Use GitHub CLI to create PR:

```bash
gh pr create \
  --title "Migrate from Jest + CommonJS to Vitest + ESM" \
  --body "$(cat <<'EOF'
## Summary

Migrates KindScript from Jest to Vitest and CommonJS to ESM.

## Motivation

- **Modern ecosystem**: ESM is the JavaScript standard
- **Performance**: Vitest is 20-40% faster than Jest
- **Consistency**: Website already uses Vitest
- **Better TypeScript integration**: Native ESM support
- **Smaller dependencies**: Fewer packages, faster installs

## Changes

### Module System (ESM)
- ✅ Added `"type": "module"` to package.json
- ✅ Updated TypeScript to output ES2020 modules
- ✅ Converted all `require()` to dynamic `import()`
- ✅ Updated package.json exports for ESM compatibility

### Test Runner (Vitest)
- ✅ Replaced Jest with Vitest v2.1.0
- ✅ Created `vitest.config.ts` with equivalent coverage thresholds
- ✅ Maintained all 342 tests without modification (Jest-compatible mode)
- ✅ Updated npm scripts (`npm test`, `npm run test:coverage`)

### Files Changed
- Modified: `package.json`, `tsconfig.json`, `src/apps/cli/main.ts`, `tests/plugin/unit/plugin-loading.test.ts`
- Deleted: `jest.config.js`
- Created: `vitest.config.ts`, `docs/VITEST_MIGRATION_PLAN.md`

## Testing

\`\`\`bash
# Build succeeds
npm run build
# ✅ Clean build, no errors

# All tests pass
npm test
# ✅ 342/342 tests passing

# Coverage thresholds met
npm run test:coverage
# ✅ Domain: 90%+ coverage
# ✅ Application: 95%+ coverage

# CLI works
node dist/apps/cli/main.js --version
# ✅ Prints version

node dist/apps/cli/main.js check tests/integration/fixtures/clean-arch-valid
# ✅ Exits 0
\`\`\`

## Breaking Changes

**For consumers (published package):**
- ⚠️ Package now exports ESM modules instead of CommonJS
- ⚠️ Node.js >=16.0.0 required (ESM support)
- ✅ TypeScript types unchanged
- ✅ Public API unchanged

**For contributors:**
- Test runner changed: use `npm test` (Vitest instead of Jest)
- New command: `npm run test:ui` for interactive debugging
- All test syntax remains Jest-compatible

## Migration Plan

See [`docs/VITEST_MIGRATION_PLAN.md`](docs/VITEST_MIGRATION_PLAN.md) for complete details.

## Rollback

If issues arise, rollback is straightforward:
\`\`\`bash
git revert HEAD~4..HEAD
npm install
\`\`\`

## Checklist

- [x] All tests passing (342/342)
- [x] Coverage thresholds met
- [x] Build succeeds
- [x] CLI executable works
- [x] Plugin loads correctly
- [x] No Jest dependencies remain
- [x] No CommonJS usage in source
- [x] Documentation updated
- [x] Migration plan documented

---

**Closes:** N/A (improvement, not fixing an issue)
**Related:** Website Vitest migration (already complete)
EOF
)" \
  --base main \
  --head vitest-migr
```

### 4.4 PR Review Checklist

For reviewers:

**Functionality:**
- [ ] All 342 tests pass
- [ ] Coverage thresholds maintained
- [ ] Build succeeds without errors
- [ ] CLI executable works (`--version`, `check`)
- [ ] Plugin can be loaded

**Code Quality:**
- [ ] No `require()` in source code
- [ ] No `module.exports` in source code
- [ ] All imports use ESM syntax
- [ ] No Jest dependencies in package.json

**Documentation:**
- [ ] Migration plan is clear and complete
- [ ] CLAUDE.md updated
- [ ] tests/README.md updated
- [ ] Breaking changes documented

**CI/CD:**
- [ ] CI pipeline still works (if applicable)
- [ ] No hardcoded Jest references in workflows

### 4.5 Post-Merge Actions

After PR is merged:

1. **Verify main branch:**
   ```bash
   git checkout main
   git pull
   npm install
   npm test
   ```

2. **Clean up worktree:**
   ```bash
   cd /Users/samuelgleeson/dev/kindscript
   git worktree remove vitest-migr
   git branch -d vitest-migr  # Local branch cleanup
   ```

3. **Archive migration plan:**
   ```bash
   git mv docs/VITEST_MIGRATION_PLAN.md docs/archive/VITEST_MIGRATION_PLAN.md
   git commit -m "docs: archive Vitest migration plan"
   git push
   ```

4. **Announce changes** (if applicable):
   - Update changelog
   - Notify contributors of new test commands
   - Document breaking changes for v3.0.0 if this is a major version

---

## Follow-Up Tasks

After successful migration and PR merge:

1. **Documentation Updates:**
   - Update `CLAUDE.md` test section
   - Update `tests/README.md` with Vitest commands
   - Update `README.md` badges (if any)

2. **Developer Experience:**
   - Add `.vscode/settings.json` with Vitest extension config
   - Document `npm run test:ui` for interactive debugging

3. **CI Optimization:**
   - Enable Vitest's native watch mode in dev containers
   - Use `--reporter=json` for CI output parsing

4. **Cleanup:**
   - Remove `jest-baseline.txt` after verification
   - Archive this migration plan to `docs/archive/`

---

## References

- Vitest docs: https://vitest.dev/
- Vitest Jest compatibility: https://vitest.dev/guide/migration.html
- Node.js ESM docs: https://nodejs.org/api/esm.html
- TypeScript ESM guide: https://www.typescriptlang.org/docs/handbook/esm-node.html

---

## Appendix A: File Change Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `package.json` | Modify | Add `"type": "module"`, update exports, replace Jest deps |
| `tsconfig.json` | Modify | Change module to ES2020, moduleResolution to bundler |
| `jest.config.js` | Delete | Replaced by vitest.config.ts |
| `vitest.config.ts` | Create | New Vitest configuration |
| `src/apps/cli/main.ts` | Modify | Replace `require()` with dynamic import (line 19) |
| `tests/plugin/unit/plugin-loading.test.ts` | Modify | Replace 5 `require()` calls with dynamic import |

**Total Files Changed:** 6 (3 modified, 1 deleted, 1 created, 1 minor test update)

---

## Appendix B: Vitest vs Jest Feature Comparison

| Feature | Jest | Vitest | Migration Impact |
|---------|------|--------|------------------|
| Globals (`describe`, `it`) | ✅ Built-in | ✅ With `globals: true` | None |
| TypeScript | ⚠️ Via ts-jest | ✅ Native | Better |
| ESM Support | ⚠️ Experimental | ✅ Native | Better |
| Coverage | Istanbul | V8 | Faster, similar results |
| Watch Mode | ✅ | ✅ | Faster in Vitest |
| Mocking | `jest.fn()` | `vi.fn()` or `jest.fn()` | None with globals |
| Snapshots | ✅ | ✅ | Compatible |
| Parallel Tests | ✅ | ✅ | Faster in Vitest |
| UI Mode | ❌ | ✅ | New feature |

---

## Appendix C: Common Issues & Solutions

### Issue 1: "Cannot use import outside a module"

**Cause:** Forgot to add `"type": "module"` to package.json

**Solution:**
```json
{
  "type": "module"
}
```

### Issue 2: "Cannot find module" errors after ESM migration

**Cause:** Missing file extensions in imports

**Solution:** Add `.js` to relative imports:
```typescript
// BEFORE
import { foo } from './foo';

// AFTER
import { foo } from './foo.js';  // Even for .ts files in source
```

**Note:** TypeScript should handle this automatically with `"moduleResolution": "bundler"`

### Issue 3: Coverage thresholds not enforced

**Cause:** Glob patterns don't match files

**Solution:** Use `**` for recursive matching:
```typescript
thresholds: {
  'src/domain/**/*.ts': { lines: 90 }  // Not 'src/domain/'
}
```

### Issue 4: Tests fail with "describe is not defined"

**Cause:** Forgot `globals: true` in vitest.config.ts

**Solution:**
```typescript
test: {
  globals: true  // <-- Add this
}
```

---

**END OF MIGRATION PLAN**
