# Review: Leveraging TypeScript Infrastructure for KindScript

## Context

This document evaluates the proposal "KindScript: Making TypeScript the Engine, Not the Analogy" against the v3 architecture document. The core question is: how many "KS mirrors TS" components can be eliminated by using TypeScript components directly?

The proposal identifies 6 major opportunities to simplify the architecture by delegating more to TypeScript. I evaluate each opportunity on:
- **Technical feasibility**: Can this actually work?
- **Trade-offs**: What do we gain and lose?
- **Alignment with v3**: Does this contradict or complement v3's architecture?
- **Verdict**: Agree, disagree, or conditional agreement

---

## Opportunity 1: Language Service Plugin Instead of Custom LSP

### The Proposal

Replace the custom LSP server (`server/server.ts`) and separate KS LanguageService with a TypeScript Language Service Plugin that intercepts and extends language service methods directly.

**Configuration:**
```json
{
  "compilerOptions": {
    "plugins": [{ "name": "kindscript" }]
  }
}
```

**Implementation pattern:**
```typescript
// plugin/index.ts
const init: ts.server.PluginModuleFactory = ({ typescript }) => {
  return {
    create(info: ts.server.PluginCreateInfo) {
      const proxy = Object.create(null) as ts.LanguageService;
      const oldService = info.languageService;

      // Proxy all methods
      for (const k of Object.keys(oldService)) {
        (proxy as any)[k] = (oldService as any)[k];
      }

      // Intercept the ones we care about
      proxy.getSemanticDiagnostics = (fileName: string) => {
        const tsDiags = oldService.getSemanticDiagnostics(fileName);
        const ksDiags = getArchitecturalDiagnostics(fileName, info);
        return [...tsDiags, ...ksDiags];
      };

      return proxy;
    }
  };
};
```

### What This Eliminates

From v3's proposed structure:
- `server/server.ts` - custom LSP server
- `services/service.ts` - extended language service API
- Editor-specific integration work
- The "two language services" merge complexity

### Evaluation

**✅ STRONGLY AGREE - This is the right approach**

#### Why This Works

1. **v3 already proposed extending TS language service.** From v3 Part 7:
   ```
   LanguageService                     Extends TS LanguageService with
                                       architectural diagnostics + fixes
   ```
   The plugin approach is simply the *correct* way to implement "extends TS LanguageService." v3 was right about the goal, this proposal is right about the mechanism.

2. **ArchDiagnostic → ts.Diagnostic is the right move.** The proposal correctly identifies that using `ts.Diagnostic` objects instead of custom `ArchDiagnostic` gives you:
   - Native flow through all TS diagnostic pipelines
   - Editor display working immediately
   - `relatedInformation` for contract references (v3 already identified this need)
   - No adapter layer needed

3. **The constraint is healthy, not limiting.** The proposal notes that plugins run in tsserver and slow contract checks block IDE responsiveness. This is **good** — it forces the design toward:
   - Sub-100ms per-file contracts (which architectural checks should be)
   - Lazy, incremental evaluation (which v3 already proposed)
   - Cached results (which v3 already proposed)

   These constraints prevent bad design (full-program re-analysis on every keystroke).

4. **Zero editor integration cost.** Every editor that supports tsserver gets KindScript support immediately. This is massive for adoption.

5. **Diagnostic codes 70000-79999 are sensible.** TypeScript reserves high ranges for third-party tools. Using this range plus `relatedInformation` for contract context is exactly right.

#### What v3 Got Right That This Preserves

- Merged diagnostic stream (structural + behavioral)
- Contract reference in diagnostics via `relatedInformation`
- Quick fixes as code actions
- Hover info extension

#### What This Changes From v3

Instead of:
```
IDE → Custom LSP Server → TS LanguageService + KS LanguageService → merged
```

We get:
```
IDE → tsserver → TS LanguageService with KS plugin → merged natively
```

This is **simpler and more correct**.

#### Trade-offs

**Gains:**
- Eliminates entire LSP server implementation
- Zero editor integration work
- Native diagnostic display
- Works everywhere tsserver works

**Costs:**
- Contracts must be fast (sub-100ms per file)
- Shares tsserver's process and event loop
- Plugin API version coupling (minor concern, API is stable)

**Mitigation:** The CLI path has no time constraints. Complex analysis that can't meet the 100ms budget belongs in `ksc check`, not the plugin. The plugin should do fast, local checks only.

#### Verdict

**✅ ADOPT - Change v3's Part 7 and build order Phase 7 accordingly.**

The architecture becomes:
```
packages/kindscript/src/
  plugin/
    index.ts              # TS language service plugin entry
    diagnostics.ts        # Fast contract checks → ts.Diagnostic[]
    codeFixes.ts          # Quick fixes
    hover.ts              # Extended hover info

  cli/
    cli.ts                # Full program analysis (no time constraints)
```

The plugin does fast, incremental checks. The CLI does complete, thorough analysis. This is the right separation.

