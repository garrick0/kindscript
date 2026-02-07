# KindScript as a Compiler: Structural Parallels with TypeScript (v4)

## Preface

This document examines how KindScript should be built as a system that leverages TypeScript's existing infrastructure while adding genuinely novel capabilities for architectural enforcement.

### Evolution Across Versions

**v1** claimed KindScript had a "dual front-end" — wrong, an implementation choice disguised as structural necessity.

**v2** corrected to single front-end but underspecified critical details.

**v3** fixed major architectural issues (binder-checker split, three-trigger invalidation, contract trust, etc.) but still over-built components that TypeScript already provides.

**v4** incorporates ecosystem evidence from real production tools. Key changes:
- Language service plugin instead of custom LSP server
- Project references as opt-in adoption path (with honest costs)
- No ts-morph dependency (raw API throughout)
- Simplified watch architecture acknowledging plugin context
- npm package distribution for standard library
- Direct use of ts.Diagnostic (no custom ArchDiagnostic type)

The guiding principle: **Build only what's genuinely new. Wrap TypeScript's existing capabilities. Skip what TypeScript handles natively.**

---

## Part 1 — TypeScript's Internal Architecture (Unchanged)

[Content from v3 Part 1 remains identical — Scanner, Parser, Binder, Checker, Emitter phases]

For brevity, see v3 Part 1. The TypeScript compiler pipeline is:
1. Scanner → tokens
2. Parser → ts.Node AST
3. Binder → ts.Symbol + flow graph
4. Checker → types + diagnostics
5. Emitter → .js/.d.ts

Key cross-cutting concerns:
- **ts.Program**: Top-level orchestrator
- **CompilerHost**: Filesystem abstraction (all inputs accessed through this)
- **ts.LanguageService**: IDE integration
- **Incremental compilation**: .tsbuildinfo persistence
- **Project references**: Multi-project builds

---

## Part 2 — One Front-End, Not Two (Unchanged)

[Content from v3 Part 2 remains identical]

KindScript uses TypeScript's parser for all .ts files (definitions, instances, target codebase). No separate front-end. Filesystem accessed through KindScriptHost during checking, not parsing.

---

## Part 2.5 — Zero-Config Enforcement via Project References (NEW)

### The Adoption Problem

Traditional architectural tools require upfront investment:
1. Learn the tool's definition language
2. Model your existing architecture
3. Configure rules
4. Only then get value

This creates a barrier. Many teams give up at step 2.

### Project References as Phase 0.5

For codebases where architectural boundaries align with directories (the common case for Clean Architecture, Hexagonal, modular monoliths), TypeScript's project references can enforce dependency rules natively—with **no kind definitions required**.

```
src/
  ordering/
    domain/
      tsconfig.json         ← references: []
      src/order.ts
    infrastructure/
      tsconfig.json         ← references: [{ path: "../domain" }]
      src/database.ts
```

If `domain/src/order.ts` tries to import from `infrastructure/src/database.ts`, TypeScript itself reports an error. No KindScript enforcement needed.

### ksc init --detect

```bash
$ ksc init --detect
Analyzing directory structure...
  src/ordering/domain/       → no dependencies detected
  src/ordering/application/  → imports from domain
  src/ordering/infrastructure/ → imports from domain

Pattern detected: Clean Architecture (3-layer)

Generate tsconfig.json files? (Y/n) y

Generated:
  src/ordering/domain/tsconfig.json
  src/ordering/application/tsconfig.json
  src/ordering/infrastructure/tsconfig.json

TypeScript will now enforce these dependency boundaries.
Run 'tsc --build' to verify.

Next steps:
  • Run 'tsc --build' to verify boundaries
  • Review generated tsconfigs (may need adjustment)
  • When ready for finer control, run 'ksc init' for full kind definitions
```

### The Three-Tier Adoption Path

```
Tier 0: No architectural enforcement
  Developer uses standard TypeScript, no boundaries

Tier 0.5: Zero-config boundaries via project references
  Run 'ksc init --detect'
  Get immediate enforcement with no definition authoring
  ✓ Works for directory-based boundaries
  ✓ Native TypeScript errors
  ✗ No fine-grained rules
  ✗ No contracts beyond dependencies

Tier 1: Config-based contracts (kindscript.json)
  Write simple config:
    { "contracts": { "noDependency": [["domain", "infra"]] } }
  ✓ Finer control than project references
  ✗ Still limited to built-in contract types

Tier 2+: Full kind definitions
  Type-safe architectural models
  Custom contracts
  Inference and generation
  Full KindScript experience
```

### When Project References Don't Apply

Project references are **supplementary**, not foundational, because they don't handle:

1. **Fine-grained rules**
   ```typescript
   // "This specific file can't import that module"
   // Project references are directory-level only
   ```

2. **Non-directory boundaries**
   ```typescript
   // location: "src/**/*.domain.ts"  (glob pattern)
   // location: "@myorg/domain-*"     (package pattern)
   ```

3. **Contracts beyond dependencies**
   ```typescript
   // purity: ["domain"]                    (no side effects)
   // mustImplement: [["ports", "adapters"]] (completeness)
   // colocated: ["feature", "test"]        (co-location)
   ```

4. **Projects that can't restructure**
   - Already have a different tsconfig topology
   - Build tools don't support `tsc --build` well
   - Can't adopt `composite: true` (requires declaration emit)

