# KindScript as a Compiler: Structural Parallels with TypeScript (v2)

## Preface

This document examines how KindScript could be built as a system that is
structurally homologous to the TypeScript compiler. Not a surface-level analogy
— a genuine structural correspondence where each component in TypeScript has a
counterpart in KindScript, adapted for the fact that KindScript's "values" are
whole codebases and its "types" are architectural patterns.

The goal is to identify what to borrow directly, what to adapt, and what is
genuinely new.

### Changes from v1

v1 claimed KindScript had a "dual front-end" — a definition parser and a
separate fact extraction pipeline, merged at the binder. This was wrong. It
described an implementation choice as a structural necessity. v2 corrects this
by examining how TypeScript actually handles its own multiple inputs and
applying the same pattern to KindScript.

---

## Part 1 — The TypeScript Compiler's Internal Architecture

Before mapping anything, we need a precise picture of what TypeScript actually
does internally. The compiler has five major phases, each producing a distinct
data structure that the next phase consumes.

### Phase 1: Scanner → Token Stream

The scanner reads raw source text character-by-character and produces tokens
(`Identifier`, `OpenBrace`, `StringLiteral`, etc.). Tokens carry positional
information (start, end, line) but no structural meaning yet.

### Phase 2: Parser → AST (Abstract Syntax Tree)

The parser consumes tokens and produces a tree of `ts.Node` objects. Every node
has a `kind` discriminant (from the `SyntaxKind` enum), a `parent` pointer, and
child nodes. The AST is the canonical in-memory representation of source code.

Key structural property: **one AST per SourceFile**, but the tree is uniform —
every node is a `ts.Node` regardless of what it represents. The parser does not
distinguish type nodes from value nodes. That distinction is made later.

### Phase 3: Binder → Symbols + Flow Graph

The binder walks the AST and does two things:

1. **Creates Symbols.** A `ts.Symbol` represents a named entity (variable,
   function, class, module). Multiple AST nodes can contribute to the same
   symbol (declaration merging). The binder builds a symbol table that maps
   names to symbols within each scope.

2. **Builds the control flow graph.** Flow nodes track reachability and are used
   later for type narrowing.

Key structural property: the binder connects the **syntactic** world (AST nodes)
to the **semantic** world (symbols, scopes, flows). It doesn't resolve types —
it just establishes the name-to-declaration mapping.

**Critically, the binder also triggers module resolution.** When it encounters
an import, it asks the `CompilerHost` to find and parse the imported file. This
is where the filesystem enters the picture — not as a parsed input, but as an
ambient resource queried on demand through an abstraction.

### Phase 4: Checker → Types + Diagnostics

The checker is the largest single component (~45,000 lines in `checker.ts`). It:

- Resolves types for every expression and declaration
- Checks assignability (`isTypeAssignableTo`)
- Performs control flow narrowing
- Resolves overloads, generics, conditional types, mapped types
- Accumulates `ts.Diagnostic` objects for every violation

Key structural properties:
- **Lazy evaluation.** Types are resolved on demand, not eagerly.
- **Caching.** Resolved types are memoized on nodes and symbols.
- **Structural typing.** Compatibility is based on shape, not identity.
- **The checker never mutates the AST.** It reads the AST and symbol table,
  produces types and diagnostics, and that's it.

### Phase 5: Emitter → Output Files

The emitter walks the AST (consulting types where needed) and produces output:
JavaScript files, `.d.ts` declaration files, source maps. It can also apply
transformations (downlevel async/await, JSX → createElement, etc.).

### Cross-Cutting: The CompilerHost and the Filesystem

TypeScript does **not** have a single input. It has:

- User `.ts` source files (contain both types and values)
- `tsconfig.json` (configuration)
- `lib.d.ts` files (describe the runtime environment — DOM, Node.js APIs)
- `node_modules/@types/*` (ambient type declarations)
- The filesystem itself (used during module resolution)

But the critical design decision is: **all of these are accessed through a
single abstraction (`CompilerHost`) and normalized into the same data structure
(`SourceFile`).** The parser doesn't care if a SourceFile came from user code,
`lib.dom.d.ts`, or `@types/node`. Everything becomes the same AST.

```typescript
interface CompilerHost {
  fileExists(fileName: string): boolean;
  readFile(fileName: string): string | undefined;
  getSourceFile(fileName: string): SourceFile | undefined;
  resolveModuleNames?(moduleNames: string[], containingFile: string): ResolvedModule[];
  // ...
}
```

The actual pipeline looks like this:

```
tsconfig.json
  → Program.create()
    → resolve root file names
    → for each root file:
        → CompilerHost.getSourceFile(fileName)
            → CompilerHost.readFile(fileName) → raw text
            → parser.createSourceFile(text)   → SourceFile AST
        → for each import/export in SourceFile:
            → resolveModuleName(importPath)
                → CompilerHost queries filesystem to find the file
            → CompilerHost.getSourceFile(resolvedFile) → SourceFile AST
            → (recursive — discovers entire reachable file graph)
    → all SourceFiles collected into Program
    → Binder: walk each SourceFile → create Symbols, build scopes
    → Checker: on demand, validate types → Diagnostics
```

The filesystem is never "parsed" as a separate input. It's an ambient resource
accessed through `CompilerHost` during module resolution. `lib.d.ts` files are
pre-generated descriptions of the runtime environment, in the same format as
user code, parsed by the same parser. There is **one representation** that all
inputs are normalized into, plus ambient resources queried through abstractions
during later phases.

This matters for KindScript.

### Other Cross-Cutting Concerns

- **`ts.Program`**: Top-level orchestrator. Owns the list of source files,
  compiler options, and the type checker instance. Entry point for all
  operations.
- **`ts.LanguageService`**: Wraps the compiler for IDE use. Provides
  completions, hover info, diagnostics, quick fixes, refactorings. Uses the
  same checker internally but adds incremental/caching layers.
- **Incremental compilation**: `--incremental` mode persists a `.tsbuildinfo`
  file that records file hashes and dependency graphs, allowing the compiler to
  skip unchanged files.
- **Project references**: `--build` mode compiles multiple related projects in
  dependency order.

---

## Part 2 — One Front-End, Not Two

### The tempting mistake

It's natural to think KindScript has two fundamentally different inputs:

- **Definition files** — kind declarations, instance bindings, contracts (normative)
- **The target codebase** — files, imports, structure (descriptive)

v1 of this document proposed a "dual front-end" where a definition parser and a
separate fact extraction pipeline each produce different data structures, merged
at the binder. This was an architectural choice disguised as a necessity.

### How TypeScript avoids this

TypeScript has the same normative/descriptive split:

- **Type annotations** are normative — they declare what should be true
- **Expressions and values** are descriptive — they are what is true
- **The runtime environment** (`lib.d.ts`) describes ambient capabilities

TypeScript doesn't have separate front-ends for these. They all go through the
same parser, into the same AST, through the same binder. The distinction between
normative and descriptive is made during **binding and checking**, not parsing.

The filesystem (which describes what files exist, what modules are available) is
not parsed at all. It's queried through the `CompilerHost` abstraction during
module resolution.

### Applying this to KindScript

The current project already uses TypeScript as the definition language. Kind
definitions are `.ts` types. Instance declarations are `.ts` values. The target
codebase is `.ts` files. **They're all TypeScript source files. They can all go
through the same parser.**

```
  kind-definitions.ts  ──┐
  instance-decls.ts    ──┼──→ TypeScript Parser → uniform TS AST
  codebase src/*.ts    ──┘
                                                                → KS Binder → KS Checker
                                                               ↗
                                                       KindScriptHost
                                                   (filesystem queries,
                                                    import graph,
                                                    package.json —
                                                    accessed on demand)
```

The KindScript binder walks the TypeScript AST and classifies what it finds:

- "This type extends `Kind<N>` — it's a kind definition. Create an architectural
  symbol."
- "This variable is typed as a kind — it's an instance declaration. Link it to
  its kind symbol."
- "This import statement is a dependency edge. Record it."
- "This `defineContracts(...)` call declares behavioral contracts. Attach them
  to the kind symbol."

The filesystem (directory structure, file existence, file paths) is accessed
through a host abstraction during binding and checking — exactly how TypeScript
accesses the filesystem through `CompilerHost` during module resolution.

```typescript
// Analogous to TypeScript's CompilerHost
interface KindScriptHost {
  // Filesystem (ambient facts, queried on demand)
  fileExists(path: string): boolean;
  directoryExists(path: string): boolean;
  getDirectoryEntries(path: string): string[];
  readFile(path: string): string | undefined;

  // TypeScript analysis (delegated to TS compiler API)
  getSourceFile(path: string): ts.SourceFile | undefined;
  getImportsForFile(path: string): ImportEdge[];
  getExportedSymbols(path: string): ExportedSymbol[];

  // Package metadata
  getPackageJson(path: string): PackageJson | undefined;
  getWorkspacePackages(root: string): string[];
}
```

No separate fact extraction phase. No dual front-end. Facts are queried on
demand, just like TypeScript queries the filesystem on demand.

### Why this matters

This isn't just aesthetics. The single-front-end architecture gives us:

