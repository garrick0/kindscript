# Contract Binding Analysis V2: From Type Syntax to Semantic Contracts

> **Status:** Design exploration
> **Date:** 2026-02-07
> **Supersedes:** `CONTRACT_BINDING_ANALYSIS.md` (V1)

Deep analysis of how KindScript transforms constraint type declarations into validated Contract objects. Grounded in research into TypeScript's compiler pipeline, Rust's multi-IR architecture, ESLint's rule system, and compiler design theory.

---

## Table of Contents

1. [The Problem in Compiler Terms](#1-the-problem-in-compiler-terms)
2. [Our Pipeline vs. TypeScript's Pipeline](#2-our-pipeline-vs-typescripts-pipeline)
3. [Where Our Design Diverges from Best Practice](#3-where-our-design-diverges-from-best-practice)
4. [What Other Systems Do](#4-what-other-systems-do)
5. [Options](#5-options)
6. [Comparison and Recommendation](#6-comparison-and-recommendation)

---

## 1. The Problem in Compiler Terms

Every compiler transforms source text through a series of increasingly semantic representations:

```
Source text → Tokens → AST → Symbols → Types → Output
               ↑         ↑       ↑        ↑
            Scanner    Parser  Binder   Checker
```

Each phase has a clear responsibility:
- **Scanner/Parser**: Syntax — what did the user write?
- **Binder**: Name resolution — what do names refer to?
- **Checker**: Semantic analysis — do the resolved entities satisfy constraints?

The key design principle, observed across TypeScript, Rust, Java, and LLVM, is: **each phase should only know about its own level of abstraction.** The parser shouldn't know what names mean. The binder shouldn't know whether types are compatible. The checker shouldn't know about syntax.

### KindScript's Analogous Pipeline

KindScript has the same phases:

| Compiler Phase | KindScript Equivalent | File |
|---|---|---|
| Parser | AST Adapter — extracts structure from `Kind<N, M, C>` type nodes | `ast.adapter.ts` |
| Binder | ClassifyASTService — resolves member name strings to ArchSymbol references, creates Contracts | `classify-ast.service.ts` |
| Checker | CheckContractsService — evaluates Contracts against the actual codebase | `check-contracts.service.ts` |

The question this document analyzes: **is the boundary between our "parser" and "binder" correctly placed?**

---

## 2. Our Pipeline vs. TypeScript's Pipeline

### TypeScript's Pipeline in Detail

TypeScript's compiler (source: [TypeScript Wiki](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview), [TypeScript Compiler Notes](https://github.com/microsoft/TypeScript-Compiler-Notes)) processes code through five phases. The relevant ones for comparison are Parser, Binder, and Checker.

**Parser** (`parser.ts`, ~10,000 lines):
- Recursive descent parser consuming tokens from a singleton scanner
- Produces AST Nodes — purely syntactic, no semantic information
- When it encounters `type Foo = Bar<A, B, C>`, it creates a `TypeReferenceNode` with `typeArguments` — it does NOT inspect what `Bar` is or what `A, B, C` mean
- The parser uses `switch` statements on `SyntaxKind` to dispatch parse functions, but these switches are about **syntax** ("is this token the start of a statement?"), never about semantics ("what does this type reference mean?")

**Binder** (`binder.ts`):
- First semantic walk of the AST
- Creates `Symbol` objects for declarations and stores them in `SymbolTable`s
- A Symbol is a **generic semantic entity** — it has `flags` (a bitfield), `name`, `declarations` (AST Nodes), and `members` (SymbolTable) — but NO type-specific intermediate representation
- The binder does NOT create typed intermediates between the AST and the Symbol. It attaches Symbols directly to AST declaration nodes
- Also builds the control flow graph for type narrowing
- Processes each SourceFile independently; cross-file merging happens later in the checker

**Checker** (`checker.ts`, ~40,000 lines):
- Resolves Types **lazily, on demand** — types are only computed when something queries them
- When it needs to know the type of a type literal like `{ foo: string; bar: number }`, it calls `getTypeFromTypeNode()` which dispatches on `SyntaxKind`
- The checker walks the AST nodes directly to extract type information — it does NOT rely on a pre-built intermediate representation
- Uses `NodeLinks` as a caching layer — resolved types are cached on nodes for reuse, but discarded between checker runs

**The critical design decisions:**
1. The parser produces generic AST nodes — no semantic knowledge
2. The binder creates generic Symbols — no type-specific intermediates
3. The checker walks AST nodes directly — lazy, on-demand resolution
4. **No phase produces a typed intermediate that the next phase must understand**

### Our Pipeline in Detail

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  User's .k.ts file                                                          │
│                                                                              │
│  type CleanArch = Kind<"CleanArch", {                                        │
│    domain: DomainLayer;                                                      │
│    infrastructure: InfraLayer;                                               │
│  }, {                                                                        │
│    noDependency: [["infrastructure", "domain"]];                             │
│    filesystem: { exists: ["domain"] };                                       │
│  }>;                                                                         │
│                                                                              │
│  (TypeScript type literal — purely syntax)                                   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                               Stage 1 │  "Parser" — AST Adapter (infrastructure)
                                       │  getTypeAliasConstraints(node)
                                       │
                                       │  Walks ts.Node tree for the 3rd type arg.
                                       │  Switches on property NAMES:
                                       │    "noDependency" → extractTuplePairs()
                                       │    "noCycles"     → extractStringArray()
                                       │    "filesystem"   → recurse, then:
                                       │      "exists"     → extractStringArray()
                                       │      "mirrors"    → extractTuplePairs()
                                       │    "pure"         → check TrueKeyword
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  ConstraintsAST  (typed intermediate, defined in ast.port.ts)           │
│                                                                              │
│  {                                                                           │
│    noDependency?: [string, string][];                                        │
│    mustImplement?: [string, string][];                                        │
│    noCycles?: string[];                                                       │
│    pure?: boolean;                                                            │
│    filesystem?: {                                                             │
│      exists?: string[];                                                       │
│      mirrors?: [string, string][];                                            │
│    };                                                                         │
│  }                                                                           │
│                                                                              │
│  (A typed mirror of the runtime Constraints<Members> type)              │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                               Stage 2 │  "Binder" — ClassifyASTService (application)
                                       │  generateContractsFromConfig()
                                       │
                                       │  Iterates properties of ConstraintsAST.
                                       │  For each property:
                                       │    - Resolves member name strings → ArchSymbol
                                       │      via instanceSymbol.findByPath(name)
                                       │    - Creates Contract domain objects
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  Contract[]  (domain objects)                                                │
│                                                                              │
│  Contract(NoDependency, [infraSymbol, domainSymbol])                         │
│  Contract(Exists, [domainSymbol])                                            │
│                                                                              │
│  (Ready for CheckContractsService — the "checker")                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### The Key Difference

In TypeScript: `AST Node → (Binder) → Symbol → (Checker walks AST Node directly) → Type`
- No typed intermediate between any phases
- The Symbol is a generic container (`flags` + `name` + `declarations`)
- The Checker resolves types lazily from AST nodes, not from pre-parsed intermediates

In KindScript: `AST Node → (Adapter) → ConstraintsAST → (Classifier) → Contract`
- **`ConstraintsAST` is a typed intermediate** between the "parser" and "binder"
- It mirrors the runtime type structure — every property is named and typed
- Both the adapter AND the classifier must know every constraint type

In TypeScript's terms, our `ConstraintsAST` is like having a `ClassDeclarationSemantics` interface between the parser and binder — a typed intermediate that the parser builds and the binder reads. TypeScript doesn't do this. The binder reads AST nodes directly.

---

## 3. Where Our Design Diverges from Best Practice

### Divergence 1: The "Parser" Has Semantic Knowledge

The AST adapter's `getTypeAliasConstraints` method (lines 129-192 of `ast.adapter.ts`) switches on property names:

```typescript
if (propName === 'pure') { ... }
else if (propName === 'noDependency' || propName === 'mustImplement') { ... }
else if (propName === 'noCycles') { ... }
else if (propName === 'filesystem') { ... }
```

This is the adapter knowing that `noDependency` means "tuple pairs" and `noCycles` means "string list." The adapter already has generic shape extractors — `extractTuplePairs()` and `extractStringArray()` — but dispatches to them based on semantic knowledge of constraint names, not structural inference.

In TypeScript's parser, there is no equivalent. The parser creates a `TypeLiteralNode` with `members` — generic property signature nodes. It doesn't know or care what the properties mean. The checker later interprets them.

### Divergence 2: The Port Interface Mirrors the Runtime Type

`ConstraintsAST` (in `ast.port.ts`) is a near-exact mirror of `Constraints<Members>` (in `kind.ts`):

```typescript
// Runtime type (kind.ts)                    // Port intermediate (ast.port.ts)
Constraints<Members> = {                ConstraintsAST = {
  pure?: true;                                 pure?: boolean;
  noDependency?: [...tuples...];               noDependency?: [string, string][];
  mustImplement?: [...tuples...];              mustImplement?: [string, string][];
  noCycles?: [...strings...];                  noCycles?: string[];
  filesystem?: {                               filesystem?: {
    exists?: [...strings...];                    exists?: string[];
    mirrors?: [...tuples...];                    mirrors?: [string, string][];
  };                                           };
};                                           };
```

Every constraint property name and shape is duplicated. This means the port interface (the abstraction boundary between infrastructure and application) is constraint-type-specific. Adding a new constraint requires changing the port definition — which is supposed to be a stable interface.

In TypeScript, the interface between parser and binder is the `Node` type hierarchy — generic, stable, and syntax-oriented. It doesn't change when new type-level semantics are added.

### Divergence 3: Four Files Must Change Per New Constraint

Adding a constraint currently requires modifying:

1. `kind.ts` — add property to `Constraints` (always required — this is the user-facing type)
2. `ast.port.ts` — add property to `ConstraintsAST` (port interface changes)
3. `ast.adapter.ts` — add parsing branch in `getTypeAliasConstraints` (infrastructure changes)
4. `classify-ast.service.ts` — add creation logic in `generateContractsFromConfig` (application changes)
5. `mock-ast.adapter.ts` — must understand the new `ConstraintsAST` shape (test infrastructure)

Plus the domain layer (`ContractType` enum, `Contract.validate()`, `Diagnostic` factory, `DiagnosticCode`) and the checker (`CheckContractsService`).

In TypeScript, adding a new built-in utility type like `Awaited<T>` requires zero parser changes, zero binder changes, and no intermediate type changes. Only the checker needs updating.

### Why This Matters

These aren't just aesthetic concerns. They create real maintenance costs:

- **Coupling across layers**: Infrastructure (adapter) and application (classifier) are coupled through a constraint-type-specific intermediate. Changes to one propagate to the other.
- **Violation of Clean Architecture port stability**: Ports should be stable interfaces that change less frequently than their implementations. Our port changes every time we add a constraint.
- **Duplicated knowledge**: The mapping "noDependency = tuple pairs" exists in both the adapter (parsing) and the classifier (interpretation).

---

## 4. What Other Systems Do

### TypeScript's Binder: Generic Symbols, No Intermediates

TypeScript's binder (source: [Compiler Notes - Binder](https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/binder.md)) creates `Symbol` objects via `declareSymbol()`:

```typescript
// Simplified from TypeScript source
function declareSymbol(symbolTable: SymbolTable, name: string, node: Declaration, flags: SymbolFlags) {
    const existing = symbolTable.get(name);
    if (existing && (existing.excludeFlags & flags)) {
        error(node, Diagnostics.Duplicate_identifier_0, name);
    } else {
        const symbol = createSymbol(flags, name);
        symbol.declarations.push(node);
        symbolTable.set(name, symbol);
    }
}
```

The Symbol is a generic container:
- `flags: SymbolFlags` — bitfield (Variable | Function | Class | Interface | ...)
- `name: string`
- `declarations: Declaration[]` — the raw AST nodes, NOT a typed intermediate
- `members?: SymbolTable` — child symbols

When the checker needs to know what a class's members are, it walks `symbol.declarations` (the AST nodes) directly. It doesn't read from a pre-parsed `ClassSemantics` intermediate.

### Rust: Multiple IRs, Each Removing Information

Rust's compiler ([rustc-dev-guide](https://rustc-dev-guide.rust-lang.org/overview.html)) uses a series of IRs, each at a lower level of abstraction:

| IR | Purpose |
|---|---|
| AST | Syntactic validation, mirrors source code |
| HIR (High-Level IR) | Type checking; desugars `async`, loops, elided lifetimes |
| THIR (Typed HIR) | Pattern exhaustiveness checking; fully typed |
| MIR (Mid-Level IR) | Borrow checking, optimization; CFG-based |
| LLVM-IR | Machine-level optimization; typed SSA |

Each lowering step **removes information the next phase doesn't need** and **makes explicit information that was implicit**. But critically, **name resolution and type checking happen BEFORE the first IR lowering** (on the AST/HIR directly). IRs are for optimization and code generation, not for semantic analysis.

For an architectural validator, there is no optimization or code generation. We only do semantic analysis. So multi-level IRs provide no value — we should operate on our "symbol table" (ArchSymbols) directly, just like TypeScript's checker operates on Symbols directly.

### Javac: Lazy Completers

Java's compiler ([javac compilation overview](https://openjdk.org/groups/compiler/doc/compilation-overview/index.html)) uses **completer objects** for lazy binding. When a class symbol is first entered into the scope, it gets a lazy completer. The completer is only triggered when something actually queries the class's members.

This is analogous to TypeScript's lazy type resolution. The pattern is: **create a lightweight placeholder during binding, resolve details on demand during checking.**

Our `ConstraintsAST` is the opposite of lazy — it eagerly parses all constraint details during AST extraction, before the classifier even knows which constraints are relevant.

### ESLint: Event-Based, Declarative Outside / Procedural Inside

ESLint's architecture ([ESLint docs](https://eslint.org/docs/latest/contribute/architecture/)) uses an event-based visitor model:

1. **Configuration** (declarative): Users specify which rules to enable
2. **Traversal**: The Linter walks the AST, emitting events named after node types
3. **Rules** (procedural): Each rule subscribes to events for node types it cares about
4. **Reporting**: Rules call `context.report()` to create diagnostics

The key design choice: **rules don't know about each other.** The Linter doesn't have a switch statement dispatching to rules. Instead, rules register themselves. This makes the system open for extension without modification.

However, ESLint has 300+ rules and is designed for third-party plugins. KindScript has 6 contract types and no plugin system. The ESLint pattern is instructive but potentially over-engineered for our scale.

### The Expression Problem

The expression problem ([Eli Bendersky](https://eli.thegreenplace.net/2016/the-expression-problem-and-its-solutions/), [Ted Kaminski](https://www.tedinski.com/2018/03/06/more-on-the-expression-problem.html)) asks: how do you make it easy to add both new data types AND new operations?

Kaminski's key insight: **"Before implementing an expression problem solution, ask: do you genuinely need both extensibility dimensions?"** He argues that deliberately closing one dimension preserves exhaustiveness checking and modular reasoning.

For KindScript:
- **Data types** (contract kinds): Stable, rarely added, should be exhaustively handled
- **Operations** (parse, bind, check): Fixed, well-defined

Both dimensions are effectively closed. A `switch` on `ContractType` with exhaustiveness checking is the right pattern for the checker. The question is only about the parser/binder boundary — how the adapter communicates parsed constraint data to the classifier.

---

## 5. Options

### Option A: Status Quo — Typed Intermediate

Keep `ConstraintsAST` as a semantically-typed mirror of the runtime type.

```
Adapter (semantic parse) → ConstraintsAST → Classifier (name resolution)
```

**How it works today:**

The adapter walks the 3rd type argument of `Kind<N, M, C>`. For each property, it checks the property name to determine how to parse the value. It builds a `ConstraintsAST` object matching the property names and shapes of `Constraints<Members>`. The classifier reads this object property-by-property.

**Strengths:**
- Already works, fully tested (278 tests passing)
- Type-safe at compile time — TypeScript catches shape mismatches between adapter and classifier
- Easy to understand — the intermediate looks exactly like the user-facing type
- Debugging is straightforward — inspect the `ConstraintsAST` object

**Weaknesses:**
- Adapter has semantic knowledge it shouldn't need (violates parser/binder boundary)
- Port interface (`ConstraintsAST`) changes with every new constraint
- Knowledge is duplicated: adapter knows "noDependency = tuple pairs", classifier also knows this
- 4+ files must change per new constraint
- Mock adapter must also understand the typed intermediate

---

### Option B: Generic Structural Extraction

The adapter parses the constraint type literal **structurally** — inferring the data shape from AST structure, not from property names. Returns a flat list of generic entries.

```
Adapter (structural parse) → ParsedConstraintEntry[] → Classifier (semantic interpretation)
```

**New port interface:**

```typescript
/**
 * A structurally-parsed entry from a type literal property.
 * The adapter infers the shape from AST structure without knowing
 * what the property name means semantically.
 */
interface ParsedConstraintEntry {
  /** Dot-path of the property: "noDependency", "filesystem.exists", etc. */
  name: string;
  /** Shape inferred from AST structure */
  shape: 'boolean' | 'stringList' | 'tuplePair';
  /** Extracted string values, interpretation depends on shape:
   *   boolean   → [] (no values, presence is the signal)
   *   stringList → [["a", "b", "c"]] (one array of member names)
   *   tuplePair  → [["a", "b"], ["c", "d"]] (pairs of member names)
   */
  values: string[][];
}
```

**How the adapter works:**

The adapter already has two private methods:
- `extractTuplePairs(typeNode)` — handles any tuple-of-tuples-of-string-literals
- `extractStringArray(typeNode)` — handles any tuple-of-string-literals

Instead of dispatching by property name, it **inspects the AST structure** of each property's type node to determine which extractor to use:

```
For each property in the constraint type literal:
  typeNode = property.type

  if typeNode is TrueKeyword or LiteralType(true):
    → { name, shape: 'boolean', values: [] }

  if typeNode is TypeLiteral (nested object):
    → recurse into its properties with prefix "parentName."

  elements = getTypeElements(typeNode)  // handles TupleType + ReadonlyArray
  first = elements[0]

  if first is LiteralType(StringLiteral):
    → { name, shape: 'stringList', values: [extractStringArray(typeNode)] }

  if first is TupleType or contains inner elements:
    → { name, shape: 'tuplePair', values: extractTuplePairs(typeNode) }
```

This is entirely structural. The adapter doesn't need to know that `noDependency` is tuple pairs — it can see from the AST that the value is a tuple of tuples of string literals.

**How the classifier works:**

The classifier maps entry names to contract types:

```typescript
// In classify-ast.service.ts or a separate module
const CONSTRAINT_BINDINGS: Record<string, { type: ContractType; shape: 'boolean' | 'stringList' | 'tuplePair' }> = {
  'noDependency':       { type: ContractType.NoDependency,  shape: 'tuplePair' },
  'mustImplement':      { type: ContractType.MustImplement, shape: 'tuplePair' },
  'noCycles':           { type: ContractType.NoCycles,      shape: 'stringList' },
  'pure':               { type: ContractType.Purity,        shape: 'boolean' },
  'filesystem.exists':  { type: ContractType.Exists,        shape: 'stringList' },
  'filesystem.mirrors': { type: ContractType.Mirrors,       shape: 'tuplePair' },
};
```

Then `generateContractsFromConfig` becomes a generic loop:

```typescript
for (const entry of constraintEntries) {
  const binding = CONSTRAINT_BINDINGS[entry.name];
  if (!binding) {
    errors.push(`Unknown constraint '${entry.name}' in Kind<${kindName}>.`);
    continue;
  }
  if (binding.shape !== entry.shape) {
    errors.push(`Constraint '${entry.name}' has wrong shape: expected ${binding.shape}, got ${entry.shape}.`);
    continue;
  }

  if (binding.shape === 'tuplePair') {
    for (const [firstName, secondName] of entry.values) {
      const first = instanceSymbol.findByPath(firstName);
      const second = instanceSymbol.findByPath(secondName);
      if (!first || !second) { errors.push(...); continue; }
      contracts.push(new Contract(binding.type, `${entry.name}(${firstName} -> ${secondName})`, [first, second], location));
    }
  } else if (binding.shape === 'stringList') {
    const symbols = entry.values[0]?.map(name => instanceSymbol.findByPath(name)).filter(Boolean);
    if (symbols?.length) {
      contracts.push(new Contract(binding.type, `${entry.name}(${symbols.map(s => s.name).join(', ')})`, symbols, location));
    }
  }
  // 'boolean' is handled specially (purity propagation, not direct binding)
}
```

**Port method change:**

```typescript
// Before:
getTypeAliasConstraints(node: ASTNode): ConstraintsAST | undefined;

// After:
getTypeAliasConstraintEntries(node: ASTNode): ParsedConstraintEntry[];
```

**What changes per component:**

| Component | Before | After |
|-----------|--------|-------|
| AST adapter | `if/else` on property names | Structural shape inference |
| Port interface | `ConstraintsAST` (6 named properties) | `ParsedConstraintEntry[]` (generic) |
| Mock adapter | Stores `ConstraintsAST` | Stores `ParsedConstraintEntry[]` |
| Classifier | Reads named properties, creates contracts per type | Loops entries, looks up `CONSTRAINT_BINDINGS` |

**Adding a new constraint (existing shape):**
1. `kind.ts` — add property to `Constraints` (always required)
2. `contract-type.ts` — add enum variant (always required)
3. `classify-ast.service.ts` — add one line to `CONSTRAINT_BINDINGS`
4. **No adapter changes.** No port interface changes. No mock adapter changes.

**Adding a new constraint (new shape):**
Same as above, plus add a shape case to the adapter's `inferShape` logic and the classifier's binding loop.

**Strengths:**
- Follows the TypeScript design principle: parser extracts structure, binder assigns meaning
- Port interface is stable — adding constraints doesn't change it
- Adapter is constraint-type-agnostic — no semantic knowledge in infrastructure
- Adding a constraint with existing shape = 1 entry in `CONSTRAINT_BINDINGS`
- Shape validation: classifier can catch shape mismatches ("expected tuplePair, got stringList")
- Natural error for unknown properties: classifier reports unrecognized constraint names

**Weaknesses:**
- `values: string[][]` loses type specificity (was `[string, string][]` vs `string[]`)
- Shape inference must handle edge cases (empty tuples, mixed types)
- The `purity` intrinsic (boolean) is still a special case that doesn't fit the generic loop
- Slightly harder to debug — generic entries vs. named properties on a typed object
- Shape mismatch between what the adapter infers and what the classifier expects could produce confusing errors

---

### Option C: Return AST Node Reference, Walk from Classifier

Eliminate the intermediate entirely. The port returns an opaque reference to the constraint type literal node. The classifier walks it through the ASTPort.

```
Adapter (return node) → ASTNode → Classifier (walks via ASTPort → creates Contracts)
```

This most closely mirrors TypeScript's design, where the Checker walks AST nodes directly to resolve types.

**Port method:**

```typescript
/** Return the 3rd type argument of Kind<N, M, C> as an opaque node */
getTypeAliasConstraintTypeArg(node: ASTNode): ASTNode | undefined;
```

**New ASTPort methods needed:**

```typescript
interface ASTTypePort {
  /** Walk a TypeLiteral's property signatures */
  getTypeLiteralMembers(node: ASTNode): Array<{ name: string; typeNode: ASTNode }>;
  /** Extract string literals from a tuple/array type */
  extractStringArrayFromType(node: ASTNode): string[];
  /** Extract pairs of string literals from a tuple-of-tuples type */
  extractTuplePairsFromType(node: ASTNode): [string, string][];
  /** Check if a type node is the `true` keyword */
  isTrueKeywordType(node: ASTNode): boolean;
  /** Check if a type node is a TypeLiteral (nested object type) */
  isTypeLiteralNode(node: ASTNode): boolean;
}
```

**How the classifier works:**

```typescript
const constraintNode = this.astPort.getTypeAliasConstraintTypeArg(kindNode);
if (!constraintNode) return;

const members = this.astPort.getTypeLiteralMembers(constraintNode);
for (const { name, typeNode } of members) {
  if (name === 'pure' && this.astPort.isTrueKeywordType(typeNode)) {
    // handle purity
  } else if (name === 'noDependency' || name === 'mustImplement') {
    const pairs = this.astPort.extractTuplePairsFromType(typeNode);
    // resolve, create contracts
  } else if (name === 'filesystem' && this.astPort.isTypeLiteralNode(typeNode)) {
    const fsMembers = this.astPort.getTypeLiteralMembers(typeNode);
    // recurse into filesystem sub-properties
  }
  // ...
}
```

**Strengths:**
- No intermediate representation at all — most faithful to TypeScript's design
- Maximum flexibility — classifier can handle any constraint shape by walking the AST
- Adapter is trivially simple — just returns a node reference

**Weaknesses:**
- Expands ASTPort surface with 5+ new methods
- The semantic `if/else` on names moves from the adapter to the classifier — the switch doesn't disappear, it relocates
- More port calls across the boundary per constraint (one per property vs. one total)
- Mock adapter must implement all new type-walking methods
- The shape extraction logic (`extractTuplePairs`, `extractStringArray`) is duplicated: it already exists as private methods in the adapter, and now it would also be on the port interface
- Classifier becomes tightly coupled to type-literal AST structure

---

### Option D: Declarative Constraint Registry

Build on Option B's generic structural extraction, but centralize all constraint metadata into a single registry.

```
Adapter (structural parse) → ParsedConstraintEntry[] → Registry (declarative) → Classifier (generic binding)
```

**The registry:**

```typescript
// src/application/use-cases/classify-ast/constraint-definitions.ts

export interface ConstraintDefinition {
  type: ContractType;
  shape: 'boolean' | 'stringList' | 'tuplePair';
  /** How to format the contract name for display */
  displayName: (...memberNames: string[]) => string;
  /** If true, handled by propagation rather than direct binding */
  intrinsic?: boolean;
}

export const CONSTRAINT_DEFINITIONS: Record<string, ConstraintDefinition> = {
  'noDependency': {
    type: ContractType.NoDependency,
    shape: 'tuplePair',
    displayName: (a, b) => `noDependency(${a} -> ${b})`,
  },
  'mustImplement': {
    type: ContractType.MustImplement,
    shape: 'tuplePair',
    displayName: (a, b) => `mustImplement(${a} -> ${b})`,
  },
  'noCycles': {
    type: ContractType.NoCycles,
    shape: 'stringList',
    displayName: (...names) => `noCycles(${names.join(', ')})`,
  },
  'pure': {
    type: ContractType.Purity,
    shape: 'boolean',
    displayName: () => 'pure',
    intrinsic: true,
  },
  'filesystem.exists': {
    type: ContractType.Exists,
    shape: 'stringList',
    displayName: (...names) => `exists(${names.join(', ')})`,
  },
  'filesystem.mirrors': {
    type: ContractType.Mirrors,
    shape: 'tuplePair',
    displayName: (a, b) => `mirrors(${a} -> ${b})`,
  },
};
```

**Generic binding function:**

```typescript
function bindConstraintEntries(
  entries: ParsedConstraintEntry[],
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
  contracts: Contract[],
  errors: string[],
): void {
  for (const entry of entries) {
    const def = CONSTRAINT_DEFINITIONS[entry.name];
    if (!def) {
      errors.push(`Unknown constraint '${entry.name}' in Kind<${kindName}>.`);
      continue;
    }
    if (def.intrinsic) continue; // handled elsewhere (purity propagation)

    if (def.shape === 'tuplePair') {
      for (const pair of entry.values) {
        const [a, b] = pair;
        const symA = instanceSymbol.findByPath(a);
        const symB = instanceSymbol.findByPath(b);
        if (!symA) { errors.push(`...`); continue; }
        if (!symB) { errors.push(`...`); continue; }
        contracts.push(new Contract(def.type, def.displayName(a, b), [symA, symB], location));
      }
    } else if (def.shape === 'stringList') {
      const names = entry.values[0] ?? [];
      const symbols: ArchSymbol[] = [];
      for (const name of names) {
        const sym = instanceSymbol.findByPath(name);
        if (!sym) { errors.push(`...`); continue; }
        symbols.push(sym);
      }
      if (symbols.length > 0) {
        contracts.push(new Contract(def.type, def.displayName(...names), symbols, location));
      }
    }
  }
}
```

**Adding a new constraint:** Add one entry to `CONSTRAINT_DEFINITIONS` (+ the always-required `ContractType` enum variant and `Constraints` property). That's it for the binding side.

**Strengths:**
- Single source of truth for constraint metadata (type, shape, display name)
- Adding a constraint = one registry entry (binding side) + enum + runtime type
- `displayName` generation is co-located with the constraint definition
- Generic binding function is reusable and never needs modification for new constraints
- Clear separation: registry declares what constraints exist, binding function handles the mechanics

**Weaknesses:**
- New abstraction to understand (the registry)
- `intrinsic: true` for purity is still a special case
- New shapes still require extending the binding function
- Slightly more indirection compared to Option B's inline `CONSTRAINT_BINDINGS` map

---

## 6. Comparison and Recommendation

### Comparison Matrix

| Criterion | A (Status Quo) | B (Generic Port) | C (Walk AST) | D (Registry) |
|---|:-:|:-:|:-:|:-:|
| Files changed per new constraint (existing shape) | 5+ | 3 | 3 | 3 |
| Adapter knows constraint names | Yes | **No** | **No** | **No** |
| Port interface changes per constraint | Yes | **No** | **No** | **No** |
| Follows TypeScript's parser/binder separation | No | **Yes** | **Yes** | **Yes** |
| Type safety of boundary data | High | Medium | N/A | Medium |
| Port surface size | Same | Same | **Larger (+5)** | Same |
| Implementation effort | None | Small | Medium | Small |
| Duplicate semantic knowledge | Yes (adapter + classifier) | **No** | **No** | **No** |
| Purity special case | Embedded | Explicit | Embedded | Explicit |

### Recommendation

**Option B** — Generic Structural Extraction.

The reasoning:

1. **It fixes the real problem.** The core issue is the adapter having semantic knowledge. Option B makes the adapter structurally generic, matching TypeScript's design where the parser doesn't know semantics.

2. **It's the simplest option that achieves the goal.** Option C is more faithful to TypeScript's design but requires 5 new port methods and relocates the name-matching switch without eliminating it. Option D adds a registry abstraction that's valuable but not necessary at 6 constraints.

3. **The port interface becomes stable.** `ParsedConstraintEntry[]` doesn't change when constraints are added. This is how ports should work in Clean Architecture — the interface should outlast the implementations.

4. **It's incrementally improvable.** Option B can be upgraded to Option D later by extracting the `CONSTRAINT_BINDINGS` map into a separate registry file. No rework required.

5. **The effort is small.** The adapter already has `extractTuplePairs()` and `extractStringArray()`. The change is mainly about how they're dispatched — by structural inference instead of by property name.

### What About Option C?

Option C most faithfully mirrors TypeScript's design (checker walks AST nodes directly). However, there's an important difference between TypeScript and KindScript:

- TypeScript's checker is in the **same process** as the AST — it can walk nodes freely
- KindScript's classifier accesses the AST through a **port interface** — every node access is a method call

In TypeScript, lazy AST walking is cheap (direct property access). In KindScript, it's expensive (port method calls + opaque type casts). The port boundary makes Option C's "walk the AST directly" approach add more surface area than it saves. Option B's approach of "extract structure once, return it" is better suited to a port-mediated architecture.

### What About the Expression Problem?

Both the contract type set and the operation set are effectively closed in KindScript. We don't need third-party constraint plugins. We don't need dynamically composable operations. A `switch` on `ContractType` with exhaustiveness checking is the right pattern for the checker. The binding process (classifier) similarly benefits from a finite, well-understood set of shapes.

The expression problem literature confirms this: Kaminski argues that deliberately closing one dimension preserves modular reasoning and exhaustiveness guarantees. For KindScript, both dimensions should be closed, and exhaustive `switch`/`match` is preferred over open dispatch.

---

## Appendix A: TypeScript Compiler Phase Summary

| Phase | Input | Output | Key Design Choice |
|---|---|---|---|
| Scanner | Source text | Token stream | Stateful, on-demand (parser pulls tokens) |
| Parser | Token stream | AST (Nodes) | Generic — doesn't know type semantics |
| Binder | AST | Symbols + SymbolTables + CFG | Generic — Symbols are containers, not typed intermediates |
| Checker | AST + Symbols | Types + Diagnostics | Lazy — resolves types on demand via NodeLinks cache |
| Emitter | AST + Types | JS/DTS/SourceMaps | Dumb printer — bugs indicate upstream issues |

Sources: [TypeScript Wiki](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview), [TypeScript Compiler Notes](https://github.com/microsoft/TypeScript-Compiler-Notes), [Basarat's TypeScript Deep Dive](https://basarat.gitbook.io/typescript/overview)

## Appendix B: Shape Inference Algorithm

For the adapter in Option B/D:

```typescript
/**
 * Structurally parse a type literal into generic constraint entries.
 * No constraint-name knowledge — purely shape-based.
 */
function parseTypeLiteralEntries(
  typeLiteral: ts.TypeLiteralNode,
  prefix: string = ''
): ParsedConstraintEntry[] {
  const entries: ParsedConstraintEntry[] = [];

  for (const member of typeLiteral.members) {
    if (!ts.isPropertySignature(member) || !member.name || !member.type) continue;
    const propName = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
    const fullName = prefix ? `${prefix}.${propName}` : propName;
    const typeNode = member.type;

    // Boolean: true keyword
    if (typeNode.kind === ts.SyntaxKind.TrueKeyword ||
        (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.TrueKeyword)) {
      entries.push({ name: fullName, shape: 'boolean', values: [] });
      continue;
    }

    // Nested type literal: recurse with prefix
    if (ts.isTypeLiteralNode(typeNode)) {
      entries.push(...parseTypeLiteralEntries(typeNode, fullName));
      continue;
    }

    // Tuple or array: determine if string list or tuple pairs
    const outerElements = getTypeElements(typeNode);
    if (outerElements.length === 0) continue;

    const first = outerElements[0];

    // Check if first element is a string literal → stringList
    if (ts.isLiteralTypeNode(first) && ts.isStringLiteral(first.literal)) {
      const strings = outerElements
        .map(e => getStringLiteralFromType(e))
        .filter((s): s is string => s !== undefined);
      entries.push({ name: fullName, shape: 'stringList', values: [strings] });
      continue;
    }

    // Check if first element is itself a tuple → tuplePair
    const innerElements = getTypeElements(first);
    if (innerElements.length > 0) {
      const pairs = extractTuplePairs(typeNode);
      entries.push({ name: fullName, shape: 'tuplePair', values: pairs.map(([a, b]) => [a, b]) });
      continue;
    }
  }

  return entries;
}
```

This algorithm uses the adapter's existing private methods (`getTypeElements`, `getStringLiteralFromType`, `extractTuplePairs`) — it just calls them based on structural inspection rather than property name matching.

## Appendix C: Sources

### TypeScript Compiler
- [TypeScript Wiki: Architectural Overview](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview)
- [TypeScript Wiki: Codebase Compiler Binder](https://github.com/microsoft/TypeScript/wiki/Codebase-Compiler-Binder)
- [TypeScript Wiki: Codebase Compiler Checker](https://github.com/microsoft/TypeScript/wiki/Codebase-Compiler-Checker)
- [TypeScript Compiler Notes: Binder](https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/binder.md)
- [TypeScript Compiler Notes: Checker](https://github.com/microsoft/TypeScript-Compiler-Notes/blob/main/codebase/src/compiler/checker.md)
- [Basarat's TypeScript Deep Dive: Compiler Overview](https://basarat.gitbook.io/typescript/overview)

### Compiler Design
- [Rust Compiler Dev Guide: Overview](https://rustc-dev-guide.rust-lang.org/overview.html)
- [Rust Compiler Dev Guide: Name Resolution](https://rustc-dev-guide.rust-lang.org/name-resolution.html)
- [Javac Compilation Overview](https://openjdk.org/groups/compiler/doc/compilation-overview/index.html)
- [Flang Semantic Analysis](https://flang.llvm.org/docs/Semantics.html)
- [LLVM Language Reference](https://llvm.org/docs/LangRef.html)

### Design Patterns
- [Expression Problem and Solutions (Eli Bendersky)](https://eli.thegreenplace.net/2016/the-expression-problem-and-its-solutions/)
- [Expression Problem Notes (Ted Kaminski)](https://www.tedinski.com/2018/03/06/more-on-the-expression-problem.html)
- [ESLint Architecture](https://eslint.org/docs/latest/contribute/architecture/)
- [Crafting Interpreters: Representing Code](https://craftinginterpreters.com/representing-code.html)
- [Martin Fowler: Rules Engine](https://martinfowler.com/bliki/RulesEngine.html)
- [Visitor Pattern Considered Pointless (nipafx)](https://nipafx.dev/java-visitor-pattern-pointless/)
