# KindScript — Building It Like a TypeScript Compiler

## Reaction to the Core Idea

The analogy is sound and precise: TypeScript gave JavaScript a static type system for values and expressions; KindScript gives codebases a static type system for architectural structure. The normative/descriptive split maps cleanly onto the type/value split. The constraint engine maps onto the checker. This isn't a superficial analogy — the structural correspondence runs deep enough to actually guide implementation.

The one place the analogy *breaks* in an interesting way: TypeScript has one input language. KindScript has two — the architectural declarations (normative) and the actual codebase (descriptive). This means KindScript needs two "front ends" that converge into a single checking phase. That asymmetry is the most important design challenge.

---

## The TypeScript Compiler's Actual Structure

Before mapping KindScript onto it, here's how `tsc` actually works internally:

```
Source Text
    │
    ▼
┌──────────┐
│  Scanner  │   Tokenizes .ts source into a token stream
└────┬─────┘
     ▼
┌──────────┐
│  Parser   │   Produces AST (tree of Nodes, each with a SyntaxKind)
└────┬─────┘
     ▼
┌──────────┐
│  Binder   │   Walks AST, creates Symbols, builds scope chains,
│           │   connects declarations → Symbols
└────┬─────┘
     ▼
┌──────────┐
│  Checker  │   Resolves Types from Symbols (lazily),
│           │   checks assignability, produces Diagnostics
└────┬─────┘
     ▼
┌──────────┐
│  Emitter  │   Generates .js, .d.ts, .map outputs
└──────────┘
```

Orchestrating all of this is the **Program** — the unit of compilation. A Program owns a set of SourceFiles, a CompilerOptions config, and wires together the binder, checker, and emitter. It handles module resolution (finding files from import paths) and manages the relationship between files.

The key data structures are:

| Structure    | Role                                                    |
| ------------ | ------------------------------------------------------- |
| **Node**     | AST node, discriminated by `SyntaxKind` enum            |
| **Symbol**   | Named entity (variable, function, class, etc.)          |
| **Type**     | Resolved semantic type (the checker's output)           |
| **Diagnostic** | Error/warning with source location and message        |
| **SourceFile** | Root AST node for a single file + per-file metadata   |

The **Symbol** is the most important conceptual bridge. It connects the syntactic world (AST nodes, declarations) to the semantic world (Types, assignability). A Symbol is created by the binder for every named declaration, and the checker resolves it into a Type on demand.

---

## The Structural Mapping

KindScript has a direct correspondent for every major compiler phase, but the inputs are different.

### Two Front Ends, One Checker

```
 FRONT END A: Declarations              FRONT END B: Codebase
 (what must hold)                        (what exists)

 .ks files / TS DSL                      Actual repo on disk
       │                                       │
       ▼                                       ▼
 ┌───────────┐                          ┌─────────────┐
 │  Scanner   │                          │  Extractors  │
 │  Parser    │                          │  (FS, TS,    │
 │  Binder    │                          │   Nx, pkg)   │
 └─────┬─────┘                          └──────┬──────┘
       │                                       │
       ▼                                       ▼
  KindSymbols                             SystemModel
  (architectural                          (facts: file tree,
   declarations +                          import graph,
   contracts)                              symbol table,
       │                                   package deps)
       │                                       │
       └──────────────┬───────────────────────┘
                      ▼
               ┌────────────┐
               │   Checker   │   facts ⊨ contracts ?
               │  (Constraint│   Produces Diagnostics
               │   Engine)   │
               └──────┬─────┘
                      ▼
               ┌────────────┐
               │   Emitter   │   Scaffolding, patches,
               │ (Generator) │   reports, diagrams
               └────────────┘
```

This two-front-end design is the key structural difference from TypeScript. Let's walk through each component.

---

## Component-by-Component Design

### 1. The Architectural IR (Nodes and SyntaxKinds)

TypeScript discriminates every AST node with a `SyntaxKind` enum. KindScript needs the same for its architectural IR.

```typescript
const enum ArchKind {
    // Definitions
    KindDefinition,        // defines a new architectural kind
    FieldDeclaration,      // a named child slot within a kind
    ContractDeclaration,   // a constraint attached to a kind

    // Instances
    InstanceDeclaration,   // declares a concrete instance of a kind
    BindingExpression,     // binds a field to a concrete path/value

    // Contracts
    DependencyRule,        // "A must not import B"
    LocationConstraint,    // "must live at path X relative to parent"
    BoundaryAssertion,     // "nothing outside may import internals"
    PurityConstraint,      // "must not have side-effectful imports"
    CardinalityConstraint, // "exactly one handler per command"

    // References
    KindReference,         // reference to another kind by name
    PathLiteral,           // a file/directory path expression
    GlobPattern,           // a glob-based path pattern
}
```

Every node in the architectural AST is a discriminated union on `ArchKind`, just as every TypeScript node is discriminated on `SyntaxKind`. This gives exhaustive switch coverage, visitor patterns, and clean serialisation for free.

### 2. Symbols — The Bridge

In TypeScript, a Symbol connects a name (in syntax) to its meaning (in the type system). In KindScript, **ArchSymbol** connects an architectural name to both its definition and its resolved facts.

```typescript
interface ArchSymbol {
    name: string;
    kind: ArchSymbolKind;         // KindDef | Instance | Field | Contract
    declarations: ArchNode[];      // AST nodes that declare this symbol
    resolvedFacts?: FactSlice;     // lazily attached by the checker
    parent?: ArchSymbol;           // scoping (instance → field → ...)
    members?: Map<string, ArchSymbol>;
}
```

The binder creates these by walking the architectural AST. The checker later attaches `resolvedFacts` — the subset of the SystemModel that this symbol maps onto. This is the exact same pattern as TypeScript, where the binder creates Symbols and the checker lazily resolves their Types.

### 3. The Binder

The binder walks the architectural AST and:

- Creates an ArchSymbol for every named declaration (kind, instance, field)
- Builds scope chains (an instance's fields are scoped to that instance)
- Resolves kind references (when an instance says `kind: CleanArchitecture`, the binder links it to the KindDefinition symbol)
- Detects duplicate declarations, unresolved references

This is a direct mirror of TypeScript's binder, which does the same for variables, functions, classes, and their scopes.

### 4. Fact Extraction (the Second Front End)

This is where KindScript diverges from TypeScript. There is no second front end in `tsc` — it only has one input language. KindScript must also "parse" the actual codebase into a structured model.

```typescript
interface SystemModel {
    fileTree: FileNode;                          // directory structure
    importGraph: DirectedGraph<ModuleId>;        // who imports whom
    symbolTable: Map<ModuleId, ExportedSymbol[]>; // what each module exports
    packageGraph: DirectedGraph<PackageId>;       // package-level deps
    projectGraph?: DirectedGraph<ProjectId>;      // Nx/workspace projects
}
```

Each data source gets its own **Extractor** — a pluggable module that reads one aspect of the codebase and contributes facts to the SystemModel. This is analogous to how TypeScript has pluggable module resolution strategies (node, classic, bundler), but broader.

```typescript
interface Extractor<T> {
    extract(rootDir: string, options: ExtractorOptions): T;
    // Incremental: only re-extract what changed
    update?(previous: T, changedFiles: string[]): T;
}
```

Key extractors:

| Extractor      | Reads                        | Produces                    |
| -------------- | ---------------------------- | --------------------------- |
| FileSystem     | `fs.readdir` recursively     | `FileNode` tree             |
| TypeScriptImports | TS compiler API (createProgram) | Import graph, symbol table |
| PackageJSON    | `package.json` + lockfile    | Package dependency graph    |
| NxProject      | `project.json` / `nx.json`  | Project graph               |

The `update` method on each extractor enables incremental builds — only re-extract facts for files that changed since last run. This mirrors TypeScript's incremental compilation (`--incremental`, `--build`).

### 5. The Checker (Constraint Engine)

This is the heart. In TypeScript, the core operation is:

```
isTypeAssignableTo(source: Type, target: Type): boolean
```

In KindScript, the core operation is:

```
doesSystemSatisfy(facts: FactSlice, contract: Contract): Diagnostic[]
```

The checker iterates over every instance, resolves which facts are relevant (by matching the instance's bindings to regions of the SystemModel), then evaluates each contract against those facts.

```typescript
function checkInstance(instance: ArchSymbol, model: SystemModel): Diagnostic[] {
    const kindDef = instance.resolvedKind;
    const diagnostics: Diagnostic[] = [];

    // 1. Structural check — do required fields exist?
    for (const field of kindDef.fields) {
        if (field.required && !instance.bindings.has(field.name)) {
            diagnostics.push(createDiagnostic(
                instance.declaration,
                `Missing required field '${field.name}' for kind '${kindDef.name}'`
            ));
        }
    }

    // 2. Resolve the fact slice for this instance
    const facts = resolveFactSlice(instance, model);

    // 3. Evaluate each contract
    for (const contract of kindDef.contracts) {
        diagnostics.push(...evaluateContract(contract, facts, model));
    }

    // 4. Recurse into children
    for (const [fieldName, child] of instance.children) {
        diagnostics.push(...checkInstance(child, model));
    }

    return diagnostics;
}
```

Contract evaluation itself is a pattern match on the contract kind:

```typescript
function evaluateContract(
    contract: Contract,
    facts: FactSlice,
    model: SystemModel
): Diagnostic[] {
    switch (contract.kind) {
        case ArchKind.DependencyRule:
            return checkDependencyRule(contract, facts, model);
        case ArchKind.LocationConstraint:
            return checkLocationConstraint(contract, facts);
        case ArchKind.BoundaryAssertion:
            return checkBoundaryAssertion(contract, facts, model);
        case ArchKind.PurityConstraint:
            return checkPurityConstraint(contract, facts, model);
        case ArchKind.CardinalityConstraint:
            return checkCardinalityConstraint(contract, facts);
    }
}
```

Each contract evaluator is a pure function: `(contract, facts) → diagnostics`. This makes them independently testable and composable — you can add new contract types without touching the checker's core loop.

**Lazy resolution** — just like TypeScript's checker resolves types lazily (only when needed for a check), KindScript's checker should resolve fact slices lazily. Don't extract the entire import graph for every instance — only extract the subgraph relevant to the instance's bindings when a contract actually needs it.

### 6. The Emitter (Generator)

TypeScript's emitter walks the AST and produces .js output. KindScript's emitter walks the architectural IR and produces:

- **Scaffolding**: directory structures, boilerplate files, barrel exports for new instances
- **Patches**: code modifications to fix violations (move a file, redirect an import)
- **Reports**: architecture diagrams, dependency matrices, violation summaries
- **Declaration files**: `.kd` files (analogous to `.d.ts`) that describe a module's architectural interface without its implementation

The emitter should use a **Printer** abstraction (as TypeScript does) to serialize the IR back into a human-readable format, and a **Transformer** API to allow plugins to modify the output.

### 7. The Program

The Program ties everything together.

```typescript
interface ArchProgram {
    // Inputs
    getSourceFiles(): ArchSourceFile[];   // parsed .ks files
    getSystemModel(): SystemModel;         // extracted facts
    getConfig(): KindConfig;               // kindconfig.json

    // Core operations
    getChecker(): ArchChecker;
    getEmitter(): ArchEmitter;

    // Outputs
    getDiagnostics(): Diagnostic[];
    emit(options?: EmitOptions): EmitResult;
}
```

The Program handles:
- **Resolution**: finding .ks files from the config, resolving kind imports
- **Caching**: memoising the SystemModel, checker results
- **Incrementality**: tracking which files changed and what needs rechecking

This mirrors `ts.createProgram` exactly.

---

## Surrounding Infrastructure (Beyond the Compiler)

TypeScript isn't just `tsc`. The ecosystem includes several components that KindScript should mirror.

### kindconfig.json (↔ tsconfig.json)

```json
{
    "rootDir": "./src",
    "include": ["**/*.ks"],
    "extractors": {
        "typescript": { "tsconfig": "./tsconfig.json" },
        "filesystem": {},
        "nx": { "nxConfig": "./nx.json" }
    },
    "strictness": {
        "noImplicitBoundary": true,
        "strictLayering": true
    },
    "extends": "@kindscript/preset-clean-architecture"
}
```

### Standard Library (↔ lib.d.ts)

TypeScript ships `lib.d.ts` — built-in type declarations for the JS runtime. KindScript should ship **standard kind definitions** for common architectural patterns:

```
@kindscript/std/
├── clean-architecture.ks      # domain / application / infrastructure
├── hexagonal.ks               # ports and adapters
├── bounded-context.ks         # DDD bounded context
├── microservice.ks            # service boundaries
├── modular-monolith.ks        # module boundaries within a monolith
└── layered.ks                 # generic N-layer architecture
```

These are *not* hardcoded into the compiler. They're defined using Layer 1 primitives (the same ones users have access to). The compiler doesn't know what "clean architecture" means — it only knows kinds, fields, contracts, and instances. The standard library defines the patterns; the compiler enforces them.

This is crucial. TypeScript's checker doesn't know what `Array` or `Promise` means — those are defined in `lib.d.ts` using the same type primitives available to users. KindScript must maintain this same separation.

### Community Packages (↔ @types/)

Third parties publish kind definitions:

```
@kindscript/nx-workspace       # kinds for Nx workspace structures
@kindscript/nextjs             # kinds for Next.js app router conventions
@kindscript/nestjs             # kinds for NestJS module patterns
```

These are resolved through normal package resolution, just like `@types/` packages.

### Language Service (↔ tsserver)

A KindScript language service provides IDE integration:

- **Diagnostics**: red squiggles in .ks files when declarations are invalid
- **Hover**: show resolved facts for an instance ("this maps to 47 files, 3 violations")
- **Go to Definition**: jump from an instance binding to the actual directory/file
- **Completions**: suggest valid field names, kind names, path patterns
- **Code Actions**: "fix this violation" → apply the emitter's suggested patch
- **Architecture View**: a panel showing the instance tree with violation counts

This runs as an LSP server (`ksserver`), exactly like `tsserver`.

### CLI (↔ tsc)

```
ksc                          # check the current project
ksc --init                   # create a kindconfig.json
ksc --watch                  # watch mode with incremental checking
ksc --scaffold               # generate missing structure
ksc --diagram                # emit architecture diagram
ksc --project ./kindconfig.json
```

### Watch Mode and Incremental Builds

TypeScript's `--watch` and `--incremental` modes are critical for developer experience in large codebases. KindScript needs the same:

1. **File watcher** monitors both .ks files and codebase files
2. On change to a .ks file → re-parse, re-bind, re-check affected instances
3. On change to a codebase file → incrementally update the SystemModel, re-check affected contracts
4. Cache the SystemModel and previous diagnostics between runs

The incremental granularity should be at the **instance** level — if a file changes, determine which instances' fact slices are affected and only re-check those.

---

## The Contract Language — Where Expressiveness Matters

TypeScript's type system became powerful enough for real-world use because it added conditional types, mapped types, template literal types, and other expressive features over time. KindScript's contract language will face the same pressure.

Start with a minimal set of contract primitives:

```
// Dependency contracts
mustNotDependOn(source: KindRef, target: KindRef)
mayOnlyDependOn(source: KindRef, targets: KindRef[])
dependencyDirection(layers: KindRef[])   // A → B → C, no reverse

// Location contracts
mustLiveAt(pattern: GlobPattern)
mustBeColocatedWith(sibling: FieldRef)

// Boundary contracts
nothingOutsideMayImport(target: FieldRef, except?: KindRef[])
publicApiOnly(target: FieldRef, via: GlobPattern)

// Cardinality contracts
exactlyOne(pattern: SymbolPattern)
atLeastOne(pattern: SymbolPattern)

// Structural contracts
mustExportSymbol(name: string, symbolKind: SymbolKind)
mustImplementPort(port: KindRef, adapter: KindRef)
```

Over time, add composability: contract combinators (`allOf`, `anyOf`, `not`), parameterised contracts (generic over kinds), and eventually a constraint DSL that can express arbitrary graph queries over the SystemModel. But start small — premature expressiveness kills adoption.

---

## Soundness Decisions

TypeScript is intentionally unsound in several places for pragmatism (bivariant function parameters, `any`, type assertions). KindScript will face similar tradeoffs.

Places where you'll want escape hatches:

- **`@ks-ignore`** — suppress a specific violation (like `@ts-ignore`)
- **`@ks-expect-error`** — suppress but fail if the violation disappears (like `@ts-expect-error`)
- **Progressive adoption** — allow partially-declared architectures where undeclared regions are unchecked (like TypeScript's `allowJs` + gradual typing)
- **Soft contracts** — warnings instead of errors for contracts you're migrating toward

Document every unsoundness explicitly, as TypeScript does.

---

## Implementation Phasing

### Phase 1: The Minimum Viable Compiler

- Parser for a minimal .ks syntax (or TypeScript-embedded DSL)
- Binder that creates ArchSymbols
- FileSystem extractor + TypeScript import graph extractor
- Checker that evaluates `mustNotDependOn` and `locationConstraint`
- CLI that outputs diagnostics
- kindconfig.json support

This alone is useful — it can enforce layering rules in a monorepo.

### Phase 2: Expressiveness

- Standard library kinds (clean architecture, hexagonal)
- More contract types (boundary assertions, cardinality)
- Incremental checking and watch mode
- `@ks-ignore` / `@ks-expect-error`

### Phase 3: Generation

- Emitter that scaffolds directory structures
- Code actions for fixing violations
- Architecture diagram output

### Phase 4: IDE and Ecosystem

- LSP server
- VS Code extension
- Community kind packages
- Nx/Turborepo plugin integration

### Phase 5: Advanced Constraint Engine

- Graph query DSL for arbitrary SystemModel queries
- Parameterised (generic) kind definitions
- Cross-project / cross-repo checking
- Refactoring engine (move module, extract layer)

---

## Open Questions

1. **DSL vs embedded TypeScript?** A dedicated `.ks` syntax gives full control over parsing and better error messages. A TypeScript-embedded DSL (builder pattern) gives zero learning curve and free IDE support. TypeScript itself chose a dedicated syntax — but TypeScript was solving a bigger problem. For KindScript, starting with a TS-embedded DSL and migrating to a dedicated syntax if needed is probably the pragmatic path.

2. **How deep should TypeScript extraction go?** Extracting the import graph is straightforward. Extracting type information (does this class implement this interface?) requires running the full TypeScript checker. How much of the TS type system does KindScript need to understand? Start with imports-only and add deeper extraction as use cases demand it.

3. **Where do contracts live?** In separate `.ks` files? Inline in TypeScript as decorators or JSDoc? Colocated with the code they constrain, or centralised in an architecture definition file? TypeScript types can live in `.d.ts` (separate) or inline in `.ts` (colocated). KindScript should probably support both patterns.

4. **How to handle the gap between "what the codebase is" and "what we declared it to be"?** When you first adopt KindScript on an existing project, there will be hundreds of violations. TypeScript solved this with `allowJs`, strict mode flags, and `@ts-ignore`. KindScript needs an equivalent progressive adoption story — probably a combination of severity levels, ignore comments, and baseline files (like ESLint's `--cache`).

---

## Summary

The TypeScript compiler's architecture — Scanner → Parser → Binder → Checker → Emitter, unified by the Program and bridged by Symbols — maps remarkably well onto KindScript. The main structural adaptation is the second front end (fact extraction) that has no analogue in TypeScript. Everything else — the discriminated AST, the symbol table, the lazy checker, the diagnostic model, the emitter, the language service, the config file, the standard library, the ecosystem model — all transfer directly.

Build it in the same order TypeScript was built: parser and checker first, emitter second, language service third, ecosystem last. Get the core checking loop right, keep the contract language minimal but extensible, and ship something that enforces dependency direction in a monorepo. That's your `tsc --init` moment.
