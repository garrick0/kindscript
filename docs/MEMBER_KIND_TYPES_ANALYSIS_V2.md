# Member Kind Types: Current State and Options (V2)

## The Problem

When a user declares a Kind and instantiates it, the members are typed as Kind interfaces:

```typescript
interface CleanContext extends Kind<"CleanContext"> {
  domain: DomainLayer;          // ← typed as DomainLayer
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}
```

But the instance is written as anonymous inline object literals:

```typescript
export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: { kind: "DomainLayer", location: "src/domain" },
  application: { kind: "ApplicationLayer", location: "src/application" },
  infrastructure: { kind: "InfrastructureLayer", location: "src/infrastructure" },
};
```

The member's Kind type identity (`DomainLayer`) is stated three times — in the interface definition, in the variable's type annotation (via `CleanContext`), and in the `kind` discriminant string — but KindScript's classifier uses none of them.

---

## What the Classifier Actually Does

### Phase 1: Reads Kind definitions (and collects member types)

`classifyKindDefinition()` calls `getPropertySignatures()`, which returns `{ name: "domain", typeName: "DomainLayer" }`. This is stored in `KindDefinition.properties`.

### Phase 2: Reads instances (and ignores member types)

`classifyInstance()` iterates the object literal's properties. For each member:

1. If it's a nested object literal → calls `extractMemberSymbol()`, which reads `location` and recurses into sub-members
2. If it's a string → treats it as a relative leaf path
3. The `kind` discriminant is **skipped** (line 163: `if (prop.name === 'kind' || prop.name === 'location') continue;`)
4. Every member is assigned **`ArchSymbolKind.Layer` unconditionally** (lines 181, 233, 242)
5. The `KindDefinition.properties[].typeName` collected in Phase 1 is **never consulted**

### The exact hinge point

Phase 2 already has everything it needs. It looks up the parent Kind definition: `const kindDef = kindDefs.get(typeName);` (line 146). The `kindDef.properties` array contains `{ name: "domain", typeName: "DomainLayer" }`. And `kindDefs` maps `"DomainLayer"` to its `KindDefinition`. But when iterating member properties (line 162), the code never does:

```typescript
const propDef = kindDef.properties.find(p => p.name === prop.name);
const memberKindDef = propDef?.typeName ? kindDefs.get(propDef.typeName) : undefined;
```

That single missing lookup is where all member type identity is lost.

---

## How Deep the Loss Goes

### `ArchSymbolKind` is 60% dead code

The enum defines seven variants:

```typescript
export enum ArchSymbolKind {
  Layer = 'layer',       // ← used (hardcoded for ALL members)
  Module = 'module',     // ← NEVER used anywhere
  Context = 'context',   // ← NEVER used anywhere
  Port = 'port',         // ← NEVER used anywhere
  Adapter = 'adapter',   // ← NEVER used anywhere
  Kind = 'kind',         // ← used (for Kind definitions)
  Instance = 'instance', // ← used (for instance declarations)
}
```

`Module`, `Context`, `Port`, `Adapter` were designed for this purpose but are never assigned. Every member is `Layer`.

### `LayerRole` does the job that `ArchSymbolKind` should

The detection pipeline (`detect-architecture.service.ts`) uses a completely separate enum for the same purpose:

```typescript
export enum LayerRole {
  Domain = 'domain',
  Application = 'application',
  Infrastructure = 'infrastructure',
  Presentation = 'presentation',
  Ports = 'ports',
  Adapters = 'adapters',
  Unknown = 'unknown',
}
```

Detection maps directory names to `LayerRole` values, then pattern-matches on the set of roles to determine architecture type (Clean, Hexagonal, Layered). The infer service uses `LayerRole` to decide which contracts to suggest (e.g., `mustImplement` only for Hexagonal when `Ports` and `Adapters` are both detected).

But `LayerRole` exists **only in the detect→infer pipeline**. It produces *text* — a generated `architecture.ts` file with Kind type names like `PortsLayer` and `AdaptersLayer`. Once that text is parsed by the classifier, the role information is gone. The classifier reads `PortsLayer` as a string, creates an `ArchSymbol` with `kind: ArchSymbolKind.Layer`, and the differentiation that `LayerRole` provided is lost.

### The `kind` discriminant is a lie

In instance literals, every member has `kind: "DomainLayer"` (or similar). But:

- The classifier **skips** this property (`if (prop.name === 'kind' ...) continue;`)
- No code reads it, matches it, or validates it
- You could write `kind: "GARBAGE"` and KindScript wouldn't notice — only TypeScript's structural checking would catch it

The discriminant exists for TypeScript's discriminated union pattern, but KindScript doesn't use discriminated unions on members. Members are identified by their property name in the parent (`domain` in `CleanContext`), not by their `kind` value.

