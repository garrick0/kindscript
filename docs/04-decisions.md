# Decisions

> Key architectural decisions and their rationale.

Each decision records the context, options considered, and outcome. Entries are ordered chronologically with the most recent first.

---

## Decision Index

| # | Decision | Date | Status |
|---|----------|------|--------|
| D18 | [Semantic error messages](#d18-semantic-error-messages) | 2026-02-10 | Done |
| D17 | [Remove mustImplement, exists, mirrors plugins](#d17-remove-mustimplement-exists-mirrors-plugins) | 2026-02-10 | Done |
| D16 | [Resolution moves from parser to binder](#d16-resolution-moves-from-parser-to-binder) | 2026-02-10 | Done |
| D15 | [Unified Kind type — TypeKind as sugar](#d15-unified-kind-type--typekind-as-sugar) | 2026-02-10 | Done |
| D14 | [File-scoped leaf instances](#d14-file-scoped-leaf-instances) | 2026-02-08 | Done |
| D13 | [Rename `ConstraintConfig` to `Constraints`, align docs terminology](#d13-rename-constraintconfig-to-constraints) | 2026-02-08 | Done |
| D12 | [Rename `InstanceConfig<T>` to `Instance<T>`](#d12-rename-instanceconfigt-to-instancet) | 2026-02-08 | Done |
| D11 | [Pipeline cleanup — separation of concerns](#d11-pipeline-cleanup--separation-of-concerns) | 2026-02-08 | Done |
| D10 | [Four-stage pipeline alignment](#d10-four-stage-pipeline-alignment) | 2026-02-08 | Done |
| D9 | [Drop `.k.ts`, piggyback on TypeScript type checker](#d9-drop-kts-piggyback-on-typescript-type-checker) | 2026-02-08 | Done |
| D8 | [Remove `ContractConfig<T>` (additive instance constraints)](#d8-remove-contractconfigt) | 2026-02-07 | Done |
| D7 | [Flatten `src/runtime/` → `src/types/index.ts`](#d7-flatten-srcruntime) | 2026-02-08 | Done |
| D6 | [Remove standard library packages](#d6-remove-standard-library-packages) | 2026-02-07 | Done |
| D5 | [Self-registering contract plugins](#d5-self-registering-contract-plugins) | 2026-02-07 | Done |
| D4 | [Use `satisfies` instead of `locate()` / `defineContracts()`](#d4-use-satisfies-instead-of-runtime-markers) | 2026-02-07 | Done |
| D3 | [Use `type` alias instead of `interface extends`](#d3-type-alias-instead-of-interface-extends) | 2026-02-07 | Done |
| D2 | [No ts-morph dependency](#d2-no-ts-morph) | 2026-02-07 | Done |
| D1 | [Language Service Plugin instead of custom LSP](#d1-language-service-plugin-instead-of-custom-lsp) | 2026-02-07 | Done |

---

## D18: Semantic Error Messages

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript's diagnostic messages reported violations using raw file paths:

```
Forbidden dependency: src/domain/service.ts -> src/infra/database.ts
Impure import in pure layer: 'fs' in src/domain/service.ts
```

Users think in terms of architectural symbols ("domain", "infrastructure"), not file paths. The messages forced users to mentally map paths back to symbols.

### Decision

Include symbol names in all diagnostic messages, keeping file paths as supporting context:

```
Forbidden dependency: domain → infrastructure (src/domain/service.ts → src/infra/database.ts)
Impure import in 'domain': 'fs'
Circular dependency detected: domain → infrastructure → domain
```

### Rationale

- **Matches mental model** — users think "domain depends on infrastructure", not "this file depends on that file"
- **Actionable** — symbol names tell you which architectural rule is violated; file paths tell you where to fix it
- **Consistent** — all three plugins now lead with semantic context
- **Backwards-compatible** — messages still contain file paths, so existing `.toContain()` assertions in tests still pass

### Impact

- `noDependencyPlugin`: `Forbidden dependency: ${from} → ${to} (${sourceFile} → ${targetFile})`
- `purityPlugin`: `Impure import in '${symbol}': '${module}'`
- `noCyclesPlugin`: already used symbol names — no change
- All 263 tests passing, no test changes required

---

## D17: Remove mustImplement, exists, mirrors Plugins

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript had 6 constraint types: `noDependency`, `mustImplement`, `purity`, `noCycles`, `filesystem.exists`, and `filesystem.mirrors`. Three of them (`mustImplement`, `filesystem.exists`, `filesystem.mirrors`) had limited real-world value and added complexity:

- **mustImplement** — checked that every exported interface in one layer had an implementing class in another. Useful in theory, but in practice classes often implement interfaces from unrelated packages or use patterns (abstract classes, partial implementations) that the simple "has `implements` clause" check didn't handle well.
- **filesystem.exists** — checked that member directories existed on disk. Redundant: if a directory is missing, dependency checks simply pass (no files to violate). The constraint only caught the case where a user declared members they never created — a trivially fixable setup issue.
- **filesystem.mirrors** — checked that every file in one directory had a counterpart in another (e.g., every component has a test). Brittle in practice: test file naming conventions vary, colocated tests break the pattern, and the check produced false positives on stories, fixtures, and helpers.

### Decision

Remove all three plugins and focus on the 3 core constraints: `noDependency`, `purity`, `noCycles`. These three are compositional, behavioral, and universally applicable.

### Rationale

- **Focus** — 3 constraints that compose well are more valuable than 6 that each cover a narrow case
- **Simpler mental model** — users only need to learn 3 constraint types
- **Less maintenance surface** — 3 plugin implementations instead of 6
- **No real-world loss** — the removed constraints had workarounds (mustImplement → TypeScript's own type checking; exists → visual inspection; mirrors → test coverage tools)
- **Principled** — the remaining 3 constraints are all import-graph analysis, which is KindScript's core competency

### Impact

- Deleted `src/application/pipeline/plugins/must-implement/`, `exists/`, `mirrors/`
- Deleted 3 test files, 3 sets of integration fixtures, related E2E tests
- Removed `ContractType` enum values, `DiagnosticCode` constants, factory functions
- Removed `filesystem.exists`/`filesystem.mirrors` from all notebooks and documentation
- 26 test files, 263 tests, 100% passing

---

## D16: Resolution Moves from Parser to Binder

**Date:** 2026-02-10
**Status:** Done

### Context

The parser (`ParseService`) had two responsibilities: building ArchSymbol trees from scan output (structural) and resolving those symbols to actual files on disk (I/O). This meant the parser depended on `FileSystemPort`, which violated its role as a structural transformation stage. It also meant resolution logic was split between parser (filesystem resolution) and binder (TypeKind declaration resolution), making the data flow harder to follow.

### Decision

Move all name resolution from the parser to the binder. The parser becomes purely structural (no I/O dependencies). The binder performs unified resolution using a three-strategy approach:

1. **TypeKind declaration resolution** — scan for typed exports within the parent scope
2. **Folder resolution** — `readDirectory()` on the derived path
3. **File resolution** — single file check

### Rationale

- **Parser purity** — the parser is now a pure function from scan output to ArchSymbol trees, with zero I/O
- **Unified resolution** — all three resolution strategies live in one place (the binder), making the data flow clear
- **Aligned with TypeScript's model** — TypeScript's binder is where names are resolved to declarations
- **Single source of `resolvedFiles`** — `BindResult.resolvedFiles` is the one authoritative map; `ParseResult` no longer carries it

### Impact

- `ParseService`: constructor takes zero arguments (was `FileSystemPort`); removed `resolveSymbolFiles()` and `resolveTypeKindFiles()`
- `ParseResult`: removed `resolvedFiles` field
- `BindService`: constructor takes `(plugins, fsPort)`; new `resolveMembers()` method
- `BindResult`: now includes `resolvedFiles: Map<string, string[]>`
- `PipelineService`: uses `bindResult.resolvedFiles` directly (no merge)
- `engine-factory.ts`: `new ParseService()` (no args), `new BindService(plugins, fs)`
- All 263 tests passing, 5 test files updated for new constructors

---

## D15: Unified Kind Type — TypeKind as Sugar

**Date:** 2026-02-10
**Status:** Done

### Context

KindScript had two separate type-level primitives: `Kind<N, Members, Constraints>` for directory/file-based architectural units, and `TypeKind<N, T>` for declaration-based units. At the type level, they were unrelated types. This created a conceptual split — users had to learn two different systems — and a practical problem: `Members extends Record<string, KindRef>` needed `KindRef` to be a shared marker, but `Kind` and `TypeKind` had no common base.

Additionally, `TypeKind` only took 2 type parameters — it couldn't carry standalone constraints (like `pure: true`), limiting its expressiveness.

### Decision

Make `Kind` a conditional type with a 4th parameter `_Config extends KindConfig`:

```typescript
type KindConfig = { wraps?: unknown; scope?: 'folder' | 'file' };

type Kind<N, Members, _Constraints, _Config> =
  _Config extends { wraps: infer T }
    ? T & { readonly __kindscript_brand?: N }  // TypeKind shape
    : { kind: N; location: string } & Members; // structural shape

type TypeKind<N, T, C = {}> = Kind<N, {}, C, { wraps: T }>;  // sugar
```

`TypeKind<N, T, C>` is now literally `Kind<N, {}, C, { wraps: T }>` — not a separate concept, but a convenience alias. Both produce `KindRef`-compatible types.

### Rationale

- **One concept, not two** — Kind and TypeKind are the same thing configured differently (directory scope vs. declaration scope)
- **TypeKind gains constraints** — `TypeKind<"Decider", DeciderFn, { pure: true }>` enables standalone purity enforcement on typed exports
- **Shared `KindRef`** — both branches satisfy the phantom marker, so `Members extends Record<string, KindRef>` works naturally
- **`KindConfig` consolidates** — the previous 4th parameter `_Scope` (from D14) and the new `wraps` live together in one config type
- **Minimal API expansion** — 2 new exports (`KindConfig`, `KindRef`), 1 parameter added to `TypeKind`

### Impact

- `src/types/index.ts`: `Kind` is now a conditional type; `TypeKind` gains 3rd parameter; `KindConfig` and `KindRef` exported
- Public API: 6 types (`Kind`, `TypeKind`, `Instance`, `Constraints`, `KindConfig`, `KindRef`)
- Scanner: extracts `constraints` from TypeKind's 3rd type parameter via `TypeKindDefinitionView.constraints`
- Binder: generates standalone TypeKind contracts from `typeKindDefs` with constraints
- 2 new integration fixtures (typekind-purity-clean, typekind-purity-violation)
- 2 new E2E tests for TypeKind standalone purity
- 26 test files, 263 tests, 100% passing

---

## D14: File-Scoped Leaf Instances

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript's parser unconditionally derived instance locations from the parent directory of the declaring file (`dirnamePath(sourceFileName)`). This meant a `satisfies Instance<AtomSource>` declaration in `Button.tsx` was interpreted as "everything in Button.tsx's directory is an AtomSource" — not "Button.tsx is an AtomSource."

This prevented file-level architectural enforcement. In a design system where `Button.tsx`, `Button.stories.tsx`, and `Button.test.tsx` are colocated in the same directory, you couldn't constrain the source file differently from stories or tests.

### Industry Research

Surveyed 12 systems (Go, Rust, Bazel, Java JPMS, Python, C#, ArchUnit, eslint-plugin-boundaries, dependency-cruiser, Nx, Node.js exports, TypeScript project references). Key findings:

1. **Every directory-scoped system eventually needs file-level escape hatches.** Go added `_test.go`. Bazel has per-file targets. ArchUnit has `SliceAssignment`.
2. **The industry trend is toward file-level as default.** Node.js deprecated directory-level exports. dependency-cruiser and eslint-boundaries default to file scope.
3. **Systems with one clear default + minimal exceptions (Go) succeed.** Systems supporting both equally (Rust) create ongoing confusion.

Full research in `.working/FILE_VS_DIRECTORY_SCOPE_RESEARCH.md`.

### Decision

Use the presence of members as the structural indicator for scope:

- **Leaf Kind** (no members): instance location = the declaring file itself
- **Composite Kind** (has members): instance location = parent directory of the declaring file

### Rationale

- **Members structurally require directories** — they map to subdirectories, so directory scope is justified by necessity
- **Leaf instances describe themselves** — a file declaring `satisfies Instance<AtomSource>` with no members is naturally saying "I am an AtomSource"
- **Follows Go's playbook** — one clear default (file), structural escape (members create directory scope)
- **No new API types or syntax** — the rule is purely structural
- **Backwards compatible** — all existing instances use composite Kinds with members; no behavior changes for them

### Impact

- `parse.service.ts`: root derivation now conditional on `kindDef.members.length > 0`
- `resolveSymbolFiles`: handles file locations (single-file resolution) alongside directories
- `FileSystemPort`: added `fileExists(path): boolean`
- `FileSystemAdapter` + `MockFileSystemAdapter`: implement `fileExists`
- 5 new tests in `classify-ast-locate.test.ts`
- 284 tests, 29 files, 100% passing
- No existing test changes required

---

## D13: Rename `ConstraintConfig` to `Constraints`

**Date:** 2026-02-08
**Status:** Done

### Context

The public API type `ConstraintConfig<Members>` carried a `Config` suffix that was a leftover from the `ContractConfig` era (D8). With `Kind` and `Instance` as clean one-word nouns, `ConstraintConfig` was the odd one out — the suffix implied runtime configuration rather than a type-level schema.

Additionally, user-facing documentation led with "contracts" (internal domain model terminology) rather than "constraints" (what users actually write). Users declare constraints on Kind types; they never interact with `Contract` domain entities. The terminology mismatch made the docs harder to navigate.

### Decision

1. Rename `ConstraintConfig<Members>` to `Constraints<Members>` in the public API.
2. Rename `docs/03-contracts.md` to `docs/03-constraints.md` and update user-facing headings from "Contract Types" to "Constraint Types."
3. Add plugin registry validation tests (uniqueness of constraint names, contract types, diagnostic codes).
4. Keep internal domain model names unchanged: `Contract`, `ContractType`, `ContractPlugin` remain as-is.

### Rationale

- `Constraints<Members>` aligns with `Kind` and `Instance` — clean, one-word nouns
- `Kind<"X", Members, Constraints<Members>>` reads naturally
- Users write constraints, not contracts — docs should match user vocabulary
- Internal domain model doesn't need renaming — "contract" is correct for bound, evaluable rules
- Plugin registry validation tests prevent silent collisions (duplicate names, types, or codes)

### Impact

- Public API: `Kind`, `Instance<T>`, `Constraints<Members>` (3 user-facing types)
- `docs/03-contracts.md` → `docs/03-constraints.md` (file rename)
- User-facing headings updated: "Contract Types" → "Constraint Types"
- Plugin registry: 3 new uniqueness tests
- All tests passing, no behavioral changes

---

## D12: Rename `InstanceConfig<T>` to `Instance<T>`

**Date:** 2026-02-08
**Status:** Done

### Context

The public API type `InstanceConfig<T>` served as the projection from a Kind type to its instance value shape (used with `satisfies`). The name was verbose and the type-theoretic relationship was indirect — users had to understand `Kind`, `InstanceConfig`, and `MemberMap` as three separate concepts.

Research across Haskell (class/instance), Scala (trait/given), Rust (trait/impl), OCaml (module type/structure), and TypeScript ecosystem tools (Zod, Effect-TS, Vite) confirmed that every system uses a schema→instance projection, and most call the instance side "instance."

### Decision

Rename `InstanceConfig<T>` to `Instance<T>`. Keep `MemberMap<T>` as an internal implementation detail (still exported for cross-module use, but not documented as part of the public API).

### Rationale

- `Instance<T>` communicates the type-theoretic relationship clearly: "this value satisfies Instance of OrderingContext"
- Mirrors naming conventions across Haskell (`class`/`instance`), Scala (`trait`/`given`), Rust (`trait`/`impl`)
- Reduces public API surface from 4 types to 3 user-facing types: `Kind`, `Instance`, `Constraints`
- `MemberMap` becomes an internal projection mechanism, not a concept users need to learn
- No deprecated alias — pre-1.0 with no external users, clean break preferred
- Mechanical rename with no logic changes

### Impact

- Public API: `Kind`, `Instance<T>`, `Constraints` (3 user-facing types)
- AST adapter: detection string changed from `'InstanceConfig'` to `'Instance'`
- ~355 occurrences renamed across ~58 files (source, tests, fixtures, docs, notebooks)
- All 276 tests passing, no behavioral changes

---

## D11: Pipeline Cleanup — Separation of Concerns

**Date:** 2026-02-08
**Status:** Done

### Context

After the four-stage pipeline alignment (D10), several cross-cutting concerns remained entangled: view DTOs lived in port files, contract plugins were split across `bind/` and `check/`, `PipelineService` handled both program setup and stage orchestration, and the `Engine` interface exposed infrastructure details (`fs`, `ts`) that no app consumed.

### Decision

Five targeted changes to improve separation of concerns:

1. **Extract view types** — Move `TypeNodeView`, `KindDefinitionView`, etc. from `ast.port.ts` into `pipeline/views.ts`. The port re-exports them for adapter compatibility.
2. **Extract plugins** — Move `ConstraintProvider`, `ContractPlugin`, plugin registry, and all 6 plugin implementations into a neutral `pipeline/plugins/` directory (shared by bind + check stages).
3. **Add use-case interfaces** — Each stage (scan, parse, bind) gets a use-case interface (`ScanUseCase`, `ParseUseCase`, `BindUseCase`). `PipelineService` depends on interfaces, not concrete classes.
4. **Extract ProgramFactory** — Config reading, file discovery, and TS program creation move from `PipelineService` into `ProgramFactory` behind a `ProgramPort` interface.
5. **Slim Engine** — Remove unused `fs` and `ts` from `Engine` interface. Apps only use `pipeline` and `plugins`.

### Rationale

- **View types in port files** — violated Interface Segregation; pipeline stages needed AST port just for DTOs
- **Plugins split across stages** — `ContractPlugin extends ConstraintProvider` created a cross-stage dependency; neutral `plugins/` directory resolves this
- **Concrete stage dependencies** — made `PipelineService` hard to test without real services; interfaces enable mock injection
- **PipelineService doing too much** — program setup is independent of stage orchestration; extracting it follows Single Responsibility
- **Engine surface area** — `fs` and `ts` were never consumed by any app; removing them reduces coupling

### Impact

- 276 tests, 29 files, 100% passing
- No public API changes
- `PipelineService` constructor: 6 interface-typed dependencies
- `Engine` interface: `{ pipeline, plugins }` only

---

## D10: Four-Stage Pipeline Alignment

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript's application layer was organized by capability (`classification/` + `enforcement/`), but `ClassifyASTService.execute()` was doing three distinct jobs in one method: extracting raw AST views (scanning), building ArchSymbol trees (parsing), and generating Contracts from constraint trees (binding). This entanglement made it hard to reason about, test, and extend each concern independently.

### Decision

Decompose the application layer into four explicit pipeline stages aligned with TypeScript's compiler terminology: **Scanner → Parser → Binder → Checker**. Replace `classification/` + `enforcement/` + `services/` with a single `pipeline/` directory.

### Rationale

- **TypeScript alignment** — using the same stage names (scan, parse, bind, check) makes the architecture immediately recognizable to TypeScript compiler contributors and readers
- **Single Responsibility** — each stage has one job with clear input/output types (`ScanResult` → `ParseResult` → `BindResult` → `CheckerResponse`)
- **Testability** — stages can be tested independently with mock inputs; the three classify-ast test files naturally map to scan, parse, and bind
- **Simplified orchestration** — `PipelineService` absorbs `ClassifyProjectService` + `RunPipelineService` into one orchestrator that owns config, program creation, caching, and the stage chain
- **Simpler Engine** — the `Engine` interface shrinks from `{ classifyProject, checkContracts, runPipeline, plugins, fs, ts }` to `{ pipeline, plugins }` (further slimmed in D11)

### Impact

- Deleted `classification/`, `enforcement/`, `services/` directories
- Created `pipeline/scan/`, `pipeline/parse/`, `pipeline/bind/`, `pipeline/check/`
- Renamed `CheckContractsService` → `CheckerService`
- Merged `ClassifyProjectService` + `RunPipelineService` → `PipelineService`
- Absorbed `resolveSymbolFiles()` into `ParseService` as a private method
- All 29 test files, 277 tests updated and passing

---

## D9: Drop `.k.ts`, Piggyback on TypeScript Type Checker

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript used a `.k.ts` file extension as a convention to identify definition files. The classifier used `fileName.endsWith('.k.ts')` to filter which files to analyze. The AST extraction itself already worked on any TypeScript file.

### Decision

Drop the `.k.ts` extension entirely. Use TypeScript's type checker (`checker.getSymbolAtLocation()` + `getAliasedSymbol()`) to discover Kind definitions and Instance declarations. This makes KindScript invisible — definitions live in regular `.ts` files with no special extension, no config file, and no naming convention.

### Rationale

- The `.k.ts` extension was unfamiliar and made KindScript feel like a separate language
- The AST extraction logic was already extension-agnostic
- TypeScript's type checker already resolves all imports, aliases, and re-exports — piggybacking on it is more robust than string matching
- Dropping `.k.ts` means zero artifacts in a project beyond `import type` statements
- Discovery through the type checker handles aliased imports (`import { Kind as K }`) correctly

### Impact

- All `.k.ts` fixture files renamed to `.ts`
- 4 extension filters removed from source
- `ASTAdapter` rewritten to use type checker for Kind/Instance identification
- ~5 lines of code changed in the core pipeline

---

## D8: Remove `ContractConfig<T>`

**Date:** 2026-02-07
**Status:** Done

### Context

The V2 redesign introduced `ContractConfig<T>` as an "additive escape hatch" — instances could declare additional constraints beyond what the Kind type specified.

### Decision

Remove `ContractConfig<T>`. All constraints must be declared on the Kind type's 3rd type parameter. The Kind type is the single source of truth for all architectural rules.

### Rationale

- Breaks the "abstractions as types" metaphor — in TypeScript, types fully describe their contract; values don't add new type rules
- Created ambiguity in multi-instance scenarios
- Required a third classification phase in the AST classifier
- Confused where to look for the authoritative set of constraints

### Impact

- Simpler mental model: read the Kind definition to understand all rules
- Different constraints require different Kinds (by design)
- Classifier simplified to 2 phases (Kind definitions + instances)
- `ContractConfig` removed from public API

---

## D7: Flatten `src/runtime/`

**Date:** 2026-02-08
**Status:** Done

### Context

`src/runtime/` contained ~65 lines of type-only exports (`Kind`, `Constraints`, `MemberMap`, `Instance`). The name "runtime" was a leftover from when it contained actual runtime functions (`locate()`, `defineContracts()`).

### Decision

Move all types to `src/types/index.ts`. Delete `src/runtime/`.

### Rationale

- ~65 lines of type-only code doesn't need its own directory
- The name "runtime" contradicted KindScript's "zero runtime footprint" value proposition
- Research across 14 tools (Zod, Vite, Rollup, ESLint, etc.) showed no tool separates user-facing types into a subfolder

---

## D6: Remove Standard Library Packages

**Date:** 2026-02-07
**Status:** Done

### Context

KindScript originally planned to ship pre-built architectural patterns as `@kindscript/*` npm packages (`@kindscript/clean-architecture`, `@kindscript/hexagonal`, etc.).

### Decision

Remove standard library packages. Users define patterns inline in their own `.ts` files.

### Rationale

- Added complexity (package resolution service, config plumbing, branching codegen logic, extra test fixtures)
- Marginal value — defining a Kind type is ~10 lines of code
- Premature optimization — the user base doesn't exist yet to justify pre-built patterns
- Patterns defined inline are easier to customize and understand

---

## D5: Self-Registering Contract Plugins

**Date:** 2026-02-07
**Status:** Done

### Context

Contract checking was a monolithic ~322-line `CheckContractsService` with a `switch` statement dispatching to private methods.

### Decision

Extract each contract type into a self-contained `ContractPlugin` object. A `plugin-registry.ts` file creates all plugins. `CheckContractsService` becomes a thin dispatcher.

### Rationale

- Open-Closed Principle — adding a new contract type means adding a new plugin, not modifying the dispatcher
- Each plugin declares its own type, constraint name, diagnostic code, validation, and checking logic
- Plugins can be tested independently
- The dispatcher is ~60 lines with no contract-specific knowledge

### Plugin Interface

```typescript
interface ContractPlugin extends ConstraintProvider {
  readonly type: ContractType;
  readonly diagnosticCode: number;

  validate(args: ArchSymbol[]): string | null;
  check(contract: Contract, ctx: CheckContext): CheckResult;

  codeFix?: { fixName: string; description: string };
}
```

Where `ConstraintProvider` provides `constraintName`, optional `generate()`, and optional `intrinsic` (detect + propagate).

---

## D4: Use `satisfies` Instead of Runtime Markers

**Date:** 2026-02-07
**Status:** Done

### Context

Users previously wrote `locate<T>("root", { ... })` and `defineContracts<T>({ ... })` — runtime function calls that were identity no-ops. KindScript's classifier matched them syntactically but never executed them.

### Decision

Replace all runtime markers with `satisfies` expressions and `import type`. Instances use `{ ... } satisfies Instance<T>`. Constraints move to the Kind type's 3rd parameter. All imports become `import type` (fully erased from output).

### Rationale

- `locate()` and `defineContracts()` required `kindscript` as a real dependency (not just `devDependencies`)
- The runtime no-ops shipped in production bundles if definition files were accidentally included
- `satisfies` is valid TypeScript with zero runtime cost
- `import type` is fully erased — KindScript becomes a devDependency only
- The Kind syntax change (D3) was already breaking, so the incremental cost of also changing instance syntax was near zero

---

## D3: Type Alias Instead of `interface extends`

**Date:** 2026-02-07
**Status:** Done

### Context

Kind definitions originally used `interface X extends Kind<"X"> { members }`.

### Decision

Change to `type X = Kind<"X", { members }, { constraints }>`.

### Rationale

- Eliminated redundant name (`interface DomainLayer extends Kind<"DomainLayer">`)
- No empty `{}` for leaf kinds (`type DomainLayer = Kind<"DomainLayer">`)
- Constraints as 3rd type parameter is cleaner than `extends Kind` plus separate `defineContracts()`
- `extends` implied OOP inheritance; `type` is a pure type-level concept
- All three pieces of a Kind (name, members, constraints) live in one declaration

---

## D2: No ts-morph

**Date:** 2026-02-07
**Status:** Done

### Context

ts-morph provides a higher-level API over TypeScript's compiler API, making AST operations more ergonomic.

### Decision

Use the raw TypeScript compiler API throughout. Do not add ts-morph as a dependency.

### Rationale

- The classifier is ~100-150 lines of straightforward AST walking
- ts-morph adds ~500KB and version coupling to TypeScript
- Performance matters in the plugin context (runs on every keystroke)
- The original use case for ts-morph (code generation/scaffolding) was removed from KindScript
- Clean helper functions provide sufficient ergonomics for the remaining use cases

---

## D1: Language Service Plugin Instead of Custom LSP

**Date:** 2026-02-07
**Status:** Done

### Context

The original architecture proposed a custom LSP server for IDE integration.

### Decision

Use TypeScript's Language Service Plugin API instead.

### Rationale

**Ecosystem evidence:**

| Project | Plugin or LSP? | File Types |
|---------|---------------|------------|
| Angular Language Service | Plugin | `.ts` only |
| typescript-styled-plugin | Plugin | `.ts` with tagged templates |
| ts-graphql-plugin | Plugin | `.ts` with tagged templates |
| Vue Language Tools | Both | `.vue` (LSP) + `.ts` (plugin) |
| Svelte Language Tools | Both | `.svelte` (LSP) + `.ts` (plugin) |

**Pattern:** Projects operating on `.ts` files only use the plugin API exclusively. KindScript operates entirely on `.ts` files.

**Benefits:**
- Eliminates entire LSP server implementation
- Zero editor-specific integration work — every tsserver-based editor works immediately
- Native diagnostic display alongside TypeScript errors
- Code actions, hover info, and squiggly underlines work out of the box

**Trade-offs:**
- Contracts must be fast (sub-100ms per file) since the plugin runs in tsserver's event loop
- Complex analysis belongs in the CLI (`ksc check`), not the plugin

---

## Build / Wrap / Skip Framework

The decisions above follow a consistent framework:

**BUILD (genuinely new):**
1. Classifier — AST → ArchSymbol (no equivalent in TS ecosystem)
2. Symbol-to-files resolution — maps type declarations to filesystem
3. Contract evaluation — behavioral checking against codebase structure

**WRAP (delegate to TypeScript):**
1. Import graph — thin query over ts.Program
2. Diagnostic format — use ts.Diagnostic directly (codes 70000–79999)
3. Language service — plugin API
4. Filesystem access — ts.sys + small extensions
5. Config parsing — ts.readConfigFile

**SKIP (TypeScript handles natively):**
1. Scanner / Parser
2. AST format (ts.Node)
3. Structural type checking
4. LSP server (plugin runs inside tsserver)
