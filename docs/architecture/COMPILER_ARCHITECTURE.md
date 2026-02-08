# KindScript as a Compiler: Structural Parallels with TypeScript (v4)

## Preface

This document examines how KindScript should be built as a system that leverages TypeScript's existing infrastructure while adding genuinely novel capabilities for architectural enforcement.

### Evolution Across Versions

**v1** claimed KindScript had a "dual front-end" — wrong, an implementation choice disguised as structural necessity.

**v2** corrected to single front-end but underspecified critical details.

**v3** fixed major architectural issues (binder-checker split, three-trigger invalidation, contract trust, etc.) but still over-built components that TypeScript already provides.

**v4** incorporates ecosystem evidence from real production tools. Key changes:
- Language service plugin instead of custom LSP server
- No ts-morph dependency (raw API throughout)
- Simplified watch architecture acknowledging plugin context
- Standard library packages removed (users define patterns inline)
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
                                    instances, and target codebase
                                    are all TypeScript

Scanner (text → tokens)             TypeScript's own scanner

Parser (tokens → AST)               TypeScript's own parser

AST Node (ts.Node)                  Same ts.Node — KindScript reads
                                    the TypeScript AST directly

CompilerHost                        KindScriptHost (extends CompilerHost
  (filesystem abstraction)            with architectural queries:
                                      directory-to-directory dependencies,
                                      which compose TS primitives)

