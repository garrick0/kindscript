# TypeScript Piggybacking: What KindScript Gathers and How It Maps

**Date:** 2026-02-08

## Context

We've decided: drop `.k.ts`, make KindScript invisible, piggyback on TypeScript's type checker for discovery and extraction. This document analyzes what data KindScript currently gathers, which parts TypeScript already provides, and how the non-TypeScript parts (primarily filesystem data) work in the piggybacking model.

## The Two Worlds

KindScript operates at the intersection of two information systems:

**TypeScript world** — parsed ASTs, resolved types, import resolution, source file contents. The type checker already computed all of this before KindScript runs.

**Filesystem world** — which directories exist, which files are in a directory, how files map to architectural members. TypeScript doesn't know or care about this — its compiler operates on files, not on architectural directory boundaries.

The bridge between these worlds is `resolveSymbolFiles()` — it takes symbols with derived paths (from the TypeScript world) and maps them to actual files on disk (from the filesystem world).

## What KindScript Gathers Today

### Layer 1: Definition Discovery and Extraction

**What:** Find Kind definitions (`type X = Kind<...>`) and instance declarations (`satisfies InstanceConfig<T>`), extract their structure.

**Current implementation:** `ASTAdapter` walks raw AST nodes, matches `"Kind"` and `"InstanceConfig"` by string comparison, manually extracts type arguments.

**TypeScript already knows:** Which symbols resolve to `Kind` from `'kindscript'`. What their type arguments are. Which `satisfies` expressions reference `InstanceConfig`. All resolved through aliases, re-exports, and computed types.

**Piggybacking:** Replace entirely with type checker queries. This is the core change from DEFINITION_FILE_STRATEGY.md. No filesystem involvement.

### Layer 2: Path Derivation

**What:** Compute where each architectural member lives on disk.

**Current implementation:** Two pure functions in `path-matching.ts`:
- `dirnamePath(sourceFile.fileName)` — instance root = directory of the `.k.ts` file
- `joinPath(parentPath, memberName)` — member path = parent path + member name

**TypeScript knows:** Nothing about this. The type checker has no concept of "this file's directory is architecturally significant." Path derivation is KindScript's core value-add — the mapping from type-level declarations to filesystem locations.

**Piggybacking:** Path derivation doesn't change mechanically. But where the ROOT comes from depends on where the instance declaration lives. See "Root Derivation" section below.

### Layer 3: File-to-Member Mapping

**What:** For each architectural member (e.g., `domain` at `/project/src/domain`), determine which `.ts`/`.tsx` files belong to it.

**Current implementation:** `resolveSymbolFiles()` calls `fsPort.directoryExists(path)` then `fsPort.readDirectory(path)` to scan each member's directory for source files. Produces `Map<string, string[]>` — symbol location → file list.

**TypeScript knows:** Which files exist in the program (`program.getSourceFiles()`), and where they are. But this is scoped to what `tsconfig.json` includes — files not reachable from root files won't be in the program. KindScript needs ALL `.ts`/`.tsx` files in a directory, even unreferenced ones, because an unreferenced file in a `domain/` directory is still architecturally significant (it might be an unused import violation, or it might be a file that the `mirrors` contract expects).

**Piggybacking options:**

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **A: Keep filesystem scan** | `resolveSymbolFiles()` continues to scan directories independently | Works exactly as today. Finds unreferenced files. | Duplicates some of what TS already knows. Requires filesystem port. |
| **B: Filter TS program source files by path** | `program.getSourceFiles().filter(f => f.fileName.startsWith(memberPath))` | No filesystem scan needed. Uses what TS already loaded. | Misses files not in the TS program (unreferenced, excluded by tsconfig). |
| **C: Hybrid — TS program first, filesystem as fallback** | Try option B first. If the member directory isn't represented in the program at all, fall back to filesystem scan. | Best of both — fast for known files, complete for edge cases. | More complex. Two code paths. |

**Recommendation:** Option A for now. The filesystem scan is simple, correct, and handles all edge cases. It's a handful of `readdir` calls, not a performance concern. Option B is an optimisation that can come later if needed.