### No downstream consumer cares about member kind

| Consumer | Uses member kind? | What it uses instead |
|---|---|---|
| `CheckContractsService` | No | `declaredLocation` only |
| `ScaffoldService` | No | `name` and `declaredLocation` only |
| `ResolveFilesService` | No | `declaredLocation` and child hierarchy |
| `GetPluginDiagnosticsService` | No | Delegates to CheckContracts |
| `GetPluginCodeFixesService` | No | Error codes only |
| `ConfigSymbolBuilder` | No | Hardcodes `ArchSymbolKind.Layer` |
| CLI scaffold command | Filters `ArchSymbolKind.Instance` | Only distinguishes instance from non-instance |

The only place `ArchSymbolKind` is read at all is `scaffold.command.ts` line 71, which filters for `Instance` vs. everything else.

### The information exists — it's just disconnected

| Pipeline stage | Has member type info? | What it does with it |
|---|---|---|
| User's `architecture.ts` | Yes (`domain: DomainLayer`) | TypeScript checks shape |
| Phase 1 (classifyKindDefinition) | Yes (`properties[].typeName = "DomainLayer"`) | Stores it in `KindDefinition` |
| Phase 2 (classifyInstance) | Has access via `kindDefs` | Never looks it up |
| `ArchSymbol` after classification | No — all members are `ArchSymbolKind.Layer` | Identity lost |
| detect→infer pipeline | Yes (`LayerRole`) | Generates text, then discarded |

---

## Where Member Kind Identity Would Change Behavior

### Contracts could validate their own arguments

Today, `mustImplement: [["ports", "adapters"]]` is bound purely by string name — the system trusts that the first arg is a ports-like member and the second is an adapters-like member. If members carried their Kind type:

```typescript
// Contract validation could check:
if (contractType === ContractType.MustImplement) {
  const [ports, adapters] = contract.args;
  if (ports.kindTypeName !== "PortsLayer") {
    errors.push("mustImplement: first arg should be a Ports kind, got " + ports.kindTypeName);
  }
}
```

This turns configuration errors from runtime surprises into classification-time errors.

### Scaffold could generate kind-specific stubs

Today, every member gets the same generic stub:

```typescript
// domain layer
// Generated by KindScript
export {};
```

With Kind identity:

```typescript
// A PortsLayer member gets:
export interface ExamplePort {
  // Define your port interface here
}

// An AdaptersLayer member gets:
export class ExampleAdapter /* implements ExamplePort */ {
  // Implement your adapter here
}
```

### Diagnostics could be kind-specific

A purity violation in a `DomainLayer` member could say "Domain layers must remain pure" instead of the generic "Impure import in pure layer". A `mustImplement` failure could reference "PortsLayer" and "AdaptersLayer" by their Kind names.

### Kind-level metadata could propagate

This is the big one for the filesystem constraints discussion (see `FILESYSTEM_CONSTRAINTS_ANALYSIS.md`). If a `DomainLayer` Kind definition carried constraints like "must have an `index.ts`" or "files must match `*.entity.ts`", those constraints would propagate to every instance that declares a `DomainLayer` member — but only if the classifier knows the member IS a `DomainLayer`.

---

## Options

### Option 1: Wire Up What's Already There

Phase 1 already extracts `properties[].typeName`. Phase 2 already has access to `kindDefs`. The connection just isn't made.

**Change:** When iterating a member in `classifyInstance`, look up the member's property in the Kind definition and use its type:

```typescript
// In classifyInstance, when iterating objProps:
const kindDef = kindDefs.get(typeName); // already available
const propDef = kindDef.properties.find(p => p.name === prop.name);
const memberKindDef = propDef?.typeName ? kindDefs.get(propDef.typeName) : undefined;

// Pass to extractMemberSymbol so it can:
// 1. Store the Kind type name on the ArchSymbol
// 2. Recurse with the member's own KindDefinition (for sub-members)
// 3. Validate the `kind` discriminant matches
const memberSymbol = this.extractMemberSymbol(
  prop.name, prop.value, projectRoot, memberKindDef
);
```

**What needs to change in `ArchSymbol`:**

```typescript
export class ArchSymbol {
  constructor(
    public readonly name: string,
    public readonly kind: ArchSymbolKind,
    public readonly declaredLocation?: string,
    public readonly members: Map<string, ArchSymbol> = new Map(),
    public readonly contracts: ContractReference[] = [],
    public readonly kindTypeName?: string,  // ← NEW: "DomainLayer", "PortsLayer", etc.
  ) {}
}
```

Or, replace `ArchSymbolKind` entirely — since `Module`, `Context`, `Port`, `Adapter` are all dead code, the enum could be simplified to `{ Kind, Instance, Member }` and the real identity would be `kindTypeName`.

