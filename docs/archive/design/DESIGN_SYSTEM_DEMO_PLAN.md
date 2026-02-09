# Design System Demo & User Guide — Plan

**Date:** 2026-02-08
**Status:** All phases implemented
**Depends on:** [STORYBOOK_ARCHITECTURE_MODELING.md](STORYBOOK_ARCHITECTURE_MODELING.md)

---

## 1. Goal

Create a multi-format demo that takes a **real production design system** (Induction Studio's storybook), shows the problems that emerge without architectural enforcement, then progressively adopts KindScript to enforce more and more of the architecture. The demo serves three purposes:

1. **User guide** — shows how to incrementally adopt KindScript on a non-trivial real-world project
2. **Capability showcase** — demonstrates what KindScript can enforce today on real code
3. **Gap analysis** — naturally surfaces what would require new features (especially `isolated`)

---

## 2. Approach: Real Codebase + Reproducible Setup

### Using the real storybook codebase

The demo uses the actual Induction Studio storybook — not a simplified fixture. This makes the demo credible and battle-tested: the import graph, the directory structure, and any pre-existing violations are real.

### Reproducibility via pinned git SHA

The real codebase is **not checked into the KindScript repo**. Instead, it's loaded at runtime by cloning a specific commit:

| Property | Value |
|----------|-------|
| Repository | `git@github.com:inductionAI/studio.git` |
| Pinned SHA | `fd8a0ebc8a167f93abf61bfd3483129b07c61245` |
| Commit | `Major codebase cleanup: remove duplicate versions, dead code, and old docs` |
| Branch | `backup/pnpm-setup` |
| Subset used | `apps/storybook/src/` only |
| Local location | `targets/induction-studio/` (gitignored) |

The `targets/` directory is already in `.gitignore` with the comment "Target codebases (cloned by setup script)."

### How it works

```
┌─────────────────────────────────────────────────────┐
│ notebooks/lib.ts  — new function: cloneTarget()     │
│                                                     │
│   1. Check if targets/induction-studio/ exists      │
│   2. If not: shallow clone at pinned SHA            │
│   3. Copy apps/storybook/src/ into a temp dir       │
│   4. Add node_modules/kindscript symlink            │
│   5. Add tsconfig.json (minimal, for ksc check)     │
│   6. Return the working directory path              │
│                                                     │
│ Idempotent: first run clones (~5s), subsequent      │
│ runs reuse the cached clone instantly.              │
└─────────────────────────────────────────────────────┘
```

The notebook setup cell calls `cloneTarget()` once. Every subsequent cell works on a copy in `/tmp/`, so the cached clone is never modified.

### Why this approach

| Concern | How it's addressed |
|---------|--------------------|
| Not checked into git | `targets/` is gitignored |
| Reproducible | Pinned to exact SHA — same code every time |
| Fast after first run | Shallow clone is cached in `targets/` |
| Real code | No simplification, no pseudo-React — actual .tsx components |
| Isolated | Each notebook run copies to a fresh temp dir |

---

## 3. Setup Infrastructure

### `lib.ts` additions

New functions added to the existing `notebooks/lib.ts`:

```typescript
/** Configuration for the target codebase. */
const TARGET_REPO = "git@github.com:inductionAI/studio.git";
const TARGET_SHA = "fd8a0ebc8a167f93abf61bfd3483129b07c61245";
const TARGET_DIR = PROJECT_ROOT + "/targets/induction-studio";
const STORYBOOK_SRC = TARGET_DIR + "/apps/storybook/src";

/**
 * Ensure the target codebase is cloned at the pinned SHA.
 * Idempotent: skips clone if already present.
 */
async function ensureTarget(): Promise<void> {
  try {
    Deno.statSync(TARGET_DIR + "/.git");
    return; // already cloned
  } catch { /* not cloned yet */ }

  console.log("Cloning target codebase (one-time setup)...");
  const clone = new Deno.Command("git", {
    args: ["clone", "--no-checkout", TARGET_REPO, TARGET_DIR],
    stdout: "piped", stderr: "piped",
  });
  await clone.output();

  const checkout = new Deno.Command("git", {
    args: ["-C", TARGET_DIR, "checkout", TARGET_SHA],
    stdout: "piped", stderr: "piped",
  });
  await checkout.output();
  console.log("Target codebase ready.");
}

/**
 * Copy the storybook src/ into a fresh temp directory for a notebook run.
 * Adds node_modules/kindscript symlink and a minimal tsconfig.json.
 * Returns the temp directory path (the "project root" for ksc check).
 */
async function loadStorybook(): Promise<string> {
  await ensureTarget();

  const tmp = Deno.makeTempDirSync({ prefix: "ksc-storybook-" });
  copyDir(STORYBOOK_SRC, tmp + "/src");

  // tsconfig.json — minimal config so TypeScript can resolve imports
  writeFile(tmp, "tsconfig.json", `{
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "jsx": "react-jsx",
      "strict": true,
      "noEmit": true,
      "baseUrl": ".",
      "paths": { "@/*": ["src/*"], "@/components/*": ["src/components/*"] }
    },
    "include": ["src"]
  }`);

  // Symlink so `import type { ... } from 'kindscript'` resolves
  Deno.mkdirSync(tmp + "/node_modules", { recursive: true });
  Deno.symlinkSync(PROJECT_ROOT, tmp + "/node_modules/kindscript");

  return tmp;
}
```

