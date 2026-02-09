# Definition File Strategy: Do We Need .k.ts?

**Date:** 2026-02-08

## The Observation

KindScript definitions are valid TypeScript:

```typescript
// This is valid TypeScript. No special syntax, no macros, no transforms.
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanContext>;
```

The `.k.ts` extension is a convention — the compiler uses `fileName.endsWith('.k.ts')` to find these declarations. But the AST extraction (`getKindDefinitions`, `getInstanceDeclarations`) already works on any TypeScript file. It looks for `Kind<...>` type references and `satisfies InstanceConfig<T>` expressions in the AST. No extension check.

So: **do we need `.k.ts` at all?**

## How Discovery Works Today

```
All project source files (from tsconfig / filesystem scan)
    ↓
Filter: fileName.endsWith('.k.ts')                          ← the only gate
    ↓
ASTAdapter.getKindDefinitions(sourceFile)                    ← works on any TS file
ASTAdapter.getInstanceDeclarations(sourceFile)               ← works on any TS file
    ↓
ClassifyASTService builds symbols + contracts
```

The `.k.ts` filter appears in 4 places:
1. `classify-project.service.ts:64` — main discovery
2. `get-plugin-diagnostics.service.ts:50` — plugin diagnostic filtering
3. `test-pipeline.ts:51` — test helper
4. `check-contracts.integration.test.ts:41` — integration test

Remove those 4 lines (or change them), and KindScript works with regular `.ts`/`.tsx` files.

## The Options

### Option 1: Keep `.k.ts` (Status Quo)

Dedicated `.k.ts` files. Discovery by file extension.

```
src/
  context.k.ts              # Kind definitions + instances
  domain/
    user.ts                  # Regular source code
  infrastructure/
    db.ts                    # Regular source code
```

**How it works:** Compiler filters by `.k.ts` extension, parses only those files.

**Pros:**
- Clear convention — easy to find architectural declarations
- Fast discovery — string suffix check, no AST traversal needed
- Explicit intent — `.k.ts` files exist solely for KindScript
- Easy to `.gitignore`, lint separately, or apply different rules
- Separation of concerns — architecture metadata vs source code

**Cons:**
- Extra files that don't exist in the user's mental model of their project
- The `.k.ts` extension is unfamiliar — requires explanation
- Instances must live in `.k.ts` files, which means separate files from source code
- For Kinds with many instances, this means many small metadata files
- Makes KindScript feel like a separate language when it isn't

---

### Option 2: Drop Extension, Discover by Import

Any file that `import`s from `'kindscript'` is scanned for Kind definitions and instances.

```
src/
  architecture.ts            # imports from 'kindscript' → scanned
  domain/
    user.ts                  # no kindscript import → skipped
  infrastructure/
    db.ts                    # no kindscript import → skipped
```

**How it works:**
1. Compiler gets all source files from the TypeScript program
2. For each file, checks if it has `import ... from 'kindscript'`
3. If yes, runs `getKindDefinitions()` and `getInstanceDeclarations()` on it
4. If no, skips it

**Pros:**
- No special extension — pure TypeScript files
- Natural convention — if you use KindScript types, you import them
- Fast filtering — checking imports is a shallow operation (first few statements)
- The import is already required for TypeScript type-checking
- Files are self-documenting — the import declares "this file uses KindScript"

**Cons:**
- Slightly slower than extension check (must parse imports vs. string suffix)
- What if someone imports 'kindscript' but doesn't define Kinds? (harmless — scanner finds nothing)
- Re-exports or barrel files could cause unexpected scanning
- The import becomes load-bearing infrastructure, not just type info

---

### Option 3: Drop Extension, Scan All Files

Check every source file for Kind/InstanceConfig patterns. No filtering at all.

```
src/
  architecture.ts            # has Kind<...> → found
  domain/
    user.ts                  # no Kind<...> → nothing found, move on
  infrastructure/
    db.ts                    # no Kind<...> → nothing found, move on
```

**How it works:**
1. Compiler gets all source files from the TypeScript program
2. Runs `getKindDefinitions()` and `getInstanceDeclarations()` on every file
3. The AST walker finds nothing in most files and returns empty arrays quickly

**Pros:**
- Zero convention needed — no special extension, no special import
- The simplest mental model: "write Kind definitions anywhere, the compiler finds them"
- Aligns with how TypeScript itself works (types are wherever you put them)
- No false negatives — every Kind definition is found, no matter where it lives

**Cons:**
- Performance — walks every file's AST top-level statements. For a project with 1000 files, that's 1000 walks. Each walk is fast (early-exit if no Kind/InstanceConfig found), but adds up.
- False positives — if someone defines their own `Kind` type unrelated to KindScript, it could be picked up. The ASTAdapter checks for `Kind<...>` with type arguments, which is specific but not unique.
- No discoverability — impossible to quickly find "which files have KindScript definitions?" without running the compiler

