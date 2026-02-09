# Contract Binding: How Constraints Go From Types to Checks

> **Status:** Design exploration
> **Date:** 2026-02-07

Deep analysis of how constraint declarations become Contract objects — the "contract binding" process. Compares with how TypeScript handles the analogous problem. Identifies architectural issues and presents options.

---

## What "Contract Binding" Means

When you write this:

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;
  infrastructure: InfraLayer;
}, {
  noDependency: [["infrastructure", "domain"]];
  filesystem: { exists: ["domain", "infrastructure"] };
}>;
```

The third type parameter (`{ noDependency: ..., filesystem: ... }`) is a **constraint declaration**. It exists only as TypeScript type syntax — it's never evaluated at runtime. KindScript must:

1. **Parse** it from the AST
2. **Bind** the member name strings (`"domain"`, `"infrastructure"`) to resolved `ArchSymbol` references
3. **Create** `Contract` domain objects that the checker can evaluate

This is the "contract binding" process. It currently spans two layers and uses a typed intermediate representation.

---

## Current Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│ User's .k.ts file                                                   │
│                                                                     │
│   { noDependency: [["infrastructure", "domain"]],                   │
│     filesystem: { exists: ["domain"] } }                            │
│                                                                     │
│   (TypeScript type literal — just syntax, never executed)           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                     Stage 1 │  AST Adapter (infrastructure)
                             │  getTypeAliasConstraints(node)
                             │
                             │  Walks ts.Node tree. Switches on property
                             │  names: "noDependency" → extractTuplePairs(),
                             │  "noCycles" → extractStringArray(), etc.
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ConstraintsAST  (intermediate representation, defined in port) │
│                                                                     │
│   { noDependency: [["infrastructure", "domain"]],                   │
│     filesystem: { exists: ["domain"] } }                            │
│                                                                     │
│   (Plain JS object — typed mirror of the runtime Constraints)  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                     Stage 2 │  ClassifyASTService (application)
                             │  generateContractsFromConfig()
                             │
                             │  Iterates properties. For tuple pairs:
                             │  resolve both names via findByPath().
                             │  For collective lists: resolve all names.
                             │  Creates Contract objects.
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Contract[]  (domain objects)                                        │
│                                                                     │
│   Contract(NoDependency, [infraSymbol, domainSymbol])               │
│   Contract(Exists, [domainSymbol])                                  │
│                                                                     │
│   (Ready for CheckContractsService to evaluate)                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Where Constraint Knowledge Lives

Every constraint type is hardcoded in **four places**:

| Location | What It Knows | File |
|----------|--------------|------|
| Runtime type | Property name + type shape | `kind.ts` — `Constraints<Members>` |
| AST adapter | Property name → parse method | `ast.adapter.ts` — if/else chain in `getTypeAliasConstraints` |
| Port interface | Property name + parsed shape | `ast.port.ts` — `ConstraintsAST` |
| Classifier | Property name → Contract creation | `classify-ast.service.ts` — `generateContractsFromConfig` |

Adding a new constraint requires modifying all four.

---

## How TypeScript Handles This

TypeScript's compiler has an analogous problem. Source code contains declarations (classes, functions, variables, type aliases). The compiler must:

1. **Parse** declarations from source text into AST nodes
2. **Bind** declaration names to `Symbol` objects (scope resolution)
3. **Check** types and validate constraints

### TypeScript's Key Design Decision

**The parser doesn't know semantics.** It parses syntax generically.

When TypeScript's parser encounters `type Foo = Bar<A, B, C>`, it doesn't know or care that `Bar` is `Kind` or `Promise` or anything else. It produces a generic `TypeReferenceNode` with `typeArguments`. The parser doesn't inspect type argument contents differently based on the referenced type name.

This means:
- Adding a new built-in utility type (e.g., `Awaited<T>`) requires **zero parser changes**
- The parser already knows how to parse `TypeReference<Args>` generically
- Semantic meaning is assigned later, in the checker

### What We Do Differently

Our AST adapter **is not generic**. When it encounters the 3rd type argument of `Kind<N, M, C>`, it switches on property names:

```typescript
// ast.adapter.ts — getTypeAliasConstraints
if (propName === 'pure') {
  // → check for TrueKeyword
} else if (propName === 'noDependency' || propName === 'mustImplement') {
  // → extractTuplePairs()
} else if (propName === 'noCycles') {
  // → extractStringArray()
} else if (propName === 'filesystem') {
  // → recurse into nested type literal
  //   → check for 'exists' → extractStringArray()
  //   → check for 'mirrors' → extractTuplePairs()
}
```

The adapter knows that `noDependency` is tuple pairs and `noCycles` is a string list. It hardcodes semantic knowledge into the parser.

### The TypeScript Analogy

Imagine if TypeScript's parser had special-case code:

```
// Hypothetical bad design
if (typeReferenceName === 'Promise') {
  // parse first type arg as the resolved type
} else if (typeReferenceName === 'Map') {
  // parse first arg as key type, second as value type
}
```

TypeScript doesn't do this. It parses all type references the same way. The checker interprets them.

**Our adapter is doing what TypeScript deliberately avoids.**

---

## The Deeper Problem

The constraint type literal is just a TypeScript type literal. It contains:
- Properties with names (`noDependency`, `noCycles`, `pure`, `filesystem`)
- Values that are either:
  - `true` (boolean literal)
  - Tuples of string literals (`["domain", "infra"]`)
  - Tuples of tuples of string literals (`[["domain", "infra"]]`)
  - Nested type literals (`{ exists: ..., mirrors: ... }`)

These are **structural shapes**, not semantic concepts. The adapter can determine the shape from the AST structure alone — it doesn't need to know what `noDependency` means to extract `[["domain", "infra"]]` from a tuple-of-tuples.

The adapter already has shape-based extractors:
- `extractTuplePairs(typeNode)` — handles any tuple-of-tuples-of-string-literals
- `extractStringArray(typeNode)` — handles any tuple-of-string-literals

The semantic mapping ("`noDependency` is a tuple pair that means forbidden dependency") belongs in the application layer, not the infrastructure layer.

---

## Options

### Option A: Status Quo

Keep `ConstraintsAST` as a typed intermediate.

```
AST adapter (knows names + shapes) → ConstraintsAST → Classifier (knows names + semantics)
```

**Pros:**
- Already works and tested
- Type-safe intermediate — TypeScript catches mismatches at compile time
- Easy to understand

**Cons:**
- 4 places to modify per new constraint
- Adapter hardcodes semantic knowledge (which property = which shape)
- Port interface (`ConstraintsAST`) is constraint-type-specific
- Mock adapter must also mirror the typed intermediate

---

### Option B: Generic Parsed Constraints

The adapter parses the constraint type literal **structurally** — inferring shapes from AST structure, not from property names. Returns a generic list.

**New port interface:**

```typescript
interface ParsedConstraintEntry {
  /** Dot-separated path: "noDependency", "filesystem.exists", etc. */
  name: string;
  /** Inferred from AST structure */
  shape: 'boolean' | 'stringList' | 'tuplePair';
  /** The extracted string values */
  values: string[][];
  // boolean → []
  // stringList → [["a", "b", "c"]]
  // tuplePair → [["a", "b"], ["c", "d"]]
}
```

**How shape inference works:**

The adapter already has `extractTuplePairs` and `extractStringArray`. It can determine which to use by inspecting the AST:

```
Type literal property value:
  → TrueKeyword or LiteralType(true)  →  shape: 'boolean'
  → TupleType containing LiteralTypes →  shape: 'stringList'
  → TupleType containing TupleTypes   →  shape: 'tuplePair'
  → TypeLiteral (nested object)       →  recurse, prefix name with parent