For these cases, KindScript's custom contracts remain necessary.

### The Real Costs (Not Zero-Config)

**"Zero-config" is misleading.** `ksc init --detect` generates configuration that may conflict with existing setup:

**Cost 1: Destructive tsconfig generation**
- If project has a root `tsconfig.json`, generating per-directory tsconfigs changes build topology
- May break existing build scripts, CI pipelines, editor configurations
- Not reversible without git revert

**Cost 2: Declaration emit requirement**
- Project references require `composite: true`
- `composite: true` requires `declaration: true`
- Projects not currently emitting .d.ts files will start doing so
- Declaration emit adds build time (10-30% slower)
- Changes build output (new .d.ts files appear)

**Cost 3: Build tool compatibility**
- Requires `tsc --build` (not all build tools support this well)
- Webpack's ts-loader has limited project reference support
- Vite's vite-plugin-checker needs additional config
- Some CI systems cache `.tsbuildinfo` incorrectly

**Cost 4: Ecosystem split**
- **Moon**: Embraces project references as primary mechanism
- **Nx**: Supports them but uses ESLint rules as primary enforcement
- **Turborepo**: Explicitly advises against (says they add "another point of configuration as well as another caching layer")
- **Bazel**: Incompatible build model

### Verdict

**ADOPT as opt-in Phase 0.5, not as foundation.**

Project references are a valuable **quick-start path** for the right projects:
- Directory-aligned boundaries
- Willing to restructure tsconfigs
- Build tooling supports `tsc --build`
- Don't need fine-grained rules

But KindScript's architecture must not depend on them. They're a convenience layer, not load-bearing.

**In the architecture:**
- Phase 0.5: `ksc init --detect` command (optional quick start)
- All subsequent phases work whether or not project references are present
- Custom contracts remain the primary mechanism

**In documentation:**
- Be honest about costs (not "zero-config")
- Emphasize opt-in nature
- Provide migration path from project refs → full kind definitions

---

## Part 3 — The Structural Mapping (Updated)

### Side-by-side pipeline comparison

```
TypeScript Pipeline                KindScript Pipeline
─────────────────────              ─────────────────────────

.ts files                          .ts files (definitions +
     │                              instances + codebase)
     │                                   │
┌────▼─────┐                        ┌────▼─────┐
│ Scanner  │                        │ Scanner  │  ← same (TS's own)
└────┬─────┘                        └────┬─────┘
     │                                   │
┌────▼─────┐                        ┌────▼─────┐
│ Parser   │                        │ Parser   │  ← same (TS's own)
└────┬─────┘                        └────┬─────┘
     │                                   │
  ts.Node AST                         ts.Node AST  ← same format
     │                                   │
┌────▼─────┐                        ┌────▼─────┐
│TS Binder │                        │KS Binder │  ← NEW (classifies
└────┬─────┘                        └────┬─────┘     architectural
     │                                   │            entities)
 ts.Symbol                          ArchSymbol
     │                                   │
┌────▼─────┐                        ┌────▼─────┐
│TS Checker│                        │KS Checker│  ← NEW (evaluates
└────┬─────┘                        └────┬─────┘     contracts via
     │                                   │            host queries)
ts.Diagnostic                      ts.Diagnostic  ← same format!
     │                                   │
┌────▼─────┐
│ Emitter  │
└────┬─────┘
     │
 .js  .d.ts


Shared: ▓▓▓▓▓▓▓▓ (scanner, parser, AST, diagnostic format)
New:    ░░░░░░░░ (binder, checker)
Host:   queried lazily by the CHECKER (not the binder)
```

### Component mapping table (Updated)

```
TypeScript                          KindScript
──────────────────────────────────  ──────────────────────────────────
Source text (.ts files)             Same .ts files — definitions,
                                    instances, contracts, and target
                                    codebase are all TypeScript

Scanner (text → tokens)             TypeScript's own scanner

Parser (tokens → AST)               TypeScript's own parser

AST Node (ts.Node)                  Same ts.Node — KindScript reads
                                    the TypeScript AST directly

CompilerHost                        KindScriptHost (extends CompilerHost
  (filesystem abstraction)            with architectural queries:
                                      directory-to-directory dependencies,
                                      which compose TS primitives)

Binder (AST → Symbols)              KS Binder (walks TS AST, classifies
                                    nodes as kind defs / instances /
                                    contracts, creates ArchSymbols —
                                    does NOT resolve against host)

Symbol (ts.Symbol)                  ArchSymbol (named architectural
                                    entity — kind, instance, layer)

Checker (Symbols + Types            KS Checker (ArchSymbols →
         → Diagnostics)              lazy host queries →
                                     Diagnostics)

Type (ts.Type)                      ResolvedKind (fully expanded kind
                                    with inherited contracts)

isTypeAssignableTo(A, B)            doesInstanceSatisfyKind(I, K)

Diagnostic (ts.Diagnostic)          ts.Diagnostic (SAME — no custom type)
                                    Uses code range 70000-79999
                                    Uses relatedInformation for contract refs

Emitter (AST → .js/.d.ts)          N/A (KindScript does not emit code)

Inference (implicit types           Inference (codebase → inferred
  from expressions)                   kind definitions) — separate component

Program (ts.Program)                ks.Program (wraps ts.Program,
                                    adds architectural checking)

LanguageService                     TypeScript Language Service Plugin
                                    (extends via plugin API, not wrapper)

LSP Server                          N/A (plugin runs inside tsserver)

CompilerOptions                     KindScriptConfig (which contracts
                                    to enforce, strictness, host config)

lib.d.ts                            @kindscript/clean-architecture
  (describes runtime environment)     @kindscript/hexagonal
                                      @kindscript/onion
                                      (npm packages with .d.ts + .js)

.tsbuildinfo                        .ksbuildinfo (cached host query
  (TS type data, file hashes)         results for architectural facts:
                                      directory listings, symbol resolutions,
                                      contract results)
```

