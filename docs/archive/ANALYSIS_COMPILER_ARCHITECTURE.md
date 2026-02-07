# KindScript as a Compiler: Structural Parallels with TypeScript

## Preface

This document examines how KindScript could be built as a system that is
structurally homologous to the TypeScript compiler. Not a surface-level analogy
— a genuine structural correspondence where each component in TypeScript has a
counterpart in KindScript, adapted for the fact that KindScript's "values" are
whole codebases and its "types" are architectural patterns.

The goal is to identify what to borrow directly, what to adapt, and what is
genuinely new.

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
every node is a `ts.Node` regardless of what it represents.

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

### Cross-Cutting Concerns

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

## Part 2 — The Structural Mapping

Here is the core claim: **every major TypeScript compiler component has a
direct KindScript counterpart**, but operating at a different abstraction level.

```
TypeScript                          KindScript
──────────────────────────────────  ──────────────────────────────────
Source text (.ts files)             Two inputs:
                                      a) KindScript definitions (.ks)
                                      b) Target codebase (files, imports, etc.)

Scanner (text → tokens)             Fact Extractors (codebase → raw facts)

Parser (tokens → AST)               Definition Parser (KS source → KindScript AST)
                                    + Fact Model Builder (raw facts → structured model)

AST Node (ts.Node)                  IR Node (KindDef | Instance | Contract | Fact)

Binder (AST → Symbols)             Binder (resolve kind references, build
                                    architecture graph, connect instances to kinds)

Symbol (ts.Symbol)                  Architectural Symbol (named entity in the
                                    architectural model — a kind, an instance,
                                    a layer, a port, a boundary)

Checker (Symbols → Types            Checker (Architecture Graph + Facts
         + Diagnostics)                      → Violations + Diagnostics)

Type (ts.Type)                      Resolved Kind (fully expanded kind with
                                    all inherited contracts, computed constraints)

isTypeAssignableTo(A, B)            doesInstanceSatisfyKind(instance, kind)

Diagnostic (ts.Diagnostic)          Violation (architectural rule broken,
                                    with span, message, related info, fix hint)

Emitter (AST → .js/.d.ts)          Generator/Refactorer (violations → patches,
                                    kind defs → scaffolded code)

Program (ts.Program)                Program (ks.Program) — top-level orchestrator

LanguageService                     LanguageService (IDE integration for
                                    architectural diagnostics and refactoring)

CompilerOptions                     KindScriptConfig (extractors, strictness,
                                    rule sets, target paths)

SourceFile                          SystemModel (the parsed/extracted representation
                                    of the target codebase)

.tsbuildinfo                        .ksbuildinfo (cached fact model for incremental
                                    re-extraction)

Project References                  Multi-system / multi-context builds
```

---

## Part 3 — What's Different (And Why It Matters)

### 3.1 Two Inputs, Not One

TypeScript has a single input class: source files. KindScript has two
fundamentally different inputs:

**a) KindScript definition files** — these are the "type annotations" of the
system. They declare kinds, instances, and contracts. These need a conventional
parser (scanner → tokens → AST).

**b) The target codebase** — this is the "value" being type-checked. It's not
text to parse in the usual sense. It's a live filesystem with TypeScript source
files, package.json files, import graphs, configuration files, etc.

This means KindScript has a **dual front-end**:

```
                  ┌──────────────────┐
  .ks files  ───→ │ Definition Parser │ ───→ KindScript AST
                  └──────────────────┘                       ╲
                                                              → Binder → Checker
                  ┌──────────────────┐                       ╱
  codebase   ───→ │  Fact Extractors  │ ───→ Fact Model
                  └──────────────────┘
```

This is the single biggest structural difference from TypeScript. TypeScript's
parser and checker operate on the same source text. KindScript's definition
parser and fact extractors operate on completely different inputs.

### 3.2 Fact Extraction is a New Phase

TypeScript doesn't have a fact extraction phase because its "facts" (the code)
are the same thing it parses. KindScript needs to extract a structured model
from an existing codebase. This is a substantive compilation phase with its own
complexity:

- **Filesystem extractor**: directory tree, file paths, naming conventions
- **TypeScript extractor**: symbols, imports/exports, dependency edges, type info
- **Package extractor**: package.json dependencies, workspace relationships
- **Build system extractor**: Nx project graph, module boundaries
- **Convention extractor**: inferred patterns (e.g., files named `*.port.ts` are ports)

Each extractor is a plugin that produces facts in a uniform schema. The fact
model is the union of all extracted facts.

This is most analogous to TypeScript's **module resolution** layer — the part
that figures out what files exist and how they relate — but much more extensive.

### 3.3 The Checker Evaluates Constraints, Not Types

TypeScript's checker resolves types and checks assignability. KindScript's
checker evaluates architectural constraints against extracted facts.

But the *structure* of the checker can be identical:

```typescript
// TypeScript checker (simplified)
function checkAssignment(source: Type, target: Type): Diagnostic | undefined {
  if (!isAssignableTo(source, target)) {
    return createDiagnostic(Errors.NotAssignable, source, target);
  }
}

// KindScript checker (same structure)
function checkContract(contract: Contract, facts: FactModel): Diagnostic | undefined {
  if (!isSatisfied(contract, facts)) {
    return createDiagnostic(Violations.ContractViolated, contract, facts);
  }
}
```

The key insight: **the checker's architecture (lazy, cached, diagnostic-accumulating)
can be borrowed wholesale**. What changes is the content of the checks, not the
machinery.

### 3.4 Structural Conformance vs Structural Typing

TypeScript checks structural typing: "does this value's shape match this type's
shape?" KindScript checks structural conformance: "does this codebase's
architecture match this kind's requirements?"

Both are structural (not nominal). Both work by recursively comparing properties.
The difference is in what "properties" means:

- TypeScript: object fields, method signatures, type parameters
- KindScript: child kinds, file locations, dependency edges, exported symbols

This means KindScript's `doesInstanceSatisfyKind` function is structurally
analogous to TypeScript's `isTypeAssignableTo` — it walks the kind definition
recursively, checking each requirement against the facts.

---

## Part 4 — Component Design (Borrowing TypeScript's Patterns)

### 4.1 The Node System

TypeScript uses a single `ts.Node` base interface with a `kind` discriminant
from the `SyntaxKind` enum. Every node in every AST is a `ts.Node`. This
uniformity is critical — it enables generic tree walks, visitors, and
transformers.

KindScript should do the same:

```typescript
const enum IRKind {
  // Definitions
  KindDef,
  FieldDef,
  ContractDef,

  // Instances
  InstanceDecl,
  BindingDecl,

  // Contracts
  NoDependencyRule,
  MustImplementRule,
  NoCyclesRule,
  CoLocationRule,
  PurityRule,

  // Facts
  FileNode,
  DirectoryNode,
  ImportEdge,
  ExportedSymbol,
  PackageDependency,

  // Composite
  SystemModel,
  ArchitectureGraph,
}

interface IRNode {
  readonly irKind: IRKind;
  readonly parent?: IRNode;
  readonly pos: Span;           // location in .ks source OR codebase path
  readonly flags: NodeFlags;
}
```

Every KindScript IR entity — whether it came from parsing a `.ks` file or
extracting facts from a codebase — is an `IRNode`. This uniformity enables
the same generic tooling (visitors, printers, transformers) that makes
TypeScript's internals so composable.

### 4.2 The Symbol Table

TypeScript's binder creates `ts.Symbol` objects that represent named entities.
A symbol can have multiple declarations (declaration merging) and lives in a
scope (a symbol table).

KindScript needs the same concept:

```typescript
interface ArchSymbol {
  readonly name: string;
  readonly flags: SymbolFlags;      // Kind | Instance | Layer | Port | Adapter | ...
  readonly declarations: IRNode[];  // AST nodes that contribute to this symbol
  readonly members?: SymbolTable;   // child symbols (e.g., a kind's fields)
  readonly exports?: SymbolTable;   // publicly visible symbols
  readonly parent?: ArchSymbol;     // containing scope
}

type SymbolTable = Map<string, ArchSymbol>;
```

