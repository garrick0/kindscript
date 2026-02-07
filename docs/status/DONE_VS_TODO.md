# KindScript: Implementation Status (Done vs TODO)

**Generated:** 2026-02-06
**Codebase version:** `0.8.0-m8`
**Reference:** `docs/architecture/COMPILER_ARCHITECTURE.md`

---

## Summary

The codebase is substantially implemented. All 8 use cases, all 5 contract types, the CLI (3 commands), the TS language service plugin, and 3 standard library packages are built and tested across 44 test files. The architecture follows strict Clean Architecture with zero domain-layer leakage.

| Area | Status |
|------|--------|
| Core pipeline (binder, checker, host) | Done |
| All 5 contract types | Done |
| CLI (`ksc check`, `init`, `infer`) | Done |
| TS Language Service Plugin | Done (partial code fixes) |
| Standard library packages (3 of 4) | Done |
| Watch mode / incremental `.ksbuildinfo` | Not started |
| Inference engine | Done |
| Generator / scaffolding | Removed |

---

## Phase-by-Phase Breakdown (vs Architecture Doc Part 9)

### Phase 0: Prove Contracts Work — DONE

> *"Build one contract (noDependency) that works against ts.Program and produces ts.Diagnostic[]"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| `noDependency` contract | Done | `src/application/use-cases/check-contracts/check-contracts.service.ts` |
| Works against ts.Program | Done | `TypeScriptAdapter` wraps `ts.createProgram` |
| Produces `ts.Diagnostic` equivalent | Done | `src/domain/entities/diagnostic.ts` (codes 70001-70005) |
| Integration test with fixture project | Done | `tests/integration/noDependency.integration.test.ts` |

---

### Phase 0.5: Project Reference Generation — DONE

> *"Build ksc init --detect"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| Analyze directory structure | Done | `detect-architecture.service.ts` |
| Analyze import graph | Done | Via `TypeScriptPort.getImports()` |
| Detect patterns (clean, hexagonal) | Done | 4 patterns: CleanArchitecture, Hexagonal, Layered, Unknown |
| Generate tsconfig.json with project refs | Done | `generate-project-refs.service.ts` |
| `ksc init --detect` CLI command | Done | `commands/init.command.ts` |
| `--write` flag for actual file creation | Done | CLI main.ts |
| E2E test | Done | `tests/e2e/cli-init-detect.e2e.test.ts` |

---

### Phase 1: CLI + Config — DONE

> *"kindscript.json for simple contract config, ksc check CLI command"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| `kindscript.json` config format (Tier 1) | Done | `ConfigAdapter` reads JSON config |
| `ConfigSymbolBuilder` (JSON -> ArchSymbol/Contract) | Done | `services/config-symbol-builder.ts` |
| `ksc check` CLI command | Done | `commands/check.command.ts` |
| Diagnostic formatting for terminal | Done | `cli-diagnostic.adapter.ts` |
| Exit codes for CI | Done | `main.ts` exits with `process.exit(1)` on violations |
| Structural watcher (new/deleted files) | **NOT DONE** | Not implemented anywhere |

**Gap:** The structural file watcher described in the architecture doc (Part 6) is not implemented. The CLI runs single-shot checks only.

---

### Phase 2: Classifier + Symbol-to-Files Resolution — DONE

> *"AST classifier, ArchSymbol creation, Symbol-to-files resolution"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| Find interfaces extending `Kind<N>` | Done | `classify-ast.service.ts` Pass 1 |
| Find instance variable declarations | Done | `classify-ast.service.ts` Pass 2 |
| Find `defineContracts<T>(...)` calls | Done | `classify-ast.service.ts` Pass 3 |
| `ArchSymbol` creation with members | Done | `domain/entities/arch-symbol.ts` |
| Symbol-to-files resolution | Done | `resolve-files.service.ts` |
| Child symbol exclusion | Done | `resolve-files.service.ts` subtracts child files |
| Integration tests (Tier 2) | Done | `tier2-classify.integration.test.ts` |

**Note:** The classifier uses the `ASTPort` abstraction (20+ methods) rather than raw `ts.` API calls. This adds a layer of indirection not in the spec but achieves the same clean architecture goal.

---

### Phase 3: Full Checker — PARTIALLY DONE