---

## Opportunity 2: TS Module Resolution as the Import Graph

### The Proposal

Don't build `getImportsForFile()` as a custom host method. Instead, query `ts.Program` and `ts.TypeChecker` directly — TypeScript has already resolved every import when it created the program.

**Implementation:**
```typescript
function getImportEdges(program: ts.Program, sourceFile: ts.SourceFile): ImportEdge[] {
  const edges: ImportEdge[] = [];
  const checker = program.getTypeChecker();

  ts.forEachChild(sourceFile, function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const symbol = checker.getSymbolAtLocation(node.moduleSpecifier);
      if (symbol) {
        const decls = symbol.getDeclarations();
        if (decls?.length) {
          const resolvedFile = decls[0].getSourceFile();
          edges.push({
            node,
            importPath: node.moduleSpecifier.text,
            resolvedPath: resolvedFile.fileName,
            resolvedSourceFile: resolvedFile,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  });

  return edges;
}
```

### What This Claims to Eliminate

From v3's KindScriptHost:
```typescript
interface KindScriptHost extends ts.CompilerHost {
  // Import/dependency graph (may delegate to TS compiler API)
  getImportsForFile(path: string): ImportEdge[];
  getExportedSymbols(path: string): ExportedSymbol[];
  getDependencyEdges(fromDir: string, toDir: string): DependencyEdge[];
}
```

The proposal claims these aren't "custom host methods" — they're "helper functions over ts.Program and ts.TypeChecker."

### Evaluation

**🟡 PARTIALLY AGREE - Correct observation, but doesn't eliminate the host abstraction**

#### Why The Core Insight Is Right

1. **TypeScript HAS already resolved all imports.** When `ts.createProgram()` runs:
   - It follows every import declaration
   - Resolves module specifiers via `moduleResolution` strategy
   - Parses imported files
   - Builds the full file graph

   This is cached in the program. We don't need to rebuild it.

2. **Walking the AST to extract imports is straightforward.** The code example is essentially correct. You can get import edges by:
   - Walking the AST looking for ImportDeclarations
   - Using `checker.getSymbolAtLocation()` to resolve the import
   - Following the symbol to its declaration to get the target file

3. **This is a query over existing data, not a new extraction step.** The proposal is right that this isn't "custom fact extraction." It's reading TS's already-computed results.

#### Why This Doesn't Eliminate KindScriptHost

**Problem 1: Directory-to-directory dependencies**

v3's `getDependencyEdges(fromDir: string, toDir: string)` isn't just "get imports." It's:
```
Given architectural symbol A mapped to directory "src/domain/"
And architectural symbol B mapped to directory "src/infra/"
Return all import edges where:
  - source file is under src/domain/
  - target file is under src/infra/
```

This requires:
1. Resolving which files belong to which directories (symbol-to-files resolution)
2. Filtering imports by these file sets
3. Aggregating results

**This is NOT just querying ts.Program.** It's an architectural abstraction built ON TOP of ts.Program's import graph.

**Problem 2: The host is still the single seam**

Even if `getImportsForFile()` is implemented as:
```typescript
getImportsForFile(path: string): ImportEdge[] {
  const sourceFile = this.tsProgram.getSourceFile(path);
  return extractImportsFromSourceFile(sourceFile, this.tsProgram);
}
```

It's still valuable to have this as a host method because:
- **Testability**: `testHost` can return predetermined edges without needing actual files
- **Caching**: `cachedHost` can memoize results without the checker knowing
- **Abstraction**: The checker doesn't need to know about ts.Program's API

**Problem 3: v3 already knew this**

From v3's KindScriptHost interface:
```typescript
interface KindScriptHost extends ts.CompilerHost {
  // Import/dependency graph (may delegate to TS compiler API)
  getImportsForFile(path: string): ImportEdge[];
  //                ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                The comment explicitly says this delegates to TS!
}
```

v3 already assumed the implementation would use ts.Program. The interface exists for abstraction, not because we're rebuilding module resolution.

#### What To Keep From v3

Keep `KindScriptHost` as an interface with import graph methods, but:

1. **Clarify the implementation delegates to TS:**
   ```typescript
   // host/defaultHost.ts
   class DefaultKindScriptHost implements KindScriptHost {
     constructor(private tsProgram: ts.Program) {}

     getImportsForFile(path: string): ImportEdge[] {
       const sourceFile = this.tsProgram.getSourceFile(path);
       if (!sourceFile) return [];
       return extractImportsFromSourceFile(sourceFile, this.tsProgram);
     }

     getDependencyEdges(fromDir: string, toDir: string): DependencyEdge[] {
       // This DOES require custom logic:
       // 1. Get all files under fromDir and toDir
       // 2. Get imports for each file in fromDir
       // 3. Filter to targets in toDir
       // This is architectural correlation, not raw TS API
     }
   }
   ```