The binder creates these symbols by walking the KindScript AST. When it
encounters `kind CleanArchitecture { domain: DomainLayer; ... }`, it creates a
symbol for `CleanArchitecture` with a member symbol for `domain` that references
the `DomainLayer` kind.

This is exactly how TypeScript's binder works — and it means KindScript gets
the same benefits: name resolution, scope chains, declaration merging (if we
want it), and a clean separation between syntax and semantics.

### 4.3 The Checker (Heart of the System)

TypeScript's checker is a single large module with:
- A public API (`checkSourceFile`, `getTypeOfSymbol`, etc.)
- Hundreds of internal helper functions
- A diagnostics store
- Type caches

KindScript's checker should mirror this:

```typescript
interface Checker {
  // Public API
  checkSystem(system: SystemModel): readonly Diagnostic[];
  getResolvedKind(symbol: ArchSymbol): ResolvedKind;
  doesInstanceSatisfy(instance: ArchSymbol, kind: ArchSymbol): boolean;

  // Diagnostics
  getDiagnostics(): readonly Diagnostic[];
}
```

Internally, the checker would have functions like:

```typescript
// Mirrors TypeScript's isTypeAssignableTo
function isInstanceConformant(instance: InstanceNode, kind: KindDefNode): boolean {
  // Check structural requirements
  for (const field of kind.fields) {
    const binding = resolveBinding(instance, field);
    if (!binding) {
      reportDiagnostic(instance, Violations.MissingRequiredField, field.name);
      return false;
    }
    // Recursively check child conformance
    if (!isInstanceConformant(binding, field.type)) {
      return false;
    }
  }

  // Check contracts
  for (const contract of kind.contracts) {
    if (!evaluateContract(contract, instance, facts)) {
      reportDiagnostic(instance, Violations.ContractViolated, contract);
      return false;
    }
  }

  return true;
}
```

Key patterns to borrow from TypeScript's checker:

1. **Lazy resolution.** Don't resolve all kinds and contracts eagerly. Resolve
   them when first needed and cache the result.

2. **Diagnostic accumulation.** Never throw on errors. Always record a
   diagnostic and continue checking. This produces maximum information per
   compilation run.

3. **Related information.** TypeScript diagnostics can have `relatedInformation`
   — secondary spans that provide context. KindScript violations should too:
   "This import violates the dependency rule **defined here** [link to contract]."

4. **Diagnostic codes.** Every diagnostic gets a stable numeric code (like
   TS2322). This enables programmatic filtering, documentation, and suppression.

### 4.4 The Emitter / Generator

TypeScript's emitter reads the AST and produces output files. KindScript's
emitter reads the architecture graph and produces:

- **Scaffolded code**: create files and directories to satisfy a kind definition
- **Fix patches**: modify imports, move files, or adjust exports to fix violations
- **Declaration files**: generate `.ks` files from an existing codebase (infer
  the architecture)

This last one — **inference** — deserves special attention. TypeScript can infer
types from values. KindScript should be able to infer kinds from codebases.
Given a codebase with a recognizable Clean Architecture layout, KindScript
should be able to generate a `.ks` file that describes it. This is the emitter
running in reverse: facts → kind definitions.

### 4.5 The Program

TypeScript's `ts.Program` is the top-level orchestrator:

```typescript
// TypeScript
const program = ts.createProgram(fileNames, options);
const checker = program.getTypeChecker();
const diagnostics = ts.getPreEmitDiagnostics(program);
```

KindScript should have the same:

```typescript
// KindScript
const program = ks.createProgram(config);
const checker = program.getChecker();
const diagnostics = ks.getAllDiagnostics(program);
```

The `Program` owns:
- The parsed KindScript definitions (AST)
- The extracted fact model
- The bound symbol table
- The checker instance
- Configuration (compiler options equivalent)

### 4.6 The Language Service

TypeScript's language service wraps the compiler for IDE use. It provides
completions, hover info, diagnostics, quick fixes, and refactorings — all
powered by the same checker.

KindScript should have a language service that provides:

- **Diagnostics**: show violations inline in the IDE
- **Hover info**: hover over an instance to see its resolved kind + contract status
- **Quick fixes**: "Add missing adapter for this port", "Move this file to the
  correct location", "Remove this disallowed import"