---

### Option 4: Drop Extension, Use Project Config

A `kindscript.json` or `tsconfig.json` field specifies which files/patterns contain definitions.

```json
// kindscript.json
{
  "definitionFiles": ["src/architecture.ts", "src/**/kinds.ts"]
}
```

```
src/
  architecture.ts            # listed in config → scanned
  components/
    atoms/kinds.ts           # matches glob → scanned
  domain/
    user.ts                  # not in config → skipped
```

**How it works:** Compiler reads config, resolves file patterns, scans only matching files.

**Pros:**
- Explicit — user controls exactly what's scanned
- No convention required (no extension, no import)
- Fast — only scans configured files
- Flexible — any file naming scheme works

**Cons:**
- Config is a separate source of truth that must be kept in sync
- Adding a new Kind definition requires updating config (easy to forget)
- More setup friction than any other option
- Feels like boilerplate for the sake of boilerplate

---

## The Instance Question

The choice of discovery mechanism interacts with where instance declarations live.

### Instances in Dedicated Files (Current Model)

```
atoms/
  atomVersion.ts             # Kind definition
  atom1/v0.0.1/
    instance.ts              # { source: {} } satisfies InstanceConfig<AtomVersion>
    atom1.tsx                # Component code
```

Only makes sense with Option 1 or 2. Requires a file per instance. Doesn't scale.

### Instances in Source Files

```
atoms/
  atomVersion.ts             # Kind definition
  atom1/v0.0.1/
    atom1.tsx                # Component code + InstanceConfig declaration
```

Where `atom1.tsx` contains:

```typescript
import type { InstanceConfig } from 'kindscript';
import type { AtomVersion } from '../../atomVersion';

// KindScript instance declaration
export const _kind = { source: {} } satisfies InstanceConfig<AtomVersion>;

// Component code
export const Button = () => <button>Click me</button>;
```

Works with Options 2 and 3 (the compiler finds the file because it imports 'kindscript' or because it scans everything). The instance lives WITH the code it describes.

**But** — still one declaration per instance. For AtomVersion, each declaration is `{ source: {} }` — pure ceremony. 40 atoms x 2 versions = 80 identical `_kind` exports.

### Instances via Pattern Discovery (No Per-Instance Declaration)

```
atoms/
  atomVersion.ts             # Kind definition + kindScope("*/v*/", AtomVersion)
  atom1/v0.0.1/
    atom1.tsx                # Just component code. No kindscript import. No instance declaration.
  atom1/v0.0.2/
    atom1.tsx
  atom2/v0.0.1/
    atom2.tsx
```

Where `atomVersion.ts` contains:

```typescript
import type { Kind } from 'kindscript';

type AtomSource = Kind<"AtomSource", {}, { filePattern: "*.tsx" }>;
type AtomVersion = Kind<"AtomVersion", { source: AtomSource }, {}>;

export const versions = kindScope(AtomVersion, "*/v*/");
```

The compiler discovers instances from the filesystem. Source files are untouched — they don't know KindScript exists. This is the cleanest separation: architectural rules in one place, source code completely unaware.

Works with any discovery option (1-4), since only the Kind definition file needs to be found.

## Analysis: What Are We Actually Deciding?

Two independent questions are entangled here:

### Question 1: How does the compiler find Kind definitions?

| Mechanism | Speed | Convention | False Positives |
|-----------|-------|------------|-----------------|
| `.k.ts` extension | Fastest | Heaviest | None |
| `import 'kindscript'` | Fast | Light | None |
| Scan all files | Slower | None | Possible |
| Config file | Fast | Medium | None |

### Question 2: How does the compiler find instances?

| Mechanism | Boilerplate | Scales? | Source Files Aware of KindScript? |
|-----------|-------------|---------|-----------------------------------|
| Per-file declarations | High | No | Yes (if in source files) |
| Pattern discovery (kindScope) | None | Yes | No |

These questions are independent. You could use import-based discovery for Kind definitions and pattern-based discovery for instances. Or scan all files for Kind definitions but use kindScope for instances.

## The Deeper Question

The user asked: "couldn't we just use typescript?"

The answer is: **we already do.** KindScript definitions ARE TypeScript. The `.k.ts` extension doesn't make them special — it just tells the compiler where to look. Removing it changes nothing about what KindScript IS. It only changes how the compiler FINDS it.

The real question is: **should KindScript be visible or invisible in a project's file structure?**

**Visible (`.k.ts` files):**
- You can see at a glance that a project uses KindScript
- Architectural declarations are clearly separated from source code
- New developers know exactly where to look
- But: extra files, unfamiliar extension, feels like a separate language

