# Member Kind Types: Current State and Options (V3)

> V3 updates V2 after the M8 refactoring — package system, ClassifyProjectService, cross-file classification, domain reorganisation. The core problem is unchanged. The new architecture makes some solutions cheaper and others more compelling.

---

## What Changed Since V2

### New: Package System (stdlib)

Three pre-built packages now exist:

- `@kindscript/clean-architecture` — `CleanContext`, `DomainLayer`, `ApplicationLayer`, `InfrastructureLayer` + contracts
- `@kindscript/hexagonal` — `HexagonalContext`, `DomainLayer`, `PortsLayer`, `AdaptersLayer` + contracts
- `@kindscript/onion` — `OnionContext`, `CoreLayer`, `DomainServicesLayer`, `ApplicationServicesLayer`, `InfrastructureLayer` + contracts

Each package exports Kind interfaces AND pre-configured contracts via `defineContracts<T>()`. When a package is installed, `ksc infer --write` generates a minimal import-based `architecture.ts`:

```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: { kind: "DomainLayer", location: "src/domain" },
  application: { kind: "ApplicationLayer", location: "src/application" },
  infrastructure: { kind: "InfrastructureLayer", location: "src/infrastructure" },
};
```

The user writes only the instance. Kind definitions and contracts live in the package.

### New: ClassifyProjectService

A new orchestrating use case (`classify-project.service.ts`) replaces ad-hoc pipeline assembly. It:

1. Reads `kindscript.json` (which now has a `packages` field alongside `definitions`)
2. Resolves package definition files via `resolvePackageDefinitions()` — looks up `node_modules/<pkg>/index.ts`
3. Merges compiler options from `tsconfig.json` and `kindscript.json`
4. Creates a single TS program from all root files + all definition files
5. Passes all definition source files (package files first, then user files) to `ClassifyASTService`
6. Caches results keyed on sorted definition paths

This means **cross-file classification works**. Kind definitions from a package are available when classifying instances in the user's `architecture.ts`. The first pass processes all files for Kind defs and instances; the second pass binds contracts.

### New: Domain Reorganisation

- Types extracted to `src/domain/types/` — `ArchSymbolKind`, `LayerRole`, `ContractType`, `ArchitecturePattern`, `CompilerOptions`
- Utilities extracted to `src/domain/utils/` — `path-matching.ts` (`isFileInSymbol`, `joinPath`), `cycle-detection.ts` (`findCycles`)
- Constants extracted to `src/domain/constants/` — `diagnostic-codes.ts`, `node-builtins.ts`, `architecture-packages.ts` (pattern→package mappings)

### Removed

- `ConfigSymbolBuilder` — deleted (was hardcoding `ArchSymbolKind.Layer`)
- `Location` value object — deleted (the codebase uses raw strings throughout)
- Deno support files (`deno.json`, `deno.lock`, `absc` CLI) — removed

---

## The Problem (Unchanged)

When a user declares a Kind and instantiates it, the member's Kind type identity (`DomainLayer`) is stated three times — in the interface definition, in the variable's type annotation (via `CleanContext`), and in the `kind` discriminant string — but KindScript's classifier uses none of them.

With the package system, there's now a fourth place: the package file exports `DomainLayer` as an interface, which the cross-file classifier has full access to. The identity is even more available than before. Still unused.

---

## What the Classifier Actually Does (Post-Refactoring)

The three-phase pipeline in `ClassifyASTService` is structurally unchanged. `ClassifyProjectService` now feeds it definition files from both packages and user definitions, but the classification logic itself is the same.

### Phase 1: Kind Definitions

`classifyKindDefinition()` checks if an interface extends `Kind`, extracts the type name and property signatures:

```typescript
interface KindDefinition {
  name: string;
  kindNameLiteral: string;
  properties: Array<{ name: string; typeName?: string }>;
}
```