**What this gives you:**

- Each member's `ArchSymbol` knows which Kind type it instantiates
- The `kind` discriminant in instance literals can be validated
- Kind-level metadata (filesystem constraints, defaults) could propagate
- Contract args can be validated against expected Kind types
- Scaffold can generate kind-specific stubs
- The data is already collected — this is connecting existing wires

**What it doesn't change:**

- User-facing syntax stays the same
- Members are still inline object literals
- The `kind` discriminant is still required by TypeScript's structural checking

**Also connects to:** The `extractMemberSymbol` method currently recurses without knowing the member's Kind definition. If it received the `KindDefinition`, it could validate sub-members too — e.g., confirm that `domain.entities` is typed as `EntitiesSub` in the `DomainLayer` interface (from the `scaffold-nested` fixture), not just "some nested object with a location."

**Cost:** Small. The data is already extracted, just not connected.

### Option 2: First-Class Member Instances

Instead of inline object literals, members could be separate `const` declarations referenced by name:

```typescript
export const domain: DomainLayer = {
  kind: "DomainLayer",
  location: "src/domain",
};

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain,           // ← reference to a typed const
  application,
  infrastructure,
};
```

**What this gives you:**

- Each member is independently typed and referenceable
- Contexts can be composed from pre-declared pieces
- Members can be shared across multiple contexts (e.g., a shared `DomainLayer` used by both `OrderingContext` and `BillingContext` — the multi-instance fixture already shows this pattern with distinct per-context types, but a shared domain layer is a real use case)
- Easier to test individual members in isolation

**What it requires:**

The classifier would need to resolve identifier references (not just inline literals). Two approaches:

- **Variable tracking pass:** In Phase 2, before processing contexts, scan all `const` declarations typed as any known Kind. Build a name→symbol map. When an instance member's value is an identifier rather than an object literal, look it up in the map.
- **TypeScript type checker resolution:** Use `tsPort` to resolve the symbol behind an identifier. Heavier dependency on the TS compiler, but handles more cases (imports from other files, re-exports).

**Cost:** Medium. The classifier currently only walks object literal structure. Adding reference resolution is a real change to the classification pipeline.

### Option 3: Eliminate the Redundant `kind` Discriminant

The member's type already carries the Kind identity (`domain: DomainLayer`), so `kind: "DomainLayer"` in the literal is redundant. If the classifier derives Kind identity from the type graph (Option 1), the discriminant becomes unnecessary for KindScript.

**Leaf members as strings (already partially works):**

```typescript
export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
};
```

The classifier already handles string-valued members (line 172-186), treating them as leaf locations. But this loses nested object structure — no sub-members, no multi-level hierarchy.

**Hybrid — strings for leaves, objects without `kind` for branches:**

```typescript
export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    location: "src/domain",     // ← no kind discriminant
    entities: "entities",
    ports: "ports",
  },
  infrastructure: "src/infrastructure",  // ← leaf: just a string
};
```

**What this requires:**

- The `Kind<N>` base interface would need to make `kind` optional on member types, or split into `Kind<N>` (root, has discriminant) and `Member` (nested, location-only)
- The classifier would derive the Kind identity from the interface definition (Option 1) rather than from the literal
- TypeScript's discriminated union support for members would be lost — but members are identified by property name, not by discriminant, so this may not matter

**The risk:** Today, TypeScript enforces `kind: "DomainLayer"` as a literal type, which prevents you from accidentally assigning the wrong kind of object to a member. Removing it relies entirely on structural matching, which is weaker. For example, if `DomainLayer` and `InfrastructureLayer` both have the same shape (`{ location: string }`), TypeScript couldn't tell them apart without the discriminant.

**Cost:** Medium. Changes the `Kind` runtime interface and the user-facing syntax. Requires Option 1 as a prerequisite.

### Option 4: Instances as Pure Location Maps

The Kind interface tree already describes the full structure — what members exist, their types, their nesting. The only thing an instance adds is *where*. So separate structure from location entirely.

**With a `locate<T>` helper:**

```typescript
export const app = locate<CleanContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});
```

**Nested version for sub-members:**

```typescript
export const app = locate<CleanContext>({
  location: "src",
  domain: {
    location: "src/domain",
    entities: "entities",
    ports: "ports",
  },
  application: "src/application",
  infrastructure: "src/infrastructure",
});
```

**How TypeScript enforces correctness:**

The `locate<T>` function would use a mapped type to transform the Kind interface into a location-assignment type:

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

TypeScript would enforce that every required member has a location, and that the nesting matches the Kind definition. No `kind` discriminants needed — the type parameter `T` carries the full structural identity.

**What this gives you:**