### Layer 4: Contract Checking Data

Each contract plugin needs specific data. Here's what it needs and where it comes from:

#### `exists` plugin
- **Needs:** Whether a member's directory exists on disk
- **Source:** Filesystem — `resolvedFiles.has(location)`
- **Piggybacking impact:** None. Directory existence is inherently a filesystem question. TypeScript has no opinion on whether `/project/src/domain/` exists.

#### `mirrors` plugin
- **Needs:** File listings for two directories + relative path comparison
- **Source:** Filesystem — `resolvedFiles.get(locationA)` and `resolvedFiles.get(locationB)`, then compare relative paths
- **Piggybacking impact:** None. File structure comparison is filesystem-only.

#### `noDependency` plugin
- **Needs:** File listings for two members + resolved import graph between them
- **Source:** Filesystem (file lists) + TypeScript type checker (import resolution via `checker.getSymbolAtLocation()` on module specifiers)
- **Piggybacking impact:** Already uses the type checker for import resolution. File lists still come from filesystem. No change needed.

#### `noCycles` plugin
- **Needs:** File listings for N members + resolved import graph + cycle detection
- **Source:** Filesystem (file lists) + TypeScript type checker (import resolution) + domain algorithm (Tarjan's SCC)
- **Piggybacking impact:** Same as `noDependency` — already piggybacking on the type checker for imports. No change needed.

#### `purity` plugin
- **Needs:** File listings for one member + raw import specifier strings (to check against `NODE_BUILTINS`)
- **Source:** Filesystem (file lists) + TypeScript AST (import declaration specifier text)
- **Piggybacking impact:** Could use type checker to resolve imports and check if they resolve to Node built-in modules, instead of matching raw specifier strings. More robust (handles aliased imports like `import fs from 'node:fs'`). But current string matching is simple and works.

#### `mustImplement` plugin
- **Needs:** File listings for two members + exported interface names + class-implements relationships
- **Source:** Filesystem (file lists) + TypeScript AST (interface declarations, heritage clauses)
- **Piggybacking impact:** Could use type checker's `checker.getExportsOfModule()` for interface discovery and type compatibility checking for implements relationships. More robust than current name-based AST matching. But current approach works for the common case.

### Summary: What Piggybacking Replaces vs. What Stays

| Data | Current Source | With Piggybacking | Changes? |
|------|---------------|-------------------|----------|
| Kind definition discovery | `.k.ts` extension filter | Type checker symbol query | **Yes — replaced** |
| Kind definition extraction | AST string matching | Type checker type resolution | **Yes — replaced** |
| Instance declaration discovery | `.k.ts` extension filter | Type checker symbol query | **Yes — replaced** |
| Instance declaration extraction | AST string matching + manual varMap | Type checker type resolution | **Yes — replaced** |
| Instance root derivation | `dirnamePath(sourceFile.fileName)` | Same — derived from containing file | No |
| Member path derivation | `joinPath(parentPath, memberName)` | Same — pure string math | No |
| File-to-member mapping | Filesystem scan (`readDirectory`) | Filesystem scan (unchanged) | No |
| Directory existence checking | Filesystem check (`directoryExists`) | Filesystem check (unchanged) | No |
| Import graph resolution | Type checker (`getSymbolAtLocation`) | Same | No |
| Import specifier extraction | AST walking | Same (or type checker) | Optional improvement |
| Interface/class analysis | AST walking | Same (or type checker) | Optional improvement |
| Config reading | Filesystem (`readFile` for JSON) | Same | No |

**The piggybacking change is concentrated in Layer 1 (discovery and extraction). Layers 2-4 are largely unaffected.** The filesystem is still needed for everything that involves "does this directory/file exist on disk" — which is most of contract checking.

## Root Derivation: The Key Question

With `.k.ts` files gone, where does the instance root come from?

### Today

```
/project/src/context.k.ts contains: const app = { ... } satisfies InstanceConfig<Ctx>
→ root = dirnamePath("/project/src/context.k.ts") = "/project/src"
```

The `.k.ts` file's location determines the root. Simple, deterministic.

### With instances in source files

```
/project/src/domain/user.ts contains: export const _kind = { ... } satisfies InstanceConfig<Ctx>
→ root = dirnamePath("/project/src/domain/user.ts") = "/project/src/domain"
```

Same mechanism, different file. The root is the directory containing whatever file has the `satisfies InstanceConfig<T>` expression.

**This raises a question:** if the instance declaration is in `/project/src/domain/user.ts`, the root becomes `/project/src/domain/` — but the user probably intended the root to be `/project/src/`. The instance declaration's file location constrains where it can live.

Three options:

#### Option 1: Instance must be in the root directory

The `satisfies InstanceConfig<T>` expression must appear in a file that lives in the intended root directory. This is how it works today — the `.k.ts` file is placed at the root level.

```
/project/src/architecture.ts    # instance here → root = /project/src/
/project/src/domain/            # member
/project/src/infrastructure/    # member
```

**Constraint:** You need a file in the root directory that contains the instance declaration. This file could be a dedicated `architecture.ts`, or any existing `.ts` file at that level.

#### Option 2: Kind definition file implies root

When the type checker finds a `satisfies InstanceConfig<T>`, it resolves `T` to a Kind definition. The Kind definition lives in some file. The root could be derived from the Kind definition file's location rather than the instance declaration's location.

```
/project/src/architecture.ts    # Kind definition → root = /project/src/
/project/src/domain/service.ts  # instance declaration here (but root comes from Kind def)
```

**Problem:** Multiple instances of the same Kind would all get the same root (the Kind definition's directory), which is wrong. Each instance needs its own root.

#### Option 3: Pattern-based discovery (kindScope)

No per-instance root derivation needed. The `kindScope` pattern defines the search scope:

```typescript
// /project/atoms/kinds.ts
export const versions = kindScope(AtomVersion, "*/v*/");
// scope root = /project/atoms/ (from file location)
// pattern = */v*/
// matches: atom1/v0.0.1/, atom1/v0.0.2/, atom2/v0.0.1/
// each match becomes an instance root
```

The root for each instance is the matched directory, not a file location. The `kindScope` declaration's file location defines the search scope. The pattern defines which subdirectories are instances.

**This is the cleanest model for many-instance Kinds.** No instance declarations in source files. No root derivation ambiguity. The pattern declares intent, the filesystem provides reality.

### Recommendation

Both mechanisms coexist:

**For few-instance Kinds** (1-5 instances, like `CleanArchitecture`): explicit `satisfies InstanceConfig<T>` in a file at the root level (Option 1). The file is a regular `.ts` file — no special extension.

**For many-instance Kinds** (10+ instances, like `AtomVersion`): `kindScope(Kind, pattern)` in a Kind definition file (Option 3). No per-instance declarations. The compiler discovers instances from the filesystem.

In both cases, TypeScript's type checker handles discovery. The filesystem handles file-to-member mapping and contract checking.

## The Data Flow With Piggybacking

```
tsconfig.json
    ↓
TypeScript creates program + type checker (already happens)
    ↓
KindScript queries type checker:                           ← REPLACES .k.ts filter + AST walking
  "Which type aliases resolve to Kind from 'kindscript'?"
  "Which satisfies expressions resolve to InstanceConfig?"
    ↓
Extract resolved type arguments from type checker           ← REPLACES manual type arg extraction
    ↓
Path derivation (unchanged):
  root = dirnamePath(file containing instance)
  memberPath = joinPath(root, memberName)
    ↓
File-to-member mapping (unchanged):
  resolveSymbolFiles() scans filesystem
  Produces Map<location, files[]>
    ↓
Contract checking (unchanged):
  Each plugin uses resolved files + type checker as needed
  exists → filesystem
  mirrors → filesystem
  noDependency → filesystem + type checker imports
  noCycles → filesystem + type checker imports
  purity → filesystem + AST import specifiers
  mustImplement → filesystem + AST interfaces/classes
    ↓
Diagnostics
```

The top of the pipeline changes (type checker replaces AST walking). The bottom stays the same (filesystem + type checker for contract enforcement). The middle (path derivation, file mapping) is unchanged.

## Implementation Plan

Seven phases. Each phase produces a passing test suite before moving to the next.

### Phase 1: Remove path overrides

Path overrides (`{ path: "custom" }` in InstanceConfig) violate the principle that instances never specify paths. Remove them entirely.

**Source changes:**

| File | Change |
|------|--------|
| `src/types/index.ts` | Remove `{ path: string } & Partial<MemberMap<T[K]>>` from the `MemberMap` union. Members accept only `MemberMap<T[K]>` or `Record<string, never>`. |
| `src/application/ports/ast.port.ts` | Remove `pathOverride?: string` from `MemberValueView` interface. |
| `src/infrastructure/ast/ast.adapter.ts` | Remove path override extraction logic (lines 196-203: the `pathProp` detection and `view.pathOverride` assignment). Remove the `path` property filter from child extraction (lines 206-210). |
| `src/application/classification/classify-ast/classify-ast.service.ts` | Remove path override consumption in `buildMemberTree()` (lines 126-129: the `if (memberValue?.pathOverride)` block). `pathSegment` is always `memberName`. |

**Test changes:**

| File | Change |
|------|--------|
| `tests/infrastructure/ast.adapter.test.ts` | Remove tests: `'extracts path override from member'`, `'handles path override alongside children'`. |
| `tests/application/classify-ast-locate.test.ts` | Remove test: `'supports path override via pathOverride in member view'`. |
| `tests/integration/tier2-locate.integration.test.ts` | Remove test: `'uses path override to derive custom directory name'`. |
| `tests/integration/tier2-contracts.integration.test.ts` | Remove or rewrite the design system tests that depend on path overrides (the `'design system (atomic design + .tsx + path overrides)'` describe block). |

**Fixture changes:**

| Fixture | Change |
|---------|--------|
| `locate-path-override/` | **Delete entirely.** Remove from `tests/helpers/fixtures.ts`. |
| `design-system-clean/` | Restructure: move `src/components/atoms/` → `src/atoms/`, etc. Remove `components/` nesting. Update `context.k.ts` to remove `{ path: "..." }` overrides — members become `{ atoms: {}, molecules: {}, ... }`. |
| `design-system-violation/` | Same restructure as `design-system-clean`. |

**Documentation:**
- No doc updates yet (covered in Phase 6).

---

### Phase 2: Add type checker parameter to ASTViewPort

The port interface needs to accept the type checker so the real adapter can use it. The mock adapter ignores it.

**Source changes:**

| File | Change |
|------|--------|
| `src/application/ports/ast.port.ts` | Add `TypeChecker` import. Change both port methods to accept the type checker: `getKindDefinitions(sourceFile: SourceFile, checker: TypeChecker)` and `getInstanceDeclarations(sourceFile: SourceFile, checker: TypeChecker)`. |
| `src/infrastructure/ast/ast.adapter.ts` | Add `checker` parameter to both methods. Not used yet (Phase 3 uses it). |
| `src/application/classification/classify-ast/classify-ast.service.ts` | Pass `checker` from the request through to `this.astPort.getKindDefinitions(sourceFile, checker)` and `this.astPort.getInstanceDeclarations(sourceFile, checker)`. |
| `tests/helpers/mocks/mock-ast.adapter.ts` | Add `_checker` parameter to both methods (ignored — mock returns canned data). |

**Tests:** All existing tests pass unchanged (mock ignores the new parameter).

---

### Phase 3: Rewrite ASTAdapter to use type checker

Replace string-based AST walking with type checker queries. This is the core piggybacking change.

**Source changes:**

| File | Change |
|------|--------|
| `src/infrastructure/ast/ast.adapter.ts` | **Full rewrite.** New implementation: |

New `getKindDefinitions()` logic:
1. Get the `Kind` symbol from the `'kindscript'` module via `checker.getSymbolAtLocation()` on the import
2. Walk top-level type alias declarations
3. For each, use `checker.getTypeAtLocation(stmt)` to get the resolved type
4. Check if the type's target symbol is the `Kind` symbol from step 1
5. If yes, extract type arguments via `checker.getTypeArguments()`:
   - First arg → kind name literal (extract from string literal type)
   - Second arg → member properties (walk object type members)
   - Third arg → constraints (walk resolved type structure → build `TypeNodeView`)
6. Return `KindDefinitionView[]`

New `getInstanceDeclarations()` logic:
1. Get the `InstanceConfig` symbol from the `'kindscript'` module
2. Walk top-level variable declarations with `satisfies` expressions
3. For each, use the checker to resolve the satisfies type
4. Check if it references `InstanceConfig` from step 1
5. Extract the `Kind` type argument from `InstanceConfig<T>` via the checker
6. Extract member values from the object literal (this part stays as AST walking — runtime values need the AST, not the type checker)
7. Return `InstanceDeclarationView[]`

**Key detail:** Constraint extraction (building `TypeNodeView` from the third type parameter) can use the resolved type rather than the raw AST node. This means computed types, type aliases, and intersections all resolve correctly.

**What stays as AST walking:** Instance member value extraction (`extractMemberValues`) still walks the object literal AST — this is runtime value extraction, not type resolution. The type checker tells us the type; the AST tells us the value.

Remove the documented alias limitation comment (lines 12-14).

**Tests:**

| File | Change |
|------|--------|
| `tests/infrastructure/ast.adapter.test.ts` | Update to provide a real or mock type checker to the adapter methods. These tests use real TypeScript source files, so the type checker from a real `ts.Program` should work. |

---

### Phase 4: Drop .k.ts extension filter

Replace extension-based discovery with type-checker-based discovery.

**Source changes:**

| File | Change |
|------|--------|
| `src/application/classification/classify-project/classify-project.service.ts` | **Line 64:** Replace `allSourceFiles.filter(sf => sf.fileName.endsWith('.k.ts'))` with: pass all source files to `ClassifyASTService`. Files without Kind/InstanceConfig references will return empty arrays from the adapter (fast no-op). **Line 67:** Change error message from `'No .k.ts definition files found in the project.'` to `'No Kind definitions found in the project.'` **Line 62:** Remove comment `// 5. Discover .k.ts definition files from the program's source files`. Replace with `// 5. Pass all source files for Kind/InstanceConfig discovery`. |
| `src/apps/plugin/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service.ts` | **Line 50:** Replace `fileName.endsWith('.k.ts')` with a check based on whether the file contains Kind/InstanceConfig declarations (can check against the classification result's symbol/contract data, or simply show structural diagnostics for any file that produced symbols). |

**Test changes:**

| File | Change |
|------|--------|
| `tests/helpers/test-pipeline.ts` | **Line 51:** Replace `.k.ts` filter with: pass all discovered `.ts`/`.tsx` files as potential definition files. The adapter handles filtering. |
| `tests/integration/check-contracts.integration.test.ts` | **Line 41:** Same change. Remove `.k.ts` filter from fixture file discovery. |
| `tests/application/classify-project.service.test.ts` | Update tests that assert `.k.ts` discovery behavior. Change mock file names from `.k.ts` to `.ts`. Update error message assertions. |
| `tests/integration/check-contracts.integration.test.ts` | **Line 95:** Update test description from `'returns empty diagnostics when project has no .k.ts files'` to `'returns empty diagnostics when project has no Kind definitions'`. |
| `tests/plugin/unit/get-plugin-diagnostics.service.test.ts` | Update mock paths and error message assertions. |

---

### Phase 5: Rename fixture files

All `.k.ts` fixture files become `.ts`.

**Fixture renames (21 files):**

```
tests/integration/fixtures/clean-arch-valid/src/context.k.ts         → context.ts
tests/integration/fixtures/clean-arch-violation/src/context.k.ts     → context.ts
tests/integration/fixtures/design-system-clean/src/context.k.ts      → context.ts
tests/integration/fixtures/design-system-violation/src/context.k.ts  → context.ts
tests/integration/fixtures/locate-clean-arch/src/context.k.ts        → context.ts
tests/integration/fixtures/locate-existence/src/context.k.ts         → context.ts
tests/integration/fixtures/locate-nested/src/context.k.ts            → context.ts
tests/integration/fixtures/locate-standalone-member/src/context.k.ts → context.ts
tests/integration/fixtures/locate-violation/src/context.k.ts         → context.ts
tests/integration/fixtures/mirrors-clean/src/context.k.ts            → context.ts
tests/integration/fixtures/mirrors-violation/src/context.k.ts        → context.ts
tests/integration/fixtures/must-implement-clean/src/context.k.ts     → context.ts
tests/integration/fixtures/must-implement-violation/src/context.k.ts → context.ts
tests/integration/fixtures/no-cycles-violation/src/context.k.ts      → context.ts
tests/integration/fixtures/purity-clean/src/context.k.ts             → context.ts
tests/integration/fixtures/purity-violation/src/context.k.ts         → context.ts
tests/integration/fixtures/tier2-clean-arch/src/context.k.ts         → context.ts
tests/integration/fixtures/tier2-violation/src/context.k.ts          → context.ts
tests/integration/fixtures/locate-multi-instance/src/ordering/ordering.k.ts → ordering.ts
tests/integration/fixtures/locate-multi-instance/src/billing/billing.k.ts   → billing.ts
```

(The `locate-path-override` fixture was already deleted in Phase 1.)

**Test changes:**

Update all unit test mock file paths from `.k.ts` to `.ts`:
- `tests/application/classify-ast-kind-parsing.test.ts` — all `/project/src/arch.k.ts` → `/project/src/arch.ts`
- `tests/application/classify-ast-contracts.test.ts` — same
- `tests/application/classify-ast-locate.test.ts` — same
- `tests/integration/tier2-locate.integration.test.ts` — update description strings

---

### Phase 6: Update documentation

Thorough update of all active documentation to reflect the new model. Archive docs are left as-is per CLAUDE.md rules.

**Core documentation:**

| File | Changes |
|------|---------|
| `CLAUDE.md` | Update "Directory Structure" section: remove `.k.ts` references. Update "Test Suite Organization" section. Update "Key Files to Know" section: note ASTAdapter uses type checker. Update "Recent Changes" section: add entry for this work. Remove any `.k.ts` references in guidelines and patterns. |
| `README.md` | Remove `.k.ts` extension explanation. Update code examples to use `.ts` files. Remove "self-documenting .k.ts files" bullet. Update "How It Works" section. |
| `tests/README.md` | Update testing guide: fixtures use `.ts` not `.k.ts`. Update any discovery mechanism descriptions. |
| `tests/integration/fixtures/README.md` | Update fixture catalog: all file references from `.k.ts` to `.ts`. Remove path override fixture entry. Update design-system fixture descriptions (no path overrides). |
| `docs/architecture/COMPILER_ARCHITECTURE.md` | Update definition file trigger description. Remove `.k.ts` extension references. Describe type-checker-based discovery. |
| `docs/architecture/DESIGN_DECISIONS.md` | Update any references to `.k.ts` discovery or definition file triggers. |

**Design documents (active — update):**

| File | Changes |
|------|---------|
| `docs/design/DEFINITION_FILE_STRATEGY.md` | Add "Decision" section at top: we chose to drop `.k.ts` and use type checker piggybacking. The rest of the doc is the analysis that led to this decision. |
| `docs/design/TYPESCRIPT_PIGGYBACKING.md` | This doc — mark recommendation as "decided." |
| `docs/design/INSTANCE_PLACEMENT.md` | Add note: we chose Option 1 (instance in root-level file). Path overrides removed. |
| `docs/design/ATOM_SOURCE_KIND.md` | Update uplift item 3: remove reference to `.k.ts`. Instance declares `{}` in a regular `.ts` file. |
| `docs/design/KIND_DERIVED_LOCATIONS.md` | Remove path override mechanism section (Step 6). Update file references from `.k.ts` to `.ts`. |
| `docs/design/KIND_INSTANCE_DESIGN.md` | Update file references. Remove path override examples. |
| `docs/design/STORYBOOK_ARCHITECTURE_MODELING.md` | Update file references. |
| `docs/design/DESIGN_SYSTEM_TUTORIAL.md` | Update file references and examples. |
| `docs/design/DESIGN_SYSTEM_DEMO_PLAN.md` | Update file references and creation steps. |
| `docs/design/INDUCTION_STUDIO_KINDSCRIPT_ANALYSIS.md` | Update proposed `.k.ts` files to `.ts`. |
| `docs/design/MEMBER_KIND_TYPES.md` | Update file references. |
| `docs/design/CONSTRAINT_ANALYSIS.md` | Update diagnostic location references. |
| `docs/design/EXISTENCE_AND_FILESYSTEM_CONSTRAINTS.md` | Remove path override references. |
| `docs/design/CONTRACT_BINDING_ANALYSIS_V3.md` | Update data flow references. Remove `pathOverride` from interface definitions. |
| `docs/design/CODE_LEVEL_MEMBERS_ANALYSIS.md` | Remove `pathOverride` field analysis. |

**Notebooks:**

| File | Changes |
|------|---------|
| `notebooks/01-quickstart.ipynb` | Rewrite to use `.ts` files. Remove "Path Overrides" section. |
| `notebooks/02-contracts.ipynb` | Update file references. |
| `notebooks/04-bounded-contexts.ipynb` | Update file references. |
| `notebooks/05-design-system.ipynb` | Update to match restructured design-system fixtures (no path overrides, no `components/` nesting). |
| `notebooks/lib.ts` | Remove comment about `.k.ts` extension auto-discovery. |

**docs/README.md:** Already up to date (user modified it).

---

### Phase 7: Final cleanup

Remove all dead code, backward compatibility, and stale references.

**Dead code removal:**

| Item | Action |
|------|--------|
| `MemberValueView.pathOverride` | Already removed in Phase 1. Verify no references remain. |
| `MemberMap` path union branch | Already removed in Phase 1. Verify no references remain. |
| Alias limitation comment in `ast.adapter.ts` | Already removed in Phase 3. |
| `.k.ts` string literals in source code | Already removed in Phase 4. Verify none remain. |

**Verification sweep:**

Run these searches and confirm zero hits in active source/test code:

```bash
grep -r "\.k\.ts" src/                    # should be 0
grep -r "\.k\.ts" tests/                  # should be 0 (except file paths in fixtures/ which are now .ts)
grep -r "pathOverride" src/               # should be 0
grep -r "pathOverride" tests/             # should be 0
grep -r "path override" src/              # should be 0
grep -r "\"path\"" src/infrastructure/ast/ # should be 0 (no more { path: "..." } extraction)
```

**Final test run:**

```bash
npm test                    # all tests pass
npm test -- --coverage      # coverage thresholds met
npm run build               # clean TypeScript compilation
```

**Update CLAUDE.md "Recent Changes" section** with a summary of everything done.

---

### Phase Dependencies

```
Phase 1 (remove path overrides)
    ↓
Phase 2 (add type checker to port)
    ↓
Phase 3 (rewrite ASTAdapter)
    ↓
Phase 4 (drop .k.ts filter)
    ↓
Phase 5 (rename fixtures)
    ↓
Phase 6 (update docs)
    ↓
Phase 7 (final cleanup)
```

Phases 1 and 2 are independent and could run in parallel. Phases 4 and 5 could also be combined. Phase 6 can start after Phase 5. Phase 7 is always last.

### Estimated Scope

| Phase | Files Changed | Lines Changed (est.) |
|-------|--------------|---------------------|
| 1. Remove path overrides | ~12 source + test + fixture files | ~150 removed |
| 2. Type checker parameter | 4 files | ~20 changed |
| 3. Rewrite ASTAdapter | 2 files (adapter + its tests) | ~300 rewritten |
| 4. Drop .k.ts filter | ~6 source + test files | ~30 changed |
| 5. Rename fixtures | 20 file renames + ~10 test files | ~100 path strings |
| 6. Update documentation | ~25 doc files + 5 notebooks | ~500 changed |
| 7. Final cleanup | Verification only | ~0 |
| **Total** | **~80 files** | **~1100 lines** |