For `CleanContext`, `properties` contains `[{ name: "domain", typeName: "DomainLayer" }, ...]`. For `DomainLayer` (which has no custom members), `properties` is `[]`.

With packages, this phase processes package file definitions first. So `DomainLayer`, `ApplicationLayer`, `InfrastructureLayer`, and `CleanContext` are all registered in `kindDefs` before any user definitions are processed.

### Phase 2: Instance Declarations

`classifyInstance()` is unchanged. For each property in the object literal that isn't `kind` or `location`:

- Object literal → `extractMemberSymbol()` → `ArchSymbolKind.Layer` (line 245)
- String literal → `new ArchSymbol(name, ArchSymbolKind.Layer, resolvedLocation)` (line 184)

The `kindDef` is looked up (`const kindDef = kindDefs.get(typeName)` at line 149) but only to confirm the variable's type annotation matches a known Kind. The `kindDef.properties` array — which contains the member type names — is **never iterated, never consulted**.

### Phase 3: Contract Descriptors

`classifyContracts()` parses `defineContracts<T>(...)` calls. The type argument `T` is used to find the matching instance symbol. Contract args are resolved by member name via `instanceSymbol.findByPath()`.

With packages, contracts from package files (e.g., `cleanArchitectureContracts`) are bound to the user's instance because the type argument `CleanContext` resolves to the user's instance declaration. This cross-file binding works correctly.

### The Hinge Point (Same as V2, Line Numbers Updated)

At line 149, `classifyInstance` has `kindDef` which contains `properties`. At line 165, it iterates `objProps`. It never does:

```typescript
const propDef = kindDef.properties.find(p => p.name === prop.name);
const memberKindDef = propDef?.typeName ? kindDefs.get(propDef.typeName) : undefined;
```

That single missing lookup is where all member type identity is lost.

---

## How Deep the Loss Goes (Updated)

### `ArchSymbolKind` is 57% dead code

Seven variants, three used in production, four only in tests:

```typescript
export enum ArchSymbolKind {
  Layer = 'layer',       // ← used (hardcoded for ALL members)
  Module = 'module',     // ← production: NEVER — tests: used for test data
  Context = 'context',   // ← production: NEVER — tests: used for test data
  Port = 'port',         // ← NEVER used anywhere (not even tests)
  Adapter = 'adapter',   // ← NEVER used anywhere (not even tests)
  Kind = 'kind',         // ← used (for Kind definitions)
  Instance = 'instance', // ← used (for instance declarations)
}
```

Nuance from V2: `Module` and `Context` appear in 40+ test assertions across `layer-structure.validation.test.ts`, `must-implement.validation.test.ts`, `arch-symbol.test.ts`, `contract.test.ts`, and `diagnostic.test.ts`. These tests construct `ArchSymbol` objects manually and validate that contract checking, hierarchy traversal, and diagnostic creation work with richer symbol kinds. But the production classifier never produces these kinds — the tests validate a capability the classifier doesn't use.

`Port` and `Adapter` are truly dead — not even test code uses them.

### `LayerRole` is still isolated in detect→infer

`LayerRole` (`src/domain/types/layer-role.ts`) is used by:

- `DetectArchitectureService` — maps directory names to roles, pattern-matches on roles
- `DetectedLayer` value object — stores `role: LayerRole`
- `InferArchitectureService` — reads detected roles to decide which contracts to infer

The detect→infer pipeline produces text (an `architecture.ts` file). Once that text is parsed by the classifier, `LayerRole` information is gone. The classifier reads `"PortsLayer"` as a string, creates an `ArchSymbol` with `kind: ArchSymbolKind.Layer`.

With the package system, the gap is even more visible. `@kindscript/hexagonal` defines `PortsLayer` and `AdaptersLayer` as distinct interfaces. The classifier processes these definitions and stores their property signatures. But when it classifies the user's instance, the `ports` member becomes `ArchSymbol("ports", Layer, "src/ports")` — no record that its type is `PortsLayer`.

