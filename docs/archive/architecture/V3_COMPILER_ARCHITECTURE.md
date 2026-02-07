# KindScript as a Compiler: Structural Parallels with TypeScript (v3)

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
described an implementation choice as a structural necessity. v2 corrected this
by examining how TypeScript actually handles its own multiple inputs and
applying the same pattern to KindScript.

### Changes from v2

v2 had the right top-level architecture but was wrong or underspecified in
several important places:

- The binder-checker boundary was contradictory (binder resolving facts vs
  checker querying the host — can't be both)
- `resolveFilesForSymbol` was treated as trivial when it's actually the core
  correlation problem
- Incremental invalidation only handled file content changes, not structural
  changes (new/deleted files)
- No error recovery strategy for when the target codebase has TS errors
- No discussion of contract trust/sandboxing for third-party contracts
- The `lib.d.ts` mapping was wrong — there IS a KindScript equivalent
- Inference was undersold and structurally misclassified
- Diagnostic deduplication between TS and KS checkers was unaddressed
- `KindScriptHost` had cache methods leaking implementation into interface

v3 fixes all of these.

---

## Part 1 — The TypeScript Compiler's Internal Architecture

Before mapping anything, we need a precise picture of what TypeScript actually
does internally. The compiler has five major phases, each producing a distinct
data structure that the next phase consumes.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TypeScript Compiler Pipeline                         │
│                                                                         │
│   Source     ┌─────────┐  Tokens  ┌────────┐  AST   ┌────────┐        │
│   Text ─────→│ Scanner │────────→│ Parser │───────→│ Binder │        │
│              └─────────┘         └────────┘        └───┬────┘        │
│                                                        │              │
│                                                   Symbols +           │
│                                                   Flow Graph          │
│                                                        │              │
│                                                   ┌────▼─────┐        │
│                                                   │ Checker  │        │
│                                                   └────┬─────┘        │
│                                                        │              │
│                                                  Types + Diagnostics  │
│                                                        │              │
│                                                   ┌────▼─────┐        │
│                                                   │ Emitter  │        │
│                                                   └────┬─────┘        │
│                                                        │              │
│                                                  .js  .d.ts  .map     │
└─────────────────────────────────────────────────────────────────────────┘
```

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

```
                         SourceFile
                        ╱          ╲
              TypeAlias              VariableStmt
             ╱    ╲                  ╱          ╲
        Ident   TypeLiteral     DeclList       Ident
        "Foo"   ╱    ╲           ╱
           PropSig  PropSig   VarDecl
           "x"      "y"      ╱     ╲
                          Ident   ObjectLiteral
                          "foo"    ╱       ╲
                               PropAssign  PropAssign
                               "x"         "y"

        ← type nodes →     ← value nodes →

  The parser treats these identically. Both are ts.Node.
  The normative/descriptive split is made later by the checker.
```

### Phase 3: Binder → Symbols + Flow Graph

The binder walks the AST and does two things:

1. **Creates Symbols.** A `ts.Symbol` represents a named entity (variable,
   function, class, module). Multiple AST nodes can contribute to the same
   symbol (declaration merging). The binder builds a symbol table that maps
   names to symbols within each scope.

2. **Builds the control flow graph.** Flow nodes track reachability and are used
   later for type narrowing.

```
  AST Nodes (syntactic)                     Symbols (semantic)
 ┌─────────────────────┐                  ┌─────────────────────┐
 │                      │                  │                      │
 │  InterfaceDecl "Foo" │──────┐     ┌────→│  Symbol "Foo"        │
 │    PropSig "x"       │──┐   ├─────┘     │    member "x"        │
 │    PropSig "y"       │──┤   │           │    member "y"        │
 │                      │  │   │           │                      │
 │  InterfaceDecl "Foo" │──┘───┘           │  (declaration merged │
 │    PropSig "z"       │──────────────────→    member "z")       │
 │                      │                  │                      │
 └─────────────────────┘                  └─────────────────────┘
                                    Binder
    Multiple AST nodes ─────────→ one Symbol
```

Key structural property: the binder connects the **syntactic** world (AST nodes)
to the **semantic** world (symbols, scopes, flows). It doesn't resolve types —
it just establishes the name-to-declaration mapping.

**Critically, the binder also triggers module resolution.** When it encounters
an import, it asks the `CompilerHost` to find and parse the imported file. This
is where the filesystem enters the picture — not as a parsed input, but as an
ambient resource queried on demand through an abstraction.

**Equally critically, the binder does NOT resolve types.** When it sees
`const x: Foo = ...`, it records that the symbol `x` has a declared type
annotation pointing to the name `Foo`. It does not resolve what `Foo` actually
is, what properties it has, or whether the assignment is valid. That's the
checker's job, done lazily when something asks for the type of `x`.

### Phase 4: Checker → Types + Diagnostics

The checker is the largest single component (~45,000 lines in `checker.ts`). It:

- Resolves types for every expression and declaration
- Checks assignability (`isTypeAssignableTo`)
- Performs control flow narrowing
- Resolves overloads, generics, conditional types, mapped types
- Accumulates `ts.Diagnostic` objects for every violation

```
                    Checker
                 ┌──────────────────────────────────┐
                 │                                    │
  Symbols ──────→│  resolve types (lazy + cached)     │
                 │          │                         │
                 │          ▼                         │
                 │  check assignability               │──────→ Diagnostics[]
                 │  narrow via control flow            │
                 │  resolve generics / conditionals    │
                 │                                    │
                 │  ┌──────────────────────────────┐  │
                 │  │ Never mutates the AST.        │  │
                 │  │ Never throws on errors.       │  │
                 │  │ Accumulates diagnostics.      │  │
                 │  │ Resolves on demand + caches.  │  │
                 │  └──────────────────────────────┘  │
                 └──────────────────────────────────┘
```

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

```
  ┌────────────────────────────────────────────────────────────────────┐
  │                       CompilerHost                                  │
  │                                                                     │
  │  The single abstraction through which ALL inputs are accessed.      │
  │  Everything that enters the compiler passes through this interface. │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  fileExists(fileName)           → boolean                    │   │
  │  │  readFile(fileName)             → string                     │   │
  │  │  getSourceFile(fileName)        → SourceFile (AST)           │   │
  │  │  resolveModuleNames(names, src) → ResolvedModule[]           │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └─────┬─────────┬───────────┬──────────────┬─────────────────────────┘
        │         │           │              │
        ▼         ▼           ▼              ▼
   user .ts    lib.d.ts   @types/*      filesystem
   files       files      packages     (module resolution)
        │         │           │              │
        └────┬────┘───────────┘              │
             ▼                               │
     Same SourceFile AST          Queried on demand during
     for ALL of these             binding, not pre-parsed
```

The actual pipeline:

```
  tsconfig.json
       │
       ▼
  Program.create()
       │
       ├──→ resolve root file names
       │
       ├──→ for each root file:
       │       │
       │       ├──→ CompilerHost.getSourceFile(fileName)
       │       │       │
       │       │       ├──→ readFile(fileName) → raw text
       │       │       └──→ createSourceFile(text) → SourceFile AST
       │       │
       │       └──→ for each import in SourceFile:
       │               │
       │               ├──→ resolveModuleName(importPath)
       │               │       └──→ CompilerHost queries filesystem
       │               │
       │               └──→ getSourceFile(resolved) → SourceFile AST
       │                       └──→ (recursive — discovers full file graph)
       │
       ├──→ all SourceFiles collected into Program
       │
       ├──→ Binder: walk each SourceFile → Symbols + scopes
       │
       └──→ Checker: validate types on demand → Diagnostics
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

v1 of this document proposed a "dual front-end":

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  v1 architecture (WRONG — unnecessarily complex)                  │
  │                                                                    │
  │                    ┌──────────────────┐                            │
  │   .ks files  ────→ │ Definition Parser │ ──→ KindScript AST        │
  │                    └──────────────────┘                  ╲         │
  │                                                          ╲        │
  │                                                    Binder → Checker│
  │                                                          ╱        │
  │                    ┌──────────────────┐                  ╱         │
  │   codebase   ────→ │  Fact Extractors  │ ──→ Fact Model            │
  │                    └──────────────────┘                            │
  │                                                                    │
  │   Two parsers. Two data structures. Merged at the binder.          │
  │   This was an implementation choice disguised as a necessity.      │
  └──────────────────────────────────────────────────────────────────┘
```

### How TypeScript avoids this

TypeScript has the same normative/descriptive split:

- **Type annotations** are normative — they declare what should be true
- **Expressions and values** are descriptive — they are what is true
- **The runtime environment** (`lib.d.ts`) describes ambient capabilities

```
  How TypeScript handles its normative/descriptive split:

  ┌─ user.ts ──────────────────────────────────────┐
  │                                                  │
  │   type Foo = { x: string; y: number }  ← normative (what must hold)
  │                                                  │
  │   const foo: Foo = { x: "hi", y: 42 }  ← descriptive (what exists)
  │                                                  │
  └──────────────────────────────────────────────────┘
                         │
                    same parser
                    same AST
                    same binder
                         │
                         ▼
                      Checker
            "does the value match the type?"
```

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
  ┌──────────────────────────────────────────────────────────────────┐
  │  v2/v3 architecture (correct — mirrors TypeScript)                │
  │                                                                    │
  │   kind-definitions.ts ──┐                                         │
  │   instance-decls.ts   ──┼──→ TypeScript Parser ──→ uniform TS AST │
  │   codebase src/*.ts   ──┘                                │        │
  │                                                          │        │
  │                                                    ┌─────▼──────┐ │
  │                    KindScriptHost ◄────────────────│  KS Binder │ │
  │                  (queried on demand                └─────┬──────┘ │
  │                   by CHECKER, not binder)                │        │
  │                                                          │        │
  │                  ┌──────────────────────┐           ┌─────▼──────┐ │
  │                  │ • filesystem tree     │           │ KS Checker │ │
  │                  │ • import edges       ◄───────────│            │ │
  │                  │ • package.json       │           └─────┬──────┘ │
  │                  │ • directory listings  │                │        │
  │                  └──────────────────────┘          Diagnostics     │
  │                                                                    │
  │   One parser. One AST. Host queried lazily by the checker.        │
  └──────────────────────────────────────────────────────────────────┘
```

The KindScript binder walks the TypeScript AST and classifies what it finds,
recording declared properties as-is without resolving them against reality:

```
  KS Binder: AST Classification (recording, not resolving)
  ─────────────────────────────────────────────────────────

  Walking the TypeScript AST...

  ┌────────────────────────────────────────┐
  │  type OrderingContext = Kind<"..."> &  │     ArchSymbol {
  │    { domain: DomainLayer; ... }        │──→    symbolKind: Kind
  └────────────────────────────────────────┘       members: [domain, app, infra]
                                                 }
                                                 Binder records the TYPE SHAPE.
                                                 Does NOT ask host about anything.

  ┌────────────────────────────────────────┐
  │  const ordering: OrderingContext = {   │     ArchSymbol {
  │    kind: "OrderingContext",            │──→    symbolKind: Instance
  │    location: "src/contexts/ordering",  │       declaredLocation: "src/contexts/ordering"
  │    domain: { ... }                     │       kind: → (ref to Kind above)
  │  }                                     │     }
  └────────────────────────────────────────┘     Binder records the DECLARED LOCATION
                                                 as a string. Does NOT check if the
                                                 directory exists. That's the checker's job.

  ┌────────────────────────────────────────┐
  │  const contracts =                     │     Contract[] {
  │    defineContracts<OrderingContext>({   │──→    noDependency: ["domain", "infra"]
  │      noDependency: [["domain","infra"]]│       purity: ["domain"]
  │    })                                  │     }
  └────────────────────────────────────────┘     Binder records the DECLARED CONTRACTS
                                                 as descriptors. Does NOT evaluate them.
```

The filesystem (directory structure, file existence, file paths) is accessed
through a host abstraction during **checking** — exactly how TypeScript's
checker calls `getTypeOfSymbol()` which triggers lazy resolution. The binder
doesn't validate anything. It classifies and records.

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
demand by the checker, just like TypeScript queries types on demand.

### Why this matters

This isn't just aesthetics. The single-front-end architecture gives us:

```
  What the single front-end eliminates:

  ┌──────────────────────┐      ┌──────────────────────┐
  │   v1: two worlds      │      │   v2/v3: one world    │
  │                        │      │                        │
  │  ┌──────┐  ┌──────┐  │      │  ┌──────────────────┐  │
  │  │def IR│  │fact IR│  │      │  │   TypeScript AST  │  │
  │  └──┬───┘  └───┬──┘  │      │  └────────┬─────────┘  │
  │     │ translate │     │      │           │             │
  │     ▼          ▼      │      │           ▼             │
  │  ┌──────────────────┐│      │  ┌──────────────────┐  │
  │  │  merged model     ││      │  │  one AST, one     │  │
  │  │  (new data struct)││      │  │  binder, one host │  │
  │  └──────────────────┘│      │  └──────────────────┘  │
  └──────────────────────┘      └──────────────────────┘

  Eliminated: custom parser, custom AST, translation layer,
              separate fact IR, merging logic
```

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
  └────┬─────┘                        └────┬─────┘     architecturally,
       │                                   │            records, does NOT
   ts.Symbol                          ArchSymbol        resolve against
       │                                   │            reality)
  ┌────▼─────┐                        ┌────▼─────┐
  │TS Checker│                        │KS Checker│  ← NEW (resolves
  └────┬─────┘                        └────┬─────┘     lazily via host,
       │                                   │            evaluates contracts)
  ts.Diagnostic                      ArchDiagnostic  ← extended
       │                                   │
  ┌────▼─────┐                        ┌────▼─────┐
  │ Emitter  │                        │Generator │  ← adapted
  └────┬─────┘                        └────┬─────┘
       │                                   │
   .js  .d.ts                      scaffolds  patches


  Shared: ▓▓▓▓▓▓▓▓ (scanner, parser, AST)
  New:    ░░░░░░░░ (binder, checker, generator)
  Host:   queried lazily by the CHECKER (not the binder)
```

### Component mapping table

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
                                    contracts, creates ArchSymbols
                                    with declared properties — does NOT
                                    resolve against host/filesystem)

Symbol (ts.Symbol)                  ArchSymbol (named architectural
                                    entity — kind, instance, layer,
                                    port, boundary)

Checker (Symbols + Types            KS Checker (ArchSymbols →
         → Diagnostics)              lazy host queries →
                                     Diagnostics)

Type (ts.Type)                      ResolvedKind (fully expanded kind
                                    with inherited contracts)

isTypeAssignableTo(A, B)            doesInstanceSatisfyKind(I, K)

Diagnostic (ts.Diagnostic)          ArchDiagnostic (violation with
                                    contract reference, fix hint)

Emitter (AST → .js/.d.ts)          Generator (kind defs → scaffolded
                                    code, violations → fix patches)

Inference (implicit types           Inference (codebase → inferred
  from expressions)                   kind definitions) — own component,
                                      NOT part of the emitter

Program (ts.Program)                ks.Program (wraps ts.Program,
                                    adds architectural checking)

LanguageService                     Extends TS LanguageService with
                                    architectural diagnostics + fixes

CompilerOptions                     KindScriptConfig (which contracts
                                    to enforce, strictness, host config)

lib.d.ts                            Standard kind library
  (describes runtime environment)     (lib.clean-architecture.ts,
                                      lib.hexagonal.ts, etc. — pre-built
                                      pattern definitions that ship
                                      with KindScript)

.tsbuildinfo                        .ksbuildinfo (cached host query
                                    results for incremental re-checking)
```

The mapping is tighter than v1 because we're not inventing new front-end
components. The scanner, parser, and AST are TypeScript's own. KindScript
adds a binder (to classify nodes architecturally), a checker (to evaluate
contracts lazily via host), a host abstraction (to answer ambient queries),
and an inference engine (to derive kind definitions from existing codebases).

---

## Part 4 — What KindScript Adds Beyond TypeScript

With the single-front-end architecture, KindScript's genuinely new components
are: a binder, a checker, a host, an inference engine, and a generator.

```
  What KindScript adds (and what it reuses):

  ╔══════════════════════════════════════════════════════════════════╗
  ║                        ks.Program                               ║
  ║                                                                  ║
  ║   ┌────────────────────────────────────────────────────────┐    ║
  ║   │            REUSED FROM TYPESCRIPT                       │    ║
  ║   │                                                         │    ║
  ║   │   Scanner ──→ Parser ──→ ts.Node AST ──→ ts.Program    │    ║
  ║   │                                              │          │    ║
  ║   │                                         TS Checker      │    ║
  ║   │                                  (structural conformance)│    ║
  ║   └────────────────────────────────────────────────────────┘    ║
  ║                              │                                   ║
  ║   ┌──────────────────────────▼─────────────────────────────┐    ║
  ║   │            NEW IN KINDSCRIPT                            │    ║
  ║   │                                                         │    ║
  ║   │   KS Binder ──→ ArchSymbols ──→ KS Checker             │    ║
  ║   │   (classify,        │             (resolve lazily,      │    ║
  ║   │    record)          │              evaluate contracts)  │    ║
  ║   │                     │                  ▲                │    ║
  ║   │                     │    KindScriptHost │                │    ║
  ║   │                     │    (queries) ─────┘                │    ║
  ║   │                     │                                    │    ║
  ║   └─────────────────────┼────────────────────────────────────┘    ║
  ║                         │                                        ║
  ║                   Diagnostics                                    ║
  ║                (merged: TS structural                            ║
  ║                 + KS behavioral)                                 ║
  ╚══════════════════════════════════════════════════════════════════╝
```

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
  readonly members?: ArchSymbolTable;   // child symbols (from type shape)
  readonly declaredLocation?: string;   // raw string, NOT validated
  readonly declaredContracts?: ContractDescriptor[];  // raw descriptors
  readonly parent?: ArchSymbol;         // containing scope
}

type ArchSymbolTable = Map<string, ArchSymbol>;
```

The binder's job:

```
  TS AST                                    ArchSymbol Graph
  ──────                                    ────────────────

  TypeAliasDecl ─────────────────────────→  ArchSymbol
    name: "OrderingContext"                   name: "OrderingContext"
    type: IntersectionType                    symbolKind: Kind
      Kind<"OrderingContext">                 members:
      TypeLiteral                               ┌─────────────────────────┐
        PropSig "domain"     ─────────────→     │ "domain" → ArchSymbol   │
        PropSig "application"─────────────→     │ "app"    → ArchSymbol   │
        PropSig "infrastructure"──────────→     │ "infra"  → ArchSymbol   │
                                                └─────────────────────────┘

  VarDecl ───────────────────────────────→  ArchSymbol
    name: "ordering"                          name: "ordering"
    type: OrderingContext                     symbolKind: Instance
    initializer: {                            declaredLocation: "src/contexts/ordering"
      location: "src/contexts/ordering"       kind: → (ref to Kind above)
    }
                                              NOTE: declaredLocation is a RAW STRING.
                                              The binder does NOT ask the host whether
                                              this path exists. That happens in the
                                              checker, lazily.

  CallExpression ────────────────────────→  ContractDescriptor[]
    defineContracts<OrderingContext>({         { type: "noDependency",
      noDependency: [["domain","infra"]]        args: ["domain", "infra"] }
    })                                        These are DATA, not evaluated.
                                              Attached to the Kind symbol.
```

The binder's three responsibilities:

1. Walk the TypeScript AST looking for types that extend `Kind<N>`. For each
   one, create an `ArchSymbol` with `symbolKind: Kind` and populate its
   `members` from the type's fields.

2. Walk the AST looking for variable declarations typed as kind types. For
   each one, create an `ArchSymbol` with `symbolKind: Instance` and record its
   `declaredLocation` as a raw string.

3. Walk the AST looking for `defineContracts(...)` calls. Parse the contract
   descriptors as data (not code) and attach them to the corresponding kind
   symbols.

The binder does NOT query the host. It does NOT validate locations. It does NOT
check whether contracts are satisfiable. It classifies and records.

### 4.2 The Binder-Checker Split

This is the most important design boundary in KindScript and it mirrors
TypeScript's own binder-checker split exactly.

```
  TypeScript's split:

  Binder                              Checker
  ──────                              ───────
  sees: const x: Foo = expr           resolves: what IS Foo?
  records: symbol "x" has             resolves: what is the type of expr?
    declared type name "Foo"          checks: is typeof(expr) assignable to Foo?
  does NOT resolve Foo                produces diagnostic if not

  The binder creates the SYMBOL TABLE.
  The checker RESOLVES and VALIDATES lazily.


  KindScript's split (same pattern):

  KS Binder                           KS Checker
  ─────────                            ──────────
  sees: location: "src/ordering"       resolves: does src/ordering exist?
  records: declaredLocation =            (asks host.directoryExists)
    "src/ordering"                     resolves: what files are in it?
  does NOT ask the host                  (asks host.getDirectoryEntries)
                                       checks: do those files satisfy contracts?
  sees: noDependency(domain, infra)    evaluates: get import edges between
  records: ContractDescriptor            domain files and infra files
    { type: "noDependency",              (asks host.getImportsForFile)
      args: ["domain", "infra"] }      checks: are there zero edges?
  does NOT evaluate the contract       produces diagnostic if not

  The binder creates the ARCH SYMBOL TABLE.
  The checker RESOLVES and VALIDATES lazily.
```

Why this matters:

1. **The binder is fast.** It does a single AST walk. No I/O, no host queries,
   no expensive resolution. This means binding is near-instant even for large
   definition files.

2. **The checker is lazy.** It only resolves what it needs, when it needs it.
   If a particular contract is disabled in config, its symbols are bound but
   never resolved. If only one file changed, only affected contracts trigger
   resolution.

3. **The host is only queried during checking.** This makes the binder
   completely deterministic (same AST → same symbols, always) and makes the
   checker the single point where ambient reality enters the system. This is
   exactly how TypeScript works: the binder is deterministic, the checker
   queries the host for type resolution.

### 4.3 The KindScript Checker

This is the heart of the system. TypeScript's checker validates that values
conform to types. KindScript's checker validates that the codebase conforms
to architectural contracts.

```
  What each checker is responsible for:

  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                    │
  │  TypeScript Checker (structural — already done for us)            │
  │  ─────────────────────────────────────────────────────            │
  │                                                                    │
  │  ✓ "Instance is missing required field 'domain'"                  │
  │  ✓ "Type 'string' is not assignable to type 'DomainLayer'"       │
  │  ✓ "Kind discriminant must be literal 'OrderingContext'"          │
  │  ✓ Recursive structural matching through the type hierarchy       │
  │                                                                    │
  ├────────────────────────────────────────────────────────────────────┤
  │                                                                    │
  │  KindScript Checker (behavioral — what we build)                  │
  │  ───────────────────────────────────────────────                  │
  │                                                                    │
  │  ✓ "domain/ imports from infrastructure/ (forbidden)"             │
  │  ✓ "Port OrderRepository has no adapter implementation"           │
  │  ✓ "Circular dependency: ordering → billing → ordering"           │
  │  ✓ "domain/ imports 'fs' (impure, violates purity contract)"     │
  │  ✓ "Directory 'domain' expected at src/ordering/domain"           │
  │                                                                    │
  └──────────────────────────────────────────────────────────────────┘
```

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

Contract evaluation flow:

```
  checkProgram()
       │
       ├──→ for each Instance symbol:
       │       │
       │       ├──→ resolve its Kind symbol
       │       │       └──→ get the Kind's ContractDescriptors
       │       │
       │       └──→ for each ContractDescriptor:
       │               │
       │               ├──→ resolve contract args to ArchSymbols
       │               │     "domain" → ArchSymbol for domain member
       │               │     "infrastructure" → ArchSymbol for infra member
       │               │
       │               ├──→ resolve those symbols to files
       │               │     (see 4.4: Symbol-to-Files Resolution)
       │               │     THIS IS WHERE THE HOST IS QUERIED
       │               │
       │               └──→ evaluate the contract against resolved files
       │                     noDependency → check import edges
       │                     mustImplement → check interface implementors
       │                     purity → check import targets
       │                     │
       │                     └──→ ArchDiagnostic[] (violations)
       │
       └──→ collect all diagnostics
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

### 4.4 Symbol-to-Files Resolution

In the `checkDependencyContract` flow above, the step "resolve those symbols
to files" was presented as trivial. It is not. This is the core correlation
problem — mapping from architectural declarations to filesystem reality —
and it is analogous to TypeScript's module resolution, which is complex enough
to have its own dedicated documentation and multiple strategy options (`node`,
`classic`, `bundler`, `node16`).

```
  The problem:

  ArchSymbol {                              Filesystem
    name: "domain"                          ─────────────
    symbolKind: Layer                       src/
    declaredLocation: "src/ordering/domain"   contexts/
  }                                             ordering/
                                                  domain/
  What files "belong" to this symbol?               order.ts
                                                    customer.ts
  Naive answer: everything under                    service.ts
    src/ordering/domain/                            ports/
                                                      order-repo.port.ts
  But what about:                                     email.port.ts
  - nested subdirectories?                        application/
  - index files vs implementation files?            ...
  - test files mixed in?                          infrastructure/
  - generated files?                                ...
  - glob patterns in the kind definition?
  - files claimed by a child symbol?
```

The resolution function:

```typescript
interface ResolvedFile {
  readonly path: string;
  readonly sourceFile: ts.SourceFile;
}

interface FileResolutionStrategy {
  resolveFilesForSymbol(
    symbol: ArchSymbol,
    host: KindScriptHost,
  ): ResolvedFile[];
}
```

Resolution must account for:

```
  Inputs to file resolution:

  ┌─────────────────────────────────────┐
  │  symbol.declaredLocation            │  "src/ordering/domain"
  │  symbol.members (child symbols)     │  ports, entities, services
  │  host.getDirectoryEntries()         │  actual files on disk
  │  host.fileExists()                  │  probe specific paths
  │  kindDef.filePatterns (if any)      │  "**/*.ts", "!**/*.test.ts"
  │  config.excludePatterns             │  global exclusions
  └─────────────────────┬───────────────┘
                        │
                        ▼
  ┌─────────────────────────────────────┐
  │  FileResolutionStrategy             │
  │                                      │
  │  1. Start at declaredLocation        │
  │  2. Recursively list directory       │
  │  3. Apply include/exclude patterns   │
  │  4. Subtract files claimed by        │
  │     child symbols (avoid double      │
  │     counting)                        │
  │  5. Return ResolvedFile[]            │
  └─────────────────────┬───────────────┘
                        │
                        ▼
  ┌─────────────────────────────────────┐
  │  ResolvedFile[]                      │
  │                                      │
  │  src/ordering/domain/order.ts        │
  │  src/ordering/domain/customer.ts     │
  │  src/ordering/domain/service.ts      │
  │  src/ordering/domain/ports/          │
  │    order-repo.port.ts                │
  │    email.port.ts                     │
  └─────────────────────────────────────┘
```

Like TypeScript's module resolution, file resolution should be a **pluggable
strategy** configured in `kindscript.json`. The default strategy handles the
common case (recursive directory listing with glob filtering), but projects
with unusual layouts can provide a custom strategy.

```
  Resolution strategies (parallel to TypeScript's moduleResolution):

  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
  │  "directory"        │  │  "glob"             │  │  "package"          │
  │  (default)          │  │                      │  │                      │
  │  declaredLocation   │  │  declaredLocation   │  │  Uses package.json   │
  │  = directory path   │  │  = glob pattern     │  │  "files" or "exports"│
  │  → recursive listing│  │  → glob match       │  │  to determine what   │
  │    minus exclusions │  │    across codebase  │  │  files belong to     │
  │                      │  │                      │  │  a symbol            │
  └────────────────────┘  └────────────────────┘  └────────────────────┘
```

Resolution results are cached by the checker (same pattern as TypeScript
caching resolved module paths).

### 4.5 The KindScriptHost

This is KindScript's version of `CompilerHost` — an abstraction over the
ambient environment that the checker queries on demand.

```
  KindScriptHost: the single seam to the outside world
  ─────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────────────┐
  │                      KindScriptHost                          │
  │                 extends ts.CompilerHost                       │
  │                                                               │
  │  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────┐  │
  │  │   Filesystem     │ │  TS Compiler API  │ │   Packages    │  │
  │  │                  │ │                   │ │               │  │
  │  │ fileExists()     │ │ getImportsFor     │ │ getPkgJson() │  │
  │  │ directoryExists()│ │   File()          │ │ getWorkspace │  │
  │  │ getDirEntries()  │ │ getExported       │ │   Packages() │  │
  │  │ readFile()       │ │   Symbols()       │ │               │  │
  │  │                  │ │ getDependency     │ │               │  │
  │  │                  │ │   Edges()         │ │               │  │
  │  └────────┬────────┘ └────────┬──────────┘ └──────┬───────┘  │
  └───────────┼───────────────────┼───────────────────┼──────────┘
              │                   │                   │
              ▼                   ▼                   ▼
         real filesystem     ts.Program API      package.json
         (or mock/remote)    (or ts-morph)       (or registry)
```

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
}
```

Note: the host interface is **pure queries**. There are no `getCachedResult` or
`setCachedResult` methods. Caching is an implementation concern of a particular
host implementation (`cachedHost`), not part of the interface contract. This
mirrors TypeScript's `CompilerHost`, which has no caching API — caching happens
internally in the host implementation and inside the checker's own memoization.

```
  Host implementations:

  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │   defaultHost     │   │   cachedHost      │   │   testHost        │
  │                    │   │                    │   │                    │
  │  Real filesystem   │   │  Wraps defaultHost │   │  In-memory files   │
  │  Real TS compiler  │   │  with memoization  │   │  Predetermined     │
  │  Real package.json │   │  layer. Hashes     │   │  import edges.     │
  │                    │   │  files. Invalidates│   │  Controlled dirs.  │
  │  Used in           │   │  on change.        │   │                    │
  │  production.       │   │  Persists to       │   │  No filesystem     │
  │                    │   │  .ksbuildinfo.      │   │  needed.           │
  └──────────────────┘   └──────────────────┘   └──────────────────┘

  The interface is the same. Caching is transparent.
  The checker doesn't know or care which implementation it's using.
```

Why extend `ts.CompilerHost` rather than creating a separate interface? Because
KindScript's program already needs a TypeScript `Program` to read the AST. By
extending `CompilerHost`, the same host serves both TypeScript's needs (file
reading, module resolution) and KindScript's needs (directory structure, import
graph, package metadata). One abstraction, one seam for testing.

### 4.6 The Generator (spec → code)

TypeScript's emitter reads the AST and produces output files. KindScript's
generator reads the architecture graph and produces:

```
  Generator modes:

  ┌─────────────────────┐         ┌──────────────────────────────┐
  │  Kind Definition     │────────→│  Scaffolded directories       │
  │  (OrderingContext)   │  scaffold│  and stub files:              │
  │                      │         │                                │
  │                      │         │  src/contexts/ordering/        │
  │                      │         │    domain/                     │
  │                      │         │      index.ts                  │
  │                      │         │    application/                │
  │                      │         │      index.ts                  │
  │                      │         │    infrastructure/             │
  │                      │         │      index.ts                  │
  └─────────────────────┘         └──────────────────────────────┘

  ┌─────────────────────┐         ┌──────────────────────────────┐
  │  ArchDiagnostic      │────────→│  Fix patch:                   │
  │  (KS1001: forbidden  │   fix   │                                │
  │   import)            │         │  - import { Db } from '../..'  │
  │                      │         │  + import { Db } from          │
  │                      │         │      '../../ports/db.port'     │
  └─────────────────────┘         └──────────────────────────────┘
```

- **Scaffolded code**: create files and directories to satisfy a kind definition
- **Fix patches**: modify imports, move files, or adjust exports to fix violations

The generator takes specifications and produces code. This is the emitter's
direct analog.

### 4.7 Inference (code → spec)

Inference is a separate component from generation. Generation takes a spec and
produces code. Inference takes a codebase and produces a spec. They are
inverses, but they share no logic. Inference is structurally closer to
TypeScript's **type inference engine** (which derives types from expressions)
than to its emitter.

```
  Generator vs Inference — opposite directions:

  Generator (spec → code):

    Kind definition ──────→ scaffolded directories + files
    ArchDiagnostic  ──────→ fix patches

  Inference (code → spec):

    existing codebase ────→ draft kind definitions
    filesystem layout ────→ proposed architecture.ts

  These are INVERSES. They share no logic.
  Inference is its own component.
```

What inference actually does:

```
  ksc infer --root src/contexts/ordering
       │
       ├──→ Walk filesystem structure
       │       src/contexts/ordering/
       │         domain/           ← recognized: possible layer
       │           entities/       ← recognized: DDD pattern
       │           ports/          ← recognized: hexagonal pattern
       │           services/
       │         application/      ← recognized: possible layer
       │           commands/
       │           handlers/
       │         infrastructure/   ← recognized: possible layer
       │           adapters/       ← recognized: hexagonal pattern
       │           persistence/
       │
       ├──→ Analyze import graph
       │       domain → application:    0 edges  ✓
       │       domain → infrastructure: 0 edges  ✓
       │       application → domain:    12 edges (expected)
       │       application → infra:     0 edges  ✓
       │       infrastructure → domain: 3 edges  (expected, via ports)
       │       infrastructure → app:    2 edges  ← suspicious
       │
       ├──→ Identify dependency direction
       │       domain is depended-on, depends on nothing → innermost layer
       │       application depends on domain only → middle layer
       │       infrastructure depends on both → outermost layer
       │       Pattern match: Clean Architecture
       │
       ├──→ Generate draft architecture.ts
       │       type OrderingContext = Kind<"OrderingContext"> & {
       │         domain: DomainLayer;
       │         application: ApplicationLayer;
       │         infrastructure: InfrastructureLayer;
       │       };
       │       const contracts = defineContracts<OrderingContext>({
       │         noDependency: [["domain", "infrastructure"],
       │                        ["domain", "application"]],
       │       });
       │
       └──→ Run checker against draft → immediate violation report
               "infrastructure/persistence/repo.ts imports from
                application/handlers/order-handler.ts"
               (the 2 suspicious edges found during analysis)
```

Inference is potentially the most important adoption feature. The difference
between "write kind definitions to use KindScript" and "run `ksc infer` and get
draft definitions plus a violation report" is the difference between a tool that
requires upfront investment and one that provides immediate value on an existing
codebase.

### 4.8 Error Recovery

What happens when the target codebase has TypeScript errors?

```
  Scenario: codebase has TS errors

  ┌─ src/ordering/domain/service.ts ──────────────┐
  │                                                  │
  │  import { Order } from './order';                │
  │  import { UnknownThing } from './nonexistent';  │ ← TS2307: cannot
  │                                                  │    find module
  │  export function process(o: Order): Foo {        │ ← TS2304: cannot
  │    return o.bar();                               │    find name 'Foo'
  │  }                                               │
  └──────────────────────────────────────────────────┘

  TypeScript checker produces diagnostics for these.
  But can KindScript still check architectural contracts?
```

KindScript should check contracts even when the target codebase has TypeScript
errors, because architectural violations and type errors are often independent.
A file can have correct architectural placement and valid import direction while
still having type errors internally.

```
  Error recovery strategy:

  ┌───────────────────────────────────────────────────────────────┐
  │                                                                 │
  │  KS Binder                                                      │
  │  ─────────                                                      │
  │  Creates ArchSymbols for everything it CAN classify.            │
  │  If a type extends Kind<N> but has TS errors in its body,       │
  │  the binder still creates the symbol with whatever members      │
  │  it can resolve. Missing members are omitted, not faked.        │
  │                                                                 │
  │  KS Checker                                                     │
  │  ──────────                                                     │
  │  For symbols with complete resolution:                          │
  │    → evaluate contracts normally                                │
  │                                                                 │
  │  For symbols with incomplete resolution:                        │
  │    → produce KS0001 warning (not error):                        │
  │      "Cannot fully evaluate contracts for 'OrderingContext'     │
  │       due to TypeScript errors in domain/service.ts.            │
  │       Partial results shown below."                             │
  │    → evaluate whatever contracts CAN be evaluated               │
  │      (e.g., location checks still work even if types are        │
  │       broken; dependency checks work for resolvable imports)    │
  │                                                                 │
  │  Principle: partial results are better than no results.         │
  │  Mirrors TypeScript's own approach: unresolvable → 'any',      │
  │  keep checking everything else.                                 │
  │                                                                 │
  └───────────────────────────────────────────────────────────────┘
```

### 4.9 The Program

TypeScript's `ts.Program` is the top-level orchestrator. KindScript's program
wraps it:

```
  ks.Program composition:

  ╔═══════════════════════════════════════════════════════════╗
  ║                        ks.Program                          ║
  ║                                                             ║
  ║   ┌───────────────────────────────────────────────────┐    ║
  ║   │                   ts.Program                       │    ║
  ║   │                                                     │    ║
  ║   │  SourceFiles[]    CompilerOptions    TS Checker     │    ║
  ║   └───────────────────────┬───────────────────────────┘    ║
  ║                           │                                  ║
  ║   ┌───────────────────────▼───────────────────────────┐    ║
  ║   │                                                     │    ║
  ║   │   KindScriptHost ◄──────────────── KS Checker       │    ║
  ║   │                    KS Binder ────→ ArchSymbols[]    │    ║
  ║   └───────────────────────────────────────────────────┘    ║
  ║                           │                                  ║
  ║   getDiagnostics() ──────▼───────────────────────────────  ║
  ║     = ts.getPreEmitDiagnostics()   // structural (TS)       ║
  ║     + checker.getDiagnostics()     // behavioral (KS)       ║
  ║     + deduplicateRelated()         // correlate overlapping  ║
  ╚═══════════════════════════════════════════════════════════╝
```

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

**Diagnostic deduplication.** `getDiagnostics()` merges TypeScript's structural
diagnostics with KindScript's behavioral diagnostics. This creates a
deduplication problem: if a structural violation (missing `domain` field) is
caused by a broader architectural issue (the developer moved the domain layer
but didn't update the instance), the user gets a TS error and a KS error about
the same underlying problem.

```
  Deduplication: when TS and KS diagnostics overlap

  ┌───────────────────────────────────────────────────────────┐
  │  User moves domain/ to core/ but doesn't update instance   │
  │                                                             │
  │  TS produces:                                               │
  │    "Property 'domain' is missing in type '...'"            │
  │    at: architecture.ts:14                                   │
  │                                                             │
  │  KS produces:                                               │
  │    "Location 'src/ordering/domain' does not exist"          │
  │    at: architecture.ts:15                                   │
  │                                                             │
  │  These are about the SAME PROBLEM.                          │
  │                                                             │
  │  deduplicateRelated() detects overlapping source ranges     │
  │  and attaches the KS diagnostic as relatedInformation       │
  │  on the TS diagnostic (using TS's existing                  │
  │  DiagnosticRelatedInformation mechanism):                   │
  │                                                             │
  │  Final output:                                              │
  │    error TS2741: Property 'domain' is missing...            │
  │      at architecture.ts:14                                  │
  │      related: Location 'src/ordering/domain' does not exist │
  │               (KS2001) at architecture.ts:15                │
  └───────────────────────────────────────────────────────────┘
```

This uses TypeScript's own `DiagnosticRelatedInformation` mechanism — the same
mechanism TS uses for "Did you mean...?" suggestions. From the user's
perspective, overlapping errors are grouped rather than duplicated.

---

## Part 5 — The Constraint Language

TypeScript's "constraint language" is its type system — a rich structural type
algebra. KindScript needs a constraint language for behavioral contracts.

### What TypeScript's type system already handles

Because kind definitions are TypeScript types, the following constraints are
checked for free by `tsc`:

```
  Structural checks (handled by TypeScript — free):

  type OrderingContext = Kind<"OrderingContext"> & {
    domain: DomainLayer;                ← TS: "required field"
    application: ApplicationLayer;      ← TS: "must match shape"
    infrastructure: InfrastructureLayer;← TS: "recursive check"
  };

  const ordering: OrderingContext = {
    kind: "OrderingContext",            ← TS: "must be literal"
    domain: { ... },                    ← TS: "checked against DomainLayer"
    application: { ... },
    // infrastructure: ???              ← TS ERROR: missing required field
  };
```

### What KindScript must add

Behavioral contracts that operate over the codebase's actual structure:

```
  Behavioral checks (KindScript must build):

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │  noDependency(domain, infrastructure)                             │
  │  ──────────────────────────────────────                           │
  │                                                                   │
  │   domain/                    infrastructure/                      │
  │   ├── order.ts               ├── database.ts                     │
  │   ├── customer.ts            └── email-service.ts                │
  │   └── service.ts                                                  │
  │          │                          ▲                              │
  │          └── import { Db } ────────┘  ← KS1001: VIOLATION        │
  │                                                                   │
  ├───────────────────────────────────────────────────────────────────┤
  │                                                                   │
  │  mustImplement(domain.ports, infrastructure.adapters)             │
  │  ─────────────────────────────────────────────────────           │
  │                                                                   │
  │   domain/ports/              infrastructure/adapters/             │
  │   ├── order-repo.port.ts     └── pg-order-repo.adapter.ts       │
  │   └── email.port.ts              ← KS3001: no adapter            │
  │                                                                   │
  ├───────────────────────────────────────────────────────────────────┤
  │                                                                   │
  │  noCycles(boundedContexts)                                        │
  │  ─────────────────────────                                        │
  │                                                                   │
  │   ordering/ ──imports──→ billing/ ──imports──→ ordering/          │
  │       ▲                                           │               │
  │       └───────────── cycle detected ──────────────┘               │
  │                                     ← KS4001: VIOLATION          │
  │                                                                   │
  └───────────────────────────────────────────────────────────────────┘
```

| Contract | What it checks |
|---|---|
| `noDependency(A, B)` | No import edges from files in A to files in B |
| `mustImplement(P, A)` | Every port interface in P has an implementing class in A |
| `noCycles(contexts)` | No circular import paths between bounded contexts |
| `purity(layer)` | No imports of side-effecting modules in the layer |
| `colocated(A, B)` | A and B must be in the same directory |
| `exclusive(A, B)` | No file may belong to both A and B |

### Design: two tiers of contracts

Contracts have a **two-tier** design: declarative descriptors for the common
cases, and function-based contracts as an escape hatch.

```
  Two-tier contract system:

  ┌────────────────────────────────────────────────────────────────┐
  │  Tier 1: Declarative Contract Descriptors (data, not code)     │
  │                                                                  │
  │  { type: "noDependency", args: ["domain", "infrastructure"] }  │
  │  { type: "mustImplement", args: ["ports", "adapters"] }        │
  │  { type: "purity", args: ["domain"] }                          │
  │                                                                  │
  │  Properties:                                                     │
  │  ✓ Safe to share (no code execution)                            │
  │  ✓ Statically analyzable (checker knows the contract type)      │
  │  ✓ Invalidation scope is known (noDependency depends on         │
  │    import edges for two symbol sets — nothing else)              │
  │  ✓ Serializable (can go in .ksbuildinfo)                        │
  │  ✓ Can ship in third-party packages safely                      │
  │                                                                  │
  ├────────────────────────────────────────────────────────────────┤
  │  Tier 2: ContractFn (code — escape hatch)                      │
  │                                                                  │
  │  (args: ArchSymbol[], host: KindScriptHost) => ArchDiagnostic[]│
  │                                                                  │
  │  Properties:                                                     │
  │  ✓ Maximum expressiveness (arbitrary logic)                     │
  │  ✗ Not safe to share (arbitrary code with host access)          │
  │  ✗ Invalidation scope unknown (must re-run on any change)       │
  │  ✗ Requires explicit opt-in trust                               │
  │                                                                  │
  └────────────────────────────────────────────────────────────────┘
```

User-facing declaration uses typed helpers for Tier 1:

```typescript
const orderingContracts = defineContracts<OrderingContext>({
  noDependency: [["domain", "infrastructure"]],
  mustImplement: [["domain.ports", "infrastructure.adapters"]],
  purity: ["domain"],
});
```

`defineContracts<T>` is generic over the kind type, so the field paths
(`"domain"`, `"infrastructure"`, `"domain.ports"`) are type-checked by
TypeScript. Invalid paths are compile errors.

```
  Type-safe contract paths:

  defineContracts<OrderingContext>({
    noDependency: [
      ["domain", "infrastructure"],     ← TS checks: valid field paths
      ["domain", "application"],         ← TS checks: valid field paths
      ["domain", "shipping"],            ← TS ERROR: "shipping" not in
    ],                                              OrderingContext
  });
```

For Tier 2 (escape hatch), the `ContractFn` type provides full host access:

```typescript
type ContractFn = (
  args: ArchSymbol[],
  host: KindScriptHost,
) => ArchDiagnostic[];
```

Tier 2 contracts require explicit opt-in in `kindscript.json` (see Q5 in
Part 12).

### The standard kind library

Just as TypeScript ships `lib.d.ts` files that describe the runtime environment,
KindScript should ship a **standard kind library** — pre-built pattern
definitions for common architectural styles.

```
  Standard kind library (ships with KindScript):

  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                    │
  │  lib.clean-architecture.ts                                        │
  │  ─────────────────────────                                        │
  │  type CleanArchitecture = Kind<"CleanArchitecture"> & {           │
  │    domain: DomainLayer;                                           │
  │    application: ApplicationLayer;                                 │
  │    infrastructure: InfrastructureLayer;                            │
  │  };                                                                │
  │  const cleanArchContracts = defineContracts<CleanArchitecture>({  │
  │    noDependency: [["domain", "infrastructure"],                   │
  │                    ["domain", "application"]],                     │
  │    purity: ["domain"],                                             │
  │  });                                                               │
  │                                                                    │
  │  lib.hexagonal.ts                                                 │
  │  ────────────────                                                 │
  │  type HexagonalArchitecture = Kind<"Hexagonal"> & { ... };       │
  │  (ports, adapters, application core)                               │
  │                                                                    │
  │  lib.ddd-bounded-context.ts                                       │
  │  ──────────────────────────                                       │
  │  type BoundedContext = Kind<"BoundedContext"> & { ... };           │
  │  (aggregates, entities, value objects, domain events)              │
  │                                                                    │
  └──────────────────────────────────────────────────────────────────┘

  Analogy:
    lib.dom.d.ts tells TS       "you can use document.querySelector"
    lib.clean-architecture.ts   "a Clean Architecture has domain/app/infra
     tells KS                    with these dependency rules"
```

This is how you bootstrap an ecosystem. Users can start with `import { CleanArchitecture } from "kindscript/lib"` and declare instances immediately,
just as TypeScript users get `HTMLElement` and `Promise` from `lib.d.ts` without
installing anything.

---

## Part 6 — Diagnostic System

TypeScript's diagnostic system is well-designed. KindScript borrows it directly,
adding architectural context:

```
  Diagnostic anatomy:

  ┌──────────────────────────────────────────────────────────────────┐
  │  ArchDiagnostic                                                   │
  │                                                                    │
  │  ┌─ Standard (from TypeScript) ─────────────────────────────────┐ │
  │  │  code: KS1001                                                 │ │
  │  │  category: Error                                              │ │
  │  │  messageText: "Forbidden dependency from domain to infra..."  │ │
  │  │  file: src/ordering/domain/service.ts                         │ │
  │  │  start: 342                                                   │ │
  │  │  length: 51                                                   │ │
  │  └──────────────────────────────────────────────────────────────┘ │
  │                                                                    │
  │  ┌─ Architectural context (KindScript additions) ───────────────┐ │
  │  │  relatedContract:                                             │ │
  │  │    file: ordering.architecture.ts                             │ │
  │  │    start: 128                                                 │ │
  │  │    contractName: "noDependency(domain, infrastructure)"       │ │
  │  │  involvedSymbols: [domain, infrastructure]                    │ │
  │  │  suggestedFix: "Remove import or introduce a port"            │ │
  │  └──────────────────────────────────────────────────────────────┘ │
  └──────────────────────────────────────────────────────────────────┘
```

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
| KS0xxx | Meta / error recovery | Cannot fully evaluate due to TS errors |
| KS1xxx | Dependency violations | Forbidden import across layers |
| KS2xxx | Location violations | File/directory in wrong place |
| KS3xxx | Completeness violations | Port without adapter |
| KS4xxx | Cycle violations | Circular dependency between contexts |
| KS5xxx | Purity violations | Side-effecting import in domain |

Example output (mirrors `tsc` output format):

```
  $ kindscript check

  src/ordering/domain/service.ts:14:1 - error KS1001: Forbidden dependency
    from domain layer to infrastructure layer.

    14 │ import { Database } from '../../infrastructure/database';
       │ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       │
       │ Contract defined in ordering.architecture.ts:8:3
       │
     8 │   noDependency: [["domain", "infrastructure"]],
       │   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  src/ordering/domain/ports/email.port.ts:1:1 - error KS3001: Port
    'EmailService' has no implementing adapter.

     1 │ export interface EmailService {
       │ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       │
       │ Contract defined in clean-architecture.ts:12:3
       │
    12 │   mustImplement: [["domain.ports", "infrastructure.adapters"]],
       │   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Found 3 errors in 2 files.
```

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
  ┌──────────────────────────────────────────────────────────────────┐
  │                   Extended Language Service                        │
  │                                                                    │
  │   IDE / Editor (VS Code, etc.)                                    │
  │        │                                                           │
  │        ▼                                                           │
  │   ┌──────────────────────────────────────────────────────────┐    │
  │   │                  LSP Server (ks-server)                   │    │
  │   │                                                           │    │
  │   │   Merges diagnostics, completions, code actions from:     │    │
  │   │                                                           │    │
  │   │   ┌─────────────────────┐   ┌──────────────────────────┐ │    │
  │   │   │  TS LanguageService  │   │  KS LanguageService      │ │    │
  │   │   │                      │   │                           │ │    │
  │   │   │  • type errors       │   │  • contract violations   │ │    │
  │   │   │  • completions       │   │  • arch quick fixes      │ │    │
  │   │   │  • go-to-definition  │   │  • arch hover info       │ │    │
  │   │   │  • rename            │   │  • code lens (pass/fail) │ │    │
  │   │   └──────────┬──────────┘   └────────────┬─────────────┘ │    │
  │   │              │                            │                │    │
  │   │   ┌──────────▼──────────┐   ┌────────────▼─────────────┐ │    │
  │   │   │    TS Checker        │   │    KS Checker             │ │    │
  │   │   │  (type conformance)  │   │  (contract evaluation)   │ │    │
  │   │   └──────────┬──────────┘   └────────────┬─────────────┘ │    │
  │   │              │                            │                │    │
  │   │   ┌──────────▼────────────────────────────▼─────────────┐ │    │
  │   │   │                 KindScriptHost                       │ │    │
  │   │   │      (filesystem, imports, packages)                 │ │    │
  │   │   └─────────────────────────────────────────────────────┘ │    │
  │   │                                                           │    │
  │   │   deduplicateRelated() merges overlapping diagnostics     │    │
  │   └──────────────────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────────────────┘

  Both checkers share the same host.
  Both contribute to the same diagnostic stream.
  Overlapping diagnostics are correlated via relatedInformation.
  The user sees one integrated experience.
```

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
checker requests from `KindScriptHost`.

```
  Incremental: what gets cached where

  ┌─────────────────────────────────────────────────────────────┐
  │                                                               │
  │  .tsbuildinfo (TypeScript manages this)                       │
  │  ─────────────────────────────────────                        │
  │  • source file hashes                                         │
  │  • TS dependency graph                                        │
  │  • which TS diagnostics are still valid                       │
  │                                                               │
  ├─────────────────────────────────────────────────────────────┤
  │                                                               │
  │  .ksbuildinfo (KindScript manages this)                       │
  │  ──────────────────────────────────────                       │
  │  • file hashes for host-queried files                         │
  │  • cached import graph edges                                  │
  │  • cached directory listings (for detecting structural change)│
  │  • cached file resolution per symbol                          │
  │  • which contract checks are still valid                      │
  │                                                               │
  └─────────────────────────────────────────────────────────────┘
```

### Three invalidation triggers

The v2 document only handled file content changes. But there are three distinct
triggers, each with different invalidation behavior:

```
  Trigger (a): File content changed
  ──────────────────────────────────

  src/ordering/domain/service.ts was modified
       │
       ├──→ hash(service.ts) ≠ cached hash → file is dirty
       │
       ├──→ invalidate cached import edges for service.ts
       │
       ├──→ re-run contracts that depend on import edges
       │    involving service.ts:
       │      noDependency(domain, infra)    → re-check
       │      purity(domain)                 → re-check
       │
       └──→ contracts that don't involve service.ts → skip
            mustImplement(ports, adapters)  → skip
            (service.ts is not a port or adapter)


  Trigger (b): File created or deleted (structural change)
  ────────────────────────────────────────────────────────

  src/ordering/infrastructure/cache.ts was CREATED (new file)
       │
       ├──→ cached directory listing for infrastructure/ is stale
       │
       ├──→ re-resolve symbol-to-files for the "infrastructure" symbol
       │    (the file set has changed — cache.ts is now included)
       │
       ├──→ re-run ALL contracts involving the "infrastructure" symbol:
       │      noDependency(domain, infra)    → re-check
       │        (new file in infra means new potential import targets)
       │      mustImplement(ports, adapters) → re-check
       │        (cache.ts might be a new adapter)
       │
       └──→ this is HARDER than (a) because invalidation flows
            through symbol-to-files resolution, not just file hashes.
            A new file doesn't change any existing file's hash, but it
            changes which files belong to a symbol.


  Trigger (c): Definition file changed
  ─────────────────────────────────────

  architecture.ts was modified (kind definition or contracts changed)
       │
       ├──→ re-bind: re-walk the AST, rebuild ArchSymbols
       │
       ├──→ diff old symbols vs new symbols:
       │      new contract added?     → evaluate it from scratch
       │      contract removed?       → drop its diagnostics
       │      contract args changed?  → re-evaluate it
       │      kind shape changed?     → re-resolve affected symbols
       │
       └──→ re-check all affected contracts with fresh resolution
```

Each **declarative** contract (Tier 1) can declare its invalidation scope
statically, because the checker knows what host queries it depends on:

```
  Contract invalidation scopes:

  ┌─────────────────────┬────────────────────────────────────────┐
  │  Contract type       │  Depends on (invalidation scope)       │
  ├─────────────────────┼────────────────────────────────────────┤
  │  noDependency(A, B)  │  import edges for files in A            │
  │                      │  + file membership of A and B           │
  ├─────────────────────┼────────────────────────────────────────┤
  │  mustImplement(P, A) │  exported interfaces in P               │
  │                      │  + exported classes in A                │
  │                      │  + file membership of P and A           │
  ├─────────────────────┼────────────────────────────────────────┤
  │  noCycles(scope)     │  import edges for all files in scope   │
  │                      │  + file membership of all sub-symbols  │
  ├─────────────────────┼────────────────────────────────────────┤
  │  purity(layer)       │  import edges for files in layer       │
  │                      │  + file membership of layer            │
  ├─────────────────────┼────────────────────────────────────────┤
  │  ContractFn (Tier 2) │  UNKNOWN — must re-run on any change   │
  └─────────────────────┴────────────────────────────────────────┘
```

This is another advantage of the two-tier contract system: declarative contracts
enable precise invalidation, while `ContractFn` escape hatches force full
re-evaluation.

### Watch mode

```
  Watch mode event flow:

  ┌───────────────────────────────────────────────────────────────┐
  │  File watcher                                                   │
  │                                                                  │
  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
  │  │ Definition .ts    │  │ Codebase .ts  │  │ New/deleted file  │  │
  │  │ changed           │  │ content      │  │ or directory     │  │
  │  │                    │  │ changed       │  │                    │  │
  │  │  Trigger (c)       │  │  Trigger (a)  │  │  Trigger (b)      │  │
  │  └───────┬──────────┘  └──────┬───────┘  └───────┬──────────┘  │
  │          │                     │                   │              │
  │          ▼                     ▼                   ▼              │
  │  re-bind, diff symbols  invalidate file's  invalidate dir       │
  │  re-check affected      cached edges,      listings, re-resolve │
  │  contracts              re-check affected  symbol-to-files,     │
  │                         contracts          re-check affected    │
  │                                            contracts            │
  │          │                     │                   │              │
  │          └─────────────────────┼───────────────────┘              │
  │                                ▼                                  │
  │                   report diagnostics incrementally                │
  └───────────────────────────────────────────────────────────────┘
```

---

## Part 9 — Module Structure

```
  packages/kindscript/src/

  ┌─ compiler/ ───────────────────────────────────────────────────┐
  │                                                                 │
  │  types.ts              ArchSymbol, ArchDiagnostic, ResolvedKind │
  │                        ContractDescriptor, KindScriptConfig     │
  │                        ← mirrors TypeScript's types.ts          │
  │                                                                 │
  │  binder.ts             Walks TS AST, creates ArchSymbols        │
  │                        with declared properties (strings,       │
  │                        descriptors). Does NOT query host.       │
  │                        ← mirrors TypeScript's binder.ts         │
  │                                                                 │
  │  checker.ts            Resolves lazily via host. Evaluates      │
  │                        contracts. Produces ArchDiagnostics.     │
  │                        ← mirrors TypeScript's checker.ts        │
  │                                                                 │
  │  resolution.ts         Symbol-to-files resolution strategies.   │
  │                        ← mirrors TypeScript's moduleResolver.ts │
  │                                                                 │
  │  generator.ts          Generates scaffolding / fix patches      │
  │                        ← mirrors TypeScript's emitter.ts        │
  │                                                                 │
  │  inference.ts          Derives kind definitions from existing   │
  │                        codebases. Walks filesystem, analyzes    │
  │                        import graph, proposes kind types.       │
  │                        ← mirrors TypeScript's type inference    │
  │                                                                 │
  │  program.ts            Top-level orchestrator, wraps ts.Program │
  │                        Merges + deduplicates diagnostics.       │
  │                        ← mirrors TypeScript's program.ts        │
  │                                                                 │
  │  diagnosticMessages.ts All diagnostic message templates + codes │
  │                        ← mirrors diagnosticMessages.json        │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ┌─ host/ ───────────────────────────────────────────────────────┐
  │                                                                 │
  │  host.ts               KindScriptHost interface (pure queries,  │
  │                        NO caching methods)                      │
  │                        ← mirrors TypeScript's compilerHost.ts   │
  │                                                                 │
  │  defaultHost.ts        Real filesystem + TS compiler API        │
  │                                                                 │
  │  cachedHost.ts         Decorator that adds transparent          │
  │                        memoization around a plain host.         │
  │                        Handles invalidation. Persists to        │
  │                        .ksbuildinfo.                             │
  │                                                                 │
  │  testHost.ts           In-memory mock host for testing          │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ┌─ contracts/ ──────────────────────────────────────────────────┐
  │                                                                 │
  │  contract.ts           ContractDescriptor, ContractFn,          │
  │                        defineContracts helper                   │
  │  noDependency.ts       Built-in: forbidden dependency edges    │
  │  mustImplement.ts      Built-in: port-adapter completeness     │
  │  noCycles.ts           Built-in: cycle detection               │
  │  purity.ts             Built-in: side-effect-free layer        │
  │  colocated.ts          Built-in: co-location requirement       │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ┌─ lib/ ───────────────────────────────────────────────────────┐
  │                                                                │
  │  clean-architecture.ts  Standard kind definition + contracts   │
  │  hexagonal.ts           Standard kind definition + contracts   │
  │  ddd-bounded-context.ts Standard kind definition + contracts   │
  │  mvc.ts                 Standard kind definition + contracts   │
  │                                                                │
  │  ← mirrors TypeScript's lib/ (lib.d.ts, lib.dom.d.ts, etc.)  │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘

  ┌─ services/ ──────────────────────────────────────────────────┐
  │                                                                │
  │  service.ts            Extended language service API            │
  │  diagnostics.ts        Diagnostic formatting + deduplication   │
  │  codeFixes.ts          Quick fix actions                       │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘

  ┌─ server/ ────────────────────────────────────────────────────┐
  │                                                                │
  │  server.ts             LSP server (wraps TS language server)   │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘

  ┌─ cli/ ───────────────────────────────────────────────────────┐
  │                                                                │
  │  cli.ts                Command-line interface                  │
  │                        ksc check, ksc infer, ksc scaffold     │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
```

Note what's new compared to v2: `resolution.ts` (symbol-to-files resolution
as a first-class module), `inference.ts` (its own component), and `lib/`
(the standard kind library).

---

## Part 10 — Build Order and Implementation Strategy

### What TypeScript built, in order

```
  TypeScript's build order:

  1. Scanner + Parser ───→ 2. Binder ───→ 3. Checker ───→ 4. Emitter
     (get code into          (names →       (validate       (produce
      memory)                 decls)         types)          output)

                                                  5. Language Service
                                                     (IDE integration)

                                                  6. Incremental
                                                     (performance)
```

### What KindScript should build, in order

```
  KindScript's build order:

  Scanner + Parser: ALREADY DONE (TypeScript's own)

  ┌─────────────────────────────────────────────────────────────────┐
  │  Phase 1          Phase 2         Phase 3          Phase 4       │
  │                                                                   │
  │  Host             Binder          Checker +        Program + CLI  │
  │  ─────            ──────          Resolution       ────────────── │
  │  KindScriptHost   Walk TS AST    ──────────        ks.createProg  │
  │  defaultHost      → ArchSymbols  noDependency     diagnostic fmt │
  │  testHost         find Kind<N>   location check   deduplication  │
  │                   find instances resolveFiles     ksc check      │
  │                   find contracts + incremental:                  │
  │                                  mustImplement                   │
  │                                  noCycles                        │
  │                                  purity                          │
  │                                                                   │
  │  ◄── testable ──► ◄── testable ► ◄── testable ──► ◄── usable ──►│
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │  Phase 5          Phase 6          Phase 7         Phase 8       │
  │                                                                   │
  │  Inference        Generator        Lang Service    Incremental    │
  │  ─────────        ─────────        ────────────    ───────────    │
  │  ksc infer        scaffold from    extend TS       cachedHost     │
  │  walk filesystem  kind defs        LangSvc         .ksbuildinfo   │
  │  analyze imports  fix patches      arch diagnostics file watchers │
  │  propose kinds                     quick fixes     invalidation   │
  │  draft arch.ts                     code lens                      │
  │                                                                   │
  │  ◄── first-time ──►◄── generates ──►◄── IDE ──────►◄── fast ───►│
  │      user value        code            experience      at scale   │
  └─────────────────────────────────────────────────────────────────┘
```

**Phase 1: Host (the ambient fact layer)**

Build `KindScriptHost` with default implementation. Start with:
- `directoryExists`, `getDirectoryEntries` (filesystem structure)
- `getImportsForFile` (delegating to TypeScript compiler API)

These two capabilities are enough to validate location constraints and
dependency direction. Build `testHost` in parallel so everything is
testable from day one.

**Phase 2: Binder (classify the AST)**

Build the binder that walks the TypeScript AST and creates architectural
symbols with declared properties. The binder does NOT query the host.

**Phase 3: Checker + Resolution (the 80% phase)**

Build the checker and the symbol-to-files resolution strategy together (they're
tightly coupled). Start with two contracts:
1. `noDependency` — checks import edges between architectural units
2. Location conformance — checks that declared locations match reality

Then add incrementally:
3. `mustImplement` — port-adapter completeness
4. `noCycles` — cycle detection between contexts
5. `purity` — side-effect-free layer checking

Note: structural conformance (missing fields, wrong types) is already handled
by `tsc`. KindScript's checker focuses exclusively on behavioral contracts.

**Phase 4: Program + CLI (wire it together)**

Build `ks.createProgram()`, diagnostic deduplication, and a CLI:

```
$ ksc check

src/ordering/domain/service.ts:14:1 - error KS1001: Forbidden dependency
  from domain layer to infrastructure layer.

Found 1 error.
```

**Phase 5: Inference (fastest path to first-time user value)**

Build `ksc infer` — walk the filesystem, analyze the import graph, propose
kind definitions. This is the command that makes KindScript immediately useful
on existing codebases without requiring upfront definition authoring.

**Phase 6: Generator (scaffolding and fixes)**

Build code generation: given a kind definition, scaffold the directory
structure and stub files. Given a violation, generate a fix patch.

**Phase 7: Language service + LSP**

Extend TypeScript's language service with architectural diagnostics and
quick fixes. Wrap in an LSP server for VS Code.

**Phase 8: Incremental + watch**

Add `cachedHost`, `.ksbuildinfo` persistence, three-trigger invalidation,
and file watchers.

---

## Part 11 — The TypeScript-as-Definition-Language Advantage

Using TypeScript as the definition language is not just a pragmatic shortcut.
It's a structural advantage that eliminates an entire class of problems.

```
  Division of labor: TypeScript checks shape, KindScript checks behavior

  ┌────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │                   TypeScript handles (free)                          │
  │  ┌────────────────────────────────────────────────────────────────┐ │
  │  │                                                                  │ │
  │  │  "Is the instance the right shape?"                              │ │
  │  │                                                                  │ │
  │  │  ✓ Required fields present?          ✓ Literal types match?     │ │
  │  │  ✓ Field types correct?              ✓ Nested structure valid?  │ │
  │  │  ✓ Autocomplete for fields?          ✓ Rename/refactor safe?   │ │
  │  │  ✓ Go-to-definition works?           ✓ Incremental re-parse?   │ │
  │  │                                                                  │ │
  │  └────────────────────────────────────────────────────────────────┘ │
  │                                                                      │
  │                   KindScript handles (we build)                      │
  │  ┌────────────────────────────────────────────────────────────────┐ │
  │  │                                                                  │ │
  │  │  "Does the codebase respect the contracts?"                      │ │
  │  │                                                                  │ │
  │  │  ✓ Dependency direction correct?     ✓ No cycles?              │ │
  │  │  ✓ Files in right locations?         ✓ Ports implemented?      │ │
  │  │  ✓ Layers pure?                      ✓ Boundaries respected?   │ │
  │  │                                                                  │ │
  │  └────────────────────────────────────────────────────────────────┘ │
  │                                                                      │
  └────────────────────────────────────────────────────────────────────┘
```

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
| Symbol-to-files resolution | KindScript resolution engine |
| Filesystem structure validation | KindScript checker + host |
| Dependency direction enforcement | KindScript checker + host |
| Architectural diagnostics + deduplication | KindScript diagnostic system |
| Scaffolding / code generation | KindScript generator |
| Kind inference from codebases | KindScript inference engine |

### The tradeoff

KindScript's expressive power for **structural** definitions is bounded by
TypeScript's type system. In practice this is not limiting — TypeScript's type
system is extraordinarily powerful for expressing record shapes, discriminated
unions, and recursive structures, which is exactly what kind definitions need.

The constraint language's expressive power is unbounded for Tier 2 contracts
(arbitrary TypeScript functions with full host access). Tier 1 contracts
(declarative descriptors) trade expressiveness for safety, analyzability, and
precise incremental invalidation.

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
just a function that returns an array of contract descriptors. The standard kind
library (`lib/clean-architecture.ts` etc.) is the natural expression of this
— each lib file exports a kind type plus its associated contract bundle.

### Q5: How should third-party contracts be sandboxed?

The two-tier contract system creates a natural trust boundary:

```
  Trust model:

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                   │
  │  Tier 1: ContractDescriptors (data)                              │
  │  ─────────────────────────────────                                │
  │  Safe by construction. No code execution. Can be installed        │
  │  from npm without risk. The checker interprets them — they        │
  │  never run arbitrary logic. A package that exports:               │
  │                                                                   │
  │    { type: "noDependency", args: ["domain", "infra"] }          │
  │                                                                   │
  │  is as safe as a JSON config file. It cannot read files,          │
  │  traverse directories, or access the host in any way.             │
  │                                                                   │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                   │
  │  Tier 2: ContractFn (code)                                       │
  │  ─────────────────────────                                        │
  │  Full host access. Can read any file, traverse any directory,     │
  │  inspect any import. This is as powerful as an ESLint rule —      │
  │  and carries the same trust implications.                         │
  │                                                                   │
  │  Requires explicit opt-in in kindscript.json:                     │
  │                                                                   │
  │    { "trustedContractPackages": ["@myorg/custom-contracts"] }    │
  │                                                                   │
  │  Without opt-in, Tier 2 contracts from third-party packages       │
  │  are refused with a clear error message.                          │
  │                                                                   │
  └─────────────────────────────────────────────────────────────────┘
```

This also helps with incrementality: Tier 1 contracts declare their dependency
footprint statically (the checker knows exactly which host queries a
`noDependency` check requires), so they can be precisely invalidated. Tier 2
contracts are opaque — their dependency footprint is unknown, so they must be
re-run on any change.

---

## Summary

```
  KindScript — complete architecture overview

  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                    │
  │   .ts files (definitions + instances + contracts + codebase)       │
  │        │                                                           │
  │   ┌────▼───────────────────────────────────────────────────┐      │
  │   │         TypeScript (reused entirely)                     │      │
  │   │                                                          │      │
  │   │   Scanner → Parser → ts.Node AST → ts.Program           │      │
  │   │                                         │                │      │
  │   │                                    TS Checker            │      │
  │   │                              (structural conformance)    │      │
  │   └─────────────────────────────────────┬──────────────────┘      │
  │                                         │                          │
  │   ┌─────────────────────────────────────▼──────────────────┐      │
  │   │         KindScript (what we build)                       │      │
  │   │                                                          │      │
  │   │   KS Binder ──→ ArchSymbols (classify, record)          │      │
  │   │                      │                                   │      │
  │   │                 KS Checker (resolve lazily, evaluate)    │      │
  │   │                      │                                   │      │
  │   │               KindScriptHost ◄── (on-demand queries)    │      │
  │   │                      │                                   │      │
  │   │               Symbol-to-Files Resolution                │      │
  │   │                      │                                   │      │
  │   │   Also:  Inference engine  (code → spec)                │      │
  │   │          Generator         (spec → code)                │      │
  │   │          Standard lib      (pre-built patterns)         │      │
  │   │                                                          │      │
  │   └─────────────────────────────────────┬──────────────────┘      │
  │                                         │                          │
  │   ┌─────────────────────────────────────▼──────────────────┐      │
  │   │         Output                                           │      │
  │   │                                                          │      │
  │   │   Diagnostics       CLI output       IDE squigglies      │      │
  │   │   (TS + KS merged   scaffolds        quick fixes         │      │
  │   │    + deduplicated)   patches          hover info          │      │
  │   │                      inferred specs                      │      │
  │   └──────────────────────────────────────────────────────────┘      │
  │                                                                    │
  └──────────────────────────────────────────────────────────────────┘
```

KindScript can be built as a genuine structural analog of the TypeScript
compiler — more tightly than v1 suggested, because the front-end is shared.

| Component | TypeScript | KindScript |
|---|---|---|
| Scanner + Parser | TypeScript's own | **Same** — reused directly |
| AST | `ts.Node` tree | **Same** — read directly |
| Host abstraction | `CompilerHost` | `KindScriptHost` (extends it, pure queries) |
| Binder | Creates `ts.Symbol` from AST | Creates `ArchSymbol` (classify + record, no host queries) |
| Checker | Resolves types lazily, validates | Resolves facts lazily via host, evaluates contracts |
| Module/file resolution | `moduleResolver.ts` | `resolution.ts` (symbol-to-files, pluggable strategies) |
| Inference | Infer types from expressions | Infer kinds from codebases (`ksc infer`) |
| Emitter / generator | Produces `.js` / `.d.ts` | Produces scaffolding / fix patches |
| Standard library | `lib.d.ts` (runtime env) | `lib/*.ts` (architectural patterns) |
| Program | Orchestrates compilation | Wraps `ts.Program`, merges + deduplicates diagnostics |
| Language service | IDE features for types | Extends with architectural features |
| Incremental | `.tsbuildinfo` | `.ksbuildinfo` (three-trigger invalidation) |

The key insight, refined across three versions: **KindScript is not a separate
compiler that happens to look like TypeScript's. It is a layer on top of
TypeScript's compiler that adds architectural checking.** TypeScript handles the
structural dimension (do the shapes match?). KindScript handles the behavioral
dimension (do the runtime relationships respect the contracts?).

The binder classifies. The checker resolves lazily. The host answers queries.
File resolution maps symbols to files. Inference derives specs from code.
The generator derives code from specs. The standard library bootstraps the
ecosystem. Diagnostics from both systems are merged and deduplicated. And the
whole thing runs incrementally with three distinct invalidation triggers.

Build it this way and you get the tightest possible structural correspondence
with the TypeScript compiler — not by copying its components, but by literally
reusing them and adding only the genuinely new layers.