**Key simplifications from v3:**
- **No custom ArchDiagnostic type** — use ts.Diagnostic directly
- **Plugin, not LSP server** — runs inside tsserver
- **Standard library as npm packages** — not bundled with KindScript

---

## Part 4 — What KindScript Adds Beyond TypeScript

### 4.1 The KindScript Binder (Classifier)

**Decision: BUILD** — genuinely new logic

TypeScript's binder creates `ts.Symbol` objects. KindScript's binder creates `ArchSymbol` objects by classifying architectural entities.

```typescript
interface ArchSymbol {
  readonly name: string;
  readonly symbolKind: ArchSymbolKind;  // Kind | Instance | Layer | Port
  readonly tsSymbol: ts.Symbol;         // link to TS symbol
  readonly declarations: ts.Node[];     // AST nodes
  readonly members?: ArchSymbolTable;   // child symbols
  readonly declaredLocation?: string;   // raw string, NOT validated
  readonly declaredContracts?: ContractDescriptor[];  // raw descriptors
  readonly parent?: ArchSymbol;
}
```

**The binder's three responsibilities:**

1. Walk the AST looking for types extending `Kind<N>` → create `ArchSymbol` with `symbolKind: Kind`
2. Walk the AST looking for variable declarations typed as kind types → create `ArchSymbol` with `symbolKind: Instance`
3. Walk the AST looking for `defineContracts(...)` calls → attach contract descriptors to kind symbols

**Critically:** The binder does NOT query the host. It does NOT validate locations. It classifies and records.

**Ecosystem precedent:** Angular Language Service does this for decorators (`@Component`, `@Injectable`). It walks the TS AST, pattern-matches on decorator syntax, creates Angular-specific semantic entities. KindScript's binder is the same pattern applied to architectural entities.

**Implementation approach:** Raw TypeScript compiler API with clean helper functions. No ts-morph.

Why not ts-morph?
- The classifier is ~100-150 lines of straightforward AST walking
- Performance matters (runs on every change in plugin context)
- Avoiding the dependency keeps core lightweight
- ts-morph's ergonomic advantage doesn't justify ~500KB dependency + version coupling

**Helper function example:**
```typescript
// core/classify.ts
function findTypeAliasesExtending(
  sourceFile: ts.SourceFile,
  baseTypeName: string,
  checker: ts.TypeChecker
): ts.TypeAliasDeclaration[] {
  const results: ts.TypeAliasDeclaration[] = [];

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node)) {
      const type = checker.getTypeAtLocation(node);
      const baseTypes = type.getBaseTypes?.() ?? [];

      for (const base of baseTypes) {
        const symbol = base.getSymbol();
        if (symbol?.getName() === baseTypeName) {
          results.push(node);
          break;
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}
```

With helpers like this, the full classifier remains compact and fast.

### 4.2 Symbol-to-Files Resolution

**Decision: BUILD** — genuinely new, architectural-level correlation

This is the core mapping problem: given an `ArchSymbol` with `declaredLocation: "src/ordering/domain"`, which files belong to it?

This is **not** just querying ts.Program. It combines:
1. Filesystem structure (directory traversal)
2. TypeScript's file graph (which files are in the program)
3. Architectural semantics (nested boundaries, exclusions)

```typescript
interface ResolvedFile {
  readonly path: string;
  readonly sourceFile: ts.SourceFile;
}

// Built on TS primitives but genuinely new logic
function resolveFilesForSymbol(
  symbol: ArchSymbol,
  host: KindScriptHost
): ResolvedFile[] {
  const location = symbol.declaredLocation;
  if (!location) return [];

  // Use ts.sys.readDirectory (TS primitive)
  const entries = host.getDirectoryEntries(location, true);

  // Filter to .ts files (TS concept)
  const tsFiles = entries.filter(e => e.endsWith('.ts'));

  // Get SourceFiles from program (TS data)
  const sourceFiles = tsFiles
    .map(path => host.getSourceFile(path))
    .filter((sf): sf is ts.SourceFile => sf !== undefined);

  // Subtract files claimed by child symbols (architectural concept)
  const childFiles = new Set(
    symbol.members?.values()
      .flatMap(child => resolveFilesForSymbol(child, host))
      .map(rf => rf.path)
    ?? []
  );

  return sourceFiles
    .filter(sf => !childFiles.has(sf.fileName))
    .map(sf => ({ path: sf.fileName, sourceFile: sf }));
}
```

**Pluggable strategies:** Not needed initially. Start with simple recursive directory resolution. Add strategies (glob-based, package-based) only if users need them.

**Caching:** Results are memoized by the checker, invalidated on structural changes (new/deleted files).

### 4.3 The KindScript Checker (Contract Evaluation)

**Decision: BUILD** — genuinely new logic

TypeScript's checker validates values conform to types. KindScript's checker validates codebases conform to architectural contracts.