### The `kind` discriminant is still unread

The classifier skips `kind` and `location` properties (line 166: `if (prop.name === 'kind' || prop.name === 'location') continue;`). No code reads, matches, or validates the `kind` discriminant value. You could write `kind: "GARBAGE"` and KindScript wouldn't notice.

### No downstream consumer cares about member kind (updated)

| Consumer | Uses member kind? | What it uses instead |
|---|---|---|
| `CheckContractsService` | No | `declaredLocation` only |
| `GetPluginDiagnosticsService` | No | Delegates to CheckContracts |
| `GetPluginCodeFixesService` | No | Error codes only |
| `ClassifyProjectService` | No | Passes through from ClassifyAST |
| `CheckCommand` | No | Passes symbols/contracts through |
| `InferCommand` | No | Uses detect→infer pipeline, not classifier |

Changes from V2: `ConfigSymbolBuilder` was deleted. The `instanceTypeNames` map exists precisely because `ArchSymbol` doesn't carry this information.

### The information exists — it's just disconnected (updated)

| Pipeline stage | Has member type info? | What it does with it |
|---|---|---|
| Package file (`@kindscript/clean-architecture`) | Yes (`domain: DomainLayer`) | Defines the type |
| User's `architecture.ts` | Yes (type annotation via import) | TypeScript checks shape |
| Phase 1 (classifyKindDefinition) | Yes (`properties[].typeName = "DomainLayer"`) | Stores it in `KindDefinition` |
| Phase 2 (classifyInstance) | Has access via `kindDefs` | Never looks it up |
| `ArchSymbol` after classification | No — all members are `ArchSymbolKind.Layer` | Identity lost |
| `instanceTypeNames` map | Instance-level only (`"app" → "CleanContext"`) | No per-member info |
| detect→infer pipeline | Yes (`LayerRole`) | Generates text, then discarded |

---

## Where Member Kind Identity Would Change Behavior

Same as V2, plus two new implications from the package system:

### Package-level constraints could propagate

With packages defining Kind types, a `DomainLayer` definition in `@kindscript/clean-architecture` could carry metadata — filesystem constraints, naming conventions, purity requirements. If the classifier knew that a user's `domain` member is typed as `DomainLayer`, those constraints would propagate automatically. Without the type lookup, the package's structural intent can't reach the user's instance members.

### Contracts could self-validate across package boundaries

Today, `mustImplement: [["ports", "adapters"]]` in the hexagonal package is bound by string name. With member kind identity, the contract binding step could verify that `"ports"` resolves to a `PortsLayer`-typed member and `"adapters"` resolves to an `AdaptersLayer`-typed member. This would catch misconfiguration where a user accidentally maps `ports` to a directory that's typed as something else.

### Diagnostics could reference Kind type names

"Forbidden dependency from DomainLayer 'domain' to InfrastructureLayer 'infrastructure'" is more informative than "Forbidden dependency from 'domain' to 'infrastructure'". The Kind type name communicates architectural intent.

---

## Options

### Option 1: Wire Up What's Already There

Phase 1 already extracts `properties[].typeName`. Phase 2 already has `kindDefs` in scope. The connection just isn't made. This option connects the existing data.

**Changes to `ClassifyASTService.classifyInstance()`** — when iterating member properties, look up the member's type from the Kind definition:

```typescript
for (const prop of objProps) {
  if (prop.name === 'kind' || prop.name === 'location') continue;

  // NEW: Look up the member's Kind type from the parent's definition
  const propDef = kindDef.properties.find(p => p.name === prop.name);
  const memberKindDef = propDef?.typeName ? kindDefs.get(propDef.typeName) : undefined;
  const memberKindTypeName = propDef?.typeName;

  if (this.astPort.isObjectLiteral(prop.value)) {
    const memberSymbol = this.extractMemberSymbol(
      prop.name, prop.value, projectRoot, memberKindDef, memberKindTypeName
    );
    // ...
  } else {
    // String leaf — still gets kindTypeName
    const memberSymbol = new ArchSymbol(
      prop.name, ArchSymbolKind.Layer, resolvedLocation,
      new Map(), [], memberKindTypeName
    );
    // ...
  }
}
```

