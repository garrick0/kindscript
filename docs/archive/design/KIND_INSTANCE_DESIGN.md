# Kind Instance Design: Location, Identity, and Composition

## Two Design Issues

### Issue 1: Location is declared in instances, but it should be a constraint on Kinds

Today, every member in an instance declaration says where it lives:

```typescript
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain:         { kind: "DomainLayer",         location: "src/ordering/domain" },
  application:    { kind: "ApplicationLayer",     location: "src/ordering/application" },
  infrastructure: { kind: "InfrastructureLayer",  location: "src/ordering/infrastructure" },
};
```

But the locations aren't arbitrary. A `CleanContext`'s `domain` member lives at `./domain` relative to the context. That's a structural fact about *what a CleanContext is*, not about this particular instance. Every `CleanContext` will have its domain at `./domain`.

The location pattern belongs on the **Kind definition**, not on each instance. The Kind should say "my `domain` member lives at `./domain`". The instance should just say "I'm at `src/ordering`". The compiler derives `src/ordering/domain` and verifies it exists.

### Issue 2: Members are anonymous inline literals, not real typed objects

Today, the `domain` member is an inline object literal:

```typescript
domain: { kind: "DomainLayer", location: "src/ordering/domain" }
```

This isn't a `DomainLayer` instance in any meaningful sense. It's an anonymous config blob that structurally matches the `DomainLayer` interface. You can't reference it independently. You can't compose it. It has no identity beyond its position in the parent literal.

If the whole point of Kinds is that things have types, then instances should be real TypeScript objects of their Kind type. To make a `CleanContext`, you should first make a `DomainLayer`, an `ApplicationLayer`, and an `InfrastructureLayer`, then compose them — like normal TypeScript.

---

## Current Behavior

### What a Kind definition looks like

```typescript
type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;
```

This defines structure (what members, what types) but says nothing about where members live on disk.

### What an instance looks like

```typescript
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain:         { kind: "DomainLayer",         location: "src/ordering/domain" },
  application:    { kind: "ApplicationLayer",     location: "src/ordering/application" },
  infrastructure: { kind: "InfrastructureLayer",  location: "src/ordering/infrastructure" },
};
```

Problems:

1. **Redundant.** `src/ordering/domain` is always `src/ordering` + `/domain`. The relative path `./domain` is a property of `CleanContext`, not of this instance.
2. **Unverified.** The `kind: "DomainLayer"` string is never read by the classifier. You could write `kind: "GARBAGE"` and KindScript wouldn't notice.
3. **Not composable.** The domain member is an anonymous literal. You can't define it separately and pass it in.
4. **Location is declared, not checked.** The instance *tells* KindScript where domain is. KindScript doesn't *verify* that the Kind definition's structure matches the filesystem.

### Two instances of the same Kind

```typescript
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain:         { kind: "DomainLayer",         location: "src/ordering/domain" },
  application:    { kind: "ApplicationLayer",     location: "src/ordering/application" },
  infrastructure: { kind: "InfrastructureLayer",  location: "src/ordering/infrastructure" },
};

export const billing: CleanContext = {
  kind: "CleanContext",
  location: "src/billing",
  domain:         { kind: "DomainLayer",         location: "src/billing/domain" },
  application:    { kind: "ApplicationLayer",     location: "src/billing/application" },
  infrastructure: { kind: "InfrastructureLayer",  location: "src/billing/infrastructure" },
};
```

The member declarations are identical except for the path prefix. The structural relationship (`domain` is at `./domain`) is repeated manually for every instance.

---

## Design Space

### Axis 1: Where does member location info come from?

**A. Instance declares it (current).** Each member spells out its absolute or relative path. Flexible but redundant.

**B. Kind definition constrains it.** The Kind says "member `domain` lives at `./domain`." The instance provides the root; member paths are derived. Compact but rigid.

**C. Convention: member name = relative directory.** No explicit path anywhere. `domain: DomainLayer` implies `./domain`. The simplest option, but "convention over configuration" can surprise people.

**D. Kind definition constrains with override.** The Kind provides a default path. The instance can override it. Combines B's compactness with A's flexibility.

### Axis 2: How are member instances constructed?