2. **Keep the abstraction for testing and caching:**
   - `testHost` returns predetermined edges (no ts.Program needed)
   - `cachedHost` memoizes results transparently
   - Checker code doesn't couple to ts.Program's API directly

#### Verdict

**🟡 REFINE v3 - Keep the host interface, clarify implementation uses TS, acknowledge it's not "custom extraction"**

Changes to v3:
- In Part 4.5, add a note: "Most host methods delegate to ts.Program and ts.TypeChecker. The abstraction exists for testability, caching, and to provide architectural-level queries (directory-to-directory dependencies) built on top of TS's file-level primitives."
- Make it clear that `getImportsForFile` is ~10 lines of AST walking, not a complex subsystem.

---

## Opportunity 3: Project References as Architectural Boundaries

### The Proposal

For the common case where architectural boundaries align with directories, use TypeScript's project references with `--composite` mode to enforce import boundaries. TypeScript itself reports errors when project A imports from project B without a reference.

**Directory structure:**
```
src/
  ordering/
    domain/
      tsconfig.json     ← references: [] (no dependencies)
      src/
        service.ts
    infrastructure/
      tsconfig.json     ← references: [{ path: "../domain" }]
      src/
        database.ts
```

If `domain/src/service.ts` tries to import from `infrastructure/src/database.ts`, TypeScript reports an error. No KindScript involvement.

**The ksc init command:**
```bash
$ ksc init --detect
Detected directory structure:
  src/ordering/domain/       → no external dependencies
  src/ordering/infrastructure/ → depends on domain

Generated tsconfig.json files.
TypeScript will now enforce these dependency boundaries natively.
Run `tsc --build` to verify.
```

### Proposed Phasing

- **Phase 0.5**: Project reference generation (TS does enforcement, KS generates config)
- **Phase 2+**: Kind definitions (full KindScript with custom contracts)

### Evaluation

**✅ STRONGLY AGREE - This is a brilliant adoption strategy**

#### Why This Is Right

1. **Addresses the cold start problem.** The biggest barrier to adopting architectural tools is "you must write extensive definitions before you get any value." Project references eliminate this:
   - Run `ksc init --detect` on existing codebase
   - Get immediate enforcement of detected boundaries
   - Zero definition authoring required