**Invisible (pure TypeScript):**
- KindScript is just "TypeScript with extra type definitions"
- No cognitive overhead — it's all `.ts` files
- Source files can contain instance declarations naturally
- But: harder to find where architectural rules are defined
- But: source files may contain architectural metadata (mixing concerns)

**Invisible + Pattern Discovery:**
- Kind definitions in regular `.ts` files (one or few per project)
- Instances discovered via `kindScope` — no per-instance declarations
- Source files are completely unaware of KindScript
- Best of both worlds: invisible infrastructure, clean source files
- But: requires the `kindScope` feature (not yet built)

## Recommendation

**Drop the `.k.ts` extension. Piggyback on TypeScript's type checker for discovery and extraction.**

1. TypeScript already creates a program and type-checks all files — this is free
2. KindScript queries the type checker: "which symbols in this program reference `Kind` or `InstanceConfig` from `'kindscript'`?"
3. No file extension convention. No import scanning heuristic. No string matching. The type checker already resolved every symbol.
4. Kind definitions live in regular `.ts` files — name them whatever makes sense (`architecture.ts`, `kinds.ts`, `atomVersion.ts`)
5. Instance declarations can live in those same files or in source files — the type checker finds them either way
6. `.k.ts` files continue to work (they're valid `.ts` files) — backward compatible

**Why type-checker-based over import-scanning:**
- Zero convention — no extension, no import check, nothing. TypeScript's type system IS the discovery mechanism.
- Handles aliases, re-exports, barrel files, computed types — all cases where string matching fails
- No false positives — the type checker knows exactly which symbols come from 'kindscript'
- The infrastructure already exists — the type checker is already created in both CLI and plugin

**Why type-checker-based over config:**
- No extra config file to maintain
- Adding a new Kind definition = just write it. The type checker finds it automatically.

**Combine with pattern-based instance discovery (future):**
- Kind definitions in regular `.ts` files → found via type checker
- Instances via `kindScope` → found via filesystem scanning
- Source files completely unaware of KindScript

## Piggybacking on TypeScript

The options above frame discovery as a KindScript-specific problem. But TypeScript already solves it. KindScript runs inside TypeScript's compiler pipeline — either as a language service plugin or by creating a `ts.Program` in the CLI. In both cases, TypeScript has already:

1. Discovered all project files (from `tsconfig.json`)
2. Parsed every file into an AST
3. Resolved all imports, symbols, and type references
4. Type-checked everything

KindScript's `ASTAdapter` duplicates much of this work — poorly. Here's what it does vs. what TypeScript already knows:

| Task | ASTAdapter (current) | TypeScript type checker (available but unused) |
|------|---------------------|-----------------------------------------------|
| Find Kind definitions | Walks statements, checks `type.typeName.text !== 'Kind'` (string match) | Knows which symbols resolve to `Kind` from `'kindscript'`, through any aliases or re-exports |
| Find instance declarations | Checks `type.typeName.text !== 'InstanceConfig'` (string match) | Knows which `satisfies` expressions reference `InstanceConfig` from `'kindscript'` |
| Extract type arguments | Manually walks `type.typeArguments` array | Has fully resolved type arguments, even through indirection |
| Resolve variable references | Builds its own `varMap` by walking all variable declarations | Full symbol resolution via `checker.getSymbolAtLocation()` |
| Extract constraint config | Walks raw type nodes structurally (`buildTypeNodeView`) | Has resolved types — handles type aliases, intersections, computed types |

This duplication produces a documented limitation that shouldn't exist:

> **Limitation:** `Kind` and `InstanceConfig` must be imported by their exact names. Aliases (e.g., `import type { Kind as K }`) are not recognized and will be silently ignored.
> — `ast.adapter.ts`, lines 12-14

This limitation exists because the adapter matches identifier text strings instead of using the type checker's symbol resolution. TypeScript solved this problem decades ago.

The type checker is already created — `classify-project.service.ts:60` calls `this.tsPort.getTypeChecker(program)` and passes it to the classify service. But the `ASTAdapter` never receives it. It works purely syntactically on raw AST nodes.

### Three levels of piggybacking

**Level 0 — Current state.** TypeScript discovers and parses files. KindScript filters by `.k.ts` extension, then re-walks the AST with string matching.

**Level 1 — Discovery.** Use the type checker to find files that reference symbols from `'kindscript'`. Replace the `endsWith('.k.ts')` filter with: "which files contain references to the `Kind` or `InstanceConfig` symbols exported by `'kindscript'`?" No extension convention needed. No import-checking heuristic needed. The type checker already resolved every symbol in every file.

**Level 2 — Identification.** Use the type checker to identify Kind definitions and instances. Instead of walking AST nodes and matching the string `"Kind"`, ask the type checker: "is this type alias's type a reference to the `Kind` symbol from `'kindscript'`?" This handles aliases (`import type { Kind as K }`), re-exports (`export type { Kind } from 'kindscript'`), and barrel files. Same for `InstanceConfig`.

**Level 3 — Extraction.** Use the type checker to extract type arguments and constraint structures. Instead of manually walking `type.typeArguments[2]` and building a `TypeNodeView` from raw AST nodes, ask the type checker: "what is the resolved type of the third type parameter of this `Kind` reference?" The type checker returns the fully resolved type — even if the user wrote:

```typescript
type MyConstraints = { noDependency: [["domain", "infra"]] };
type Ctx = Kind<"Ctx", Members, MyConstraints>;
```

The current AST walker fails here — it sees `MyConstraints` (an identifier), not the resolved type literal. The type checker resolves it automatically.

### What this means for the options

With full type-checker piggybacking, Options 1-4 collapse into a single approach:

```
TypeScript creates program (already happens)
    ↓
Type checker resolves all symbols (already happens)
    ↓
KindScript queries the type checker:
  "Which type aliases in this program resolve to Kind from 'kindscript'?"
  "Which satisfies expressions resolve to InstanceConfig from 'kindscript'?"
    ↓
For each match, extract resolved type arguments from the type checker
    ↓
ClassifyASTService builds symbols + contracts (unchanged)
```

No file extension convention. No import scanning. No AST walking for discovery. No string matching. The type checker already did the work — KindScript just asks it questions.

### What the ASTAdapter becomes

Today the `ASTAdapter` is 323 lines of manual AST walking, variable resolution, and type node interpretation. With type-checker piggybacking, it becomes a thin query layer over `ts.TypeChecker`:

- `getKindDefinitions()` → find all type aliases whose type resolves to the `Kind` symbol; extract resolved type args via `checker.getTypeArguments()`
- `getInstanceDeclarations()` → find all `satisfies` expressions whose type resolves to `InstanceConfig`; extract the expression value and resolved Kind type
- `buildTypeNodeView()` → replaced by walking the checker's resolved `ts.Type` objects instead of raw `ts.TypeNode` AST nodes

The documented alias limitation disappears. Computed types work. Re-exports work. The adapter shrinks and becomes more robust.

### Trade-off: type checker dependency

The current ASTAdapter works without a type checker — it takes a `SourceFile` and returns views. This is useful for testing (the mock adapter doesn't need a real type checker). Moving to type-checker-based extraction would mean:

- The real adapter needs the type checker (available in both CLI and plugin contexts)
- The mock adapter for tests continues to work as-is (it returns canned views, doesn't walk ASTs)
- The port interface (`ASTViewPort`) may need to accept a type checker parameter, or the adapter could receive it via constructor

This is a real architectural change but a clean one — the mock adapter is unaffected, and the real adapter becomes simpler and more correct.

## What Changes

### Discovery (drop `.k.ts` filter):

1. `classify-project.service.ts:64` — replace `endsWith('.k.ts')` filter with type-checker query for files containing `Kind`/`InstanceConfig` references from `'kindscript'`
2. `get-plugin-diagnostics.service.ts:50` — same change
3. `test-pipeline.ts:51` — same change
4. `check-contracts.integration.test.ts:41` — same change
5. Update error message "No .k.ts definition files found" → "No Kind definitions found in the project"
6. Update all documentation references to `.k.ts`
7. Existing `.k.ts` files in fixtures continue to work (optionally rename to `.ts`)

### Extraction (piggyback on type checker):

1. `ASTAdapter` — rewrite to query `ts.TypeChecker` instead of walking raw AST nodes
2. `ASTAdapter.getKindDefinitions()` — use type checker to find type aliases resolving to `Kind` symbol, extract resolved type arguments via `checker.getTypeArguments()`
3. `ASTAdapter.getInstanceDeclarations()` — use type checker to find `satisfies` expressions resolving to `InstanceConfig` symbol
4. `ASTAdapter.buildTypeNodeView()` — replace with resolved `ts.Type` walking instead of raw `ts.TypeNode` walking
5. `ASTViewPort` interface — may need to accept type checker (or adapter receives it via constructor)
6. Remove the documented alias limitation from `ast.adapter.ts`

### What stays the same:

- `ClassifyASTService` — consumes the same views (`KindDefinitionView`, `InstanceDeclarationView`)
- `CheckContractsService` — unchanged
- `MockASTAdapter` in tests — unchanged (returns canned views, doesn't walk ASTs)
- All type definitions (`Kind`, `InstanceConfig`, `ConstraintConfig`) — unchanged
- All constraints and contract plugins — unchanged
- All domain entities and value objects — unchanged