> *"All contracts, lazy evaluation, caching, .ksbuildinfo persistence"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| `noDependency` contract | Done | `check-contracts.service.ts` |
| `mustImplement` contract | Done | `check-contracts.service.ts` (uses `getExportedInterfaceNames` + `hasClassImplementing`) |
| `noCycles` contract | Done | `check-contracts.service.ts` (DFS cycle detection) |
| `purity` contract | Done | `check-contracts.service.ts` (50+ Node.js built-in module names) |
| `colocated` contract | Done | `check-contracts.service.ts` (basename matching) |
| Lazy evaluation | **NOT DONE** | Contracts are evaluated eagerly (all at once) |
| In-memory caching | **PARTIAL** | Plugin diagnostics service has simple caching; checker itself does not |
| `.ksbuildinfo` persistence | **NOT DONE** | No `.ksbuildinfo` file format or persistence |

**Gaps:**
- No lazy/on-demand contract evaluation — all contracts run on every check
- No `.ksbuildinfo` cache file for incremental builds
- No cached host implementation (`cachedHost` from spec Part 4.4)

---

### Phase 4: Inference — DONE

> *"Walk filesystem, analyze import graph, pattern match, generate draft kind definitions"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| Walk filesystem structure | Done | `detect-architecture.service.ts` |
| Analyze import graph | Done | Via `TypeScriptPort` |
| Pattern match (clean, hex, layered) | Done | `detect-architecture.service.ts` |
| Generate draft `architecture.ts` | Done | `infer-architecture.service.ts` (4-section code gen) |
| `ksc infer` CLI command | Done | `commands/infer.command.ts` |
| Stdlib package resolution in inference | Done | `resolve-package-definitions.ts` uses installed `@kindscript/*` packages |
| E2E tests | Done | `cli-infer.e2e.test.ts` |

---

### Phase 5: Generator (Scaffolding) — REMOVED

Removed -- scaffold functionality was removed as a peripheral convenience feature.

---

### Phase 6: Plugin — DONE (with gaps)

> *"TS language service plugin, intercept diagnostics and code fixes"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| Plugin entry point (`PluginModuleFactory`) | Done | `infrastructure/plugin/index.ts` |
| Intercept `getSemanticDiagnostics` | Done | `language-service-proxy.ts` |
| Intercept `getCodeFixesAtPosition` | Done | `language-service-proxy.ts` |
| Diagnostic converter (domain -> ts.Diagnostic) | Done | `diagnostic-converter.ts` |
| Code fix suggestions | Done | `get-plugin-code-fixes.service.ts` (remove-forbidden-import, remove-impure-import) |
| Actual `ts.TextChanges` for auto-fix | **NOT DONE** | Code fixes return empty `changes: []` (description only) |
| `relatedInformation` pointing to contract definition | **NOT DONE** | Diagnostics don't include related info pointing back to contracts |
| Code lens (contract status) | **NOT DONE** | Not implemented |
| Extended hover info | **NOT DONE** | Not implemented |
| Fast sub-100ms per file checks | **UNVERIFIED** | No performance benchmarks |
| E2E test | Done | `plugin-loading.e2e.test.ts` |

**Gaps:**
- Code fixes are description-only stubs (no actual text edits applied)
- No `relatedInformation` on diagnostics linking to contract source
- No code lens or hover extensions
- No performance benchmarking

---

### Phase 7: Standard Library Packages — MOSTLY DONE

> *"Publish core patterns as npm packages"*

| Spec Item | Status | Location |
|-----------|--------|----------|
| `@kindscript/clean-architecture` | Done | `packages/clean-architecture/index.ts` |
| `@kindscript/hexagonal` | Done | `packages/hexagonal/index.ts` |
| `@kindscript/onion` | Done | `packages/onion/index.ts` |
| `@kindscript/modular-monolith` | **NOT DONE** | Not created |
| Published to npm | **NOT DONE** | Packages exist locally only |
| Separate `package.json` per package | **NOT DONE** | No individual package.json files |

**Gaps:**
- `@kindscript/modular-monolith` pattern not created
- Packages are not independently publishable (no per-package `package.json`, no `.d.ts` + `.js` split)
- Not published to npm

---

## Cross-Cutting Concerns

### Watch Mode (Architecture Doc Part 6) — NOT DONE