**A. Inline anonymous literals (current).** Members are config blobs inside the parent literal. No independent identity.

**B. Standalone typed variables, composed into parent.** Each member is a `const` with its Kind type. The parent instance references them. Real TypeScript composition.

**C. Automatically derived from Kind definition.** Members aren't instantiated at all. The Kind definition + root location is enough. The compiler builds the member tree internally.

### Axis 3: What does the compiler verify?

**A. Import contracts only (current).** `noDependency`, `mustImplement`, etc. Location is trusted, never verified.

**B. Location existence.** The compiler checks that declared/derived directories actually exist.

**C. Structural matching.** The compiler verifies that the filesystem structure matches the Kind definition's expected layout.

---

## Design Options

### Design 1: Convention-Based Location (member name = directory)

The Kind definition doesn't mention locations. The convention is: if a Kind has a member named `domain`, that member's directory is `./domain` relative to the parent instance.

**Kind definitions (unchanged):**

```typescript
type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;
```

**Instance — just the root location:**

```typescript
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
};
```

The compiler derives:
- `ordering.domain` → `src/ordering/domain`
- `ordering.application` → `src/ordering/application`
- `ordering.infrastructure` → `src/ordering/infrastructure`

**Two instances:**

```typescript
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
};

export const billing: CleanContext = {
  kind: "CleanContext",
  location: "src/billing",
};
```

That's it. No member declarations at all. The Kind definition determines the full tree structure. The instance just says where the root is.

**What the classifier does:**