### `tsconfig.json` considerations

The real storybook uses Vite path aliases (`@/` -> `src/`). The `tsconfig.json` we inject mirrors these with `paths` so that KindScript (which uses the TS compiler for import resolution) can resolve `@/components/atoms/Button` to `src/components/atoms/Button/index.ts`.

JSX is set to `react-jsx` so `.tsx` files parse correctly. We don't need React installed — KindScript only analyzes the import graph, not runtime behavior.

---

## 4. Delivery Formats

### Format A: Jupyter Notebook — `05-design-system.ipynb` (PRIMARY)

The main deliverable. Follows the established pattern from notebooks 01-04.

**Notebook outline:**

```
# 05: Real-World Architecture — Enforcing a Design System

## Setup
- import { ksc, loadStorybook, writeFile, readFile, tree, cleanup } from './lib.ts'
- const DEMO = await loadStorybook()
- Show: "This is a real production codebase with 200+ files"

## Part 0: The Architecture (Before KindScript)
- tree(DEMO) — show the full directory structure
- Explain the implicit rules (atomic design, page independence, etc.)
- Show examples of the real imports (readFile some key components)
- Note: these rules exist only in documentation and code review

## Part 1: Top-Level Layer Enforcement
- Write src/context.k.ts with noDependency constraints
- ksc check — show results on the REAL codebase
  - May find pre-existing violations (great for the narrative!)
  - Or passes clean (also good — demonstrates the code is well-structured)
- Inject a violation into a real atom file (add an organism import)
- ksc check — caught! Show the diagnostic
- Restore the file and verify

## Part 2: Page Internal Layer Enforcement
- Show DashboardPage's real internal structure (readFile the real files)
- Write a .k.ts inside DashboardPage/v1.0.0/
- ksc check — verify the page's internal layers
- Inject a violation (ui/ imports directly from data/)
- ksc check — caught!
- Restore and verify
- Point out: two .k.ts files coexist (top-level + page-level)

## Part 3: The Gap — Sibling Isolation
- Show that one organism importing from another is NOT caught
- Inject: ReleasesManager imports from DocumentManager
- ksc check — passes (no constraint covers this)
- Explain why: organisms is a single member
- Show what isolated: true would look like
- Remove the violation

## Part 4: Additional Constraints
- Add filesystem.exists — verify structure exists on disk
- Rename a directory, show it's caught
- Discuss deniedExternals (atoms importing zustand)

## Summary
- Table of what's enforced vs what's aspirational
- "You just enforced architecture on a real 200+ file codebase in ~30 lines of .k.ts"
```

### Format B: Standalone Markdown Tutorial

A text-only version of the notebook walkthrough with copy-paste-able commands and expected output. Extracted from the notebook after it's finalized. Low marginal effort.

### Format C: Integration Test

A test using a separate, small fixture (not the real codebase) that verifies the same constraint patterns work. The integration test should not depend on an external git clone — it uses a dedicated fixture in `tests/integration/fixtures/design-system/` that captures the essential structure in ~15 files.

```typescript
describe('design system architecture', () => {
  it('passes when clean', () => {
    const { checkResult } = runPipeline(FIXTURES.DESIGN_SYSTEM_CLEAN);
    expect(checkResult.violationsFound).toBe(0);
  });

  it('catches atom -> organism violation', () => {
    const { checkResult } = runPipeline(FIXTURES.DESIGN_SYSTEM_VIOLATION);
    expect(checkResult.violationsFound).toBeGreaterThan(0);
  });
});
```

The notebook uses real code for credibility. The integration test uses a minimal fixture for CI reliability. Different tools, different purposes.