```typescript
interface KSChecker {
  checkProgram(): readonly ts.Diagnostic[];
  getResolvedKind(symbol: ArchSymbol): ResolvedKind;
  doesInstanceSatisfy(instance: ArchSymbol, kind: ArchSymbol): boolean;
}
```

**Contract evaluation flow:**

```
checkProgram()
     │
     ├──→ for each Instance symbol:
     │       │
     │       ├──→ resolve its Kind symbol
     │       │     └──→ get the Kind's ContractDescriptors
     │       │
     │       └──→ for each ContractDescriptor:
     │               │
     │               ├──→ resolve contract args to ArchSymbols
     │               │     "domain" → ArchSymbol for domain member
     │               │
     │               ├──→ resolve symbols to files
     │               │     (symbol-to-files resolution)
     │               │     THIS IS WHERE THE HOST IS QUERIED
     │               │
     │               └──→ evaluate contract against resolved files
     │                     noDependency → check import edges
     │                     mustImplement → check completeness
     │                     purity → check imports for side effects
     │                     │
     │                     └──→ ts.Diagnostic[] (violations)
     │
     └──→ collect all diagnostics
```

**Key patterns borrowed from TypeScript:**

1. **Lazy evaluation** — Resolve and check on demand, cache results
2. **Diagnostic accumulation** — Never throw on errors, record and continue
3. **Related information** — Point to both violation and contract definition
4. **Stable codes** — Every diagnostic gets a numeric code (70001, 70002, etc.)

**Example diagnostic:**
```typescript
const diagnostic: ts.Diagnostic = {
  file: sourceFile,
  start: importNode.getStart(),
  length: importNode.getWidth(),
  messageText: "Forbidden dependency: domain → infrastructure",
  category: ts.DiagnosticCategory.Error,
  code: 70001,  // KindScript range: 70000-79999
  relatedInformation: [{
    file: contractSourceFile,
    start: contractNode.getStart(),
    length: contractNode.getWidth(),
    messageText: "Contract 'noDependency' defined here",
    category: ts.DiagnosticCategory.Message,
    code: 70001,
  }],
};
```

**Ecosystem precedent:** dependency-cruiser has a similar contract evaluation engine (forbidden/allowed dependency rules over import graph). The pattern is proven. KindScript's novel contribution is tying contracts to typed kind definitions.

### 4.4 The KindScriptHost (Architectural Queries)

**Decision: WRAP** — extends ts.CompilerHost with architectural-level queries

```typescript
interface KindScriptHost extends ts.CompilerHost {
  // Filesystem structure
  directoryExists(path: string): boolean;
  getDirectoryEntries(path: string, recursive?: boolean): string[];

  // Import graph (delegates to ts.Program under the hood)
  getImportsForFile(path: string): ImportEdge[];

  // Architectural-level query (genuinely novel)
  // Combines import graph + symbol-to-files resolution
  getDependencyEdges(fromDir: string, toDir: string): DependencyEdge[];

  // Package metadata
  getPackageJson(path: string): PackageJson | undefined;
}
```

**Why extend ts.CompilerHost?**

Because KindScript needs a ts.Program (to read the AST). By extending CompilerHost, the same host serves both TypeScript's needs (file reading, module resolution) and KindScript's needs (directory structure, architectural queries). One abstraction, one seam for testing.

**What's genuinely novel vs what delegates to TS:**

```
directoryExists()        → ts.sys.directoryExists (TS primitive)
getDirectoryEntries()    → ts.sys.readDirectory (TS primitive)
getImportsForFile()      → Helper over ts.Program.getTypeChecker() (TS data)
getDependencyEdges()     → Combines import graph + symbol resolution (NOVEL)
getPackageJson()         → ts.readConfigFile (TS utility)
```

**The key insight from Opportunity 2 feedback:**

`getDependencyEdges(fromDir, toDir)` is genuinely novel because it's an **architectural-level query that composes TS primitives**:

```typescript
getDependencyEdges(fromDir: string, toDir: string): DependencyEdge[] {
  // 1. Resolve which files belong to fromDir (symbol-to-files, architectural)
  const fromFiles = this.resolveFiles(fromDir);

  // 2. Resolve which files belong to toDir (symbol-to-files, architectural)
  const toFiles = this.resolveFiles(toDir);

  // 3. Get imports for each from-file (TS primitive)
  const allImports = fromFiles.flatMap(f => this.getImportsForFile(f));

  // 4. Filter to imports targeting to-files (set intersection)
  return allImports.filter(imp => toFiles.includes(imp.target));
}
```

This can't be expressed as a single ts.Program query. It's an architectural abstraction.

**Host implementations:**

```
defaultHost
  Real filesystem via ts.sys
  Real TS program via ts.createProgram

cachedHost (wraps defaultHost)
  Memoizes directory listings
  Memoizes import graph edges
  Memoizes symbol resolutions
  Persists to .ksbuildinfo

testHost
  In-memory file system
  Predetermined import edges
  No actual filesystem needed
```

The interface is identical. Caching is transparent to the checker.

### 4.5 Inference (Code → Spec)

**Decision: BUILD** — genuinely new

Walk filesystem, analyze import graph, propose kind definitions:

