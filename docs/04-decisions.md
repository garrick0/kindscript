# Decisions

> Key architectural decisions and their rationale.

Each decision records the context, options considered, and outcome. Entries are ordered chronologically with the most recent first.

---

## Decision Index

| # | Decision | Date | Status |
|---|----------|------|--------|
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

## D9: Drop `.k.ts`, Piggyback on TypeScript Type Checker

**Date:** 2026-02-08
**Status:** Done

### Context

KindScript used a `.k.ts` file extension as a convention to identify definition files. The classifier used `fileName.endsWith('.k.ts')` to filter which files to analyze. The AST extraction itself already worked on any TypeScript file.

### Decision

Drop the `.k.ts` extension entirely. Use TypeScript's type checker (`checker.getSymbolAtLocation()` + `getAliasedSymbol()`) to discover Kind definitions and InstanceConfig declarations. This makes KindScript invisible — definitions live in regular `.ts` files with no special extension, no config file, and no naming convention.

### Rationale

- The `.k.ts` extension was unfamiliar and made KindScript feel like a separate language
- The AST extraction logic was already extension-agnostic
- TypeScript's type checker already resolves all imports, aliases, and re-exports — piggybacking on it is more robust than string matching
- Dropping `.k.ts` means zero artifacts in a project beyond `import type` statements
- Discovery through the type checker handles aliased imports (`import { Kind as K }`) correctly

### Impact

- All `.k.ts` fixture files renamed to `.ts`
- 4 extension filters removed from source
- `ASTAdapter` rewritten to use type checker for Kind/InstanceConfig identification
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

`src/runtime/` contained ~65 lines of type-only exports (`Kind`, `ConstraintConfig`, `MemberMap`, `InstanceConfig`). The name "runtime" was a leftover from when it contained actual runtime functions (`locate()`, `defineContracts()`).

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
interface ContractPlugin {
  type: ContractType;
  constraintName: string;
  diagnosticCode: number;
  validate(args: ArchSymbol[]): string | null;
  check(request: CheckRequest): Diagnostic[];
  generate?(view: TypeNodeView): Contract[];
  intrinsic?(symbol: ArchSymbol): Contract[];
}
```

---

## D4: Use `satisfies` Instead of Runtime Markers

**Date:** 2026-02-07
**Status:** Done

### Context

Users previously wrote `locate<T>("root", { ... })` and `defineContracts<T>({ ... })` — runtime function calls that were identity no-ops. KindScript's classifier matched them syntactically but never executed them.

### Decision

Replace all runtime markers with `satisfies` expressions and `import type`. Instances use `{ ... } satisfies InstanceConfig<T>`. Constraints move to the Kind type's 3rd parameter. All imports become `import type` (fully erased from output).

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