### Format D: "How to Model Your Architecture" Guide

A general doc that uses the storybook as a running example but teaches transferable principles. Higher effort, can come later.

---

## 5. Comparison of Formats

| Format | Audience | Effort | Source | Stays Valid |
|--------|----------|--------|--------|-------------|
| Jupyter notebook | Developers exploring KindScript | Medium | Real codebase (pinned SHA) | Re-run to verify |
| Markdown tutorial | Documentation readers | Low (extract) | Screenshots from notebook | Manual |
| Integration test | KindScript maintainers | Medium | Minimal fixture (checked in) | Automatic (CI) |
| General guide | Any architect | High | Prose + examples | Manual |

**Recommended priority:**

1. **Jupyter notebook** — the primary deliverable, uses real code
2. **Integration test** — ensures constraint patterns work in CI
3. **Markdown tutorial** — extract from notebook (low marginal effort)
4. **General guide** — can come later

---

## 6. Design Decisions

### D1: Real code via git clone, not checked in

The storybook source is ~200+ files and belongs to a different repo. Checking it in would bloat the KindScript repo and create a maintenance burden. Instead, it's cloned on-demand to `targets/` (gitignored). The pinned SHA ensures everyone works with the same code.

### D2: Shallow clone with sparse checkout

We only need `apps/storybook/src/`. A full clone of the monorepo would be wasteful. The setup uses `--no-checkout` + selective checkout to minimize disk/network usage.

### D3: Working copy in `/tmp/`, cached clone in `targets/`

The notebook never modifies the cached clone. Each `loadStorybook()` call copies to a fresh temp directory. This means the notebook can inject violations, write `.k.ts` files, and `cleanup()` without side effects.

### D4: TSX files work as-is

KindScript parses `.tsx` via the TypeScript compiler. No need to rename or strip JSX. The injected `tsconfig.json` sets `"jsx": "react-jsx"` so the parser handles JSX syntax.

### D5: Path aliases need a tsconfig

The real storybook uses `@/` path aliases (Vite convention). We inject a `tsconfig.json` with `paths` to make these resolve. Without this, KindScript wouldn't follow `@/components/atoms/Button` imports.

### D6: Separate fixture for integration tests

The integration test should not depend on a git clone (CI environments may not have SSH keys). It uses a small checked-in fixture that captures the same architectural patterns in ~15 files.

### D7: `.k.ts` files written by the notebook, not pre-existing

The narrative is "incremental adoption" — you start with a real codebase that has no KindScript, then add enforcement step by step. The `.k.ts` files are written dynamically by notebook cells.

---

## 7. The `.k.ts` Files

### Top-level — `src/context.k.ts`

Written by the notebook in Part 1:

```typescript
import type { Kind, Constraints, Instance } from 'kindscript';

type AtomLayer = Kind<"AtomLayer">;
type MoleculeLayer = Kind<"MoleculeLayer">;
type OrganismLayer = Kind<"OrganismLayer">;
type PageLayer = Kind<"PageLayer">;
type CoreLayer = Kind<"CoreLayer">;
type CommonLayer = Kind<"CommonLayer">;
type MockLayer = Kind<"MockLayer">;

type DesignSystem = Kind<"DesignSystem", {
  atoms: AtomLayer;
  molecules: MoleculeLayer;
  organisms: OrganismLayer;
  pages: PageLayer;
  core: CoreLayer;
  common: CommonLayer;
  mocks: MockLayer;
}, {
  noDependency: [
    // Atoms: leaf nodes
    ["atoms", "molecules"], ["atoms", "organisms"], ["atoms", "pages"],
    // Molecules: can use atoms, nothing above
    ["molecules", "organisms"], ["molecules", "pages"],
    // Organisms: can't depend on pages
    ["organisms", "pages"],
    // Core: independent of UI layers
    ["core", "atoms"], ["core", "molecules"], ["core", "organisms"], ["core", "pages"],
    // Production code can't depend on mocks
    ["atoms", "mocks"], ["molecules", "mocks"], ["organisms", "mocks"],
    ["pages", "mocks"], ["core", "mocks"],
  ];
  filesystem: {
    exists: ["atoms", "molecules", "organisms", "pages", "core"];
  };
}>;

export const designSystem = {
  atoms:     { path: "components/atoms" },
  molecules: { path: "components/molecules" },
  organisms: { path: "components/organisms" },
  pages:     { path: "components/Pages" },
  core:      {},
  common:    {},
  mocks:     {},
} satisfies Instance<DesignSystem>;
```