```

**Port method change:**

```typescript
// Before (constraint-type-specific):
getTypeAliasConstraints(node: ASTNode): ConstraintsAST | undefined;

// After (generic):
getTypeAliasConstraintEntries(node: ASTNode): ParsedConstraintEntry[];
```

**Classifier maps names to contract types:**

```typescript
const CONSTRAINT_MAP: Record<string, { type: ContractType; shape: string }> = {
  'noDependency':       { type: ContractType.NoDependency, shape: 'tuplePair' },
  'mustImplement':      { type: ContractType.MustImplement, shape: 'tuplePair' },
  'noCycles':           { type: ContractType.NoCycles, shape: 'stringList' },
  'pure':               { type: ContractType.Purity, shape: 'boolean' },
  'filesystem.exists':  { type: ContractType.Exists, shape: 'stringList' },
  'filesystem.mirrors': { type: ContractType.Mirrors, shape: 'tuplePair' },
};
```

Then `generateContractsFromConfig` becomes:

```typescript
for (const entry of constraintEntries) {
  const mapping = CONSTRAINT_MAP[entry.name];
  if (!mapping) { errors.push(`Unknown constraint: ${entry.name}`); continue; }

  if (mapping.shape === 'tuplePair') {
    // resolve pairs, create contracts
  } else if (mapping.shape === 'stringList') {
    // resolve list, create contract
  } else if (mapping.shape === 'boolean') {
    // handle intrinsic (purity propagation)
  }
}
```

**What changes:**

| Component | Before | After |
|-----------|--------|-------|
| AST adapter | Switches on property names | Infers shape from AST structure |
| Port interface | `ConstraintsAST` (typed mirror) | `ParsedConstraintEntry[]` (generic) |
| Mock adapter | Stores `ConstraintsAST` | Stores `ParsedConstraintEntry[]` |
| Classifier | Switches on config properties | Loops over entries, looks up `CONSTRAINT_MAP` |

**Adding a new constraint:**
1. Add to `Constraints` runtime type (always required)
2. Add to `ContractType` enum (always required)
3. Add one line to `CONSTRAINT_MAP` in the classifier
4. **No adapter changes** (if the shape is boolean, stringList, or tuplePair)

**Pros:**
- Adapter becomes constraint-type-agnostic — follows TypeScript's design
- Adding a constraint with an existing shape = 1 line in `CONSTRAINT_MAP` (vs. modifying 4 files)
- Port interface is stable — doesn't change when adding constraints
- Clear separation: infrastructure parses structure, application assigns meaning

**Cons:**
- `values: string[][]` is less type-safe than the typed intermediate
- Shape inference must handle edge cases (empty arrays, malformed structures)
- New shapes (beyond boolean/stringList/tuplePair) still need adapter work
- Slightly harder to debug — generic entries vs. named properties

---

### Option C: Return AST Node, Walk From Classifier

Eliminate the intermediate entirely. The port returns an opaque reference to the constraint type literal. The classifier walks it using ASTPort methods.

**Port method change:**

```typescript
// Returns the 3rd type argument as an opaque ASTNode
getTypeAliasConstraintNode(node: ASTNode): ASTNode | undefined;
```

**Classifier walks the node:**

```typescript
const constraintNode = this.astPort.getTypeAliasConstraintNode(kindNode);
if (!constraintNode) return;

