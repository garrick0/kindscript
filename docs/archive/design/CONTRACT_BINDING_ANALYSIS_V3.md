# Contract Binding Analysis V3: Full Data Model and Rich Views

> **Status:** Implemented (Option D, Step 1)
> **Date:** 2026-02-07 (updated after pre-resolved filesystem refactoring)
> **Supersedes:** `CONTRACT_BINDING_ANALYSIS.md` (V1), `CONTRACT_BINDING_ANALYSIS_V2.md` (V2)

V1 and V2 focused narrowly on how constraint type parameters cross the port boundary. This document zooms out to analyze the full data model — all sources the classifier consumes — and proposes a unified approach using rich domain-oriented views.

**Update note:** The original V3 described the checker as having live filesystem queries via `FileSystemPort`. That has since been refactored — the checker now receives a pre-resolved `Map<string, string[]>` and does zero live I/O during checking. This version reflects the current architecture.

---

## Table of Contents

1. [The Full Data Model](#1-the-full-data-model)
2. [Two Kinds of AST Data](#2-two-kinds-of-ast-data)
3. [Non-AST Data Sources](#3-non-ast-data-sources)
4. [What Crosses the Port Boundary Today](#4-what-crosses-the-port-boundary-today)
5. [The Problem Restated](#5-the-problem-restated)
6. [The Design Spectrum](#6-the-design-spectrum)
7. [Rich Domain Views (Approach 2)](#7-rich-domain-views-approach-2)
8. [Options](#8-options)
9. [Comparison and Recommendation](#9-comparison-and-recommendation)

---

## 1. The Full Data Model

The pipeline has four stages. Each stage consumes different data from different sources:

```
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 1: Orchestration  (ClassifyProjectService)                   │
│                                                                     │
│  Config data    ← ConfigPort                                        │
│    kindscript.json  → settings, compiler options                    │
│    tsconfig.json    → compiler options, root files                  │
│                                                                     │
│  File discovery ← CompilerPort + FileSystemPort                     │
│    Create TS program from root files                                │
│    Filter source files for .k.ts extension                          │
│                                                                     │
│  OUTPUT: SourceFile[] (definition files) + Program + settings       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 2: Classification  (ClassifyASTService — the "binder")       │
│                                                                     │
│  Type-level AST data  ← ASTPort                                    │
│    Kind<N, Members, Constraints> type aliases                       │
│    → kind name, member names + types, constraint declarations       │
│                                                                     │
│  Value-level AST data ← ASTPort                                    │
│    { ... } satisfies InstanceConfig<T> expressions                  │
│    → member assignments, path overrides, identifier resolution      │
│                                                                     │
│  File path context                                                  │
│    dirnamePath(sourceFile.fileName)                                  │
│    → root directory (from .k.ts file location)                      │
│    → derived member paths (root + member name)                      │
│                                                                     │
│  OUTPUT: ArchSymbol[] + Contract[] + errors                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 2.5: File Resolution  (resolveSymbolFiles helper)            │
│                                                                     │
│  Filesystem     ← FileSystemPort                                    │
│    directoryExists()  → existence checks                            │
│    readDirectory()    → files in member directories                 │
│                                                                     │
│  Walks ArchSymbol tree, builds Map<location, files[]>               │
│  Only locations that exist on disk are included — map presence      │
│  serves as an existence check.                                      │
│                                                                     │
│  OUTPUT: resolvedFiles: Map<string, string[]>                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STAGE 3: Checking  (CheckContractsService — the "checker")         │
│                                                                     │
│  TypeScript compiler  ← TypeScriptPort                              │
│    getImports()           → resolved import targets                 │
│    getImportModuleSpecifiers() → raw module names (for purity)      │
│    getExportedInterfaceNames() → interfaces to check                │
│    hasClassImplementing() → implementation verification             │
│                                                                     │
│  Pre-resolved files   ← resolvedFiles (request parameter)           │
│    resolvedFiles.get(location) → files in member directories        │
│    resolvedFiles.has(location) → existence checks                   │
│    relativePath()              → path comparison (domain utility)    │
│                                                                     │
│  OUTPUT: Diagnostic[]                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Summary of data sources

| Source | Stage | Port / Origin | Purpose |
|---|---|---|---|
| `kindscript.json` | Orchestration | ConfigPort | Settings, compiler options |
| `tsconfig.json` | Orchestration | ConfigPort | Compiler options, root files |
| `.k.ts` file AST (type-level) | Classification | ASTPort | Kind definitions, constraint declarations |
| `.k.ts` file AST (value-level) | Classification | ASTPort | Instance configs, path overrides |
| `.k.ts` file path | Classification | (SourceFile.fileName) | Root directory inference |
| Derived computation | Classification | (domain utils) | Member paths from root + name |
| Filesystem | Resolution | FileSystemPort | Pre-resolve symbol locations to file listings |
| Pre-resolved file map | Checking | (request parameter) | Directory contents, existence |
| TypeScript program | Checking | TypeScriptPort | Import resolution, interface scanning |
| Path comparison | Checking | (domain utility) | `relativePath()` for mirrors contract |

---

## 2. Two Kinds of AST Data

The classifier reads two fundamentally different kinds of data from `.k.ts` files, and they work completely differently at the AST level.

### Type-level AST: Kind definitions

```typescript
type CleanArch = Kind<"CleanArch", {
  domain: DomainLayer;             // ← TypeScript type syntax
  infrastructure: InfraLayer;      //   parsed from TypeLiteralNode
}, {
  noDependency: [["infrastructure", "domain"]];   // ← TypeScript type syntax
  filesystem: { exists: ["domain"] };              //   parsed from TypeLiteralNode
}>;
```

This is a TypeScript type alias. The second and third type parameters are **type literals** — they exist only in the type system. TypeScript erases them entirely during compilation. The AST adapter reads them by walking type-specific nodes (`TypeLiteralNode`, `PropertySignature`, `TupleTypeNode`, `LiteralTypeNode`).

The adapter currently extracts this via:
- `getTypeAliasReferenceName()` → `"Kind"`
- `getTypeAliasTypeArgLiterals()` → `["CleanArch"]`
- `getTypeAliasMemberProperties()` → `[{ name: "domain", typeName: "DomainLayer" }, ...]`
- `getTypeAliasConstraintConfig()` → `ConstraintConfigAST { noDependency: [...], ... }`

Four separate port calls to extract four aspects of the same type alias node.

### Value-level AST: Instance declarations

```typescript
const app = {
  domain: {},                          // ← JavaScript runtime value
  infrastructure: { path: "infra" },   //   parsed from ObjectLiteralExpression
} satisfies InstanceConfig<CleanArch>;
```

This is a JavaScript variable declaration with an object literal and a `satisfies` type assertion. The object literal is **runtime code** — it would exist in the compiled JavaScript output. The AST adapter reads it using value-specific node methods (`isObjectLiteral`, `getObjectProperties`, `getStringValue`, `isIdentifier`).

The adapter currently extracts this through many fine-grained port calls:
- `isVariableStatement()` → `isSatisfiesExpression()` → identify the pattern
- `getSatisfiesTypeReferenceName()` → `"InstanceConfig"`
- `getSatisfiesTypeArgumentNames()` → `["CleanArch"]`
- `getSatisfiesExpression()` → the object literal node
- `getObjectProperties()` → `[{ name: "domain", value: ... }, ...]`
- `getStringValue()` → path overrides like `"infra"`
- `isIdentifier()` / `getIdentifierName()` → variable reference resolution

Many port calls, each extracting a small piece.

### Why this distinction matters

The constraint binding analysis (V1/V2) focused only on the type-level constraint parsing — one of four type-level extractions, and none of the value-level extractions. But the classifier does ALL of these through the same port, using the same fine-grained method-call-per-property pattern.

The question isn't just "how should constraints cross the port boundary?" It's "how should ALL of the classifier's input data cross the port boundary?"

---

## 3. Non-AST Data Sources

### File path context (during classification)

When the classifier processes an instance declaration, it infers the root directory from the `.k.ts` file's location:

```typescript
// classify-ast.service.ts, line 172
const resolvedRoot = dirnamePath(sourceFile.fileName);
```

`sourceFile.fileName` is a string on the `SourceFile` interface — it comes from TypeScript's program, which gets it from the filesystem when creating the program. The classifier doesn't call a filesystem port to get this; it's already available on the source file object.

From the root, member paths are derived using pure domain utilities:

```typescript
// classify-ast.service.ts, line 242
const memberPath = joinPath(parentPath, pathSegment);
```

This is pure computation — no port calls, no AST walking. `joinPath` is a domain utility in `path-matching.ts`.

### Config data (during orchestration)

`ClassifyProjectService` reads `kindscript.json` and `tsconfig.json` via `ConfigPort`. This happens before classification. By the time the classifier runs, config data has already been consumed — the classifier receives `SourceFile[]` and `projectRoot`, not config objects.

### Pre-resolved filesystem data (between classification and checking)

After classification produces `ArchSymbol[]` and before the checker runs, the orchestrator (either `CheckCommand` or `GetPluginDiagnosticsService`) calls `resolveSymbolFiles()` to pre-resolve all symbol locations:

```typescript
// application/services/resolve-symbol-files.ts
export function resolveSymbolFiles(
  symbols: ArchSymbol[],
  fsPort: FileSystemPort,
): Map<string, string[]> {
  const resolved = new Map<string, string[]>();
  for (const symbol of symbols) {
    for (const s of [symbol, ...symbol.descendants()]) {
      if (s.declaredLocation && !resolved.has(s.declaredLocation)) {
        if (fsPort.directoryExists(s.declaredLocation)) {
          resolved.set(
            s.declaredLocation,
            fsPort.readDirectory(s.declaredLocation, true),
          );
        }
      }
    }
  }
  return resolved;
}
```

This walks the symbol tree and builds a `Map<string, string[]>` from each symbol's `declaredLocation` to the files it contains. Only locations that actually exist on disk are added — so `resolvedFiles.has(location)` serves as an existence check.

The checker then receives this map as `request.resolvedFiles` and queries it instead of the live filesystem. The checker has **no `FileSystemPort` dependency** — its constructor takes only `TypeScriptPort`. Path comparisons (for the `mirrors` contract) use the `relativePath()` domain utility from `path-matching.ts`, which is pure string computation.

This follows the standard compiler pattern: build a pre-loaded model, then evaluate over it. TypeScript's own `Program` works the same way — source files are loaded before type-checking begins.

### Where each source is consumed

```
Orchestration:  config files ──→ settings, file discovery
                                  │
Classification: type-level AST ──┤──→ ArchSymbol[] + Contract[]
                value-level AST ──┤
                file path context ┘
                                  │
Resolution:     filesystem ───────┤──→ resolvedFiles: Map<string, string[]>
                                  │
Checking:       TS program ───────┤──→ Diagnostic[]
                resolved files ───┘
```

The classification stage is the one that combines multiple data sources (type-level AST + value-level AST + file paths) into unified domain objects. The checking stage combines two pre-built models (TypeScript program + resolved files) — both are fully loaded before any contract evaluation begins.

---

## 4. What Crosses the Port Boundary Today

The classifier accesses the AST through ~20 fine-grained `ASTPort` methods. Here's what it actually extracts and which methods it uses:

### For Kind definitions (type-level)

| Data extracted | Port methods used | Returns |
|---|---|---|
| Is this a type alias? | `isTypeAliasDeclaration` | boolean |
| Type alias name | `getDeclarationName` | string |
| Referenced type name | `getTypeAliasReferenceName` | `"Kind"` or other |
| Kind name literal | `getTypeAliasTypeArgLiterals` | `["CleanArch"]` |
| Member properties | `getTypeAliasMemberProperties` | `[{ name, typeName }]` |
| Constraint config | `getTypeAliasConstraintConfig` | `ConstraintConfigAST` |

Six port calls to extract one Kind definition.

### For instance declarations (value-level)

| Data extracted | Port methods used | Returns |
|---|---|---|
| Is this a variable statement? | `isVariableStatement` | boolean |
| Variable declarations | `getVariableDeclarations` | `ASTNode[]` |
| Variable name | `getDeclarationName` | string |
| Variable type name | `getVariableTypeName` | string |
| Initializer | `getInitializer` | `ASTNode` |
| Is satisfies? | `isSatisfiesExpression` | boolean |
| Satisfies type name | `getSatisfiesTypeReferenceName` | `"InstanceConfig"` |
| Satisfies type args | `getSatisfiesTypeArgumentNames` | `["CleanArch"]` |
| Inner expression | `getSatisfiesExpression` | `ASTNode` |
| Is object literal? | `isObjectLiteral` | boolean |
| Object properties | `getObjectProperties` | `[{ name, value }]` |
| String values | `getStringValue` | `"infra"` |
| Is identifier? | `isIdentifier` | boolean |
| Identifier name | `getIdentifierName` | `"domainVar"` |

Fourteen port calls to extract one instance declaration (plus recursive calls for nested members).

### The pattern

The classifier is essentially a manual recursive-descent walker over the AST, making individual port calls for each node inspection. The port provides primitive operations ("is this a type alias?", "get the name of this node"), and the classifier composes them into higher-level extractions.

This is like the classifier manually tokenizing and parsing through the port, one token at a time.

### What the checker uses (for comparison)

The checker's port usage is much cleaner. It depends on only one port:

| Data needed | Source | Method |
|---|---|---|
| Source files for analysis | TypeScriptPort | `getSourceFile()` |
| Resolved imports | TypeScriptPort | `getImports()` |
| Module specifier strings | TypeScriptPort | `getImportModuleSpecifiers()` |
| Exported interface names | TypeScriptPort | `getExportedInterfaceNames()` |
| Implementation verification | TypeScriptPort | `hasClassImplementing()` |
| Files in member directories | `request.resolvedFiles` | `.get(location)` |
| Directory existence | `request.resolvedFiles` | `.has(location)` |
| Relative path comparison | domain utility | `relativePath()` |

The checker's relationship with data is already clean: the TypeScript program is a pre-built model, and `resolvedFiles` is a pre-built model. No live I/O during evaluation. The remaining problem is exclusively in the **classifier ↔ ASTPort boundary**.

---

## 5. The Problem Restated

The V1/V2 analyses identified that the constraint port method (`getTypeAliasConstraintConfig`) returns a semantically-typed intermediate (`ConstraintConfigAST`) where the adapter knows constraint semantics. This is correct — but it's actually the **least problematic** part of the port boundary.

The bigger issue: **the classifier is tightly coupled to AST structure through dozens of fine-grained port calls.**

The classifier knows:
- That Kind definitions are type alias declarations referencing `"Kind"`
- That instance configs are variable declarations with satisfies expressions referencing `"InstanceConfig"`
- That member values can be object literals, identifiers, or nested objects
- That path overrides are string properties named `"path"` inside member objects
- That identifiers need resolution through a variable map

This is all AST-structure knowledge embedded in the application layer. If the AST representation changed (e.g., if KindScript moved from `satisfies` expressions to decorators, or from type aliases to interfaces), the classifier would need rewriting even though the domain concepts haven't changed.

**The classifier should speak in domain concepts** ("Kind definition", "instance declaration", "constraint tree") **not AST concepts** ("type alias", "satisfies expression", "object literal property").

Note that the checker's port boundary is already clean — it queries the TypeScript program through domain-oriented operations ("get imports", "has class implementing") and receives pre-resolved file data. The classifier is the remaining rough edge.

---

## 6. The Design Spectrum

There's a spectrum from "classifier walks everything" to "adapter extracts everything":

### Level 1: Fine-grained primitives (current)

```
Port returns: booleans, strings, opaque ASTNode references
Classifier: ~20 port calls per definition, manual AST walking
Classifier knows: AST node types, nesting structure, satisfies pattern
```

The port provides generic AST primitives. The classifier composes them. Maximum flexibility, maximum coupling.

### Level 2: Type-level rich views + fine-grained values (V2 recommendation)

```
Port returns: TypeNodeView for constraints, primitives for everything else
Classifier: fewer port calls for constraints, same for instances
Classifier knows: TypeNodeView shape + all value-level AST structure
```

V2's recommendation. Only addresses constraints, leaves the rest unchanged.

### Level 3: Full rich views for both type-level and value-level

```
Port returns: KindDefinitionView + InstanceDeclarationView
Classifier: 2 port calls per file (one for kinds, one for instances)
Classifier knows: domain concepts only (kind name, members, constraints, paths)
```

The adapter extracts everything and returns domain-oriented views. The classifier never touches AST concepts. This is what this document explores.

### Level 4: Fully pre-built domain objects

```
Port returns: ArchSymbol[] + Contract[] directly
Classifier: doesn't exist — adapter does everything
Classifier knows: nothing (it's gone)
```

The adapter creates domain objects directly. Eliminates the classifier. But this puts domain logic in infrastructure, violating Clean Architecture.

### The right level

Level 4 is too far — domain logic belongs in the application layer. Level 1 is where we are — too coupled. Level 2 is a partial fix. **Level 3 is the natural target**: the port speaks domain concepts, the adapter handles AST mechanics, the classifier handles domain logic (symbol resolution, constraint binding, propagation).

---

## 7. Rich Domain Views (Approach 2)

### The views

Two view types capture everything the classifier needs from the AST:

**KindDefinitionView** — everything from a `type X = Kind<N, Members, Constraints>` declaration:

```typescript
/**
 * Structured view of a Kind type alias, extracted from the AST.
 * The adapter walks the type reference node and returns this.
 */
interface KindDefinitionView {
  /** The type alias name (e.g., "CleanArch") */
  typeName: string;
  /** The first type argument string literal (e.g., "CleanArch") */
  kindNameLiteral: string;
  /** Member properties from the second type argument */
  members: Array<{ name: string; typeName?: string }>;
  /** Constraint declarations from the third type argument */
  constraints?: TypeNodeView;
}
```

**InstanceDeclarationView** — everything from a `{ ... } satisfies InstanceConfig<T>` expression:

```typescript
/**
 * Structured view of an instance declaration, extracted from the AST.
 * The adapter walks the satisfies expression and returns this.
 */
interface InstanceDeclarationView {
  /** Variable name (e.g., "app") */
  variableName: string;
  /** Kind type name from InstanceConfig<T> (e.g., "CleanArch") */
  kindTypeName: string;
  /** Member values from the object literal */
  members: MemberValueView[];
}

interface MemberValueView {
  name: string;
  /** Path override if { path: "custom" } was provided */
  pathOverride?: string;
  /** Nested member values (for composite kinds) */
  children?: MemberValueView[];
}
```

**TypeNodeView** — the constraint tree (from V2 discussion):

```typescript
/**
 * Structural view of a type literal, preserving tree shape.
 * The adapter infers the value shape from AST structure.
 */
type TypeNodeView =
  | { kind: 'boolean' }
  | { kind: 'stringList'; values: string[] }
  | { kind: 'tuplePairs'; values: [string, string][] }
  | { kind: 'object'; properties: Array<{ name: string; value: TypeNodeView }> };
```

### How the port changes

Currently the `ASTDeclarationPort` has 6 methods and the `ASTExpressionPort` has 7 methods. Most of these would be replaced by two high-level methods:

```typescript
interface ASTDeclarationPort {
  /** Extract all Kind definitions from a source file's statements */
  getKindDefinitions(sourceFile: SourceFile): KindDefinitionView[];

  /** Extract all instance declarations from a source file's statements */
  getInstanceDeclarations(
    sourceFile: SourceFile,
    knownKinds: Set<string>,
  ): InstanceDeclarationView[];
}
```

The `knownKinds` parameter lets the adapter know which type aliases are Kind definitions, so it can resolve identifier references and nested member values correctly. This is information the classifier currently tracks itself.

### How the classifier simplifies

Before (current — ~120 lines of AST walking in `execute()`):

```typescript
execute(request: ClassifyASTRequest): ClassifyASTResponse {
  for (const sourceFile of request.definitionFiles) {
    const statements = this.astPort.getStatements(sourceFile);

    // Phase 1: Walk statements, check isTypeAliasDeclaration, extract kind defs
    for (const stmt of statements) {
      if (this.astPort.isTypeAliasDeclaration(stmt)) {
        const refName = this.astPort.getTypeAliasReferenceName(stmt);
        if (refName === 'Kind') {
          const name = this.astPort.getDeclarationName(stmt);
          const literals = this.astPort.getTypeAliasTypeArgLiterals(stmt);
          const properties = this.astPort.getTypeAliasMemberProperties(stmt);
          const constraints = this.astPort.getTypeAliasConstraintConfig(stmt);
          // ... store KindDefinition
        }
      }
    }

    // Build variable map for identifier resolution
    for (const stmt of statements) {
      if (this.astPort.isVariableStatement(stmt)) {
        const decls = this.astPort.getVariableDeclarations(stmt);
        for (const decl of decls) {
          // ... 5 more port calls per declaration
        }
      }
    }

    // Phase 2: Walk statements again, find satisfies expressions
    for (const stmt of statements) {
      if (this.astPort.isVariableStatement(stmt)) {
        const decls = this.astPort.getVariableDeclarations(stmt);
        for (const decl of decls) {
          const init = this.astPort.getInitializer(decl);
          if (init && this.astPort.isSatisfiesExpression(init)) {
            const typeName = this.astPort.getSatisfiesTypeReferenceName(init);
            if (typeName === 'InstanceConfig') {
              // ... 10+ more port calls for member extraction
            }
          }
        }
      }
    }
  }
}
```

After (with rich views):

```typescript
execute(request: ClassifyASTRequest): ClassifyASTResponse {
  for (const sourceFile of request.definitionFiles) {
    // Phase 1: Get all Kind definitions (one port call)
    const kindViews = this.astPort.getKindDefinitions(sourceFile);
    for (const view of kindViews) {
      kindDefs.set(view.typeName, view);
    }

    // Phase 2: Get all instance declarations (one port call)
    const knownKinds = new Set(kindDefs.keys());
    const instanceViews = this.astPort.getInstanceDeclarations(sourceFile, knownKinds);
    for (const view of instanceViews) {
      const kindDef = kindDefs.get(view.kindTypeName);
      if (!kindDef) { errors.push(...); continue; }

      const root = dirnamePath(sourceFile.fileName);
      const symbol = this.buildSymbolTree(kindDef, view, root);
      symbols.push(symbol);
      // ... register instance
    }
  }

  // Phase 3: Bind constraints (walks TypeNodeView tree)
  this.bindConstraints(kindDefs, instanceSymbols, contracts, errors);
}
```

The classifier goes from ~440 lines of mixed AST-walking and domain logic to focused domain logic only. All AST mechanics move into the adapter.

### How constraint binding works with TypeNodeView

The `bindConstraints` method walks the `TypeNodeView` tree and maps property names to contract types:

```typescript
private bindConstraints(
  kindDefs: Map<string, KindDefinitionView>,
  instanceSymbols: Map<string, ArchSymbol[]>,
  contracts: Contract[],
  errors: string[],
): void {
  for (const [kindName, kindDef] of kindDefs) {
    if (!kindDef.constraints) continue;
    const instances = instanceSymbols.get(kindName) ?? [];

    for (const instanceSymbol of instances) {
      this.walkConstraintView(
        kindDef.constraints, instanceSymbol, kindName,
        `type:${kindName}`, contracts, errors
      );
    }
  }
}

private walkConstraintView(
  view: TypeNodeView,
  instanceSymbol: ArchSymbol,
  kindName: string,
  location: string,
  contracts: Contract[],
  errors: string[],
  namePrefix: string = '',
): void {
  if (view.kind !== 'object') return;

  for (const prop of view.properties) {
    const fullName = namePrefix ? `${namePrefix}.${prop.name}` : prop.name;
    const value = prop.value;

    // Recurse into nested objects (e.g., filesystem: { exists: ..., mirrors: ... })
    if (value.kind === 'object') {
      this.walkConstraintView(value, instanceSymbol, kindName, location, contracts, errors, fullName);
      continue;
    }

    // Look up constraint binding
    const binding = CONSTRAINT_BINDINGS[fullName];
    if (!binding) {
      errors.push(`Unknown constraint '${fullName}' in Kind<${kindName}>.`);
      continue;
    }

    if (binding.intrinsic) continue; // purity handled by propagation

    if (value.kind === 'tuplePairs' && binding.shape === 'tuplePair') {
      for (const [a, b] of value.values) {
        const symA = instanceSymbol.findByPath(a);
        const symB = instanceSymbol.findByPath(b);
        if (!symA) { errors.push(`Kind<${kindName}>: member '${a}' not found.`); continue; }
        if (!symB) { errors.push(`Kind<${kindName}>: member '${b}' not found.`); continue; }
        contracts.push(new Contract(binding.type, `${fullName}(${a} -> ${b})`, [symA, symB], location));
      }
    } else if (value.kind === 'stringList' && binding.shape === 'stringList') {
      const symbols: ArchSymbol[] = [];
      for (const name of value.values) {
        const sym = instanceSymbol.findByPath(name);
        if (!sym) { errors.push(`Kind<${kindName}>: member '${name}' not found.`); continue; }
        symbols.push(sym);
      }
      if (symbols.length > 0) {
        contracts.push(new Contract(binding.type, `${fullName}(${symbols.map(s => s.name).join(', ')})`, symbols, location));
      }
    }
  }
}

const CONSTRAINT_BINDINGS: Record<string, { type: ContractType; shape: 'boolean' | 'stringList' | 'tuplePair'; intrinsic?: boolean }> = {
  'noDependency':       { type: ContractType.NoDependency,  shape: 'tuplePair' },
  'mustImplement':      { type: ContractType.MustImplement, shape: 'tuplePair' },
  'noCycles':           { type: ContractType.NoCycles,      shape: 'stringList' },
  'pure':               { type: ContractType.Purity,        shape: 'boolean', intrinsic: true },
  'filesystem.exists':  { type: ContractType.Exists,        shape: 'stringList' },
  'filesystem.mirrors': { type: ContractType.Mirrors,       shape: 'tuplePair' },
};
```

The tree walk handles nesting naturally — `filesystem: { exists: ... }` becomes a recursive walk that produces the name `"filesystem.exists"`, which maps to `ContractType.Exists`. No special-case nesting logic needed.

### How the adapter changes

The adapter absorbs all AST-walking mechanics. Its `getKindDefinitions` method replaces six existing port calls:

```typescript
// In ASTAdapter
getKindDefinitions(sourceFile: SourceFile): KindDefinitionView[] {
  const tsSourceFile = this.toTsSourceFile(sourceFile);
  if (!tsSourceFile) return [];

  const results: KindDefinitionView[] = [];
  for (const stmt of tsSourceFile.statements) {
    if (!ts.isTypeAliasDeclaration(stmt)) continue;

    const type = stmt.type;
    if (!ts.isTypeReferenceNode(type)) continue;
    if (!ts.isIdentifier(type.typeName) || type.typeName.text !== 'Kind') continue;

    const typeName = stmt.name.text;
    const kindNameLiteral = /* extract first string literal type arg */ ;
    const members = /* extract member properties from 2nd type arg */ ;
    const constraints = /* build TypeNodeView from 3rd type arg */ ;

    results.push({ typeName, kindNameLiteral, members, constraints });
  }
  return results;
}
```

The constraint extraction method builds a `TypeNodeView` by structural inference — the same algorithm described in V2 Appendix B, but returning a tree instead of a flat list:

```typescript
private buildTypeNodeView(typeNode: ts.TypeNode): TypeNodeView | undefined {
  // Boolean
  if (typeNode.kind === ts.SyntaxKind.TrueKeyword ||
      (ts.isLiteralTypeNode(typeNode) && typeNode.literal.kind === ts.SyntaxKind.TrueKeyword)) {
    return { kind: 'boolean' };
  }

  // Nested type literal → recurse
  if (ts.isTypeLiteralNode(typeNode)) {
    const properties: Array<{ name: string; value: TypeNodeView }> = [];
    for (const member of typeNode.members) {
      if (!ts.isPropertySignature(member) || !member.name || !member.type) continue;
      const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
      const value = this.buildTypeNodeView(member.type);
      if (value) properties.push({ name, value });
    }
    return { kind: 'object', properties };
  }

  // Tuple or array
  const elements = this.getTypeElements(typeNode);
  if (elements.length === 0) return undefined;

  const first = elements[0];

  // String literals → stringList
  if (ts.isLiteralTypeNode(first) && ts.isStringLiteral(first.literal)) {
    const values = elements
      .map(e => this.getStringLiteralFromType(e))
      .filter((s): s is string => s !== undefined);
    return { kind: 'stringList', values };
  }

  // Tuples of strings → tuplePairs
  const innerElements = this.getTypeElements(first);
  if (innerElements.length > 0) {
    const pairs = this.extractTuplePairs(typeNode);
    return { kind: 'tuplePairs', values: pairs };
  }

  return undefined;
}
```

This method uses the adapter's existing private helpers (`getTypeElements`, `getStringLiteralFromType`, `extractTuplePairs`). The only change is that it builds a `TypeNodeView` tree instead of a `ConstraintConfigAST` object. The structural inference means it doesn't switch on property names — it determines the shape from AST node types.

### Where non-AST data fits

Non-AST data sources stay exactly where they are:

- **File path context**: The classifier calls `dirnamePath(sourceFile.fileName)` to get the root. This doesn't come from the ASTPort — it's a property on `SourceFile`, which is already in the request. The views don't change this.

- **Config data**: `ClassifyProjectService` reads configs and discovers `.k.ts` files. It passes `SourceFile[]` to the classifier. The views don't change this relationship.

- **Pre-resolved filesystem data**: `resolveSymbolFiles()` builds a `Map<string, string[]>` from the classified symbols. The orchestrator calls this after classification and before checking. The checker receives the map as `request.resolvedFiles`. The views don't affect this relationship — resolution and checking are downstream of classification.

The rich views only reshape what crosses the **ASTPort boundary**. Everything else stays the same.

---

## 8. Options

### Option A: Status Quo

Keep the fine-grained ASTPort. The classifier walks AST nodes through ~20 port methods.

**Strengths:**
- Already works, fully tested
- Maximum flexibility — classifier can handle any AST pattern
- No new types to design

**Weaknesses:**
- Classifier coupled to AST structure (type aliases, satisfies expressions, object literals)
- ~20 port calls per definition file
- Constraint extraction uses semantically-typed intermediate (`ConstraintConfigAST`)
- Adding constraints requires modifying adapter + port + classifier

---

### Option B: TypeNodeView for Constraints Only

Replace `ConstraintConfigAST` with `TypeNodeView`. Leave everything else unchanged.

This is the V2 recommendation (but using a tree instead of flat entries).

**Port change:**
```typescript
// Before:
getTypeAliasConstraintConfig(node: ASTNode): ConstraintConfigAST | undefined;

// After:
getTypeAliasConstraintView(node: ASTNode): TypeNodeView | undefined;
```

**Strengths:**
- Fixes the narrowest problem (adapter knowing constraint semantics)
- Small change, low risk
- Constraint binding becomes data-driven (`CONSTRAINT_BINDINGS` map)

**Weaknesses:**
- Only addresses constraints — the classifier still does fine-grained AST walking for Kind definitions and instance declarations (~15 other port calls unchanged)
- Partial fix — the principle "port should speak domain concepts" is applied inconsistently

---

### Option C: Full Rich Views

Replace fine-grained ASTPort methods with `getKindDefinitions()` and `getInstanceDeclarations()` returning `KindDefinitionView` and `InstanceDeclarationView`. `TypeNodeView` is nested inside `KindDefinitionView.constraints`.

**Port change:**
```typescript
interface ASTDeclarationPort {
  getKindDefinitions(sourceFile: SourceFile): KindDefinitionView[];
  getInstanceDeclarations(sourceFile: SourceFile, knownKinds: Set<string>): InstanceDeclarationView[];
}
```

**Strengths:**
- Classifier speaks only domain concepts — no AST-structure knowledge
- Port boundary is clean — adapter handles mechanics, classifier handles meaning
- Classifier shrinks dramatically (AST walking code moves to adapter)
- Constraint extraction uses structurally-inferred `TypeNodeView` — adapter is constraint-agnostic
- Adding constraints = one entry in `CONSTRAINT_BINDINGS` (no adapter/port changes)
- Instance declaration extraction is also cleaner — `MemberValueView` replaces recursive ASTNode walking

**Weaknesses:**
- Larger refactoring — need to design `InstanceDeclarationView` and move value-level AST walking into adapter
- `knownKinds` parameter couples the two port calls (instance extraction needs to know which type aliases are Kinds)
- `MemberValueView` must handle edge cases currently handled by the classifier (identifier resolution, nested objects, path overrides)
- Mock adapter becomes more complex — must build `KindDefinitionView` and `InstanceDeclarationView` directly

---

### Option D: Progressive — Start with B, Evolve to C

Implement Option B first (TypeNodeView for constraints only). Later, if the fine-grained port becomes a pain point, uplift to Option C (full rich views).

This works because the changes are additive:
1. Replace `ConstraintConfigAST` with `TypeNodeView` and add `CONSTRAINT_BINDINGS` (Option B)
2. Later, extract `KindDefinitionView` incorporating the existing `TypeNodeView` (Option C)
3. Later, extract `InstanceDeclarationView` (completing Option C)

Each step is independently valuable and independently deployable.

**Strengths:**
- Incremental — no big-bang refactoring
- Each step is testable in isolation
- Can stop at B if the full rich views aren't needed
- Constraint binding (the original problem) is fixed immediately

**Weaknesses:**
- Intermediate states have inconsistent abstraction levels (constraints use views, everything else uses primitives)
- May do some rework if the InstanceDeclarationView design reveals that the TypeNodeView needs adjustment

---

## 9. Comparison and Recommendation

### Comparison matrix

| Criterion | A (Status Quo) | B (Constraint View) | C (Full Views) | D (Progressive) |
|---|:-:|:-:|:-:|:-:|
| Classifier decoupled from AST | No | Partially | **Yes** | Eventually |
| Port speaks domain concepts | No | Partially | **Yes** | Eventually |
| Constraint binding is data-driven | No | **Yes** | **Yes** | **Yes** (step 1) |
| Adapter constraint-agnostic | No | **Yes** | **Yes** | **Yes** (step 1) |
| Refactoring effort | None | Small | Large | Small then medium |
| Risk | None | Low | Medium | Low |
| Files to change per new constraint | 5+ | 3 | 3 | 3 |

### Recommendation

**Option D** — progressive approach, starting with the `TypeNodeView` for constraints.

The reasoning:

1. **The constraint binding problem is real and immediate.** The adapter has semantic knowledge it shouldn't have. `TypeNodeView` fixes this with low effort and low risk.

2. **Full rich views are the right long-term target** but aren't urgent. The classifier's fine-grained AST walking for Kind definitions and instance declarations works correctly. It's coupled to AST structure, but that structure hasn't changed frequently. The cost of the coupling is theoretical today.

3. **Progressive lets us validate the approach.** The `TypeNodeView` is the first domain-oriented view. If it works well — if the discriminated union is expressive enough, if structural inference handles edge cases, if the mock adapter is manageable — then we'll have confidence to design `KindDefinitionView` and `InstanceDeclarationView`.

4. **Each step is independently valuable.** Step 1 (TypeNodeView) fixes constraint binding. Step 2 (KindDefinitionView) would clean up Kind extraction. Step 3 (InstanceDeclarationView) would clean up instance extraction. Any of these can be the stopping point.

### First step: implement TypeNodeView

Concretely, the first step is:

1. **Define `TypeNodeView`** discriminated union in `ast.port.ts`
2. **Add `buildTypeNodeView()`** private method to `ASTAdapter` (structural inference from `ts.TypeNode`)
3. **Change `getTypeAliasConstraintConfig`** to return `TypeNodeView | undefined` instead of `ConstraintConfigAST | undefined`
4. **Remove `ConstraintConfigAST`** from the port definition
5. **Add `CONSTRAINT_BINDINGS`** map to classify-ast service
6. **Replace `generateContractsFromConfig`** with `walkConstraintView` that walks the tree and looks up bindings
7. **Update `KindDefinition`** internal type: `constraints?: TypeNodeView` instead of `constraints?: ConstraintConfigAST`
8. **Update `MockASTAdapter`** to store and return `TypeNodeView` instead of `ConstraintConfigAST`
9. **Update tests** to use `TypeNodeView` in mock setup

No changes to: domain entities, filesystem port, TypeScript port, CLI, plugin, or integration tests. The checker was already refactored to use pre-resolved data (see Stage 2.5 above) — this change is orthogonal.

---

## 10. Implementation Plan (Option D, Step 1)

> **Status:** Implemented

### Overview

Replace `ConstraintConfigAST` (semantically-typed intermediate where the adapter knows constraint names) with `TypeNodeView` (structurally-inferred discriminated union where the adapter is constraint-agnostic). Then replace the classifier's `generateContractsFromConfig` (hardcoded switch logic) with a data-driven `walkConstraintView` + `CONSTRAINT_BINDINGS` map.

### File changes

**1. `src/application/ports/ast.port.ts`** — Define `TypeNodeView`, remove `ConstraintConfigAST`

```typescript
// Remove:
export interface ConstraintConfigAST { ... }

// Add:
export type TypeNodeView =
  | { kind: 'boolean' }
  | { kind: 'stringList'; values: string[] }
  | { kind: 'tuplePairs'; values: [string, string][] }
  | { kind: 'object'; properties: Array<{ name: string; value: TypeNodeView }> };

// Change return type:
getTypeAliasConstraintConfig(node: ASTNode): TypeNodeView | undefined;
```

**2. `src/infrastructure/adapters/ast/ast.adapter.ts`** — Build `TypeNodeView` structurally

Replace the `getTypeAliasConstraintConfig` method: instead of switching on property names (`pure`, `noDependency`, etc.) and building a flat `ConstraintConfigAST`, build a `TypeNodeView` tree by structural inference:
- `TrueKeyword` → `{ kind: 'boolean' }`
- `TypeLiteralNode` → `{ kind: 'object', properties: [...] }` (recurse)
- Tuple of string-pairs → `{ kind: 'tuplePairs', values: [...] }`
- Tuple/array of strings → `{ kind: 'stringList', values: [...] }`

Uses existing private helpers (`getTypeElements`, `getStringLiteralFromType`, `extractTuplePairs`).

**3. `src/application/use-cases/classify-ast/classify-ast.service.ts`** — Data-driven constraint binding

- Change `KindDefinition.constraints` from `ConstraintConfigAST` to `TypeNodeView`
- Remove `generateContractsFromConfig` (~120 lines of hardcoded switch logic)
- Add `CONSTRAINT_BINDINGS` map: `Record<string, { type: ContractType; shape: string; intrinsic?: boolean }>`
- Add `walkConstraintView` method: recursively walks `TypeNodeView` tree, builds dotted names (e.g., `"filesystem.exists"`), looks up binding, creates contracts
- Update `generateTypeLevelContracts` to call `walkConstraintView` instead of `generateContractsFromConfig`
- Purity propagation stays separate (it walks member Kinds, not the constraint tree)

**4. `src/infrastructure/adapters/testing/mock-ast.adapter.ts`** — Mock uses `TypeNodeView`

- Change `MockTypeAliasNode.constraintConfig` from `ConstraintConfigAST` to `TypeNodeView`
- Change `withTypeAlias` parameter type accordingly
- `getTypeAliasConstraintConfig` return stays the same (returns stored value)

**5. Tests** — Update mock setup to pass `TypeNodeView` instead of `ConstraintConfigAST`

Test call sites currently pass `ConstraintConfigAST` objects like `{ pure: true }` or `{ noDependency: [['a', 'b']] }`. These need to become `TypeNodeView` trees:
- `{ pure: true }` → `{ kind: 'object', properties: [{ name: 'pure', value: { kind: 'boolean' } }] }`
- `{ noDependency: [['a', 'b']] }` → `{ kind: 'object', properties: [{ name: 'noDependency', value: { kind: 'tuplePairs', values: [['a', 'b']] } }] }`
- `{ noCycles: ['a', 'b'] }` → `{ kind: 'object', properties: [{ name: 'noCycles', value: { kind: 'stringList', values: ['a', 'b'] } }] }`
- `{ filesystem: { exists: ['a'] } }` → `{ kind: 'object', properties: [{ name: 'filesystem', value: { kind: 'object', properties: [{ name: 'exists', value: { kind: 'stringList', values: ['a'] } }] } }] }`

Add a `constraintView()` helper to `MockASTAdapter` for convenient construction.

### What does NOT change

- Domain entities (`ArchSymbol`, `Contract`, `Diagnostic`)
- Contract types (`ContractType` enum)
- `FileSystemPort`, `TypeScriptPort`, `ConfigPort`
- `CheckContractsService` (checker)
- CLI, plugin
- Integration test fixtures (real `.k.ts` files parsed by real `ASTAdapter`)
- E2E tests

### Verification

- All 272 existing tests must pass
- Integration tests exercise the real `ASTAdapter`, validating `buildTypeNodeView` end-to-end
- Unit tests exercise `walkConstraintView` via the mock adapter