```
ksc infer --root src/contexts/ordering
     │
     ├──→ Walk filesystem structure
     │     domain/ ← recognized
     │     application/ ← recognized
     │     infrastructure/ ← recognized
     │
     ├──→ Analyze import graph
     │     domain → nothing (0 outgoing edges)
     │     application → domain (12 edges)
     │     infrastructure → domain (3 edges)
     │
     ├──→ Pattern match: Clean Architecture
     │
     └──→ Generate draft architecture.ts
```

**No ecosystem equivalent.** Tools like Knip detect unused exports. dependency-cruiser validates given rules. None infer architectural pattern definitions from structure. This is genuinely novel.

### 4.6 The Program

TypeScript's `ts.Program` orchestrates compilation. KindScript's program wraps it:

```typescript
function createProgram(config: KindScriptConfig): KSProgram {
  const host = createKindScriptHost(config);
  const tsProgram = ts.createProgram(config.rootFiles, config.compilerOptions, host);
  const binder = createBinder(tsProgram, host);
  const checker = createChecker(binder, host);

  return {
    getTsProgram: () => tsProgram,
    getChecker: () => checker,
    getArchSymbols: () => binder.getSymbols(),

    getDiagnostics: () => deduplicateRelated([
      ...ts.getPreEmitDiagnostics(tsProgram),  // structural (from TS)
      ...checker.getDiagnostics(),              // behavioral (from KS)
    ]),
  };
}
```

**Diagnostic deduplication:** Merge TS structural diagnostics with KS behavioral diagnostics using `relatedInformation` to avoid duplicate reports for the same underlying issue.

---

## Part 5 — Language Service Integration (Plugin Architecture)

**Decision: WRAP** — TypeScript Language Service Plugin API

### Why Plugin, Not Custom LSP?

**Ecosystem evidence:**

| Project | Plugin or LSP? | File types |
|---|---|---|
| Angular Language Service | Plugin | .ts files only |
| typescript-styled-plugin | Plugin | .ts files with tagged templates |
| ts-graphql-plugin | Plugin | .ts files with tagged templates |
| Vue Language Tools | Both | .vue files (LSP) + .ts files (plugin) |
| Svelte Language Tools | Both | .svelte files (LSP) + .ts files (plugin) |

**Pattern:** Projects operating on `.ts` files only use the plugin API exclusively. Projects with custom file formats (`.vue`, `.svelte`) require a full LSP.

**KindScript operates entirely on `.ts` files.** Plugin API is sufficient.

### Plugin Implementation

```typescript
// plugin/index.ts
import type * as ts from 'typescript/lib/tsserverlibrary';

const init: ts.server.PluginModuleFactory = ({ typescript }) => {
  return {
    create(info: ts.server.PluginCreateInfo) {
      const proxy = Object.create(null) as ts.LanguageService;
      const oldService = info.languageService;

      // Proxy all methods
      for (const k of Object.keys(oldService)) {
        (proxy as any)[k] = (oldService as any)[k];
      }

      // Intercept getSemanticDiagnostics
      proxy.getSemanticDiagnostics = (fileName: string) => {
        const tsDiags = oldService.getSemanticDiagnostics(fileName);
        const ksDiags = getArchitecturalDiagnostics(fileName, info);
        return [...tsDiags, ...ksDiags];
      };

      // Intercept getCodeFixesAtPosition
      proxy.getCodeFixesAtPosition = (fileName, start, end, codes, fmt, prefs) => {
        const tsFixes = oldService.getCodeFixesAtPosition(
          fileName, start, end, codes, fmt, prefs
        );
        const ksFixes = getArchitecturalFixes(fileName, start, end, codes, info);
        return [...tsFixes, ...ksFixes];
      };

      return proxy;
    }
  };
};

export = init;
```

**Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "plugins": [
      { "name": "kindscript" }
    ]
  }
}
```

### What Users Get

**In the editor:**
- Architectural violations appear inline with type errors
- Squiggly underlines on violating imports
- Hover over violation → see contract that's violated
- Quick fixes: "Move to correct layer", "Add import exception"
- Code lens: "✓ 5 contracts passing" or "✗ 2 violations"

**Zero editor-specific integration work.** Every editor using tsserver (VS Code, Sublime, Vim, Emacs, WebStorm) gets this immediately.

### The CLI Path

**Critical limitation:** Plugin diagnostics appear in the editor but **NOT** in `tsc` CLI output.

This means KindScript needs a separate CLI for CI:

```bash
# In CI
$ ksc check
src/ordering/domain/service.ts:12:1 - error KS70001: Forbidden dependency: domain → infrastructure

  12 import { Db } from '../../infrastructure/database';
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Contract 'noDependency' defined in architecture.ts:42:3