1. **One AST format.** Every tool (visitors, printers, transformers, language
   service) works on the same data structure. No translation layer between
   "definition IR" and "fact IR."

2. **TypeScript structural checking for free.** Because kind definitions are
   real TypeScript types and instances are real TypeScript values, TypeScript's
   own checker validates structural conformance. KindScript only needs to build
   the behavioral contract checking that TypeScript can't do.

3. **The existing TypeScript language service.** Users get autocomplete, hover
   info, go-to-definition, and refactoring for their kind definitions with zero
   additional work — because those definitions are just TypeScript types.

4. **Incremental by default.** TypeScript's incremental compilation already
   handles change tracking for the source files. KindScript only needs
   incremental caching for the ambient facts (filesystem, import graph).

---

## Part 3 — The Structural Mapping (Corrected)

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
                                      directory structure, import graph,
                                      package metadata)

Binder (AST → Symbols)             KS Binder (walks TS AST, classifies
                                    nodes as kind defs / instances /
                                    contracts, creates ArchSymbols,
                                    queries KindScriptHost for facts)

Symbol (ts.Symbol)                  ArchSymbol (named architectural
                                    entity — kind, instance, layer,
                                    port, boundary)

Checker (Symbols + Types            KS Checker (ArchSymbols + Facts
         → Diagnostics)                        → Diagnostics)

Type (ts.Type)                      ResolvedKind (fully expanded kind
                                    with inherited contracts)

isTypeAssignableTo(A, B)            doesInstanceSatisfyKind(I, K)

Diagnostic (ts.Diagnostic)          ArchDiagnostic (violation with
                                    contract reference, fix hint)

Emitter (AST → .js/.d.ts)          Generator (kind defs → scaffolded
                                    code, violations → fix patches)

Program (ts.Program)                ks.Program (wraps ts.Program,
                                    adds architectural checking)

LanguageService                     Extends TS LanguageService with
                                    architectural diagnostics + fixes

CompilerOptions                     KindScriptConfig (which contracts
                                    to enforce, strictness, host config)

lib.d.ts                            (no direct equivalent — the target
  (describes runtime environment)     codebase IS the environment,
                                      queried through KindScriptHost)

.tsbuildinfo                        .ksbuildinfo (cached host query
                                    results for incremental re-checking)
```

The mapping is tighter than v1 because we're not inventing new front-end
components. The scanner, parser, and AST are TypeScript's own. KindScript
adds a binder (to classify nodes architecturally), a checker (to evaluate
contracts), and a host abstraction (to query ambient facts).

---

## Part 4 — What KindScript Adds Beyond TypeScript

With the single-front-end architecture, KindScript's genuinely new components
are:

### 4.1 The KindScript Binder

TypeScript's binder creates `ts.Symbol` objects from AST nodes. KindScript's
binder creates `ArchSymbol` objects by walking the same AST and applying
architectural classification.

```typescript
interface ArchSymbol {
  readonly name: string;
  readonly symbolKind: ArchSymbolKind;  // Kind | Instance | Layer | Port | ...
  readonly tsSymbol: ts.Symbol;         // link back to the TS symbol
  readonly declarations: ts.Node[];     // AST nodes that contribute
  readonly members?: ArchSymbolTable;   // child symbols
  readonly contracts?: Contract[];      // attached behavioral contracts
  readonly parent?: ArchSymbol;         // containing scope
}

type ArchSymbolTable = Map<string, ArchSymbol>;
```

The binder's job:

1. Walk the TypeScript AST looking for types that extend `Kind<N>`. For each
   one, create an `ArchSymbol` with `symbolKind: Kind` and populate its
   `members` from the type's fields.

2. Walk the AST looking for variable declarations typed as kind types. For
   each one, create an `ArchSymbol` with `symbolKind: Instance` and link it
   to its kind symbol.

3. Walk the AST looking for `defineContracts(...)` calls. Parse the contract
   descriptors and attach them to the corresponding kind symbols.

4. Query the `KindScriptHost` to resolve location bindings — when an instance
   declares `location: "src/contexts/ordering"`, the binder asks the host
   whether that path exists and what's in it.

This is analogous to how TypeScript's binder queries the `CompilerHost` during
module resolution. The binder doesn't "parse" the filesystem. It asks the host
questions and records the answers as facts on the architectural symbols.

### 4.2 The KindScript Checker

This is the heart of the system. TypeScript's checker validates that values
conform to types. KindScript's checker validates that the codebase conforms
to architectural contracts.

```typescript
interface KSChecker {
  // Public API
  checkProgram(): readonly ArchDiagnostic[];
  getResolvedKind(symbol: ArchSymbol): ResolvedKind;
  doesInstanceSatisfy(instance: ArchSymbol, kind: ArchSymbol): boolean;