When it sees `ordering: CleanContext`, it:
1. Looks up `CleanContext` in Kind definitions
2. Reads `location: "src/ordering"`
3. Walks the Kind definition's properties: `domain: DomainLayer`, `application: ApplicationLayer`, `infrastructure: InfrastructureLayer`
4. For each, derives location: `src/ordering/domain`, `src/ordering/application`, `src/ordering/infrastructure`
5. Recursively walks sub-members (if `DomainLayer` had members like `entities: EntitiesKind`, they'd be at `src/ordering/domain/entities`)

**The compiler can now verify:** Does `src/ordering/domain/` exist? If not, that's a diagnostic.

**Pros:**
- Minimal syntax — instances are 3 lines
- Location is deterministic — no room for inconsistency
- The Kind definition IS the filesystem contract
- Two instances of the same Kind always have the same internal structure

**Cons:**
- No flexibility in directory naming. If your domain layer is at `./core` instead of `./domain`, you can't use `CleanContext` as-is. You'd need a custom Kind:

  ```typescript
  type MyCleanContext = Kind<"MyCleanContext", {
    core: DomainLayer;          // lives at ./core
    application: ApplicationLayer;
    infrastructure: InfrastructureLayer;
  }>;
  ```

  This is arguably correct — if your layout is different, your *Kind* is different. But it means you can't reuse stdlib contracts without redefining the Kind.

- Deeply nested hierarchies are fully implicit. If `DomainLayer` has members, and those have members, the user has to mentally trace the tree to know where files end up.

### Design 2: Explicit Location Constraints on Kind Definitions

Kinds declare the relative location of each member explicitly:

```typescript
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;          // @location "./domain"
  application: ApplicationLayer; // @location "./app"
  infrastructure: InfrastructureLayer; // @location "./infra"
}>;
```

TypeScript doesn't support annotations on type alias members. So the constraint needs another encoding. Options:

**Option A: Separate metadata object**

```typescript
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

const CleanContextLayout = defineLayout<CleanContext>({
  domain: "./domain",
  application: "./application",
  infrastructure: "./infrastructure",
});
```

**Option B: Use the member name as default, allow override in Kind definition**

Fall back to convention (member name = directory) unless explicitly overridden:

```typescript
// Default: member name = directory name
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;           // → ./domain (convention)
  application: ApplicationLayer;  // → ./application (convention)
  infrastructure: InfrastructureLayer; // → ./infrastructure (convention)
}>;

// Override when directory name differs from member name:
type MyContext = Kind<"MyContext", {
  domain: DomainLayer;           // → ./domain (convention)
  app: ApplicationLayer;          // → ./app (convention, matches member name)
  infra: InfrastructureLayer;     // → ./infra (convention, matches member name)
}>;
```

In this approach, you'd just name the member to match the directory. No separate override mechanism needed. Convention IS the mechanism.

**Option C: Location encoded in the Kind type parameter**

```typescript
type DomainLayer = Kind<"DomainLayer", { path: "domain" }>;
type ApplicationLayer = Kind<"ApplicationLayer", { path: "application" }>;
```

Then any Kind that has a `DomainLayer` member knows it lives at `./domain`. But this couples the location to the Kind type itself — all `DomainLayer` instances everywhere would have to live at `./domain`, regardless of parent. That's too rigid.

**Recommendation for this axis:** Option B (convention from member name) is the simplest and handles 90% of cases. If you want `./core` instead of `./domain`, name the member `core`. This is Design 1 effectively.

### Design 3: Instances as Composed Typed Objects

Members are real `const` declarations with Kind types, composed into parents like normal TypeScript.

**Kind instances (no sub-members):**

```typescript
const domain: DomainLayer = { kind: "DomainLayer" };
const application: ApplicationLayer = { kind: "ApplicationLayer" };
const infrastructure: InfrastructureLayer = { kind: "InfrastructureLayer" };
```

No `location` — location is derived from the Kind definition constraints (member name = directory).

**Composed parent instance:**

```typescript
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain,
  application,
  infrastructure,
};
```

TypeScript enforces the types: `domain` must be a `DomainLayer`, `application` must be an `ApplicationLayer`. You can't accidentally swap them.

**Two instances sharing member definitions:**

```typescript
// Member instances (shared — they describe what, not where)
const domain: DomainLayer = { kind: "DomainLayer" };
const application: ApplicationLayer = { kind: "ApplicationLayer" };
const infrastructure: InfrastructureLayer = { kind: "InfrastructureLayer" };

// Two contexts using the same member types but different root locations
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain,
  application,
  infrastructure,
};

export const billing: CleanContext = {
  kind: "CleanContext",
  location: "src/billing",
  domain,
  application,
  infrastructure,
};
```

Both `ordering` and `billing` have a `domain` member that's a `DomainLayer`. But `ordering.domain` resolves to `src/ordering/domain` and `billing.domain` resolves to `src/billing/domain` — the location is derived from the parent, not from the member instance itself.

**What this means:** The member instance (`domain: DomainLayer`) describes *what* something is. The parent's location + the member name determines *where* it is. The member instance is reusable across parents because it carries no location data.

**Members with sub-members:**

```typescript
type EntitiesModule = Kind<"EntitiesModule">;
type ValueObjectsModule = Kind<"ValueObjectsModule">;

type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;
  valueObjects: ValueObjectsModule;
}>;

// Instances (no sub-members)
const entities: EntitiesModule = { kind: "EntitiesModule" };
const valueObjects: ValueObjectsModule = { kind: "ValueObjectsModule" };

// Composed domain
const domain: DomainLayer = {
  kind: "DomainLayer",
  entities,
  valueObjects,
};

// Composed context
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain,
  application,
  infrastructure,
};
```

Location derivation:
- `ordering` → `src/ordering`
- `ordering.domain` → `src/ordering/domain`
- `ordering.domain.entities` → `src/ordering/domain/entities`
- `ordering.domain.valueObjects` → `src/ordering/domain/valueObjects`

Each level adds the member name as a path segment.

**Classifier impact:**

The classifier would need to:
1. Resolve variable references (not just walk inline literals)
2. Track Kind types through variable declarations (`domain: DomainLayer` → this is a `DomainLayer` instance)
3. Derive locations from the parent's location + member name
4. Walk the Kind definition tree to know the full hierarchy

**Pros:**
- Real TypeScript composition — each member is a typed value
- Type safety — can't put an `InfrastructureLayer` where a `DomainLayer` goes
- Reusable members across instances
- Bottom-up construction mirrors how TypeScript objects normally work
- Clean separation: Kind definition = structure, instance = identity, location = derived

**Cons:**
- More lines of code for member instances (each needs a `const` declaration)
- Classifier needs reference resolution (medium complexity)
- If member instances carry no location and no unique state, what's the point of declaring them at all? (See Design 4)

### Design 4: Kinds + Root Location = Everything (No Member Instances)

If member locations are derived and member instances carry no unique data (just `{ kind: "DomainLayer" }` with no other fields), then member instances are pointless. The Kind definition + the root instance location is all you need.

**Kind definitions (in package or user-defined):**

```typescript
type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;
```

**Instance — absolute minimum:**

```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const ordering = createInstance<CleanContext>("src/ordering");
export const billing = createInstance<CleanContext>("src/billing");
```

Two lines per instance. The Kind type parameter tells the compiler everything about the structure. The string tells it where the root is. Members are derived.

**What the classifier does:**

1. Sees `createInstance<CleanContext>("src/ordering")`
2. Looks up `CleanContext` Kind definition → has members `domain: DomainLayer`, `application: ApplicationLayer`, `infrastructure: InfrastructureLayer`
3. Derives location tree:
   - `ordering` @ `src/ordering`
   - `ordering.domain` @ `src/ordering/domain` (kind: `DomainLayer`)
   - `ordering.application` @ `src/ordering/application` (kind: `ApplicationLayer`)
   - `ordering.infrastructure` @ `src/ordering/infrastructure` (kind: `InfrastructureLayer`)
4. If `DomainLayer` has sub-members, recurses:
   - `ordering.domain.entities` @ `src/ordering/domain/entities` (kind: `EntitiesModule`)

**The compiler then verifies** that these directories exist and contain TypeScript files.

**But what about non-standard paths?**

If your domain is at `./core` instead of `./domain`, you can't use `CleanContext`. You'd define:

```typescript
type MyCleanContext = Kind<"MyCleanContext", {
  core: DomainLayer;
  app: ApplicationLayer;
  infra: InfrastructureLayer;
}>;

export const myApp = createInstance<MyCleanContext>("src");
// Derives: core @ src/core, app @ src/app, infra @ src/infra
```

The member names are chosen to match the directory names. This is a feature, not a bug — the Kind definition describes the *actual structure* of the project.

**Contracts still work:**

```typescript
import { CleanContext } from '@kindscript/clean-architecture';

export const ordering = createInstance<CleanContext>("src/ordering");
export const billing = createInstance<CleanContext>("src/billing");

// Contracts apply to all instances of CleanContext
// (noDependency, purity, etc. come from the package)
```

If contracts are defined per-Kind (in the package), they apply automatically to all instances.

**Pros:**
- Absolute minimum syntax
- Zero redundancy
- The Kind definition is the single source of truth for structure AND layout
- Location is verifiable (compiler can check directories exist)
- Instances are trivially composable (just a type + a path)

**Cons:**
- Member name MUST match directory name (no override without a new Kind)
- Deeply nested structures are fully implicit
- Less familiar to TypeScript developers (magic function, no visible object structure)

---

## Design 3 + Convention vs. Design 4: The Composition Question

The key question between Design 3 and Design 4 is: **do member instances need to exist at all?**

### When they do: members with custom state

If a Kind member could carry additional metadata — e.g., "this domain layer uses strict file naming" or "this adapters layer has a custom test pattern" — then each member instance is meaningful:

```typescript
const domain: DomainLayer = {
  kind: "DomainLayer",
  filePattern: "*.entity.ts",  // custom metadata
};
```

But KindScript doesn't support this today, and it's not clear it should. Metadata like file patterns belongs on the Kind *definition*, not on instances. Every `DomainLayer` should enforce the same naming constraints.

### When they don't: pure structure

If members carry no data beyond their type identity, then a `DomainLayer` instance is just `{ kind: "DomainLayer" }` — a value with zero information content. You're writing code purely to satisfy the type checker. Design 4 eliminates this by deriving the full tree from the Kind definition.

### A middle ground: Design 3 syntax, Design 4 semantics

```typescript
import { CleanContext, DomainLayer, ApplicationLayer, InfrastructureLayer } from '@kindscript/clean-architecture';

// Members exist as typed values (Design 3)...
const domain: DomainLayer = { kind: "DomainLayer" };
const application: ApplicationLayer = { kind: "ApplicationLayer" };
const infrastructure: InfrastructureLayer = { kind: "InfrastructureLayer" };

// ...composed into the parent (Design 3)...
export const ordering: CleanContext = {
  kind: "CleanContext",
  location: "src/ordering",
  domain,
  application,
  infrastructure,
};

// ...but locations are derived from member names (Design 4 semantics)
// ordering.domain → src/ordering/domain
// ordering.application → src/ordering/application
// ordering.infrastructure → src/ordering/infrastructure
```

The member declarations are boilerplate — they carry no information. But they make the composition explicit and type-safe. TypeScript verifies that `domain` IS a `DomainLayer`.

The question is whether this boilerplate earns its keep through type safety, or whether `createInstance<CleanContext>("src/ordering")` is sufficient because the type parameter already provides the same guarantee.

---

## Comparison

| Criterion | Current | Design 1: Convention | Design 3: Composed | Design 4: Derived |
|---|---|---|---|---|
| Instance syntax | 7+ lines per instance | 3 lines | 5-7 lines | 1 line |
| Member location source | Instance literal | Member name convention | Member name convention | Member name convention |
| Location overridable? | Yes (per member) | No (rename member) | No (rename member) | No (rename member) |
| Members as real typed objects | No (inline literals) | No (no member instances) | Yes | No (fully implicit) |
| Compiler can verify paths | No (trusts declared) | Yes (derives + checks) | Yes (derives + checks) | Yes (derives + checks) |
| Type safety on members | Structural only | Via Kind def walking | TypeScript enforces | Via Kind def walking |
| Custom directory names | location: "src/core" | Name member `core` | Name member `core` | Name member `core` |
| Classifier complexity | AST literal walking | Kind def tree walking | Reference resolution | Kind def tree walking |
| Familiar to TS devs | Moderate (config-like) | Low (magic) | High (normal TS) | Low (magic) |

---

## Implications

### For packages

Design 1/4 make packages much more powerful. A package defines the full Kind tree. Users write:

```typescript
import { CleanContext } from '@kindscript/clean-architecture';
export const app = createInstance<CleanContext>("src");
```

One line. The package provides structure, constraints, AND contracts. The user just says where the root is.

### For the classifier

Designs 1 and 4 mean the classifier drives from the Kind definition tree, not from the object literal. It walks `CleanContext.properties`, derives paths from the parent location, and builds `ArchSymbol` nodes with full `kindTypeName` identity. This is a fundamentally different approach to Phase 2 — type-graph-driven instead of literal-driven.

Design 3 requires reference resolution (the classifier must follow `domain` → the `const domain: DomainLayer` declaration), which is a medium-complexity change.

### For contracts

If contracts are defined on the Kind (in the package), they apply to all instances automatically. No per-instance `defineContracts` call needed for standard patterns:

```typescript
// Package defines:
type CleanContext = Kind<"CleanContext", { ... }>;
const contracts = defineContracts<CleanContext>({ ... });

// User writes:
export const ordering = createInstance<CleanContext>("src/ordering");
export const billing = createInstance<CleanContext>("src/billing");

// Both ordering and billing inherit the package's contracts
```

### For the `kind` discriminant

In Designs 1 and 4, there are no member object literals at all, so the `kind` discriminant question disappears for members. The root instance might still need a `kind` discriminant for `createInstance` to work without a type annotation — but if `createInstance<CleanContext>` takes a type parameter, even that is unnecessary.

In Design 3, member instances still have `kind: "DomainLayer"` for TypeScript's benefit. But the classifier would use the variable's type annotation, not the `kind` string, to determine identity.

### For non-standard layouts

All designs converge on the same answer: if your directory name differs from the standard member name, you define a custom Kind with member names that match your directories. This is correct — your layout IS your architecture. If it's different from Clean Architecture, it's a different Kind.

But this means the package's pre-built contracts don't automatically apply to custom Kinds. You'd need to define your own contracts, or the contract system would need to match by member *type* rather than member *name*:

```typescript
// Package contract says: noDependency between any DomainLayer-typed member and any InfrastructureLayer-typed member
// This works regardless of whether the member is called "domain" or "core"
```

This is another place where member Kind type identity matters.