Found 1 architectural violation.
```

**Every plugin-based project does this:**
- Angular has `ng build` CLI
- GraphQL has codegen CLI
- styled-components has `styled-components-cli`

The plugin and CLI **share contract evaluation logic** but have separate entry points.

---

## Part 6 — Watch Mode and Incremental Compilation

### Watch Mode Architecture

**Key insight from feedback:** If KindScript runs as a TS plugin inside tsserver, **tsserver already notifies it of source file changes**. The plugin doesn't need its own source file watcher.

KindScript only needs a **supplementary watcher for structural changes** (new/deleted files that TypeScript doesn't track as part of the program).

```
┌─────────────────────────────────────────────────────────────┐
│  tsserver (hosts the plugin)                                 │
│  ────────────────────────────                                 │
│  Watches: all .ts files in the program                       │
│  On change: re-parses, re-binds, re-checks (TS types)        │
│  Notifies: plugin via language service update                │
│                                                               │
│  Plugin receives notification automatically                  │
│    → re-runs affected contracts                              │
│    → returns updated diagnostics                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  KS Structural Watcher (supplementary)                       │
│  ──────────────────────────────                              │
│  Watches: directory structure (fs.watch on root dirs)        │
│  Detects: new/deleted files not yet in TS program            │
│  On change:                                                   │
│    → invalidate directory listings in .ksbuildinfo           │
│    → invalidate symbol-to-files resolutions                  │
│    → trigger contract re-evaluation                          │
│    → notify plugin to refresh diagnostics                    │
└─────────────────────────────────────────────────────────────┘
```

**Example scenario:**

```
Developer creates src/ordering/domain/new-entity.ts
  ↓
TS Program doesn't know about it yet (not imported)
  ↓
KS Structural Watcher detects new file
  ↓
Invalidates directory listing for src/ordering/domain/
  ↓
Re-resolves files for domain symbol
  ↓
Re-evaluates completeness contracts
  ↓
Plugin shows updated diagnostics
```

### Incremental Build with .ksbuildinfo

**TypeScript's `.tsbuildinfo` handles:**
- Source file hashes
- TS type information
- TS dependency graph
- Which TS diagnostics are still valid

**KindScript's `.ksbuildinfo` handles:**
- Cached directory listings (for detecting structural changes)
- Cached import graph edges
- Cached symbol-to-files resolutions
- Previously computed contract results
- Invalidation metadata

**These are separate concerns.** TS tracks source code, KS tracks architectural facts.

```typescript
// .ksbuildinfo format
interface KindScriptBuildInfo {
  version: string;

  // Directory structure cache
  directoryListings: Record<string, {
    files: string[];
    hash: string;  // hash of file list for change detection
  }>;

  // Import graph cache
  importEdges: Record<string, ImportEdge[]>;

  // Symbol resolution cache
  symbolResolutions: Record<string, {
    symbolName: string;
    files: string[];
    lastUpdated: number;
  }>;

  // Contract evaluation cache
  contractResults: Record<string, {
    contractId: string;
    diagnostics: ts.Diagnostic[];
    dependencies: string[];  // which files this result depends on
  }>;
}
```

### Three-Trigger Invalidation

From v3, validated as correct:

```
Trigger (a): File content changed
  → TS detects via .tsbuildinfo
  → Plugin receives notification
  → Invalidate cached import edges for that file
  → Re-run contracts depending on those edges

Trigger (b): File created/deleted (structural change)
  → KS watcher detects
  → Invalidate directory listings in .ksbuildinfo
  → Re-resolve symbol-to-files mappings
  → Re-run ALL contracts involving affected symbols

Trigger (c): Definition file changed
  → TS detects via .tsbuildinfo
  → Plugin receives notification
  → Re-bind (classify) architecture definitions
  → Diff symbols (what changed?)
  → Re-check all affected contracts
```

---

## Part 7 — Standard Library Distribution

**Decision: BUILD content, WRAP distribution (npm + .d.ts)**

### The Ecosystem Model

**Precedent:**

| Project | Distribution | Content |
|---|---|---|
| DefinitelyTyped | npm (@types/*) | Type definitions (.d.ts) |
| type-fest | npm | Utility types (.d.ts) |
| Zod | npm | Schema types (.d.ts) + validation (.js) |
| TypeBox | npm | JSON Schema types (.d.ts) + runtime (.js) |

**KindScript patterns follow the Zod/TypeBox model:** Type definitions (.d.ts) + runtime contracts (.js).

### Package Structure

```
@kindscript/clean-architecture/
  package.json
  index.d.ts        ← Kind type definitions
  index.js          ← Contract runtime values
  lib/
    domain.d.ts
    domain.js
    application.d.ts
    application.js
    infrastructure.d.ts
    infrastructure.js
```

**index.d.ts:**
```typescript
/** A bounded context following Clean Architecture principles. */
export interface CleanContext extends Kind<"CleanContext"> {
  /** Pure business logic — no external dependencies. */
  readonly domain: DomainLayer;
  /** Use cases orchestrating domain objects. */
  readonly application: ApplicationLayer;
  /** Adapters connecting to external systems. */
  readonly infrastructure: InfrastructureLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {
  readonly entities: string;
  readonly valueObjects?: string;
  readonly ports: string;
}

// ... more definitions
```

**index.js:**
```javascript
import { defineContracts } from 'kindscript';

export const cleanContextContracts = defineContracts({
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
  ],
  purity: ["domain"],
  mustImplement: [["domain.ports", "infrastructure.adapters"]],
});
```

### User Consumption

**Installation:**
```bash
npm install @kindscript/clean-architecture
```

**In architecture.ts:**
```typescript
import { CleanContext, cleanContextContracts } from '@kindscript/clean-architecture';

export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/contexts/ordering",
  domain: {
    kind: "DomainLayer",
    location: "src/contexts/ordering/domain",
    entities: "entities",
    ports: "ports",
  },
  application: { /* ... */ },
  infrastructure: { /* ... */ },
};