  // Diagnostics
  getDiagnostics(): readonly ArchDiagnostic[];
}
```

**Important distinction from v1:** structural conformance (does the instance
have all required children with the right types?) is already checked by
TypeScript's own checker, because kind definitions are TypeScript types and
instances are TypeScript values. If an instance is missing a required field,
`tsc` will catch it.

KindScript's checker handles **behavioral contracts** — the things TypeScript's
type system cannot express:

```typescript
function checkDependencyContract(
  contract: NoDependencyContract,
  fromSymbol: ArchSymbol,
  toSymbol: ArchSymbol,
  host: KindScriptHost,
): ArchDiagnostic[] {
  const diagnostics: ArchDiagnostic[] = [];

  // Get all files belonging to the "from" architectural unit
  const fromFiles = resolveFilesForSymbol(fromSymbol, host);

  // Get all files belonging to the "to" architectural unit
  const toFiles = resolveFilesForSymbol(toSymbol, host);
  const toFileSet = new Set(toFiles.map(f => f.path));

  // Check each import edge from "from" files
  for (const file of fromFiles) {
    const imports = host.getImportsForFile(file.path);
    for (const imp of imports) {
      if (toFileSet.has(imp.resolvedPath)) {
        diagnostics.push(createArchDiagnostic(
          imp.node,                           // the import statement
          DiagnosticCode.ForbiddenDependency,
          `Module '${file.path}' imports from '${imp.resolvedPath}'. ` +
          `This violates contract 'noDependency(${fromSymbol.name}, ${toSymbol.name})'.`,
          { relatedContract: contract },
        ));
      }
    }
  }

  return diagnostics;
}
```

Key patterns borrowed from TypeScript's checker:

1. **Lazy evaluation.** Don't resolve all kinds and check all contracts eagerly.
   Resolve and check on demand, cache results.

2. **Diagnostic accumulation.** Never throw on errors. Record a diagnostic and
   continue. Produce maximum information per run.

3. **Related information.** Diagnostics point to both the violation site (the
   offending import) and the contract definition (where the rule was declared).

4. **Diagnostic codes.** Every diagnostic gets a stable numeric code (KS1001,
   KS1002, etc.) for filtering, documentation, and suppression.

5. **Host queries, not materialized facts.** The checker asks the
   `KindScriptHost` for information when it needs it. It doesn't work against
   a pre-extracted fact model. This mirrors how TypeScript's checker calls
   `getTypeOfSymbol` which may trigger lazy resolution through the host.

### 4.3 The KindScriptHost

This is KindScript's version of `CompilerHost` — an abstraction over the
ambient environment that the binder and checker query on demand.

```typescript
interface KindScriptHost extends ts.CompilerHost {
  // Filesystem structure
  directoryExists(path: string): boolean;
  getDirectoryEntries(path: string): string[];

  // Import/dependency graph (may delegate to TS compiler API)
  getImportsForFile(path: string): ImportEdge[];
  getExportedSymbols(path: string): ExportedSymbol[];
  getDependencyEdges(fromDir: string, toDir: string): DependencyEdge[];

  // Package metadata
  getPackageJson(path: string): PackageJson | undefined;
  getWorkspacePackages(root: string): string[];

  // Caching layer (for incremental)
  getFileHash(path: string): string;
  getCachedResult<T>(key: string): T | undefined;
  setCachedResult<T>(key: string, value: T): void;
}
```

Why extend `ts.CompilerHost` rather than creating a separate interface? Because
KindScript's binder and checker already need a TypeScript `Program` to read the
AST. By extending `CompilerHost`, the same host serves both TypeScript's needs
(file reading, module resolution) and KindScript's needs (directory structure,
import graph, package metadata). One abstraction, one seam for testing.

The host enables:

- **Testing**: Supply a mock host with in-memory files, predetermined import
  edges, and controlled directory structures. No real filesystem needed.
- **Incremental checking**: The host caches file hashes and query results.
  On re-check, only re-query for changed files.
- **Remote analysis**: Implement a host that reads from a git remote or a
  CI artifact instead of the local filesystem.

### 4.4 The Emitter / Generator

TypeScript's emitter reads the AST and produces output files. KindScript's
emitter reads the architecture graph and produces:

- **Scaffolded code**: create files and directories to satisfy a kind definition
- **Fix patches**: modify imports, move files, or adjust exports to fix violations
- **Inferred declarations**: generate kind definitions from an existing codebase

This last one — **inference** — deserves special attention. TypeScript can infer
types from values. KindScript should be able to infer kinds from codebases.
Given a codebase with a recognizable Clean Architecture layout, KindScript
should be able to generate type definitions that describe it. This is the
emitter running in reverse: observed structure → kind definitions.

### 4.5 The Program

TypeScript's `ts.Program` is the top-level orchestrator. KindScript's program
wraps it:

```typescript
// KindScript
function createProgram(config: KindScriptConfig): KSProgram {
  const host = createKindScriptHost(config);
  const tsProgram = ts.createProgram(config.rootFiles, config.compilerOptions, host);
  const binder = createBinder(tsProgram, host);
  const checker = createChecker(binder, host);

  return {
    getTsProgram: () => tsProgram,
    getChecker: () => checker,
    getArchSymbols: () => binder.getSymbols(),
    getDiagnostics: () => [
      ...ts.getPreEmitDiagnostics(tsProgram),  // structural (from TS)
      ...checker.getDiagnostics(),              // behavioral (from KS)
    ],
  };
}