// Walk properties of the type literal
const properties = this.astPort.getTypeLiteralProperties(constraintNode);
for (const prop of properties) {
  if (prop.name === 'noDependency') {
    const pairs = this.astPort.extractTuplePairsFromType(prop.valueNode);
    // ... resolve symbols, create contracts
  }
}
```

This is closest to how TypeScript works — the checker walks AST nodes directly.

**Problem:** The ASTPort currently has no methods for walking type literal members generically. It has `getTypeAliasMemberProperties` but that's specialized. We'd need:
- `getTypeLiteralProperties(node): { name: string; valueNode: ASTNode }[]`
- `extractTuplePairsFromType(node): [string, string][]`
- `extractStringArrayFromType(node): string[]`
- `isTrueLiteral(node): boolean`

These are essentially the adapter's current private methods exposed through the port.

**Pros:**
- No intermediate representation at all — mirrors TypeScript's design exactly
- Classifier has full control over interpretation
- Maximum flexibility for complex constraint shapes

**Cons:**
- Expands the ASTPort surface with type-literal-specific methods
- The semantic knowledge (which name = which shape) moves to the classifier but the shape extraction stays in the adapter — split responsibility
- More port calls across the boundary per constraint parse
- Mock adapter needs more type-literal-walking methods
- More complex than Option B for the same benefit

---

### Option D: Hybrid — Generic Adapter + Declarative Classifier

Combine Option B's generic adapter with a fully declarative classifier. Define a single `CONSTRAINTS` registry that drives both parsing and binding:

```typescript
// application/constraints/constraint-registry.ts (application layer)
export const CONSTRAINTS = {
  noDependency: {
    type: ContractType.NoDependency,
    shape: 'tuplePair' as const,
    displayName: (args: string[]) => `noDependency(${args[0]} -> ${args[1]})`,
  },
  mustImplement: {
    type: ContractType.MustImplement,
    shape: 'tuplePair' as const,
    displayName: (args: string[]) => `mustImplement(${args[0]} -> ${args[1]})`,
  },
  noCycles: {
    type: ContractType.NoCycles,
    shape: 'stringList' as const,
    displayName: (args: string[]) => `noCycles(${args.join(', ')})`,
  },
  pure: {
    type: ContractType.Purity,
    shape: 'boolean' as const,
    intrinsic: true, // handled by propagation, not direct binding
  },
  'filesystem.exists': {
    type: ContractType.Exists,
    shape: 'stringList' as const,
    displayName: (args: string[]) => `exists(${args.join(', ')})`,
  },
  'filesystem.mirrors': {
    type: ContractType.Mirrors,
    shape: 'tuplePair' as const,
    displayName: (args: string[]) => `mirrors(${args[0]} -> ${args[1]})`,
  },
} as const;
```

**Generic binding logic** (two handlers cover all non-intrinsic constraints):

```typescript
function bindConstraints(
  entries: ParsedConstraintEntry[],
  instanceSymbol: ArchSymbol,
  registry: typeof CONSTRAINTS,
): { contracts: Contract[]; errors: string[] } {
  for (const entry of entries) {
    const def = registry[entry.name];
    if (!def || def.intrinsic) continue;

    if (def.shape === 'tuplePair') {
      for (const [a, b] of entry.values) {
        // resolve symbols, create Contract(def.type, ...)
      }
    } else if (def.shape === 'stringList') {
      // resolve all symbols, create one Contract(def.type, ...)
    }
  }
}
```

**Adding a new constraint:** Add one entry to `CONSTRAINTS`. That's it (assuming its shape is tuplePair, stringList, or boolean). No adapter changes, no classifier changes, no port changes.

**Pros:**
- Single source of truth for constraint metadata
- Adding a constraint = adding a registry entry
- Generic adapter (from Option B) + declarative classifier
- `displayName` generation is co-located with the constraint definition

**Cons:**
- Registry is a new concept to understand
- New shapes require extending the binding logic
- `intrinsic: true` for purity is still a special case

---

## Comparison

| | A (Status Quo) | B (Generic Port) | C (Walk AST) | D (Registry) |
|---|:-:|:-:|:-:|:-:|
| Files to change for new constraint | 4 | 2* | 2 | 1* |
| Adapter knows constraint names | Yes | No | No | No |
| Port interface changes per constraint | Yes | No | No | No |
| Type safety of intermediate | High | Medium | N/A | Medium |
| Complexity increase | None | Low | Medium | Low |
| Follows TS compiler design | No | Yes | Yes | Yes |

*Assuming the shape already exists (tuplePair, stringList, or boolean).

---

## Recommendation

**Option B** (Generic Parsed Constraints) gives the best improvement with the least complexity.

The core insight is that the adapter's job is **structural parsing, not semantic interpretation**. It should answer "what shape is this property's value?" not "what does `noDependency` mean?" The adapter already has the shape extractors — it just needs to use them generically instead of dispatching by property name.

Option D (Registry) is a natural follow-on if constraint count grows, but it's additive — you can do B first and add the registry later without rework.

Option C mirrors TypeScript most faithfully but expands the port surface for marginal benefit over B.

---

## Appendix: Shape Inference Algorithm

For Option B/D, the adapter's `getTypeAliasConstraintEntries` would use this logic:

```
function inferShape(typeNode):
  if typeNode is TrueKeyword or LiteralType(true):
    return { shape: 'boolean', values: [] }

  elements = getTypeElements(typeNode)  // handles both TupleType and ReadonlyArray
  if elements is empty:
    return null  // can't determine shape

  first = elements[0]
  if first is LiteralType(StringLiteral):
    // ["a", "b", "c"] — each element is a string
    strings = elements.map(extractStringLiteral)
    return { shape: 'stringList', values: [strings] }

  if first is TupleType or ReadonlyArray:
    // [["a", "b"], ["c", "d"]] — each element is a tuple of strings
    pairs = elements.map(extractInnerStrings)
    return { shape: 'tuplePair', values: pairs }

  if typeNode is TypeLiteral:
    // { exists: [...], mirrors: [...] } — recurse with dotted name prefix
    results = []
    for each property in typeNode:
      sub = inferShape(property.type)
      results.push({ name: prefix + property.name, ...sub })
    return results
```

This is entirely structural — no constraint name knowledge needed.