- **Completions**: when writing `.ks` files, autocomplete kind names, field
  names, contract types
- **Code lens**: show "3 violations" above a kind instance declaration

This layer sits on top of the compiler and adds incremental/caching behavior.
TypeScript uses a `LanguageServiceHost` interface that the IDE implements to
provide file access and change notifications. KindScript should do the same.

---

## Part 5 — The Constraint Language

This is where KindScript must innovate beyond what TypeScript provides. TypeScript's
"constraint language" is its type system — a rich structural type algebra with
unions, intersections, conditionals, mapped types, etc.

KindScript needs its own constraint language. Here are three design options,
ordered by ambition:

### Option A: Constraints as TypeScript Functions (Pragmatic)

Constraints are just TypeScript functions that take a fact model and return
diagnostics:

```typescript
const noDependency: Contract = (from: ArchSymbol, to: ArchSymbol, facts: FactModel) => {
  const edges = facts.getDependencyEdges(from, to);
  return edges.map(edge => createViolation(edge, "Forbidden dependency"));
};
```

**Pros**: No new language to design. Full power of TypeScript. Easy to author.
**Cons**: Not declarative. Hard to analyze, optimize, or compose contracts.

### Option B: Declarative DSL with TypeScript Embedding (Balanced)

A small declarative language for common patterns, with escape hatches to
TypeScript:

```
kind CleanArchitecture {
  domain: DomainLayer
  application: ApplicationLayer
  infrastructure: InfrastructureLayer

  contract noDependency(domain, infrastructure)
  contract noDependency(domain, application.adapters)
  contract mustImplement(application.ports, infrastructure.adapters)
  contract purity(domain)
}
```

This is compiled to the same internal representation as Option A but is much
more readable and analyzable.

**Pros**: Clear, analyzable, composable. Familiar to anyone who's seen ArchUnit.
**Cons**: Requires designing and maintaining a DSL parser.

### Option C: Full Constraint Algebra (Ambitious)

A typed constraint language with first-class quantification, composition, and
negation:

```
forall (ctx: BoundedContext) in system {
  forall (dep: Dependency) from ctx.domain to ctx.infrastructure {
    violation("Domain cannot depend on infrastructure", dep.source)
  }
}
```

**Pros**: Maximum expressiveness. Can encode complex invariants.
**Cons**: Significant language design effort. Might be over-engineering.

### Recommendation

Start with **Option A** internally (constraints as functions) and expose
**Option B** as the user-facing syntax. This mirrors how TypeScript works:
the checker internally uses function calls and algorithms, but users write
type annotations in a declarative syntax. The declarative syntax compiles
down to the internal function-based representation.

---

## Part 6 — The Fact Model as "Virtual File System"

TypeScript's compiler operates on a `CompilerHost` interface that abstracts
file access:

```typescript
interface CompilerHost {
  fileExists(fileName: string): boolean;
  readFile(fileName: string): string | undefined;
  getSourceFile(fileName: string): SourceFile | undefined;
  // ...
}
```

This abstraction lets TypeScript work with in-memory files, remote files,
virtual file systems, etc. The compiler never touches the real filesystem
directly.

KindScript should use the same pattern for fact extraction:

```typescript
interface FactHost {
  // Filesystem facts
  getFileTree(root: string): DirectoryNode;
  getFileContents(path: string): string | undefined;

  // TypeScript facts
  getImportEdges(file: string): ImportEdge[];
  getExportedSymbols(file: string): ExportedSymbol[];

  // Package facts
  getPackageDependencies(packagePath: string): PackageDependency[];

  // Build system facts
  getProjectGraph(): ProjectNode[];
}
```

This abstraction is critical for:
- **Testing**: supply mock fact models without needing a real codebase
- **Incremental compilation**: cache and reuse facts for unchanged files
- **Remote analysis**: extract facts from a remote repository
- **Composition**: merge facts from multiple extractors

---

## Part 7 — Incremental Compilation

TypeScript's incremental mode (`--incremental`) works by:

1. Recording a hash of each source file
2. Recording the dependency graph between files
3. On recompilation, skipping files whose hash and dependencies haven't changed
4. Persisting this state in a `.tsbuildinfo` file

KindScript needs the same, but for fact extraction (the expensive phase):

1. Record a hash of each file in the target codebase
2. Record which facts were extracted from which files
3. On re-analysis, only re-extract facts for changed files
4. Persist this in a `.ksbuildinfo` file

The checker itself is fast (evaluating constraints against an in-memory model).
The bottleneck is fact extraction (parsing TypeScript files, resolving imports,
building dependency graphs). Incremental extraction is essential for watch mode
and IDE integration.

---

## Part 8 — Diagnostic System

TypeScript's diagnostic system is well-designed and worth borrowing in detail:

```typescript
interface Diagnostic {
  readonly code: number;               // stable numeric code (e.g., KS1001)
  readonly category: DiagnosticCategory; // Error | Warning | Suggestion
  readonly messageText: string;
  readonly file?: SourceFile;          // .ks file or codebase file
  readonly start?: number;             // position in file
  readonly length?: number;
  readonly relatedInformation?: DiagnosticRelatedInformation[];
}
```

For KindScript, diagnostics carry architectural context:

```typescript
interface ArchDiagnostic extends Diagnostic {
  readonly violatedContract?: Contract;     // which contract was broken
  readonly involvedSymbols?: ArchSymbol[];  // which architectural entities
  readonly suggestedFix?: CodeFixAction;    // auto-fixable?
}
```

Examples of KindScript diagnostics:

```
KS1001: Module 'ordering/domain/repository.ts' imports from
        'ordering/infrastructure/database.ts'.
        This violates contract 'noDependency(domain, infrastructure)'
        defined in ordering.ks:14.

KS1002: Port 'OrderRepository' (ordering/domain/ports/order-repository.port.ts)
        has no implementing adapter.
        Contract 'mustImplement(ports, adapters)' requires at least one.
        defined in clean-architecture.ks:8.

KS2001: Directory 'ordering/domain' expected at 'src/contexts/ordering/domain'
        but found at 'src/ordering/domain-layer'.
        Location constraint defined in ordering.ks:22.
```

Each diagnostic has:
- A stable code for programmatic use
- A human-readable message
- A source location (in the codebase *and* in the `.ks` file)
- Related information (the contract definition, the offending import, etc.)
- An optional suggested fix

---

## Part 9 — Watch Mode and Feedback Loop

TypeScript's `--watch` mode uses filesystem watchers to recompile on change.
KindScript's watch mode would:

1. Watch both `.ks` definition files and the target codebase
2. On change to a `.ks` file: re-parse definitions, re-bind, re-check
3. On change to a codebase file: re-extract facts for that file, re-check
   affected contracts
4. Report diagnostics incrementally

This creates a tight feedback loop: change code, immediately see if
architectural contracts are satisfied. This is the "red squiggly" experience
but for architecture.

---

## Part 10 — Module Structure

Mapping TypeScript's internal module structure to KindScript:

```
packages/kindscript/src/
  compiler/
    types.ts              # Core IR types (IRNode, IRKind, etc.)
                          # ← mirrors TypeScript's types.ts

    scanner.ts            # Tokenizes .ks source text
                          # ← mirrors TypeScript's scanner.ts

    parser.ts             # Parses .ks tokens into AST
                          # ← mirrors TypeScript's parser.ts

    binder.ts             # Creates symbols, resolves references
                          # ← mirrors TypeScript's binder.ts

    checker.ts            # Evaluates constraints, produces diagnostics
                          # ← mirrors TypeScript's checker.ts

    emitter.ts            # Generates code / patches
                          # ← mirrors TypeScript's emitter.ts

    program.ts            # Top-level orchestrator
                          # ← mirrors TypeScript's program.ts

    diagnosticMessages.ts # All diagnostic message templates
                          # ← mirrors TypeScript's diagnosticMessages.json

  extractors/
    extractorHost.ts      # FactHost interface
                          # ← mirrors TypeScript's compilerHost.ts

    filesystem.ts         # File/directory tree extraction
    typescript.ts         # TS symbol/import extraction (via ts-morph or TS API)
    packageJson.ts        # Package dependency extraction
    nx.ts                 # Nx project graph extraction

  services/
    services.ts           # Language service API
                          # ← mirrors TypeScript's services.ts

    completions.ts        # Autocomplete for .ks files
    diagnostics.ts        # Diagnostic formatting / squiggly lines
    codeFixes.ts          # Quick fix actions
                          # ← mirrors TypeScript's codefixes/

  server/
    server.ts             # LSP server for IDE integration
                          # ← mirrors TypeScript's tsserver/

  cli/
    cli.ts                # Command-line interface
                          # ← mirrors TypeScript's tsc.ts
```