// Usage
const program = ks.createProgram(config);
const diagnostics = program.getDiagnostics();
```

Note how `getDiagnostics()` merges TypeScript's structural diagnostics with
KindScript's behavioral diagnostics. From the user's perspective, there's one
stream of errors. Some come from TypeScript ("missing required field `domain`
in OrderingContext"), others from KindScript ("domain layer imports from
infrastructure layer"). Both are shown together, both have source locations,
both may have suggested fixes.

---

## Part 5 — The Constraint Language

TypeScript's "constraint language" is its type system — a rich structural type
algebra. KindScript needs a constraint language for behavioral contracts.

### What TypeScript's type system already handles

Because kind definitions are TypeScript types, the following constraints are
checked for free by `tsc`:

- Required fields: `domain: DomainLayer` — if missing from an instance, TS error
- Field types: the value assigned to `domain` must structurally match `DomainLayer`
- Kind discriminants: `kind: "OrderingContext"` must be the literal string
- Nested structure: recursively checked through the type hierarchy

### What KindScript must add

Behavioral contracts that operate over the codebase's runtime structure:

| Contract | What it checks |
|---|---|
| `noDependency(A, B)` | No import edges from files in A to files in B |
| `mustImplement(P, A)` | Every port interface in P has an implementing class in A |
| `noCycles(contexts)` | No circular import paths between bounded contexts |
| `purity(layer)` | No imports of side-effecting modules in the layer |
| `colocated(A, B)` | A and B must be in the same directory |
| `exclusive(A, B)` | No file may belong to both A and B |

### Design: constraints as typed functions

Constraints are TypeScript functions that take architectural symbols and a host,
and return diagnostics:

```typescript
type ContractFn = (
  args: ArchSymbol[],
  host: KindScriptHost,
) => ArchDiagnostic[];

// Built-in contracts
const noDependency: ContractFn = ([from, to], host) => { /* ... */ };
const mustImplement: ContractFn = ([ports, adapters], host) => { /* ... */ };
const noCycles: ContractFn = ([scope], host) => { /* ... */ };
```

User-facing declaration uses typed helpers:

```typescript
const orderingContracts = defineContracts<OrderingContext>({
  noDependency: [["domain", "infrastructure"]],
  mustImplement: [["domain.ports", "infrastructure.adapters"]],
  purity: ["domain"],
});
```

`defineContracts<T>` is generic over the kind type, so the field paths
(`"domain"`, `"infrastructure"`, `"domain.ports"`) are type-checked by
TypeScript. Invalid paths are compile errors. This gives the constraint
declarations themselves the same type safety as the kind definitions.

### Why not a separate DSL?

A custom `.ks` syntax for contracts (like `contract noDependency(domain, infra)`)
would be more readable but requires building a parser, language service, and
syntax highlighting. The TypeScript-function approach gets type-checked field
paths, autocomplete, and IDE support for free.

If readability becomes a problem, a thin DSL layer can be added later that
compiles to the same `ContractFn` representation — just as TypeScript type
annotations compile to the same internal `Type` objects that the checker
manipulates programmatically.

---

## Part 6 — Diagnostic System

TypeScript's diagnostic system is well-designed. KindScript borrows it directly,
adding architectural context:

```typescript
interface ArchDiagnostic {
  // Standard diagnostic fields (borrowed from TypeScript)
  readonly code: number;                 // stable code: KS1001, KS2001, etc.
  readonly category: DiagnosticCategory; // Error | Warning | Suggestion
  readonly messageText: string;
  readonly file: ts.SourceFile;          // the file containing the violation
  readonly start: number;                // position in file
  readonly length: number;