// Contracts are automatically applied (imported by KS checker)
```

**What users get:**
- TypeScript sees the types → structural checking (free)
- KindScript sees the contracts → behavioral checking (KS checker)
- Hover docs (TSDoc in .d.ts) → visible in IDE (free)
- Autocomplete on fields → from TS language service (free)
- Go-to-definition → jumps to pattern definition (free)

### Versioning and Community

**Core patterns (official):**
```
@kindscript/clean-architecture
@kindscript/hexagonal
@kindscript/onion
@kindscript/modular-monolith
```

These live in the KindScript monorepo, published as separate packages.

**Community patterns:**
```
@myorg/event-sourced-architecture
@community/ddd-tactical-patterns
@enterprise/microservices-patterns
```

Anyone can publish. Discovery via npm search. Standard npm versioning.

**Pattern dependencies:**
```json
// @kindscript/hexagonal/package.json
{
  "dependencies": {
    "@kindscript/clean-architecture": "^2.0.0"
  }
}
```

If hexagonal builds on clean architecture, npm handles transitive dependencies.

---

## Part 8 — Module Structure (Revised)

```
packages/kindscript/src/
  core/
    types.ts              # ArchSymbol, Contract (simplified - no ArchDiagnostic)
    classify.ts           # AST classification (raw TS API)
    resolve.ts            # Symbol-to-files resolution
    contracts/
      noDependency.ts     # Import edge checking
      mustImplement.ts    # Port-adapter completeness
      noCycles.ts         # Cycle detection
      purity.ts           # Side-effect checking
      colocated.ts        # Co-location checking

  host/
    host.ts               # KindScriptHost interface
    defaultHost.ts        # Real filesystem + TS program
    cachedHost.ts         # Memoization + .ksbuildinfo
    testHost.ts           # In-memory for testing

  plugin/
    index.ts              # TS language service plugin entry
    diagnostics.ts        # Fast contract checks → ts.Diagnostic[]
    codeFixes.ts          # Quick fixes (code actions)
    hover.ts              # Extended hover info

  cli/
    cli.ts                # ksc check, ksc infer
    init.ts               # Project reference generation (Phase 0.5)
    watch.ts              # Structural watcher (supplements tsserver)

  infer/
    detect.ts             # Pattern detection from structure
    generate.ts           # Draft kind definitions

  program/
    program.ts            # ks.Program (wraps ts.Program)
    diagnostics.ts        # Deduplication logic

packages/clean-architecture/
  index.d.ts              # Kind definitions
  index.js                # Contract runtime values
  (published as @kindscript/clean-architecture)

packages/hexagonal/
  index.d.ts
  index.js
  (published as @kindscript/hexagonal)
```

**What's eliminated vs v3:**
- `compiler/types.ts` — shrinks significantly (no ArchDiagnostic, just ArchSymbol + Contract)
- `server/server.ts` — LSP server (plugin runs in tsserver)
- `services/service.ts` — Custom language service wrapper (plugin API instead)
- Monolithic standard library (separate npm packages)

**What's kept:**
- `host/` — Abstraction layer (but implementation delegates to TS primitives)
- `cachedHost.ts` — Necessary for architectural facts (.ksbuildinfo)
- Core contracts — These are genuinely new

**What's added:**
- `cli/init.ts` — Project reference generation (Phase 0.5)
- `plugin/` — Language service plugin implementation

---

## Part 9 — Build Order (Revised)

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 0          Phase 0.5        Phase 1          Phase 2      │
│                                                                   │
│  Prove contracts  Project refs     CLI + config     Classifier   │
│  ─────────────    ─────────────    ────────────     ──────────   │
│  noDependency()   ksc init         kindscript.json  classify.ts  │
│  + ts.Program     --detect         ksc check        ArchSymbol   │
│  → ts.Diagnostic  generate         watch mode       resolve.ts   │
│                   tsconfigs        (structural      (symbol to   │
│  Validates core   Immediate value  watcher)         files)       │
│  concept works    Zero definitions                  Full binder  │
│                                                                   │
│  ◄── 2 weeks ───►◄── 1 week ─────►◄── 2 weeks ───►◄── 3 weeks ►│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Phase 3          Phase 4          Phase 5                         │
│                                                                   │
│  Full checker     Inference        Plugin                         │
│  ─────────────    ────────────     ──────────                     │
│  All contracts    ksc infer        plugin/                         │
│  Lazy eval        Pattern detect   index.ts                       │
│  Caching          Draft kind defs  Fast checks                    │
│  .ksbuildinfo     Adoption accel   ts.Diagnostic                  │
│                                    Code actions                   │
│                                                                   │
│  ◄── 3 weeks ───►◄── 2 weeks ────►◄── 2 weeks ───────────────►│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Phase 7                                                         │
│                                                                   │
│  Standard library packages                                       │
│  ──────────────────────────                                      │
│  @kindscript/clean-architecture                                  │
│  @kindscript/hexagonal                                           │
│  @kindscript/onion                                               │
│  Community ecosystem                                             │
│                                                                   │
│  ◄── Ongoing ─────────────────────────────────────────────────►│
└─────────────────────────────────────────────────────────────────┘
```

### Phase 0: Prove Contracts Work (2 weeks)

Build one contract (`noDependency`) that works against ts.Program and produces ts.Diagnostic[].

```typescript
// Entire phase validates this pattern works
const program = ts.createProgram(rootFiles, compilerOptions);
const diagnostics = checkNoDependency(
  program,
  { from: "src/ordering/domain", to: "src/ordering/infrastructure" }
);
// → ts.Diagnostic[] pointing to violating imports
```