| Spec Item | Status |
|-----------|--------|
| Structural file watcher (new/deleted files) | Not implemented |
| Three-trigger invalidation (content, structural, definition) | Not implemented |
| `.ksbuildinfo` format and persistence | Not implemented |
| Cached directory listings | Not implemented |
| Cached import graph edges | Not implemented |
| Cached symbol resolutions | Not implemented |
| Cached contract results | Not implemented |

This is the largest unimplemented area. The CLI runs single-shot checks. The plugin re-evaluates on every request without persistent caching.

---

### KindScriptHost Abstraction (Architecture Doc Part 4.4) — NOT DONE (as specified)

The architecture doc describes a `KindScriptHost extends ts.CompilerHost` with three implementations (`defaultHost`, `cachedHost`, `testHost`). The codebase uses a different approach:

| Spec Item | Codebase Equivalent | Notes |
|-----------|---------------------|-------|
| `KindScriptHost` interface | 6 separate ports (`TypeScriptPort`, `FileSystemPort`, etc.) | More granular, same concept |
| `defaultHost` (real fs + ts.Program) | Real adapters (TypeScriptAdapter, FileSystemAdapter) | Done |
| `cachedHost` (memoization + .ksbuildinfo) | Not implemented | No caching layer |
| `testHost` (in-memory) | 6 mock adapters in `testing/` | Done |
| `getDependencyEdges(fromDir, toDir)` | Composed in `CheckContractsService` | Logic exists, not on a host interface |

**Assessment:** The codebase achieves the same goals via Clean Architecture ports/adapters instead of a monolithic host. The missing piece is the caching layer.

---

### Program Orchestrator (Architecture Doc Part 4.7) — PARTIAL

| Spec Item | Status | Notes |
|-----------|--------|-------|
| `ks.Program` wrapping `ts.Program` | Partial | `Program` entity exists but is a thin wrapper (`handle: unknown`) |
| `getDiagnostics()` combining TS + KS | Done | CLI `check` command merges both |
| `getArchSymbols()` | Done | Via `ClassifyASTService` |
| Diagnostic deduplication | **NOT DONE** | No `deduplicateRelated()` logic |

---

### Adoption Tiers (Architecture Doc Part 2.5) — DONE

| Tier | Status | Notes |
|------|--------|-------|
| Tier 0: No enforcement | N/A | Baseline |
| Tier 0.5: Project references (`ksc init --detect`) | Done | Generates tsconfigs |
| Tier 1: Config-based (`kindscript.json`) | Done | `ConfigSymbolBuilder` + `ksc check` |
| Tier 2: Full kind definitions | Done | `ClassifyASTService` + `ksc check` with architecture.ts |

---

## Remaining Work: Priority-Ordered TODO List

### High Priority (Core functionality gaps)

1. **Watch mode + incremental compilation** — The largest missing piece. Without `.ksbuildinfo` and file watching, every check runs from scratch. This matters for both CLI watch mode and plugin performance.

2. **Plugin code fix auto-application** — Code fixes currently return empty `changes: []`. Need actual `ts.TextChanges` to enable one-click fixes in the editor.

3. **`relatedInformation` on diagnostics** — The spec calls for diagnostics to link back to the contract definition site. This is important for developer UX ("why is this an error?").

4. **Diagnostic deduplication** — When TS and KS both report issues on the same code, duplicates should be merged.

### Medium Priority (Completeness)

5. **`@kindscript/modular-monolith` package** — 4th standard library pattern mentioned in the spec.

6. **Lazy contract evaluation** — Evaluate contracts on-demand rather than all-at-once, for performance.

7. **Caching layer** — In-memory memoization of directory listings, import edges, symbol resolutions, and contract results (the `cachedHost` concept).

### Lower Priority (Polish)

8. **Plugin code lens** — Show "N contracts passing / N violations" inline.

9. **Plugin hover extensions** — Show architectural context on hover.

10. **Performance benchmarking** — Verify sub-100ms per-file plugin checks.

11. **npm publishing pipeline** — Per-package `package.json`, `.d.ts` + `.js` split, CI publish workflow.

12. **README update** — Still says "M0 complete, M1 in progress" but codebase is at M8.

### Housekeeping

13. **Empty `absc` file at repo root** — Appears to be abandoned; can be removed.

14. **Deno / Node dual config** — `deno.json` + `lib/` directory appear vestigial. The `Kind` type is defined in both `lib/types.ts` and `src/runtime/kind.ts`.