  // Architectural context (KindScript additions)
  readonly relatedContract?: {
    file: ts.SourceFile;                 // where the contract is defined
    start: number;
    length: number;
    contractName: string;
  };
  readonly involvedSymbols?: ArchSymbol[];
  readonly suggestedFix?: CodeFixAction;
}
```

Diagnostic categories, following TypeScript's precedent:

| Code Range | Category | Example |
|---|---|---|
| KS1xxx | Dependency violations | Forbidden import across layers |
| KS2xxx | Location violations | File/directory in wrong place |
| KS3xxx | Completeness violations | Port without adapter |
| KS4xxx | Cycle violations | Circular dependency between contexts |
| KS5xxx | Purity violations | Side-effecting import in domain |

Example output (mirrors `tsc` output format):

```
src/ordering/domain/service.ts:14:1 - error KS1001: Forbidden dependency
  from domain layer to infrastructure layer.

  14 │ import { Database } from '../../infrastructure/database';
     │ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Contract defined in ordering.architecture.ts:8:3
   8 │   noDependency: [["domain", "infrastructure"]],
     │   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 3 errors in 2 files.
```

Each diagnostic has:
- A stable numeric code for programmatic use
- The violation site (in the codebase)
- The contract site (in the definition file)
- An optional suggested fix (auto-applicable via language service)

---

## Part 7 — The Language Service

TypeScript's language service wraps the compiler for IDE use. KindScript
**extends** it rather than replacing it.

Because kind definitions are TypeScript types, users already get full IDE
support — autocomplete, hover info, go-to-definition, rename — from
TypeScript's own language service. KindScript adds architectural features
on top:

### Additional diagnostics

Behavioral contract violations appear as red/yellow squigglies on the
offending code (the import statement, the misplaced file reference, etc.),
alongside TypeScript's own type errors.

### Quick fixes

- "Remove this import (violates noDependency contract)"
- "Move this file to `src/contexts/ordering/domain/` (location mismatch)"
- "Create adapter for `OrderRepository` port"

### Hover info (extended)

Hovering over an instance declaration shows the resolved kind, contract status,
and any violations — in addition to TypeScript's own type hover.

### Code lens

Above each instance declaration: "2 contracts passing, 1 violation" with
clickable links to the violations.

### Architecture

```
┌─────────────────────────────────────────────────┐
│            Extended Language Service              │
│  ┌───────────────────┐  ┌─────────────────────┐ │
│  │  TS LanguageService│  │  KS LanguageService │ │
│  │  (structural)      │  │  (behavioral)       │ │
│  └────────┬──────────┘  └──────────┬──────────┘ │
│           │                        │             │
│  ┌────────▼──────────┐  ┌──────────▼──────────┐ │
│  │  TS Checker        │  │  KS Checker         │ │
│  │  (type conformance)│  │  (contract eval)    │ │
│  └────────┬──────────┘  └──────────┬──────────┘ │
│           │                        │             │
│  ┌────────▼────────────────────────▼──────────┐ │
│  │              KindScriptHost                 │ │
│  │    (filesystem, imports, packages)          │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Both checkers share the same host. Both contribute diagnostics to the same
stream. From the user's perspective, there's one integrated experience.

---

## Part 8 — Incremental Compilation

### What TypeScript does

TypeScript's `--incremental` mode:

1. Records a hash of each source file
2. Records the dependency graph between files
3. On recompilation, skips files whose hash and dependencies haven't changed
4. Persists this state in `.tsbuildinfo`

### What KindScript needs

TypeScript's incremental mode already handles source file changes. KindScript
needs incremental caching for **host queries** — the ambient facts that the
binder and checker request from `KindScriptHost`.

The host can cache:
- File hashes (to detect filesystem changes)
- Import graph edges (expensive to compute via TS compiler API)
- Directory listings (to detect structural changes)
- Package.json contents

On re-check:
1. Compare file hashes against cache
2. Invalidate cached host query results for changed files
3. Propagate invalidation through the dependency graph
4. Re-run only affected contract checks