**Changes to `ArchSymbol`:**

```typescript
export class ArchSymbol {
  constructor(
    public readonly name: string,
    public readonly kind: ArchSymbolKind,
    public readonly declaredLocation?: string,
    public readonly members: Map<string, ArchSymbol> = new Map(),
    public readonly contracts: ContractReference[] = [],
    public readonly kindTypeName?: string,  // NEW: "DomainLayer", "PortsLayer", etc.
  ) {}
}
```

**Changes to `extractMemberSymbol()`** — receives the member's `KindDefinition` and `kindTypeName`, passes them through recursion:

```typescript
private extractMemberSymbol(
  name: string,
  objNode: ASTNode,
  projectRoot: string,
  memberKindDef?: KindDefinition,  // NEW
  kindTypeName?: string,           // NEW
): ArchSymbol | undefined {
  // ... existing location extraction ...

  for (const prop of props) {
    if (prop.name === 'kind' || prop.name === 'location') continue;

    // NEW: recursive Kind def lookup for sub-members
    const subPropDef = memberKindDef?.properties.find(p => p.name === prop.name);
    const subKindDef = subPropDef?.typeName ? /* lookup from kindDefs */ : undefined;
    const subKindTypeName = subPropDef?.typeName;

    // ... existing object/string handling, now with sub-type info ...
  }

  return new ArchSymbol(name, ArchSymbolKind.Layer, location, members, [], kindTypeName);
}
```

**Note on recursive access to `kindDefs`:** `extractMemberSymbol` currently doesn't have access to the top-level `kindDefs` map. Two options: (a) pass it as a parameter, or (b) promote it to an instance field set at the start of `execute()`. Option (b) is cleaner since `kindDefs` is used across all three phases.

**What this gives you:**

- Each member `ArchSymbol` knows which Kind type it instantiates
- Works across package boundaries (package Kind defs are in `kindDefs`)
- The `kind` discriminant can be validated against the expected type
- Kind-level metadata could propagate from package definitions to user instances
- `instanceTypeNames` side-channel becomes redundant for per-member info
- Recursive resolution means sub-members (e.g., `domain.entities` typed as some `EntitiesKind`) also carry identity

**What it doesn't change:**

- User-facing syntax stays the same
- Members are still inline object literals
- The `kind` discriminant is still required by TypeScript's structural checking

**What to do with the dead variants:** Simplify `ArchSymbolKind` to `{ Kind, Instance, Member }`. The semantic role (`DomainLayer`, `PortsLayer`, etc.) is carried by `kindTypeName`. The enum describes structural position, not semantic identity. Update the ~40 test assertions that use `Module` and `Context` to use `Member` instead.

**Cost:** Small. 3 files touched in production code (`arch-symbol.ts`, `arch-symbol-kind.ts`, `classify-ast.service.ts`). ~40 test assertions to update for the enum simplification. The data is already extracted — this connects existing wires.

### Option 2: First-Class Member Instances

Members could be separate `const` declarations referenced by name:

```typescript
import { CleanContext, DomainLayer, ApplicationLayer, InfrastructureLayer } from '@kindscript/clean-architecture';

export const domain: DomainLayer = {
  kind: "DomainLayer",
  location: "src/domain",
};

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain,           // ← reference, not inline literal
  application,
  infrastructure,
};
```

**What this gives you over Option 1:**

- Members are independently typed and referenceable
- Contexts can be composed from pre-declared pieces
- Members can be shared across contexts (e.g., a shared `DomainLayer` in a mono-context project)
- Each member is also an instance of its Kind type, visible to the classifier as a first-class entity

**What it requires:**

The classifier currently only walks object literal structure. It would need to resolve identifier references. Two approaches:

- **Variable tracking pass:** Before processing context instances, scan all `const` declarations typed as any known Kind. Build a `name→ArchSymbol` map. When a member's value is an identifier, look it up. This works for same-file references and is consistent with how the classifier already works (AST-level, no type checker dependency).
- **TypeScript checker resolution:** Use the type checker to resolve the symbol behind an identifier. Handles imports from other files and re-exports. Heavier dependency on the TS compiler API, but `tsPort` already supports the operations needed.

**Interaction with packages:** If a package exported pre-built member instances (not just types), users could compose from them:

```typescript
import { CleanContext, domainLayer, applicationLayer, infraLayer } from '@kindscript/clean-architecture';

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: { ...domainLayer, location: "src/domain" },
  // ...
};
```

But this fights the fact that instances carry locations — a package can't know where the user's domain directory is. The spread pattern is awkward and hard for an AST-level classifier to process.

**Cost:** Medium. Real change to the classification pipeline. Option 1 is a prerequisite (you need `kindTypeName` resolution to make this work properly).

### Option 3: Eliminate the Redundant `kind` Discriminant

If the classifier derives Kind identity from the type graph (Option 1), the `kind` discriminant in member literals becomes unnecessary for KindScript.

**Leaf members as strings (already works):**

```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
};
```

The classifier already handles string-valued members (lines 174–189). This works today for flat hierarchies. No `kind` discriminants needed on members. The root `kind: "CleanContext"` stays because the classifier uses it for... actually, it doesn't. The classifier uses the *type annotation* (`app: CleanContext`) to identify the Kind type, not the `kind` property. The `kind` property is skipped (line 166).