Binder (AST → Symbols)              KS Binder (walks TS AST, classifies
                                    nodes as kind defs / instances,
                                    extracts constraints from Kind type
                                    params, creates ArchSymbols —
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

Program (ts.Program)                ks.Program (wraps ts.Program,
                                    adds architectural checking)

LanguageService                     TypeScript Language Service Plugin
                                    (extends via plugin API, not wrapper)

LSP Server                          N/A (plugin runs inside tsserver)

CompilerOptions                     KindScriptConfig (which contracts
                                    to enforce, strictness, host config)

lib.d.ts                            N/A (standard library packages
  (describes runtime environment)     were removed — users define
                                      patterns inline via architecture.ts)

.tsbuildinfo                        .ksbuildinfo (cached host query
  (TS type data, file hashes)         results for architectural facts:
                                      directory listings, symbol resolutions,
                                      contract results)
```

**Key simplifications from v3:**
- **No custom ArchDiagnostic type** — use ts.Diagnostic directly
- **Plugin, not LSP server** — runs inside tsserver

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

**The binder's two responsibilities:**

1. Walk the AST looking for type aliases assigned to `Kind<N>` → create `ArchSymbol` with `symbolKind: Kind`, extract constraints from the 3rd type parameter
2. Walk the AST looking for variable declarations typed as kind types → create `ArchSymbol` with `symbolKind: Instance`

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
function findKindTypeAliases(
  sourceFile: ts.SourceFile,
  baseTypeName: string,
  checker: ts.TypeChecker
): ts.TypeAliasDeclaration[] {
  const results: ts.TypeAliasDeclaration[] = [];

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node) && node.type) {
      // Match: type X = Kind<"X"> or type X = Kind<"X", { ... }>
      if (ts.isTypeReferenceNode(node.type)) {
        const typeName = node.type.typeName;
        if (ts.isIdentifier(typeName) && typeName.text === baseTypeName) {
          results.push(node);
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

### 4.5 The Program

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

## Part 7 — Standard Library Distribution — REMOVED

> **Note (2026-02-07):** Standard library packages (`@kindscript/clean-architecture`, `@kindscript/hexagonal`, `@kindscript/onion`) were removed from the codebase. They added complexity for marginal value — users can define patterns inline in `architecture.ts`, which is the recommended approach. The original design vision is preserved below for historical context.

**Original Decision: BUILD content, WRAP distribution (npm + .d.ts)**

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
export type DomainLayer = Kind<"DomainLayer", {
  readonly entities: string;
  readonly valueObjects?: string;
  readonly ports: string;
}>;

// ... more leaf kind definitions

/** A bounded context following Clean Architecture principles. */
export type CleanContext = Kind<"CleanContext", {
  /** Pure business logic — no external dependencies. */
  readonly domain: DomainLayer;
  /** Use cases orchestrating domain objects. */
  readonly application: ApplicationLayer;
  /** Adapters connecting to external systems. */
  readonly infrastructure: InfrastructureLayer;
}>;

// ... more composite definitions
```

**Constraints as type-level declarations (on the Kind type itself):**
```typescript
// Constraints are declared as the 3rd type parameter on Kind — no runtime code needed
export type CleanContext = Kind<"CleanContext", {
  readonly domain: DomainLayer;
  readonly application: ApplicationLayer;
  readonly infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
  ];
  purity: ["domain"];
  mustImplement: [["domain.ports", "infrastructure.adapters"]];
}>;
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
      exists.ts           # Directory existence checking
      mirrors.ts          # Cross-directory file correspondence

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
    cli.ts                # ksc check
    watch.ts              # Structural watcher (supplements tsserver)

  program/
    program.ts            # ks.Program (wraps ts.Program)
    diagnostics.ts        # Deduplication logic

```

**What's eliminated vs v3:**
- `compiler/types.ts` — shrinks significantly (no ArchDiagnostic, just ArchSymbol + Contract)
- `server/server.ts` — LSP server (plugin runs in tsserver)
- `services/service.ts` — Custom language service wrapper (plugin API instead)
- Standard library packages (removed — users define patterns inline)

**What's kept:**
- `host/` — Abstraction layer (but implementation delegates to TS primitives)
- `cachedHost.ts` — Necessary for architectural facts (.ksbuildinfo)
- Core contracts — These are genuinely new

**What's added:**
- `plugin/` — Language service plugin implementation

---

## Part 9 — Build Order (Revised)

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 0          Phase 1          Phase 2                        │
│                                                                   │
│  Prove contracts  CLI + config     Classifier                    │
│  ─────────────    ────────────     ──────────                    │
│  noDependency()   kindscript.json  classify.ts                   │
│  + ts.Program     ksc check        ArchSymbol                    │
│  → ts.Diagnostic  watch mode       resolve.ts                    │
│                   (structural      (symbol to                    │
│  Validates core   watcher)         files)                        │
│  concept works                     Full binder                   │
│                                                                   │
│  ◄── 2 weeks ───►◄── 2 weeks ───►◄── 3 weeks ─────────────────►│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Phase 3          Phase 4                                         │
│                                                                   │
│  Full checker     Plugin                                         │
│  ─────────────    ──────────                                     │
│  All contracts    plugin/                                         │
│  Lazy eval        index.ts                                       │
│  Caching          Fast checks                                    │
│  .ksbuildinfo     ts.Diagnostic                                  │
│                   Code actions                                   │
│                                                                   │
│  ◄── 3 weeks ───►◄── 2 weeks ────────────────────────────────►│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Phase 5: Standard library packages — REMOVED                    │
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
- `filesystem.exists` (directory existence checking)
- `filesystem.mirrors` (cross-directory file correspondence)

Add:
- Lazy evaluation
- Caching (in-memory)
- .ksbuildinfo persistence

**Deliverable:** Full contract evaluation with incremental caching.

### Phase 4: Plugin (2 weeks)

Build TS language service plugin:
- Intercept `getSemanticDiagnostics`
- Intercept `getCodeFixesAtPosition`
- Fast contract checks (sub-100ms per file)
- Code actions for violations

**Deliverable:** Plugin shows architectural violations in editor alongside type errors.

### Phase 5: Standard Library Packages — REMOVED

Standard library packages were removed as premature optimization. Users define patterns inline in `architecture.ts`.

---

## Part 10 — Summary: Build / Wrap / Skip

Based on ecosystem evidence from real production tools:

**BUILD (3 components — genuinely new):**
1. Classifier (AST → ArchSymbol) — Angular does similar for decorators
2. Symbol-to-files resolution — No equivalent in TS ecosystem
3. Contract evaluation — dependency-cruiser is adjacent, not equivalent

**WRAP (7 components — delegate to TS):**
1. Module resolution / import graph — Thin query over ts.Program
2. Diagnostic format — Use ts.Diagnostic directly (code range 70000-79999)
3. Language service — Plugin API (not custom LSP)
4. Watch mode — Hook tsserver notifications + add structural watcher
5. Incremental build — Use ts.Program + add .ksbuildinfo for architectural facts
6. Filesystem access — ts.sys + small extensions
7. Config parsing — ts.readConfigFile for base, custom for KS fields

**SKIP (4 components — TS handles natively):**
1. Scanner/parser — TypeScript's own
2. AST format — ts.Node directly
3. Structural type checking — TypeScript's checker
4. LSP server — Plugin runs in tsserver

**EVALUATE (1 component — optional/deferred):**
1. ts-morph — Not needed (classifier ~150 lines, raw API sufficient)

---

## Part 11 — Closing Statement

**KindScript is not a parallel compiler that mirrors TypeScript's architecture.**

**KindScript is a TypeScript plugin that understands architecture.**

The genuinely novel contributions are:
1. Classifying TypeScript types as architectural entities (Kind<N>)
2. Mapping architectural declarations to filesystem reality (symbol-to-files)
3. Evaluating behavioral contracts over the codebase structure

Everything else delegates to TypeScript's existing infrastructure:
- Parsing → TypeScript
- Type checking → TypeScript
- Module resolution → TypeScript
- IDE integration → TypeScript's plugin API
- Diagnostic display → TypeScript's diagnostic format
- Incremental compilation → TypeScript's .tsbuildinfo + KS's .ksbuildinfo

The architecture is lean because it only builds what's genuinely new. The integration is tight because it uses TypeScript's extension points correctly. The adoption path is smooth because it offers config-based contracts before requiring full kind definitions.

Build this way and you get a tool that feels like a natural extension of TypeScript, not a separate system that happens to work with TypeScript files.