This state is persisted in `.ksbuildinfo` (or embedded in `.tsbuildinfo`
if TypeScript's format allows extension).

### Watch mode

Watches both definition files and target codebase files:

- Definition file changes → re-bind (reclassify architectural symbols),
  re-check affected contracts
- Codebase file changes → invalidate cached host queries for that file,
  re-check contracts that depend on it
- Filesystem structure changes (new/deleted files/dirs) → invalidate directory
  listings, re-check location contracts

---

## Part 9 — Module Structure

```
packages/kindscript/src/
  compiler/
    types.ts              # ArchSymbol, ArchDiagnostic, ResolvedKind,
                          # Contract, KindScriptConfig
                          # ← mirrors TypeScript's types.ts

    binder.ts             # Walks TS AST, creates ArchSymbols,
                          # classifies nodes, queries host
                          # ← mirrors TypeScript's binder.ts

    checker.ts            # Evaluates contracts against host queries,
                          # produces ArchDiagnostics
                          # ← mirrors TypeScript's checker.ts

    emitter.ts            # Generates scaffolding / fix patches
                          # ← mirrors TypeScript's emitter.ts

    program.ts            # Top-level orchestrator, wraps ts.Program
                          # ← mirrors TypeScript's program.ts

    diagnosticMessages.ts # All diagnostic message templates + codes
                          # ← mirrors TypeScript's diagnosticMessages.json

  host/
    host.ts               # KindScriptHost interface
                          # ← mirrors TypeScript's compilerHost.ts

    defaultHost.ts        # Default implementation (real filesystem,
                          # TS compiler API for imports)

    cachedHost.ts         # Caching wrapper for incremental mode

    testHost.ts           # In-memory mock host for testing

  contracts/
    contract.ts           # ContractFn type, defineContracts helper
    noDependency.ts       # Built-in: forbidden dependency edges
    mustImplement.ts      # Built-in: port-adapter completeness
    noCycles.ts           # Built-in: cycle detection
    purity.ts             # Built-in: side-effect-free layer
    colocated.ts          # Built-in: co-location requirement

  services/
    service.ts            # Extended language service API
                          # ← mirrors TypeScript's services.ts

    diagnostics.ts        # Diagnostic formatting
    codeFixes.ts          # Quick fix actions
                          # ← mirrors TypeScript's codefixes/

  server/
    server.ts             # LSP server (wraps TS language server)
                          # ← mirrors TypeScript's tsserver/

  cli/
    cli.ts                # Command-line interface
                          # ← mirrors TypeScript's tsc.ts
```

Note what's **not** here compared to v1: no `scanner.ts`, no `parser.ts`, no
`extractors/` directory. The scanner and parser are TypeScript's own. Fact
"extraction" is just the `KindScriptHost` answering queries — it's a service
interface, not a compilation phase.

---

## Part 10 — Build Order and Implementation Strategy

### What TypeScript built, in order

1. Scanner + Parser (get source code into memory)
2. Binder (connect names to declarations)
3. Checker (validate types — the 80% phase)
4. Emitter (produce output)
5. Language service (IDE support)
6. Incremental compilation (performance)

### What KindScript should build, in order

Since KindScript reuses TypeScript's scanner, parser, and AST, the build order
starts later in the pipeline:

**Phase 1: Host (the ambient fact layer)**

Build `KindScriptHost` with default implementation. Start with:
- `directoryExists`, `getDirectoryEntries` (filesystem structure)
- `getImportsForFile` (delegating to TypeScript compiler API)

These two capabilities are enough to validate location constraints and
dependency direction. Build the `testHost` in parallel so everything is
testable from day one.

**Phase 2: Binder (classify the AST)**

Build the binder that walks the TypeScript AST and creates architectural
symbols. Start with:
- Finding types that extend `Kind<N>`
- Finding variables typed as kind types
- Finding `defineContracts(...)` calls

**Phase 3: Checker (the 80% phase)**

Build the contract evaluator. Start with two contracts:
1. `noDependency` — checks import edges between architectural units
2. Location conformance — checks that declared locations match reality

Then add incrementally:
3. `mustImplement` — port-adapter completeness
4. `noCycles` — cycle detection between contexts
5. `purity` — side-effect-free layer checking

Note: structural conformance (missing fields, wrong types) is already handled
by `tsc`. KindScript's checker focuses exclusively on behavioral contracts.

**Phase 4: Program + CLI (wire it together)**

Build `ks.createProgram()` and a CLI that runs it:

```
$ kindscript check

src/ordering/domain/service.ts:14:1 - error KS1001: Forbidden dependency
  from domain layer to infrastructure layer.

Found 1 error.
```

**Phase 5: Emitter (scaffolding and fixes)**

Build code generation: given a kind definition, scaffold the directory
structure and stub files. Given a violation, generate a fix patch.

**Phase 6: Language service + LSP**

Extend TypeScript's language service with architectural diagnostics and
quick fixes. Wrap in an LSP server for VS Code.

**Phase 7: Incremental + watch**

Add `cachedHost`, `.ksbuildinfo` persistence, and file watchers.

---

## Part 11 — The TypeScript-as-Definition-Language Advantage

Using TypeScript as the definition language is not just a pragmatic shortcut.
It's a structural advantage that eliminates an entire class of problems.

### What you get for free

| Concern | Who handles it |
|---|---|
| Structural conformance (missing fields, wrong types) | TypeScript checker |
| Autocomplete for kind fields | TypeScript language service |
| Go-to-definition on kind references | TypeScript language service |
| Rename/refactor kind types | TypeScript language service |
| Type-safe contract field paths | TypeScript generics |
| Incremental re-parsing of definition files | TypeScript incremental mode |
| Syntax highlighting for definitions | Every TypeScript-aware editor |

### What you must build

| Concern | Who handles it |
|---|---|
| Behavioral contract evaluation | KindScript checker |
| Filesystem structure validation | KindScript checker + host |
| Dependency direction enforcement | KindScript checker + host |
| Architectural diagnostics | KindScript diagnostic system |
| Scaffolding / code generation | KindScript emitter |

The split is clean: **TypeScript checks the shape, KindScript checks the
behavior.** This mirrors a natural division — structural properties are
expressible as types, behavioral properties are not.

### The tradeoff

KindScript's expressive power for **structural** definitions is bounded by
TypeScript's type system. In practice this is not limiting — TypeScript's type
system is extraordinarily powerful for expressing record shapes, discriminated
unions, and recursive structures, which is exactly what kind definitions need.

The constraint language's expressive power is unbounded — contracts are
TypeScript functions with access to the full host API. Any property that can
be statically observed about a codebase can be checked.

---

## Part 12 — Open Questions

### Q1: How deep should host queries go?

Shallow queries (filesystem + imports) are fast and cover 80% of use cases.
Deeper queries (type relationships, function signatures, runtime behavior
analysis) are expensive.

Recommendation: **start shallow.** The host interface is extensible — add
deeper query methods as specific contracts require them. The abstraction
boundary (the `KindScriptHost` interface) ensures that adding depth doesn't
change the architecture.

### Q2: How should soft violations work?

Some contracts are absolute (no domain→infrastructure imports). Others are
aspirational (minimize cross-context coupling). TypeScript handles this with
strict mode flags. KindScript could use:

- Diagnostic categories: Error (must fix), Warning (should fix), Suggestion
- Per-contract severity overrides in configuration
- A `// @ks-ignore KS1001` suppression comment (mirrors `// @ts-ignore`)

### Q3: Should KindScript extend tsconfig.json or have its own config?

Options:
- Extend `tsconfig.json` with a `"kindscript"` section (tight integration)
- Separate `kindscript.json` (cleaner separation)
- Both (kindscript.json can reference tsconfig.json for TS settings)

Recommendation: **separate `kindscript.json`** that references the tsconfig.
This avoids polluting tsconfig with non-TS concerns and allows KindScript to
evolve its configuration independently.

### Q4: Can contracts compose?

Example: a `CleanArchitecture` kind might compose `noDependency` with
`mustImplement` and `purity` into a single reusable contract bundle. Should
contract composition be explicit (a function that returns multiple contracts)
or have special syntax?

Recommendation: **explicit composition via TypeScript.** A contract bundle is
just a function that returns an array of contracts. No special machinery needed.

---

## Summary

KindScript can be built as a genuine structural analog of the TypeScript
compiler — more tightly than v1 suggested, because the front-end is shared.

| Component | TypeScript | KindScript |
|---|---|---|
| Scanner + Parser | TypeScript's own | **Same** — reused directly |
| AST | `ts.Node` tree | **Same** — read directly |
| Host abstraction | `CompilerHost` | `KindScriptHost` (extends it) |
| Binder | Creates `ts.Symbol` from AST | Creates `ArchSymbol` from same AST |
| Checker | Validates values against types | Validates codebase against contracts |
| Emitter | Produces `.js` / `.d.ts` | Produces scaffolding / fix patches |
| Program | Orchestrates compilation | Wraps `ts.Program`, adds KS checking |
| Language service | IDE features for types | Extends with architectural features |
| Incremental | `.tsbuildinfo` | `.ksbuildinfo` (cached host queries) |

The key insight, refined from v1: **KindScript is not a separate compiler that
happens to look like TypeScript's. It is a layer on top of TypeScript's compiler
that adds architectural checking.** TypeScript handles the structural dimension
(do the shapes match?). KindScript handles the behavioral dimension (do the
runtime relationships respect the contracts?).

This is possible because the project made the right decision early: use
TypeScript types as the definition language. That decision means KindScript
doesn't need its own scanner, parser, AST format, or structural checker. It
needs a binder (to classify TypeScript AST nodes architecturally), a checker
(to evaluate behavioral contracts), and a host (to query the codebase's
ambient properties). Everything else is TypeScript's.

Build it this way and you get the tightest possible structural correspondence
with the TypeScript compiler — not by copying its components, but by literally
reusing them and adding only the genuinely new layers.