- The Kind type is the single source of truth for structure
- Instances are minimal — just a path mapping
- No redundant `kind` discriminants anywhere
- The classifier reads `CleanContext` from `locate<CleanContext>(...)`, walks the Kind definition tree, and builds the full `ArchSymbol` hierarchy with proper Kind types
- Maximum information: the classifier knows every member's Kind type because it drives the walk from the type graph, not from the literal
- `defineContracts<T>` already works the same way (reads type argument, not literal shape), so there's precedent in the codebase

**How it relates to packages:**

Stdlib packages would export Kind definitions as they do today. Users would just locate them:

```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const app = locate<CleanContext>({
  location: "src",
  domain: "src/domain",
  application: "src/application",
  infrastructure: "src/infrastructure",
});
```

No `kind` strings, no boilerplate Kind/ContractConfig inlining.

**Cost:** Significant. Changes the user-facing API, the runtime types, and the classifier's Phase 2 logic. But it's the cleanest end state.

---

## Comparison

| Criterion | Option 1: Wire up | Option 2: Refs | Option 3: Drop `kind` | Option 4: Location maps |
|---|---|---|---|---|
| User syntax change | None | Optional | Yes | Yes |
| Redundancy removed | None (internal only) | Some | `kind` discriminant | All structural redundancy |
| Classifier change | Small | Medium | Medium | Large |
| Kind identity on members | Yes | Yes | Yes | Yes |
| Kind metadata propagation | Yes | Yes | Yes | Yes |
| Composable members | No | Yes | No | No |
| Type safety via TS | Same as today | Same as today | Weaker (no discriminant) | Stronger (mapped type) |
| Backwards compatible | Fully | Fully (additive) | Breaking | Breaking |
| Prerequisite for others | — | Option 1 | Option 1 | Option 1 |

---

## Also: What to Do with `ArchSymbolKind` and `LayerRole`

These two enums represent the same concept — "what role does this member play?" — split across two pipelines that don't talk to each other.

**Option A: Merge them.** Replace `ArchSymbolKind` with a richer enum that includes roles:

```typescript
export enum ArchSymbolKind {
  Kind = 'kind',
  Instance = 'instance',
  // Roles (from LayerRole, assigned via Kind type identity):
  Domain = 'domain',
  Application = 'application',
  Infrastructure = 'infrastructure',
  Ports = 'ports',
  Adapters = 'adapters',
  // Generic:
  Layer = 'layer',       // fallback when no role can be inferred
  Module = 'module',
}
```

The classifier would use the member's Kind type name to assign the appropriate role (e.g., `DomainLayer` → `ArchSymbolKind.Domain`). The detect→infer pipeline would generate Kind type names that the classifier can then map to roles.

**Problem:** This hard-codes a fixed set of roles in the domain model. Users defining custom Kind types (`export interface CacheLayer extends Kind<"CacheLayer"> {}`) wouldn't have a matching enum variant.

**Option B: Drop `ArchSymbolKind` roles, use `kindTypeName` directly.** If `ArchSymbol` stores `kindTypeName: "DomainLayer"`, the enum can be simplified to `{ Kind, Instance, Member }`. Consumers that need role-level differentiation would read `kindTypeName` directly. This avoids maintaining a parallel enum that must stay in sync with Kind definitions.

**This is the right answer.** The Kind type name IS the identity. Trying to collapse it into a fixed enum is fighting the fact that Kind types are user-defined and open-ended. The enum should describe structural position (is this a Kind definition, an instance, or a member?), not semantic role (is this a domain layer?). Semantic role is carried by the Kind type name.

**Option C: Keep both, add a mapping.** After classification, a small resolver maps `kindTypeName` → `LayerRole` for consumers that need it. This preserves both enums but connects them.

**Problem:** Same as A — the mapping is a fixed table that can't handle custom Kind types.

---

## Recommendation

**Option 1 is the immediate move.** It connects data that's already extracted, costs almost nothing, and is a prerequisite for every other option. Specifically:

1. Add `kindTypeName?: string` to `ArchSymbol`
2. In Phase 2, look up member properties in `kindDef.properties` to get `typeName`
3. Pass the member's `KindDefinition` into `extractMemberSymbol` for recursive resolution
4. Optionally validate the `kind` discriminant against the expected Kind type
5. Simplify `ArchSymbolKind` to `{ Kind, Instance, Member }` (drop dead variants)

After that, the path forks:

- If the priority is **reducing user ceremony** → Option 3 or 4
- If the priority is **composability** (sharing members across contexts) → Option 2
- If the priority is **Kind types as the single source of truth** → Option 4

Option 4 is the logical endpoint — the Kind type graph defines structure, instances are just location bindings, the `kind` discriminant disappears, and `locate<T>` provides full type safety via a mapped type — but it's a breaking change to the user-facing API. Option 1 now, then Option 4 when the API is ready to evolve, is a clean path.