If this doesn't produce correct, useful results, nothing else matters.

### Phase 0.5: Project Reference Generation (1 week)

**NEW** — missed in v3.

Build `ksc init --detect`:
- Analyze directory structure
- Analyze import graph
- Detect patterns (clean, hexagonal, etc.)
- Generate tsconfig.json files with project references
- Provide instant value with no kind definitions

**Deliverable:** Users can run `ksc init --detect` and get immediate boundary enforcement via TypeScript.

**Caveat:** Document costs honestly (destructive, requires declaration emit, build tool compatibility).

### Phase 1: CLI + Config (2 weeks)

- `kindscript.json` for simple contract config
- `ksc check` CLI command
- Structural watcher (for new/deleted files)
- Diagnostic formatting
- Exit codes for CI

**Deliverable:** `ksc check` runs in CI and reports violations.

### Phase 2: Classifier + Symbol-to-Files Resolution (3 weeks)

**MERGED** — v3 had these as separate phases (Phase 2 and Phase 3).

Build:
- AST classifier (find Kind<N>, instances, contracts)
- ArchSymbol creation
- Symbol-to-files resolution (location → file set)

They're built together because you can't test the classifier without resolving locations.

**Deliverable:** Can parse kind definitions and resolve which files belong to each architectural unit.

### Phase 3: Full Checker (3 weeks)

Build all contracts:
- `noDependency` (already built in Phase 0)
- `mustImplement` (port-adapter completeness)
- `noCycles` (cycle detection)
- `purity` (side-effect checking)
- `colocated` (co-location rules)

Add:
- Lazy evaluation
- Caching (in-memory)
- .ksbuildinfo persistence

**Deliverable:** Full contract evaluation with incremental caching.

### Phase 4: Inference (2 weeks)

Build `ksc infer`:
- Walk filesystem structure
- Analyze import graph
- Pattern match (clean, hexagonal, etc.)
- Generate draft kind definitions

**Deliverable:** `ksc infer` produces draft architecture.ts from existing codebase.

### Phase 5: Plugin (2 weeks)

Build TS language service plugin:
- Intercept `getSemanticDiagnostics`
- Intercept `getCodeFixesAtPosition`
- Fast contract checks (sub-100ms per file)
- Code actions for violations

**Deliverable:** Plugin shows architectural violations in editor alongside type errors.

### Phase 6: Standard Library Packages (Ongoing)

Publish core patterns as npm packages:
- `@kindscript/clean-architecture`
- `@kindscript/hexagonal`
- `@kindscript/onion`
- `@kindscript/modular-monolith`

Each package: .d.ts (types) + .js (contracts).

**Deliverable:** Users can `npm install @kindscript/clean-architecture` and use it immediately.

---

## Part 10 — Summary: Build / Wrap / Skip

Based on ecosystem evidence from real production tools:

**BUILD (4 components — genuinely new):**
1. Classifier (AST → ArchSymbol) — Angular does similar for decorators
2. Symbol-to-files resolution — No equivalent in TS ecosystem
3. Contract evaluation — dependency-cruiser is adjacent, not equivalent
4. Inference engine — No equivalent (tools validate, don't infer patterns)

**WRAP (8 components — delegate to TS):**
1. Module resolution / import graph — Thin query over ts.Program
2. Diagnostic format — Use ts.Diagnostic directly (code range 70000-79999)
3. Language service — Plugin API (not custom LSP)
4. Watch mode — Hook tsserver notifications + add structural watcher
5. Incremental build — Use ts.Program + add .ksbuildinfo for architectural facts
6. Filesystem access — ts.sys + small extensions
7. Config parsing — ts.readConfigFile for base, custom for KS fields
8. Standard library distribution — npm + .d.ts (proven at scale)

**SKIP (4 components — TS handles natively):**
1. Scanner/parser — TypeScript's own
2. AST format — ts.Node directly
3. Structural type checking — TypeScript's checker
4. LSP server — Plugin runs in tsserver

**EVALUATE (2 components — optional/deferred):**
1. Project references — Opt-in Phase 0.5 (ecosystem split, real costs)
2. ts-morph — Not needed (classifier ~150 lines, raw API sufficient)

---

## Part 11 — Closing Statement

**KindScript is not a parallel compiler that mirrors TypeScript's architecture.**

**KindScript is a TypeScript plugin that understands architecture.**

The genuinely novel contributions are:
1. Classifying TypeScript types as architectural entities (Kind<N>)
2. Mapping architectural declarations to filesystem reality (symbol-to-files)
3. Evaluating behavioral contracts over the codebase structure
4. Inferring architectural patterns from existing code

Everything else delegates to TypeScript's existing infrastructure:
- Parsing → TypeScript
- Type checking → TypeScript
- Module resolution → TypeScript
- IDE integration → TypeScript's plugin API
- Diagnostic display → TypeScript's diagnostic format
- Incremental compilation → TypeScript's .tsbuildinfo + KS's .ksbuildinfo
- Standard library distribution → npm packages (like @types/*)

The architecture is lean because it only builds what's genuinely new. The integration is tight because it uses TypeScript's extension points correctly. The adoption path is smooth because it offers immediate value (project references) before requiring investment (kind definitions).

Build this way and you get a tool that feels like a natural extension of TypeScript, not a separate system that happens to work with TypeScript files.