### Page-level — `src/components/Pages/DashboardPage/v1.0.0/dashboard.k.ts`

Written by the notebook in Part 2 (note: placed inside `v1.0.0/` so root is inferred as the version directory):

```typescript
import type { Kind, Constraints, Instance } from 'kindscript';

type UILayer = Kind<"UILayer">;
type DomainLayer = Kind<"DomainLayer">;
type DataLayer = Kind<"DataLayer">;
type TypesLayer = Kind<"TypesLayer">;
type ValidationLayer = Kind<"ValidationLayer">;

type PageArchitecture = Kind<"PageArchitecture", {
  ui: UILayer;
  domain: DomainLayer;
  data: DataLayer;
  types: TypesLayer;
  validation: ValidationLayer;
}, {
  noDependency: [
    ["types", "ui"], ["types", "domain"], ["types", "data"],
    ["validation", "ui"], ["validation", "domain"],
    ["data", "ui"],
    ["domain", "ui"],
  ];
}>;

export const page = {
  ui: {},
  domain: {},
  data: {},
  types: {},
  validation: {},
} satisfies Instance<PageArchitecture>;
```

---

## 8. Open Questions

### Q1: What if the real codebase has pre-existing violations?

**This is a feature, not a bug.** If `ksc check` finds existing violations in the real code, the notebook narrative becomes even more compelling: "Look — your architecture has already drifted. KindScript caught it." The notebook should handle both outcomes gracefully (violations found vs. clean pass) and narrate accordingly.

### Q2: How to handle `@/` path alias imports?

The injected `tsconfig.json` includes `paths: { "@/*": ["src/*"] }`. This should handle most imports. If specific aliases like `@/components/*` are also used, we include those too. The setup cell can verify by running `ksc check` and checking for unresolved import errors.

### Q3: Will external package imports (react, zustand, etc.) cause errors?

KindScript tracks imports between **members** (project directories). Imports from `node_modules` packages are ignored by the dependency checker — they don't resolve to any member's file set. So `import React from 'react'` is transparent to KindScript. No `node_modules` installation needed.

### Q4: How long will `ksc check` take on 200+ files?

KindScript uses the TypeScript compiler for parsing, so ~200 files should take 1-3 seconds. This is fine for a notebook. If it's slow, we can note it and explain that KindScript is designed for CI pipelines where this is amortized.

### Q5: What if the pinned SHA becomes stale?

The SHA is pinned precisely so it doesn't become stale — it always refers to the same code. If we want to demo against a newer version later, we update the SHA in `lib.ts` and re-test the notebook. The doc should note the SHA and date.

---

## 9. Implementation Plan

### Phase 1: Setup Infrastructure

**Goal:** `loadStorybook()` works and `ksc check` runs on the real codebase.

#### Step 1.1: Extend `lib.ts` with target codebase loading

Add to `notebooks/lib.ts`:
- `TARGET_REPO`, `TARGET_SHA`, `TARGET_DIR` constants
- `ensureTarget()` — idempotent shallow clone at pinned SHA
- `loadStorybook()` — copies `apps/storybook/src/` to temp dir, adds `tsconfig.json` + `node_modules/kindscript` symlink

#### Step 1.2: Verify `ksc check` works on the real storybook

Run `ksc check` against the loaded storybook (without any `.k.ts` — should exit cleanly with "no definitions found" or similar). This validates that:
- The TypeScript parser handles `.tsx` files
- Path aliases resolve via injected `tsconfig.json`
- No crashes on the real codebase

#### Step 1.3: Write a minimal `.k.ts` and verify

Write the top-level `context.k.ts` to the temp dir. Run `ksc check`. Verify it either passes or reports violations. Debug any issues (unresolved paths, unexpected file types, etc.).

**Exit criteria:** `loadStorybook()` returns a working directory. `ksc check` with a `.k.ts` produces meaningful output (pass or violation).

### Phase 2: Build the Notebook

**Goal:** Complete `05-design-system.ipynb` with all parts.

#### Step 2.1: Part 0 — The Architecture (Before KindScript)

- Setup cell: `const DEMO = await loadStorybook()`
- `tree(DEMO)` to show the real directory structure
- `readFile` a few key files (Button, Card, ReleasesManager, DashboardPage) to show real imports
- Markdown cells explaining the atomic design rules

#### Step 2.2: Part 1 — Top-Level Layer Enforcement