---

## Part 11 — Build Order and Implementation Strategy

TypeScript was built roughly in this order:
1. Scanner + Parser (get source code into memory)
2. Binder (connect names to declarations)
3. Checker (validate types — this is where 80% of the work lives)
4. Emitter (produce output)
5. Language service (IDE support)
6. Incremental compilation (performance)

KindScript should follow the same order but with the dual-front-end twist:

### Phase 1: Fact Extraction (Get the codebase into memory)

Build the extractor pipeline. Start with filesystem extraction (directory tree,
file existence) and TypeScript import extraction (dependency edges). These two
alone are enough to validate location constraints and dependency direction rules.

This is KindScript's "scanner + parser" equivalent for the codebase side.

### Phase 2: Definition Parser (Get .ks files into memory)

Build the scanner and parser for `.ks` definition files. Produce an AST of
kind definitions, instance declarations, and contracts.

Alternatively — and this is a pragmatic shortcut — **use TypeScript itself as
the definition language**, leveraging the existing Layer 1 types. The "parser"
becomes the TypeScript compiler API reading the user's Layer 2/3 type
definitions. This is what the current design already does, and it's a
significant advantage: zero new parser needed for the definition side.

### Phase 3: Binder (Connect everything)

Build the binder that:
- Creates architectural symbols from kind definitions
- Resolves kind references (when a kind field references another kind)
- Links instances to their kind definitions
- Builds the architecture graph (a DAG of symbols and relationships)

### Phase 4: Checker (The 80% phase)

Build the constraint engine. Start with two core checks:
1. **Structural conformance**: does the instance have all required children?
2. **Dependency direction**: do imports respect layering rules?

Then add checks incrementally:
3. Location conformance (files in the right places)
4. Port-adapter completeness (every port has an adapter)
5. Cycle detection (no circular dependencies between contexts)
6. Purity checking (domain layer has no side-effecting imports)

### Phase 5: Reporter / CLI (Show results)

Build the diagnostic formatter and CLI. Produce output similar to `tsc`:

```
src/ordering/domain/service.ts:14:1 - error KS1001: Forbidden dependency
  from domain layer to infrastructure layer.

  14 │ import { Database } from '../../infrastructure/database';
     │ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Contract defined in ordering.ks:8:3
   8 │   contract noDependency(domain, infrastructure)
     │   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 3 errors in 2 files.
```

### Phase 6: Emitter / Generator (Produce output)

Build the code generator that can scaffold files to satisfy a kind definition
and generate patches to fix violations.

### Phase 7: Language Service + LSP (IDE integration)

Build the language service layer on top of the compiler, then wrap it in an
LSP server for VS Code / other editors.

### Phase 8: Incremental Compilation (Performance)

Add `.ksbuildinfo` persistence, file hashing, and incremental fact extraction.

---

## Part 12 — The TypeScript-as-Definition-Language Shortcut

The current project already uses TypeScript types as the definition language
(Layer 1 primitives, Layer 2 patterns, Layer 3 instances). This is a
significant structural advantage.

Instead of building a custom `.ks` parser, KindScript can:

1. Use the TypeScript Compiler API to parse definition files
2. Extract kind definitions by walking the AST for types that extend `Kind<N>`
3. Extract instances by finding variable declarations typed as kind types
4. Extract contracts from decorator-like patterns or companion objects

This means the **Definition Parser** phase is actually **TypeScript's own
parser**, and the binder/checker layers consume TypeScript AST nodes directly.