**So the root `kind` discriminant is also unused by KindScript.** It exists solely for TypeScript's type narrowing. If we don't need discriminated unions on instances (and we don't — instances are identified by their type annotation, not their runtime shape), the root discriminant is redundant too.

**Hybrid — strings for leaves, objects for branches:**

```typescript
export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    location: "src/domain",
    entities: "entities",
    ports: "ports",
  },
  infrastructure: "src/infrastructure",
};
```

Branch members keep their location + sub-members but drop the `kind` discriminant. Leaf members are just location strings.

**What changes in `Kind<N>`:**

The base interface needs to split into root (requires `kind`) and member (location-only):

```typescript
interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

// For members that don't need a discriminant:
type MemberOf<T extends Kind> = {
  readonly location: string;
} & {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind ? string | MemberOf<T[K]> : T[K];
};
```

**The risk is still structural ambiguity.** Without the discriminant, if `DomainLayer` and `InfrastructureLayer` have the same shape (`{ location: string }`), TypeScript can't distinguish them — assigning a `DomainLayer` object to an `InfrastructureLayer` field wouldn't be a type error. With the discriminant, it's a compile error. In practice, members are identified by their property name in the parent (`domain`, not `kind: "DomainLayer"`), so this may not matter for correctness. But it's a weaker safety net.

**Interaction with packages:** Packages would need to export the `MemberOf` type (or a `locate` function — see Option 4). The package's `Kind<N>` interface stays the same; the user's instantiation syntax changes.

**Cost:** Medium. Changes the user-facing syntax and the `Kind` runtime interface. Requires Option 1 as a prerequisite.

### Option 4: Instances as Pure Location Maps

The Kind interface tree describes the full structure. Instances only add *where*. Separate structure from location entirely.

**With `locate<T>`:**

```typescript
import { CleanContext, locate } from '@kindscript/clean-architecture';

export const app = locate<CleanContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});
```

**With nesting:**

```typescript
import { HexagonalContext, locate } from '@kindscript/hexagonal';

export const app = locate<HexagonalContext>({
  location: "src",
  domain: {
    location: "src/domain",
    entities: "entities",
    valueObjects: "value-objects",
  },
  ports: "src/ports",
  adapters: "src/adapters",
});
```

**How TypeScript enforces correctness:**

```typescript
type LocationMap<T extends Kind> = {
  location: string;
} & {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind ? string | LocationMap<T[K]> : never;
};

function locate<T extends Kind>(map: LocationMap<T>): LocationMap<T> {
  return map;
}
```

TypeScript enforces that every required member has a location, and that nesting matches the Kind definition. No `kind` discriminants needed — the type parameter `T` carries full structural identity. `locate<T>` is enforced at the type level, not at runtime.

**How the classifier handles it:**

The classifier would recognise `locate<T>(...)` calls the same way it recognises `defineContracts<T>(...)` calls — by function name and type argument. It reads `T` to get the Kind type name, walks the Kind definition tree, and builds `ArchSymbol` hierarchy with proper `kindTypeName` values. The object literal provides locations; the type graph provides structure and identity.

This is maximum-information classification. The classifier knows every member's Kind type because it drives the walk from the type graph, not from the literal. No information is lost.

**Interaction with packages:**

`locate` would be exported from the package (or from `kindscript` core). The package defines the Kind interfaces and contracts. The user calls `locate<CleanContext>({...})`. This is the leanest possible user syntax:

```typescript
import { CleanContext, locate } from '@kindscript/clean-architecture';

export const app = locate<CleanContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});
```

No `kind` strings, no redundant structural declarations. Three lines of actual content.

`defineContracts<T>` already works this way (reads type argument, not literal shape). `locate<T>` would be the instance-side equivalent.

**How `ksc infer --write` would generate this:**

With a package installed:
```typescript
import { CleanContext, locate } from '@kindscript/clean-architecture';

export const app = locate<CleanContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});
```

Without a package (standalone):
```typescript
// Kind definitions + ContractConfig + defineContracts stubs...

export const app = locate<CleanArchitectureContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});

export const contracts = defineContracts<CleanArchitectureContext>({ ... });
```

The `InferredDefinitions.toImportBasedContent()` method already generates import-based content — extending it to use `locate<T>` is straightforward.

**Cost:** Significant. Changes user-facing API, runtime types, and Phase 2 classifier logic. But it's the cleanest end state and fits naturally with the package system. `defineContracts<T>` is precedent for this exact pattern.

### Option 5: Type-Argument Driven Instances (variant of Option 4)

Instead of `locate<T>`, use a `defineInstance<T>` function that parallels `defineContracts<T>`:

```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const app = defineInstance<CleanContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});

export const contracts = defineContracts<CleanContext>({ ... });
```

**Why this might be better than `locate`:** It matches the existing `defineContracts<T>` naming convention. Users learn one pattern: `define___<KindType>(config)`. The classifier already knows how to handle `defineContracts<T>()` calls — the same detection logic (function name match + type argument extraction) would handle `defineInstance<T>()`.

**The classifier change is smaller than Option 4's general `locate<T>`** because the function name `defineInstance` is an unambiguous marker (just like `defineContracts`), whereas `locate` is a generic word that might collide with user code.

**Cost:** Same as Option 4 in principle. Slightly easier classifier integration due to naming convention alignment.

---

## Comparison

| Criterion | Option 1: Wire up | Option 2: Refs | Option 3: Drop `kind` | Option 4: `locate<T>` | Option 5: `defineInstance<T>` |
|---|---|---|---|---|---|
| User syntax change | None | Optional | Yes | Yes | Yes |
| Redundancy removed | None (internal) | Some | `kind` discriminant | All structural redundancy | All structural redundancy |
| Classifier change | Small | Medium | Medium | Large | Large (but pattern exists) |
| Kind identity on members | Yes | Yes | Yes | Yes | Yes |
| Kind metadata propagation | Yes | Yes | Yes | Yes | Yes |
| Composable members | No | Yes | No | No | No |
| Type safety via TS | Same as today | Same as today | Weaker (no discriminant) | Stronger (mapped type) | Stronger (mapped type) |
| Package system fit | Good | Moderate | Good | Excellent | Excellent |
| Naming consistency | — | — | — | New pattern | Matches `defineContracts` |
| Backwards compatible | Fully | Fully (additive) | Breaking | Breaking | Breaking |
| Prerequisite | — | Option 1 | Option 1 | Option 1 | Option 1 |

---

## What to Do with `ArchSymbolKind` and `LayerRole`

### The state after the refactoring

`ArchSymbolKind` has 7 variants. In production, only 3 are used: `Kind` (for definitions), `Instance` (for instance declarations), `Layer` (hardcoded for all members). The remaining 4 (`Module`, `Context`, `Port`, `Adapter`) are used only in test assertions where `ArchSymbol` objects are constructed manually.

`LayerRole` has 7 variants, used exclusively in the detect→infer pipeline. It maps directory names (`domain` → `LayerRole.Domain`, `ports` → `LayerRole.Ports`) to determine architecture pattern and infer contracts. It's stored on `DetectedLayer` and consumed by `InferArchitectureService`. It never reaches the classifier or any downstream consumer.

### Recommendation: Option B (from V2, still the right answer)

**Simplify `ArchSymbolKind` to `{ Kind, Instance, Member }`.** Drop `Layer`, `Module`, `Context`, `Port`, `Adapter`. The enum describes structural position (is this a definition, an instance, or a member?), not semantic role. Semantic role is carried by `kindTypeName`.

**Keep `LayerRole` where it is.** It serves a different purpose — heuristic pattern detection from directory names. It doesn't need to reach the classifier because the classifier gets type identity from the AST. `LayerRole` is correct for its pipeline; the problem is that the classifier pipeline doesn't use the type information it already has.

**Don't merge them.** They answer different questions: `LayerRole` answers "what role does this directory play based on its name?" while `kindTypeName` answers "what Kind type does this member instantiate based on its type annotation?" These are independent facts about the same entity that happen to correlate for standard patterns but can diverge for custom Kind types.

---

## Recommendation

### Immediate: Option 1

Wire up the existing data. This is 100% backwards compatible, touches 3 production files, and is a prerequisite for every other option.

Specifically:

1. Add `kindTypeName?: string` to `ArchSymbol`
2. In `classifyInstance`, look up `kindDef.properties` to get each member's `typeName`
3. Pass the member's `KindDefinition` (and `kindDefs` map) into `extractMemberSymbol` for recursive resolution
4. Store `kindTypeName` on every member `ArchSymbol`
5. Optionally validate the `kind` discriminant against the expected Kind type name
6. Simplify `ArchSymbolKind` to `{ Kind, Instance, Member }` (update ~40 test assertions)

After Option 1, the `instanceTypeNames` side-channel becomes partially redundant — instance-level type names are already there (keep it for backwards compat or remove it). More importantly, every `ArchSymbol` in the tree now carries its Kind type identity, enabling all downstream consumers to use it.

### Next: Option 5 (or 4)

Once Option 1 is in place, the path to `defineInstance<T>` (or `locate<T>`) is clear:

1. Define `LocationMap<T>` mapped type in `kindscript` core (or in each package)
2. Export `defineInstance<T>(map: LocationMap<T>)` function
3. Add a new classifier path that recognises `defineInstance<T>()` calls (same pattern as `defineContracts<T>()`)
4. Walk the Kind definition tree from the type argument to build `ArchSymbol` hierarchy
5. Update `ksc infer --write` to generate `defineInstance<T>()` syntax
6. Deprecate but continue supporting the current inline object literal syntax

The package system makes this transition natural. Users on packages would see:

```typescript
import { CleanContext, defineInstance } from '@kindscript/clean-architecture';

export const app = defineInstance<CleanContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});
```

Three lines of content. Maximum type safety. Zero redundancy. The Kind type graph is the single source of truth for structure; the instance is a pure location binding.