- Write `src/context.k.ts` with the `noDependency` constraints
- Run `ksc check` — narrate the results
- Inject a violation into a real atom file (e.g., add `import { ReleasesManager } from ...` to Button.tsx)
- Run `ksc check` — show the diagnostic
- Restore the original file
- Optionally: inject a mocks violation (production code imports from `mocks/`)

#### Step 2.3: Part 2 — Page Internal Layer Enforcement

- Show the real DashboardPage structure with `tree` and `readFile`
- Write `dashboard.k.ts` inside `v1.0.0/`
- Run `ksc check` — verify page layers
- Inject a violation (ui/ imports from data/ directly)
- Run `ksc check` — show the diagnostic
- Restore and verify

#### Step 2.4: Part 3 — The Gap (Sibling Isolation)

- Inject: one organism imports from another (e.g., ReleasesManager imports from DocumentManager)
- Run `ksc check` — it passes (no constraint for this)
- Explain the gap and show what `isolated: true` would look like
- Remove the injected violation

#### Step 2.5: Part 4 — Additional Constraints + Summary

- Add `filesystem.exists` — show it validates directory presence
- Discuss future features: `deniedExternals`, `isolated`, `eachChild`
- Summary table: what's enforced, what's not, what's planned
- Cleanup

**Exit criteria:** All cells run end-to-end. `ksc check` produces the expected output in each step.

### Phase 3: Integration Test Fixture

**Goal:** A minimal checked-in fixture that tests the same constraint patterns in CI.

#### Step 3.1: Create `tests/integration/fixtures/design-system-clean/`

A ~15 file fixture with the essential structure:
- `src/components/atoms/` (2 files)
- `src/components/molecules/` (1 file, imports from atoms)
- `src/components/organisms/` (1 file, imports from atoms + molecules)
- `src/components/Pages/` (1 file, imports from organisms)
- `src/core/` (1 file)
- `src/common/` (1 file)
- `src/mocks/` (1 file)
- `src/context.k.ts` with the `noDependency` constraints
- `tsconfig.json`

#### Step 3.2: Create `tests/integration/fixtures/design-system-violation/`

Same structure but with a pre-planted violation (atom imports from organism).

#### Step 3.3: Write integration test

```typescript
describe('design system architecture', () => {
  it('passes clean design system', () => { ... });
  it('catches cross-layer violation', () => { ... });
});
```

#### Step 3.4: Update test helpers

- Add `DESIGN_SYSTEM_CLEAN` and `DESIGN_SYSTEM_VIOLATION` to `tests/helpers/fixtures.ts`
- Update `tests/integration/fixtures/README.md`

**Exit criteria:** `npm test -- design-system` passes.

### Phase 4: Polish & Documentation

#### Step 4.1: Markdown tutorial

Extract the notebook narrative into `docs/design/DESIGN_SYSTEM_TUTORIAL.md` with code blocks and expected output.

#### Step 4.2: Update indexes

- Update `docs/README.md` with new docs
- Update `CLAUDE.md` notebook count if needed

#### Step 4.3: Verify end-to-end

- Fresh clone of KindScript repo
- Run `npx tsc` to build CLI
- Open notebook, run all cells
- Run `npm test`
- Everything passes

---

## 10. File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `notebooks/lib.ts` | Modify | Add `ensureTarget()`, `loadStorybook()` |
| `notebooks/05-design-system.ipynb` | Create | Main demo notebook |
| `tests/integration/fixtures/design-system-clean/` | Create | CI-friendly fixture (clean) |
| `tests/integration/fixtures/design-system-violation/` | Create | CI-friendly fixture (violation) |
| `tests/integration/design-system.integration.test.ts` | Create | Regression test |
| `tests/helpers/fixtures.ts` | Modify | Add fixture constants |
| `tests/integration/fixtures/README.md` | Modify | Document new fixtures |
| `docs/design/DESIGN_SYSTEM_TUTORIAL.md` | Create | Markdown tutorial (Phase 4) |
| `docs/README.md` | Modify | Update index |

---

## 11. Success Criteria

The demo is successful if:

1. A developer with no KindScript knowledge can follow the notebook from start to finish
2. The first `loadStorybook()` cell takes <10s (clone) and subsequent runs are instant (cached)
3. `ksc check` runs on the real 200+ file codebase and produces meaningful output
4. Every violation/fix cycle produces the expected diagnostic
5. The "gap" section (sibling isolation) clearly motivates the `isolated` feature
6. The integration test passes in CI without depending on the external clone
7. Running the entire notebook end-to-end completes without errors