The tradeoff: KindScript's expressive power is bounded by what TypeScript's
type system can express. For structural definitions (kinds, children, fields),
TypeScript types are excellent. For behavioral contracts (dependency rules,
purity), TypeScript types are insufficient — these need to be expressed as
runtime objects or function calls, not types.

A hybrid approach:

```typescript
// Structural definition: pure TypeScript types (Layer 1 + 2)
type OrderingContext = Kind<"OrderingContext"> & {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
};

// Behavioral contracts: runtime objects (new addition)
const orderingContracts = defineContracts<OrderingContext>({
  noDependency: [["domain", "infrastructure"]],
  mustImplement: [["domain.ports", "infrastructure.adapters"]],
  purity: ["domain"],
});

// Instance declaration: typed variable (Layer 3)
const ordering: WithLocation<OrderingContext> = {
  kind: "OrderingContext",
  location: "src/contexts/ordering",
  domain: { /* ... */ },
  application: { /* ... */ },
  infrastructure: { /* ... */ },
};
```

The compiler reads both the types and the contract objects. Structural
conformance is checked by TypeScript itself (for free!). Behavioral contracts
are checked by KindScript's constraint engine.

This is the most pragmatic path: **let TypeScript do what it's good at
(structural typing) and build only the parts it can't do (behavioral contract
evaluation over extracted facts).**

---

## Part 13 — Open Questions

### Q1: Should .ks be a separate language?

A separate language gives maximum control over syntax and semantics but
requires building a parser, language service, and syntax highlighting from
scratch. TypeScript-as-definition-language is pragmatic but limits
expressiveness.

My recommendation: **start with TypeScript as the definition language** (the
current approach). If the constraint language outgrows what TypeScript can
express, introduce a minimal `.ks` syntax for contracts only — not for
structural definitions, which TypeScript handles well.

### Q2: How deep should fact extraction go?

Shallow extraction (filesystem + imports) is fast and covers 80% of use cases.
Deep extraction (type relationships, function purity, runtime behavior) is
expensive and complex.

My recommendation: **start shallow, go deep incrementally.** Filesystem +
import edges are enough to validate location constraints and dependency
direction. Add deeper extraction only when specific contracts require it.

### Q3: How should the constraint engine handle "soft" violations?

Some contracts are absolute (no domain→infrastructure imports). Others are
aspirational (minimize cross-context coupling). TypeScript has a strict mode
that enables additional checks. KindScript could have severity levels:
`error`, `warning`, `suggestion`.

### Q4: What's the execution environment?

TypeScript's compiler runs in Node.js (and now Deno). KindScript should
target the same environments but could also run as a Deno-first tool (given
the current project setup) with Node.js compatibility.

---

## Summary

KindScript can be built as a genuine structural analog of the TypeScript
compiler:

| Component | TypeScript | KindScript |
|---|---|---|
| Input | Source files | .ks definitions + target codebase |
| Front-end | Scanner → Parser → AST | Definition parser + Fact extractors |
| Middle | Binder → Checker | Binder → Constraint engine |
| Back-end | Emitter | Code generator / refactorer |
| Orchestrator | Program | Program |
| IDE layer | LanguageService + tsserver | LanguageService + LSP server |
| Incremental | .tsbuildinfo | .ksbuildinfo |

The key insight is that **TypeScript's architecture is not specific to
checking types in source code**. It's a general pattern for static analysis
systems that:

1. Parse a specification (types / kinds)
2. Extract a model from a target (source code / codebase)
3. Check conformance (type compatibility / contract satisfaction)
4. Report violations (diagnostics)
5. Optionally transform the target (emit JS / scaffold code)

KindScript fits this pattern exactly. The structural parallels are not
accidental — they reflect a deep correspondence between type checking and
architectural validation. Both are instances of the same abstract problem:
**does this concrete thing satisfy this abstract specification?**

Build it like TypeScript built their compiler, and you get the same
structural benefits: clean phase separation, lazy evaluation, incremental
computation, rich diagnostics, and a language service that makes the whole
thing feel interactive rather than batch-oriented.