2. **Leverages TS's native enforcement.** Project references aren't a hack — they're a first-class TS feature for managing multi-project repos. Using them for architectural boundaries is elegant because:
   - Developers already understand project references
   - Build tools already support them
   - Error messages are native TS diagnostics
   - No runtime overhead (it's compile-time only)

3. **Provides a migration path.** The three-tier system is perfect:
   ```
   Tier 0: No KindScript
   Tier 0.5: ksc init --detect → project references (zero config)
   Tier 1: config-based contracts (kindscript.json)
   Tier 2+: Full kind definitions + custom contracts
   ```

   Users can start at 0.5 and gradually move up as needed.

4. **Correctly identifies the 80% case.** The proposal is right that Clean Architecture, Hexagonal, and most modular monolith patterns have architectural boundaries that map cleanly to directories. For these, project references handle the dependency rules automatically.

5. **KindScript becomes the fallback, not the foundation.** This inverts the value proposition:
   - Before: "KindScript enforces boundaries"
   - After: "TypeScript enforces boundaries; KindScript handles the cases TS can't"

   This is more honest and more powerful.

#### What v3 Missed

v3 mentioned project references once, in "Other Cross-Cutting Concerns":
```
- **Project references**: `--build` mode compiles multiple related projects in
  dependency order.
```

But it didn't explore using them as a **substitute** for KindScript's dependency enforcement in the common case. This is a significant oversight.

#### The 20% Case

Project references don't handle:
- Fine-grained rules ("this specific file can't import that module")
- Non-directory-based boundaries
- Contracts beyond dependencies (purity, completeness, co-location)
- Projects that can't/won't adopt separate tsconfigs

For these, KindScript's custom `noDependency` contracts remain necessary. But making them the fallback rather than the default is strategically smart.

#### Implementation Impact

**Add to v3:**

**New Part 2.5: Zero-Config Enforcement via Project References**

```
For codebases where architectural boundaries align with directories,
KindScript can generate TypeScript project references to enforce
dependency rules without requiring kind definitions.

┌─────────────────────────────────────────────────────────────┐
│  ksc init --detect                                           │
│       │                                                       │
│       ├──→ Analyze directory structure                       │
│       │     src/ordering/domain/                             │
│       │     src/ordering/application/                        │
│       │     src/ordering/infrastructure/                     │
│       │                                                       │
│       ├──→ Analyze import graph                              │
│       │     domain → nothing                                 │
│       │     application → domain                             │
│       │     infrastructure → domain                          │
│       │                                                       │
│       ├──→ Generate tsconfig.json for each                   │
│       │     domain: references: []                           │
│       │     application: references: ["../domain"]           │
│       │     infrastructure: references: ["../domain"]        │
│       │                                                       │
│       └──→ Report detected boundaries                        │
│             "TypeScript will now enforce these via           │
│              project references. Run 'tsc --build'."         │
└─────────────────────────────────────────────────────────────┘

When to use project references:
✓ Boundaries are directories
✓ Each boundary is willing to have its own tsconfig.json
✓ Standard dependency rules (no complex cases)

When to use KindScript contracts:
✗ Fine-grained file-level rules
✗ Non-directory boundaries (glob patterns, package-based)
✗ Additional contracts beyond dependencies (purity, completeness)
✗ Project can't adopt composite mode
```

**Update build order:**
```
Phase 0: Prove contracts work
Phase 0.5: Project reference generation (NEW)
  ksc init --detect
  Generate tsconfig.json files
  Validate with tsc --build
Phase 1: CLI + config
Phase 2: Kind definitions
...
```

#### Verdict

**✅ ADOPT - Add Phase 0.5 to build order and Part 2.5 to architecture doc**

This is a major value add that v3 completely missed. It solves the adoption problem elegantly.

---

## Opportunity 4: TypeScript's Watch and Build Infrastructure

### The Proposal

Instead of building custom watch mode with custom `.ksbuildinfo`, hook into `ts.createWatchProgram` and `ts.createSolutionBuilder`, letting TypeScript handle file watching, change detection, incremental compilation, and `.tsbuildinfo` persistence.

**Implementation pattern:**
```typescript
const host = ts.createWatchCompilerHost(
  configPath,
  {},
  ts.sys,
  ts.createSemanticDiagnosticsBuilderProgram,
  reportDiagnostic,
  reportWatchStatus,
);

// Hook: after TS recompiles, run KindScript checks
const origPostProgramCreate = host.afterProgramCreate;
host.afterProgramCreate = (program) => {
  origPostProgramCreate?.(program);

  // Run KS checks on the updated program
  const ksDiagnostics = runArchitecturalChecks(program.getProgram());
  for (const d of ksDiagnostics) {
    reportDiagnostic(d);
  }
};

ts.createWatchProgram(host);
```

### What This Claims to Eliminate

From v3:
- Custom file watching logic
- Custom `.ksbuildinfo` for source file tracking
- Custom file hashing
- The `cachedHost.ts` module for source-file-level caching

What KindScript still needs:
- Caching for its own computations (resolved file sets, contract results)
- Simple memoization layer keyed on file hashes (which TS provides)

### Evaluation

**🔴 DISAGREE - This misunderstands what .ksbuildinfo is for and conflates two separate concerns**

#### Why This Proposal Is Wrong

**Problem 1: Conflates source file changes with architectural fact changes**

TypeScript's `.tsbuildinfo` tracks:
- Source file hashes
- TS type information
- TS dependency graph

KindScript's `.ksbuildinfo` tracks (from v3 Part 8):
- File hashes for host-queried files
- **Cached import graph edges**
- **Cached directory listings** (for detecting structural changes)
- **Cached file resolution per symbol**
- **Previously computed contract results**

These are **different things**. TS tracks *source code*. KS tracks *architectural facts derived from the codebase structure*.

Example: a new file is created under `src/ordering/domain/`. TypeScript's `.tsbuildinfo` doesn't care (it's not imported anywhere yet). But KindScript cares because:
- Directory listing for `src/ordering/domain/` changed
- Contracts checking "completeness" of the domain layer need to re-run
- Symbol-to-files resolution for the domain symbol is invalidated

**Problem 2: v3's three-trigger invalidation requires more than TS provides**

From v3 Part 8:
```
Trigger (a): File content changed
  → invalidate cached import edges for that file
  → re-run contracts depending on those edges

Trigger (b): File created/deleted (structural change)
  → invalidate directory listings
  → re-resolve symbol-to-files mappings
  → re-run ALL contracts involving affected symbols

Trigger (c): Definition file changed
  → re-bind, diff symbols
  → re-check all affected contracts
```

TypeScript's watch mode handles (a) and (c). It does NOT handle (b) — structural changes that don't involve TypeScript compilation.

**Scenario:** I create `src/ordering/domain/new-entity.ts` but don't import it anywhere yet.

- **TypeScript watch:** Does nothing (file isn't in the import graph)
- **KindScript needs to:** Re-evaluate completeness contracts, re-check if ports have implementations, verify the file belongs where it is

**Problem 3: cachedHost does MORE than source file caching**

The proposal claims `cachedHost.ts` is eliminated because TS handles source files. But `cachedHost` caches:

```typescript
class CachedHost implements KindScriptHost {
  private directoryListingsCache: Map<string, string[]>;
  private importGraphCache: Map<string, ImportEdge[]>;
  private symbolResolutionCache: Map<ArchSymbol, ResolvedFile[]>;
  private contractResultsCache: Map<ContractInstance, ArchDiagnostic[]>;

  // These are NOT in .tsbuildinfo!
  // These are architectural-level caches
}
```

TypeScript doesn't cache directory listings. TypeScript doesn't cache architectural symbol resolutions. These are KindScript-specific.

#### What v3 Got Right

v3's incremental strategy is correct:

```
┌─────────────────────────────────────────────────────────────┐
│  .tsbuildinfo (TypeScript manages this)                      │
│  ──────────────────────────────────                          │
│  • source file hashes                                        │
│  • TS type data                                              │
│  • TS dependency graph                                       │
│  • which TS diagnostics are still valid                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  .ksbuildinfo (KindScript manages this)                      │
│  ──────────────────────────────────                          │
│  • file hashes for host-queried files                        │
│  • cached import graph edges                                 │
│  • cached directory listings (for detecting structural change)│
│  • cached file resolution per symbol                         │
│  • previously computed contract results                      │
│  • invalidation metadata                                     │
└─────────────────────────────────────────────────────────────┘

Two separate concerns. Two separate cache files.
```

This separation is **necessary** because the concerns are fundamentally different:
- TS cares about type checking source files
- KS cares about architectural properties of the codebase structure

#### What To Accept From The Proposal

The proposal is right that:
1. **Use ts.createWatchProgram as the foundation.** Hook `afterProgramCreate` to run KS checks after TS recompiles. This is correct.
2. **Don't rebuild TS's file watching.** Use TS's watch infrastructure, then add KS-specific watchers for structural changes.
3. **Leverage TS's change detection for definition files.** When a kind definition changes, TS will trigger recompilation and we hook into that.

But keep `.ksbuildinfo` and `cachedHost` for KindScript's own caches.

#### Corrected Architecture

```
Watch Mode Architecture:

┌───────────────────────────────────────────────────────────┐
│  ts.createWatchProgram                                     │
│  ─────────────────────                                     │
│  Watches: definition .ts files, target codebase .ts files │
│  On change: re-parse, re-bind, re-check (TS types)        │
│  Hook: afterProgramCreate → run KS checks                 │
└──────────────────┬────────────────────────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────────────────────────┐
│  KS Structural Watcher                                     │
│  ─────────────────────                                     │
│  Watches: directory structure (new/deleted files)         │
│  On change: invalidate directory listings in .ksbuildinfo │
│             re-resolve symbol-to-files                     │
│             re-run affected contracts                      │
└───────────────────────────────────────────────────────────┘

Two watchers. TS handles source content. KS handles structure.
```

#### Verdict

**🔴 REJECT - Keep v3's approach with .ksbuildinfo and cachedHost**

Refinement: Make it clear that KS hooks into TS's watch infrastructure but adds its own structural watcher and maintains its own cache file for architectural facts.

---

## Opportunity 5: ts-morph for the Binder / Classifier

### The Proposal

Use ts-morph's higher-level API instead of raw TypeScript compiler API for the binder/classifier. Finding "types that extend Kind<N>" becomes simpler:

```typescript
import { Project } from 'ts-morph';

function findKindDefinitions(project: Project): KindDefinition[] {
  const kinds: KindDefinition[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    for (const typeAlias of sourceFile.getTypeAliases()) {
      const type = typeAlias.getType();
      if (extendsKindBase(type)) {
        kinds.push({
          name: typeAlias.getName(),
          typeAlias,
          members: extractMembers(type),
          sourceFile,
        });
      }
    }
  }

  return kinds;
}
```

**Trade-off noted:**
- CLI: use ts-morph (ergonomics > performance)
- Plugin hot path: use direct compiler API (performance critical)
- Share classification logic between both

### Evaluation

**🟡 CONDITIONAL AGREE - Good for CLI, questionable for plugin, adds dependency cost**

#### Arguments In Favor

1. **ts-morph is genuinely more ergonomic.** Compare:

   **Raw TS API:**
   ```typescript
   ts.forEachChild(sourceFile, function visit(node) {
     if (ts.isTypeAliasDeclaration(node)) {
       const type = checker.getTypeAtLocation(node);
       const baseTypes = type.getBaseTypes?.() ?? [];
       for (const base of baseTypes) {
         const symbol = base.getSymbol();
         if (symbol?.getName() === 'Kind') {
           // Found a Kind definition
           // Now extract members...
         }
       }
     }
     ts.forEachChild(node, visit);
   });
   ```

   **ts-morph:**
   ```typescript
   for (const typeAlias of sourceFile.getTypeAliases()) {
     const type = typeAlias.getType();
     if (extendsKindBase(type)) {
       const members = typeAlias.getType().getProperties();
       // Much cleaner
     }
   }
   ```

   The ergonomics win is real.

2. **Import analysis is cleaner.** From the proposal:
   ```typescript
   for (const importDecl of sourceFile.getImportDeclarations()) {
     const moduleFile = importDecl.getModuleSpecifierSourceFile();
     // vs. the symbol-chasing required in raw API
   }
   ```

3. **Separation of concerns is sensible.** CLI (runs occasionally, user waits) vs. plugin (runs on every keystroke, must be fast) having different implementations is reasonable if they share the core logic.

#### Arguments Against

1. **Adds a significant dependency.** ts-morph is:
   - An additional npm package (~500KB)
   - Version-coupled to TypeScript
   - Another surface for breaking changes
   - Overhead in startup time (wrapping the compiler API isn't free)

2. **v3's binder is not that complex.** The proposal implies that AST classification is ~40 lines of complex compiler API code. But v3 already proposed a focused binder:

   From v3 Part 4.1:
   ```
   The binder's three responsibilities:

   1. Walk the TypeScript AST looking for types that extend Kind<N>
   2. Walk the AST looking for variable declarations typed as kind types
   3. Walk the AST looking for defineContracts(...) calls
   ```

   These are straightforward AST walks. With good helper functions, the raw compiler API version is maybe 100-150 lines total. Is ts-morph's ergonomics worth the dependency cost for 100 lines?

3. **The "share logic between CLI and plugin" claim is questionable.** If the classification logic is truly shared, you're calling the same functions from both. But:
   - CLI with ts-morph wrapping: `Project → getTypeAliases() → classify()`
   - Plugin with raw API: `sourceFile → forEachChild() → classify()`

   The classify() function needs different inputs (ts-morph's Type vs. raw ts.Type). So either:
   - They're not actually sharing logic (two implementations)
   - There's an adapter layer (complexity)
   - The shared logic operates on a lowest-common-denominator interface (limiting)

4. **For the generator, ts-morph makes more sense.** The proposal mentions ts-morph for "source file manipulation (for the emitter/scaffolder)." This is where ts-morph's value is strongest — code generation and AST transformation. For reading/classification, the value is less clear.

#### Recommendation

**Use ts-morph selectively:**

1. **Generator/scaffolder: YES**
   - ts-morph is designed for code generation
   - Its fluent API for creating/modifying nodes is much better than raw compiler API
   - Performance doesn't matter (scaffolding is one-time)

   ```typescript
   // scaffold/generator.ts
   import { Project } from 'ts-morph';

   const project = new Project();
   const sourceFile = project.createSourceFile('domain/index.ts');
   sourceFile.addExportDeclaration({
     namedExports: ['Order', 'Customer'],
   });
   ```

2. **Binder/classifier: NO**
   - The ergonomics win is real but not dramatic
   - The dependency cost is significant
   - The code isn't that complex with good helper functions
   - Avoiding the dependency keeps the core lightweight

   Write clean helper functions in the binder:
   ```typescript
   // compiler/binder.ts
   function findTypeAliasesExtending(
     sourceFile: ts.SourceFile,
     baseTypeName: string,
     checker: ts.TypeChecker
   ): ts.TypeAliasDeclaration[] {
     const results: ts.TypeAliasDeclaration[] = [];
     // Clean implementation using raw API
     return results;
   }
   ```

3. **Import analysis: Use Opportunity 2's approach**
   - As established in Opportunity 2, imports are queried from ts.Program
   - No need for ts-morph's wrapper here

#### Verdict

**🟡 PARTIAL ADOPT - Use ts-morph for generator/scaffolder only, not for binder**

Update v3:
- Part 4.1 (Binder): Keep using raw compiler API, but add better helper functions
- Part 4.6 (Generator): Add ts-morph as a dependency for code generation specifically
- Build order: Generator phase adds ts-morph dependency

---

## Opportunity 6: Declaration Files as the Standard Library Format

### The Proposal

Publish KindScript's standard library of architectural patterns as `@kindscript/*` npm packages containing TypeScript declaration files, leveraging the entire `@types/*` ecosystem infrastructure.

**Example:**
```bash
npm install @kindscript/clean-architecture
npm install @kindscript/hexagonal
```

**Package contents:**
```typescript
// node_modules/@kindscript/clean-architecture/index.d.ts

/** A bounded context following Clean Architecture principles. */
export interface CleanContext extends Kind<"CleanContext"> {
  /** Pure business logic — no external dependencies. */
  readonly domain: DomainLayer;
  /** Use cases orchestrating domain objects. */
  readonly application: ApplicationLayer;
  /** Adapters connecting to external systems. */
  readonly infrastructure: InfrastructureLayer;
}

// ... with paired .js file containing contract runtime values
```

### What This Provides

From the proposal:
- Versioned, publishable pattern definitions
- IDE support (hover docs, autocomplete) from TypeScript
- Dependency management via npm
- Community contributions via npm ecosystem
- Same discovery/installation UX as `@types/*`

### Evaluation

**✅ STRONGLY AGREE - This is obviously correct and v3 was wrong to say "no equivalent"**

#### Why v3 Was Wrong

From v3 Part 3 mapping table:
```
lib.d.ts                            Standard kind library
  (describes runtime environment)     (lib.clean-architecture.ts,
                                      lib.hexagonal.ts, etc. — pre-built
                                      pattern definitions that ship
                                      with KindScript)
```

v3 mapped `lib.d.ts` correctly, but then didn't think through the distribution mechanism. The proposal is asking: "If lib.d.ts is distributed as an npm package (`@types/node`), why wouldn't kind definitions be?"

The answer is: they should be.

#### Why This Is Obviously Right

1. **TypeScript definitions ARE npm packages.** The ecosystem has already solved this:
   - `@types/node` - Node.js runtime types
   - `@types/react` - React types
   - Thousands more in the @types namespace

   KindScript's pattern definitions are the same kind of thing — type definitions without runtime code (mostly).

2. **Versioning is crucial.** Architectural patterns evolve:
   ```
   @kindscript/clean-architecture@1.0.0  - original version
   @kindscript/clean-architecture@2.0.0  - adds support for CQRS
   ```

   Projects can pin versions. Breaking changes are communicated via semver. This is all standard npm.

3. **Community contributions become natural.** Someone wants to add `@kindscript/event-driven`? They publish it to npm. No central gatekeeping needed.

4. **IDE support is immediate.** Because these are just TypeScript files:
   - Hover over `CleanContext` → see TSDoc
   - Autocomplete on `.domain` → suggests DomainLayer
   - Go-to-definition → jumps to the kind definition
   - All this works today, for free, with zero KindScript-specific tooling

5. **Discovery via npm.** Users can:
   ```bash
   npm search kindscript
   # → @kindscript/clean-architecture
   # → @kindscript/hexagonal
   # → @kindscript/onion
   # → @kindscript/ports-and-adapters
   ```

6. **Dependencies between patterns.** If Hexagonal builds on Clean Architecture:
   ```json
   // @kindscript/hexagonal/package.json
   {
     "dependencies": {
       "@kindscript/clean-architecture": "^2.0.0"
     }
   }
   ```

   npm handles transitive dependencies automatically.

#### The Runtime Contract Problem

**Issue:** Contracts aren't just types — they're runtime functions that evaluate.

```typescript
// This is a type (ships as .d.ts)
export interface CleanContext extends Kind<"CleanContext"> {
  readonly domain: DomainLayer;
}

// But this is runtime code (needs .js)
export const cleanContextContracts = defineContracts<CleanContext>({
  noDependency: [["domain", "infrastructure"]],
  purity: ["domain"],
});
```

**Solution:** npm packages contain both `.d.ts` (for types) and `.js` (for runtime contracts).

```
@kindscript/clean-architecture/
  package.json
  index.d.ts        ← Type definitions
  index.js          ← Contract runtime values
  lib/
    domain.d.ts
    domain.js
    application.d.ts
    application.js
```

This is standard. Many npm packages ship both `.d.ts` and `.js`. The `.d.ts` describes the types, the `.js` provides the runtime values.

#### How Users Consume This

**In their tsconfig.json:**
```json
{
  "compilerOptions": {
    "types": ["@kindscript/clean-architecture"]
  }
}
```

**In their architecture.ts:**
```typescript
import { CleanContext, cleanContextContracts } from '@kindscript/clean-architecture';

export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/contexts/ordering",
  domain: { /* ... */ },
  application: { /* ... */ },
  infrastructure: { /* ... */ },
};

// Contracts are imported and applied
```

TypeScript sees the types. KindScript's checker sees the contract runtime values. Both are happy.

#### What This Changes From v3

v3 said "ships with KindScript" implying these live in KindScript's repo:
```
packages/
  kindscript/
  lib/
    clean-architecture.ts
    hexagonal.ts
    onion.ts
```

This proposal says they're separate npm packages:
```
@kindscript/clean-architecture  (own repo, own version)
@kindscript/hexagonal           (own repo, own version)
@kindscript/onion               (own repo, own version)
```

**Which is better?**

Separate packages:
✓ Independent versioning
✓ Users only install what they need
✓ Community can publish additional patterns
✓ Clear ownership boundaries

Monorepo:
✓ Easier to keep in sync with KindScript core
✓ Official blessing is clear

**Hybrid approach:** Core patterns (@kindscript/clean-architecture, @kindscript/hexagonal) live in KindScript's monorepo but are published as separate npm packages. Community patterns live in their own repos.

```
github.com/kindscript/kindscript
  packages/
    kindscript/         → npm: kindscript
    clean-architecture/ → npm: @kindscript/clean-architecture
    hexagonal/          → npm: @kindscript/hexagonal

github.com/community/my-pattern
  package.json → npm: @kindscript/event-sourced-architecture
```

#### Verdict

**✅ ADOPT - Change v3's standard library distribution strategy to npm packages**

Update v3:
- Part 3 mapping: Keep the mapping, change the distribution note
- Part 11: Add a section on the standard library ecosystem
- Build order: Add "Phase 9: Standard library packages" for publishing core patterns

---

## Summary: Decision Matrix

| Opportunity | Verdict | Impact on v3 |
|-------------|---------|--------------|
| **1. TS Plugin Instead of LSP** | ✅ **ADOPT** | Replace Part 7 architecture. Eliminates `server/server.ts`. Use ts.Diagnostic everywhere. |
| **2. TS Module Resolution** | 🟡 **REFINE** | Keep host abstraction. Clarify implementation delegates to TS. Host provides architectural-level queries. |
| **3. Project References** | ✅ **ADOPT** | Add Phase 0.5 and Part 2.5. Major adoption win. Makes KS the fallback, not the foundation. |
| **4. TS Watch Infrastructure** | 🔴 **REJECT** | Keep .ksbuildinfo and cachedHost. Hook into ts.createWatchProgram but maintain KS structural watcher. |
| **5. ts-morph for Binder** | 🟡 **PARTIAL** | Use ts-morph for generator only, not binder. Keep binder lightweight with clean helpers. |
| **6. npm Package Distribution** | ✅ **ADOPT** | Change standard library from "ships with KS" to separate npm packages. Enables ecosystem. |

## Final Architecture: The Thin Coordination Layer

Accepting opportunities 1, 3, and 6, with refinements to 2 and 5, and rejecting 4, the architecture becomes:

```
packages/kindscript/src/
  core/
    classify.ts           # AST classification (raw TS API)
    resolve.ts            # Symbol-to-files resolution
    contracts/
      noDependency.ts
      mustImplement.ts
      purity.ts

  host/
    host.ts               # Interface (refined, delegates to TS)
    defaultHost.ts        # Implementation
    cachedHost.ts         # Caching layer with .ksbuildinfo
    testHost.ts           # Testing

  plugin/
    index.ts              # TS language service plugin
    diagnostics.ts        # Fast checks → ts.Diagnostic[]
    codeFixes.ts          # Quick fixes

  cli/
    cli.ts                # ksc check, ksc init
    init.ts               # Project reference generation
    watch.ts              # Hooks ts.createWatchProgram

  infer/
    detect.ts             # Pattern detection
    generate.ts           # Draft kind definitions

  scaffold/
    plan.ts               # Uses ts-morph
    apply.ts              # Uses ts-morph

packages/clean-architecture/
  index.ts               # Ships as @kindscript/clean-architecture

packages/hexagonal/
  index.ts               # Ships as @kindscript/hexagonal
```

**What's eliminated vs. v3:**
- `server/server.ts` - LSP server (use TS plugin instead)
- `services/service.ts` - Custom language service (extend via plugin)
- Monolithic standard library (use npm packages)

**What's kept vs. v3:**
- `host/` - Host abstraction (but clarified as delegation layer)
- `compiler/binder.ts` → `core/classify.ts` (lighter, raw API)
- `compiler/checker.ts` → `core/contracts/*` (distributed)
- `.ksbuildinfo` and `cachedHost` (necessary for architectural facts)

**What's added:**
- `cli/init.ts` - Project reference generation (Phase 0.5)
- `plugin/` - TS language service plugin (replacement for LSP)
- ts-morph dependency for scaffold/ only

## Build Order Revised

```
Phase 0: Prove contracts work
  Contract functions + ts.Program → ts.Diagnostic[]

Phase 0.5: Project reference generation (NEW)
  ksc init --detect
  Immediate value with zero config

Phase 1: CLI + config
  kindscript.json
  ksc check

Phase 2: Kind definitions + classifier
  AST classification
  ArchSymbol creation

Phase 3: Symbol-to-files resolution
  Pluggable strategies

Phase 4: Full checker
  Contract evaluation
  Diagnostic accumulation

Phase 5: Inference
  ksc infer

Phase 6: Generator
  Scaffolding with ts-morph
  Fix patches

Phase 7: Language service plugin (CHANGED)
  TS plugin instead of LSP
  Fast diagnostics

Phase 8: Incremental + watch
  cachedHost
  .ksbuildinfo
  Hook ts.createWatchProgram

Phase 9: Standard library packages (NEW)
  Publish @kindscript/clean-architecture
  Publish @kindscript/hexagonal
```

## Conclusion

The proposal's core thesis is correct: **v3 built more than necessary.** But it wasn't uniformly correct about what to eliminate.

**Accept:**
- TS plugin architecture (massive simplification)
- Project references as zero-config tier (adoption breakthrough)
- npm packages for patterns (obvious in hindsight)

**Refine:**
- Host abstraction (keep it, but clarify it's delegation + architectural queries)
- ts-morph (use selectively for generation, not everywhere)

**Reject:**
- Eliminating .ksbuildinfo (conflates source code with architectural facts)

The result is leaner than v3 but not as thin as the proposal suggested. The genuinely new contributions remain:
1. AST classification (Kind definitions in the wild)
2. Symbol-to-files resolution (architectural correlation)
3. Contract evaluation (behavioral checking)
4. Inference (spec from code)
5. Generation (code from spec)

Everything else delegates to TypeScript or uses TypeScript's extension points.

**The key insight:** KindScript isn't a parallel compiler. It's a TypeScript plugin that understands architecture.
