# Design: Kind-Derived Locations, Standalone Members, and Existence Checking

> **Update (2026-02-07):** `defineContracts<T>()` and `ContractConfig<T>` have been removed from KindScript. All constraints are now declared on the Kind type's third parameter (`Kind<N, Members, Constraints>`). References to `defineContracts()` in examples below are historical. The locate/instance and existence checking designs described here were implemented; the contract declaration mechanism has changed.

Three design decisions, and how they compose into a concrete system.

## The Three Axes

### Axis 1 — Kind definitions constrain member locations

The Kind type alias says where members live, relative to their parent. The instance provides a root. Member paths are derived. Compact, rigid, no redundancy.

### Axis 2 — Standalone typed variables, composed into parent

Each member is a `const` with its own Kind type. The parent instance references them by name. Real TypeScript composition — members are values, not anonymous inline objects.

### Axis 3 — Location existence checking

The compiler verifies that derived/declared locations actually exist on the filesystem. Missing directories are violations.

---

## What This Looks Like

### Kind definitions (in stdlib package or user code)

```typescript
import { Kind, defineContracts } from 'kindscript';

// The Kind type alias defines STRUCTURE: what members exist and their types.
// Member names ARE their relative paths by convention.
// "domain" → ./domain, "application" → ./application

export type EntitiesModule = Kind<"EntitiesModule">;
export type PortsModule = Kind<"PortsModule">;
export type ApplicationLayer = Kind<"ApplicationLayer">;
export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;
  ports: PortsModule;
}>;

export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

export const cleanArchContracts = defineContracts<CleanContext>({
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
    ["application", "infrastructure"],
  ],
  purity: ["domain"],
});
```

Nothing new here — the Kind definitions stay the same (now using type alias syntax). The change is in how they're used: the member name `domain` implies the relative path `./domain`. This is already the convention in every fixture and package today. The design just makes it the rule.

### Instance declarations (user code)

**Today — redundant, inline, verbose:**

```typescript
export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",         // ← redundant (src + domain)
    entities: {
      kind: "EntitiesModule",
      location: "src/domain/entities",  // ← redundant (src + domain + entities)
    },
    ports: {
      kind: "PortsModule",
      location: "src/domain/ports",     // ← redundant (src + domain + ports)
    },
  },
  application: {
    kind: "ApplicationLayer",
    location: "src/application",    // ← redundant
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    location: "src/infrastructure", // ← redundant
  },
};
```

Every member restates its `kind` (already in the type) and its `location` (already implied by its name and parent). The nested fixture repeats the full path at every level.

**New — derived locations, standalone members:**

```typescript
import { CleanContext, DomainLayer } from '@kindscript/clean-architecture';
import { locate } from 'kindscript';

// Axis 2: Members are standalone typed constants.
// They declare sub-structure but NOT location — location is derived on composition.
const domain: DomainLayer = {
  entities: {},
  ports: {},
};

// The root instance. Axis 1: only the root specifies a location.
// Member paths are derived: domain → src/domain, domain.entities → src/domain/entities, etc.
export const app = locate<CleanContext>("src", {
  domain,
  application: {},
  infrastructure: {},
});
```

That's it. No `kind` discriminants. No location strings on members. No nesting the full path at every level. The Kind type graph says what the structure is. The `locate` call says where it lives. The compiler derives the rest.

### Multi-instance (bounded contexts)

```typescript
import { CleanContext } from '@kindscript/clean-architecture';
import { locate } from 'kindscript';

export const ordering = locate<CleanContext>("src/ordering", {
  domain: {},
  application: {},
  infrastructure: {},
});

export const billing = locate<CleanContext>("src/billing", {
  domain: {},
  application: {},
  infrastructure: {},
});
```

Both contexts use the same Kind definition. `ordering.domain` resolves to `src/ordering/domain`. `billing.domain` resolves to `src/billing/domain`. The Kind constrains the structure; the root determines the position.

### Nested sub-structure

```typescript
import { locate, Kind } from 'kindscript';

type EntitiesModule = Kind<"EntitiesModule">;
type PortsModule = Kind<"PortsModule">;

type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;
  ports: PortsModule;
}>;

type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
}>;

// Standalone member with sub-structure
const domain: DomainLayer = {
  entities: {},
  ports: {},
};

export const app = locate<AppContext>("src", { domain });

// Derived paths:
//   app         → src/
//   domain      → src/domain/
//   entities    → src/domain/entities/
//   ports       → src/domain/ports/
```

The Kind tree is `AppContext > DomainLayer > (EntitiesModule, PortsModule)`. Each level adds its member name as a path segment. The instance provides `"src"` as root, and the full tree is resolved.

---

## The `locate<T>` Function

### Runtime

At runtime, `locate` is an identity function — just like `defineContracts`. It returns the config object unchanged. Its purpose is to be a recognizable call expression that the classifier can find in the AST.

```typescript
function locate<T extends Kind>(root: string, members: MemberMap<T>): MemberMap<T> {
  return members;
}
```

### Type-level

`MemberMap<T>` transforms a Kind type alias into a location-assignment type. It strips `kind` and `location` (these are derived), keeps member names, and allows either an empty object `{}` (no sub-members) or a nested `MemberMap<ChildKind>` (with sub-members):

```typescript
type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | {}  // with or without sub-members
      : never;
};
```

This gives full TypeScript checking:
- Missing members → type error
- Extra members → type error
- Wrong nesting → type error
- No `kind` discriminant needed — the type parameter carries identity

### What the classifier sees

```typescript
export const app = locate<CleanContext>("src", { domain, application: {}, infrastructure: {} });
```

The classifier reads:
1. Call expression name: `locate`
2. Type argument: `CleanContext`
3. First arg: string literal `"src"` → root location
4. Second arg: object literal with member assignments

It walks the `CleanContext` Kind definition tree, matches each member property to its Kind type, and derives absolute paths.

---

## Path Derivation Rules

### Convention: member name = relative directory name

| Member name | Relative path |
|---|---|
| `domain` | `./domain` |
| `application` | `./application` |
| `domainServices` | `./domainServices` |

Member name is used directly as the directory name. No transformation (no camelCase-to-kebab, no pluralization). What you name the member is what the directory is called.

### Derivation is recursive

Given root `"src"` and Kind tree:

```
CleanContext
├── domain: DomainLayer
│   ├── entities: EntitiesModule
│   └── ports: PortsModule
├── application: ApplicationLayer
└── infrastructure: InfrastructureLayer
```

Derived paths:

| Symbol | Path |
|---|---|
| `app` (root) | `src` |
| `domain` | `src/domain` |
| `domain.entities` | `src/domain/entities` |
| `domain.ports` | `src/domain/ports` |
| `application` | `src/application` |
| `infrastructure` | `src/infrastructure` |

### Override mechanism

Convention works for 95% of cases. For the other 5%, the Kind definition can specify an explicit relative path using a second type parameter:

```typescript
type EntitiesModule = Kind<"EntitiesModule">;
type PortsModule = Kind<"PortsModule">;
type ValueObjectsModule = Kind<"ValueObjectsModule">;

type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;        // → ./entities (convention)
  ports: PortsModule;              // → ./ports (convention)
  valueObjects: ValueObjectsModule; // → ./valueObjects (convention)
}>;
```

If a project uses `value-objects/` on disk instead of `valueObjects/`, the instance can override:

```typescript
const domain: DomainLayer = {
  entities: {},
  ports: {},
  valueObjects: { path: "value-objects" },  // explicit override
};
```

The `MemberMap` type permits this:

```typescript
type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & MemberMap<T[K]> | {}
      : never;
};
```

Override is per-member, per-instance. The Kind definition stays clean. Most users never need it.

---

## Axis 3: Location Existence Checking

### What the compiler checks

After path derivation, the compiler verifies that every derived path exists as a directory on the filesystem. This is a new contract type evaluated during `ksc check`.

**Diagnostic for missing location:**

```
src/domain/entities — error KS70010: Derived location 'src/domain/entities' does not exist.
  Expected directory for member 'entities' of DomainLayer (derived from root 'src').
```

### When it runs

Existence checking runs as part of the check pipeline, after classification and path derivation, before contract evaluation. This means:

1. Classify AST → extract Kind definitions, instances, contracts
2. **Derive paths** → walk Kind tree, compute absolute paths from root + member names
3. **Check existence** → verify each derived path is a real directory
4. Check contracts → noDependency, purity, etc. (only on paths that exist)

### Severity

Missing locations could be:

- **Error** (default) — `ksc check` fails. You declared structure that doesn't exist.
- **Warning** (via config or flag) — for greenfield projects where directories haven't been created yet.

---

## How Standalone Members (Axis 2) Work

### Members are typed values

A member is a `const` with its Kind type. It carries sub-structure but not location:

```typescript
const domain: DomainLayer = {
  entities: {},
  ports: {},
};
```

This is a real TypeScript value. TypeScript checks that `domain` satisfies `DomainLayer`'s member requirements (has `entities` of type `EntitiesModule`, has `ports` of type `PortsModule`).

### Composition into parent

The `locate` call receives members as properties of its config object:

```typescript
export const app = locate<CleanContext>("src", {
  domain,          // ← standalone const
  application: {}, // ← inline (also fine for leaves)
  infrastructure: {},
});
```

Both standalone references and inline objects work. The classifier resolves both.

### What the classifier does with references

When the classifier encounters a member property whose value is an identifier (not an object literal), it resolves it:

1. Look up the identifier in the current file's variable declarations
2. Find its type annotation (e.g., `DomainLayer`)
3. Look up `DomainLayer` in `kindDefs`
4. Read the initializer's object properties for sub-member assignments
5. Build the ArchSymbol tree with the correct `kindTypeName`

This is a new capability — today the classifier only handles inline object literals. The change adds a variable-resolution pass to Phase 2.

### Why standalone matters

1. **Reuse.** The same `domain` definition can be used across multiple contexts or in tests.

2. **Readability.** Complex nested structure is defined once, named, and composed — instead of deeply nested inline objects.

3. **Type identity.** `const domain: DomainLayer` carries the Kind type as a first-class annotation. The classifier reads it directly — no need to infer Kind type from the parent's type alias definition.

4. **Incremental definition.** A large architecture can be built bottom-up:

```typescript
const entities: EntitiesModule = {};
const ports: PortsModule = {};
const domain: DomainLayer = { entities, ports };
const application: ApplicationLayer = {};
const infrastructure: InfrastructureLayer = {};

export const app = locate<CleanContext>("src", {
  domain,
  application,
  infrastructure,
});
```

Each piece is independently typed, testable, and composable.

---

## What Changes in the Codebase

### Runtime (`src/runtime/`)

**New file: `locate.ts`**

```typescript
export function locate<T extends Kind>(root: string, members: MemberMap<T>): MemberMap<T> {
  return members;
}
```

**Modified: `kind.ts`**

`Kind<N>` stays the same. Add `MemberMap<T>` mapped type.

**Modified: `define-contracts.ts`**

No change needed — `defineContracts` already uses the same pattern (`<T>` type arg as classifier hint).

### Domain (`src/domain/`)

**Modified: `arch-symbol.ts`**

```typescript
export class ArchSymbol {
  constructor(
    public readonly name: string,
    public readonly kind: ArchSymbolKind,    // simplified to Kind | Instance | Member
    public readonly declaredLocation?: string,
    public readonly members: Map<string, ArchSymbol> = new Map(),
    public readonly contracts: ContractReference[] = [],
    public readonly kindTypeName?: string,   // NEW: "DomainLayer", "PortsLayer", etc.
    public readonly locationDerived?: boolean, // NEW: true if path was derived, not explicit
  ) {}
}
```

**Modified: `arch-symbol-kind.ts`**

```typescript
export enum ArchSymbolKind {
  Kind = 'kind',         // A Kind definition
  Instance = 'instance', // A locate<T>() call
  Member = 'member',     // A member within an instance
}
```

Drop `Layer`, `Module`, `Context`, `Port`, `Adapter` (dead code). The real identity is `kindTypeName`.

**New: `diagnostic.ts` factory method**

```typescript
static locationNotFound(
  derivedPath: string,
  memberName: string,
  kindTypeName: string,
  rootLocation: string,
): Diagnostic {
  return new Diagnostic(
    `Derived location '${derivedPath}' does not exist. ` +
    `Expected directory for member '${memberName}' of ${kindTypeName} ` +
    `(derived from root '${rootLocation}').`,
    70010,
    derivedPath,
    0, 0,
  );
}
```

### Application (`src/application/`)

**Modified: `classify-ast.service.ts`**

Phase 2 changes:

1. **Recognize `locate<T>(root, members)` calls** — new recognition path alongside the existing `const app: CleanContext = { ... }` path.

2. **Walk the Kind definition tree** — when processing a `locate<CleanContext>("src", { ... })`, use `kindDefs` to get `CleanContext`'s properties and their types. For each member property in the object literal, look up its Kind definition and recurse.

3. **Derive paths** — compute `declaredLocation` as `root + "/" + memberName` for each member, recursively. Don't read `location` from the literal (it's not there).

4. **Resolve variable references** — when a member's value is an identifier, look it up in a pre-built variable map. Read its type annotation and initializer.

5. **Store `kindTypeName`** — each member's ArchSymbol gets its Kind type name from the Kind definition's property type.

**New: existence checking in `check-contracts.service.ts`**

```typescript
private checkExistence(
  symbol: ArchSymbol,
): { diagnostics: Diagnostic[]; filesAnalyzed: number } {
  const diagnostics: Diagnostic[] = [];

  for (const member of symbol.descendants()) {
    if (!member.declaredLocation) continue;
    if (!this.fsPort.directoryExists(member.declaredLocation)) {
      diagnostics.push(Diagnostic.locationNotFound(
        member.declaredLocation,
        member.name,
        member.kindTypeName ?? 'unknown',
        symbol.declaredLocation ?? '',
      ));
    }
  }

  return { diagnostics, filesAnalyzed: 0 };
}
```

This runs automatically for every instance — no user-declared contract needed. The Kind definition implies the existence requirement.

### Stdlib Packages

**Before (what packages export today):**

```typescript
// packages/clean-architecture/index.ts
interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig { ... }
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig { ... }

export type DomainLayer = Kind<"DomainLayer">;
export type CleanContext = Kind<"CleanContext", { ... }>;
// etc.
```

Packages inline `Kind`, `ContractConfig`, and `defineContracts` because they can't import from `kindscript` (not a runtime dependency). This works for the classifier since it reads AST structure, not resolved imports.

**After:**

Same pattern. Packages inline `Kind`, `MemberMap`, `locate`, `defineContracts`. The classifier recognizes them by AST shape, not import path. No change to the package distribution model.

---

## Legacy Syntax

The old `const app: CleanContext = { kind: "CleanContext", location: "src", ... }` syntax has been **fully removed**. All instances must use `locate<T>(root, members)`. All fixtures have been migrated.

---

## Examples: Full Architecture Files

### Simple (clean architecture from package)

```typescript
import { CleanContext, cleanArchContracts } from '@kindscript/clean-architecture';
import { locate } from 'kindscript';

export const app = locate<CleanContext>("src", {
  domain: {},
  application: {},
  infrastructure: {},
});
```

5 lines. The package carries the Kind definitions, the contracts, and the structural constraints. The user says where.

### With sub-structure

```typescript
import { Kind, locate, defineContracts } from 'kindscript';

type EntitiesModule = Kind<"EntitiesModule">;
type PortsModule = Kind<"PortsModule">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;
  ports: PortsModule;
}>;

type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}>;

const domain: DomainLayer = {
  entities: {},
  ports: {},
};

export const app = locate<AppContext>("src", {
  domain,
  application: {},
  infrastructure: {},
});

export const contracts = defineContracts<AppContext>({
  noDependency: [
    ["domain", "infrastructure"],
    ["domain", "application"],
  ],
  purity: ["domain"],
});
```

### Multi-instance

```typescript
import { CleanContext, cleanArchContracts } from '@kindscript/clean-architecture';
import { locate } from 'kindscript';

export const ordering = locate<CleanContext>("src/ordering", {
  domain: {},
  application: {},
  infrastructure: {},
});

export const billing = locate<CleanContext>("src/billing", {
  domain: {},
  application: {},
  infrastructure: {},
});
```

### With path override

```typescript
import { Kind, locate } from 'kindscript';

type ValueObjectsModule = Kind<"ValueObjectsModule">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type DomainLayer = Kind<"DomainLayer", {
  valueObjects: ValueObjectsModule;
}>;

type MyContext = Kind<"MyContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}>;

const domain: DomainLayer = {
  valueObjects: { path: "value-objects" },  // override: ./value-objects instead of ./valueObjects
};

export const app = locate<MyContext>("src", {
  domain,
  infrastructure: {},
});

// Derived: src/domain/value-objects/ (not src/domain/valueObjects/)
```

---

## What `ksc check` Reports

Given the simple clean architecture example with root `"src"`:

```
$ ksc check

Checking app (CleanContext) rooted at src/...

  Deriving locations:
    domain         → src/domain/
    application    → src/application/
    infrastructure → src/infrastructure/

  Checking existence:
    ✓ src/domain/
    ✓ src/application/
    ✗ src/infrastructure/     ← KS70010: directory does not exist

  Checking contracts:
    ✓ noDependency(domain → infrastructure)
    ✓ noDependency(domain → application)
    ✓ noDependency(application → infrastructure)
    ✓ purity(domain)

1 error found.
```

---

## Summary of Decisions

| Decision | Choice |
|---|---|
| Where member paths come from | Derived from root + member name (Axis 1) |
| How members are declared | Standalone typed constants, composed into parent (Axis 2) |
| Whether locations are validated | Yes — missing directories are errors (Axis 3) |
| Root location syntax | `locate<T>(root, members)` |
| Member name → path convention | Identity (member name = directory name) |
| Path override mechanism | `{ path: "override" }` per member per instance |
| `kind` discriminant | Gone from member instances; retained on root via type arg |
| `ArchSymbolKind` enum | Simplified to `Kind`, `Instance`, `Member` |
| Member Kind identity | Carried as `kindTypeName` on ArchSymbol, derived from Kind definition |
| Legacy syntax | Removed — all instances use `locate<T>()` |

---

## Implementation Plan

### Guiding Principles

1. **Piece at a time.** Each step is independently testable, committable, and does not break the existing test suite.
2. **Test-first with notebooks.** Each step has a Jupyter notebook (`notebooks/impl/NN-*.ipynb`) that exercises the change in isolation before wiring it into the full pipeline.
3. **Clean migration.** The legacy `const: T = { ... }` syntax was removed. All fixtures and packages use `locate<T>()` exclusively.
4. **Domain first, then application, then runtime/packages.** Changes flow inward-out following clean architecture.

### Dependency Graph

```
Step 1 ─── domain entity changes (ArchSymbol, ArchSymbolKind, DiagnosticCode)
  │
  ├── Step 2 ─── kindTypeName wiring in classifier (Phase 2)
  │     │
  │     └── Step 3 ─── locate<T>() recognition in classifier (new Phase 2 path)
  │           │
  │           ├── Step 4 ─── path derivation (Kind-tree walker)
  │           │     │
  │           │     └── Step 5 ─── variable reference resolution (Axis 2)
  │           │           │
  │           │           └── Step 6 ─── path override mechanism ({ path: "..." })
  │           │
  │           └── Step 7 ─── existence checking (Axis 3)
  │
  └── Step 8 ─── runtime API (locate, MemberMap) + public exports
        │
        └── Step 9 ─── stdlib package updates (clean-arch, hexagonal, onion)
              │
              └── Step 10 ─── integration test fixtures + E2E validation
```

Steps 1–7 are the core compiler changes. Steps 8–10 are the user-facing API and packages. Steps 3–6 form the critical path for the `locate<T>()` feature.

---

### Step 1: Domain Entity Changes

**Goal:** Add `kindTypeName` and `locationDerived` to `ArchSymbol`, simplify `ArchSymbolKind`, add `LocationNotFound` diagnostic code.

**Files changed:**

| File | Change |
|---|---|
| `src/domain/types/arch-symbol-kind.ts` | Add `Member = 'member'`. Keep `Layer`, `Module`, `Context`, `Port`, `Adapter` as **deprecated aliases** for now (remove in Step 10). |
| `src/domain/entities/arch-symbol.ts` | Add optional `kindTypeName?: string` and `locationDerived?: boolean` constructor params. |
| `src/domain/constants/diagnostic-codes.ts` | Add `LocationNotFound: 70010`. |
| `src/domain/entities/diagnostic.ts` | Add `static locationNotFound(...)` factory method. |

Legacy enum variants (`Layer`, `Module`, `Context`, `Port`, `Adapter`) have been removed. The enum now has only `Kind`, `Instance`, `Member`.

**Notebook:** `notebooks/impl/01-domain-entities.ipynb`
- Construct `ArchSymbol` with `kindTypeName` and `locationDerived`
- Verify `toString()` includes the new fields
- Construct `Diagnostic.locationNotFound()` and verify its message format
- Verify `ArchSymbolKind.Member` exists alongside legacy variants

**Validation:** `npm test` — all existing tests pass (new fields are optional, defaults unchanged).

---

### Step 2: Wire kindTypeName in Existing Classifier

**Goal:** Make Phase 2 of `ClassifyASTService` look up each member's Kind type from `KindDefinition.properties[].typeName` and store it as `kindTypeName` on the member `ArchSymbol`.

**This is the prerequisite for everything else.** Today, Phase 1 extracts `properties: [{ name: 'domain', typeName: 'DomainLayer' }]` but Phase 2 never reads `typeName`. This step wires that data through.

**Files changed:**

| File | Change |
|---|---|
| `src/application/use-cases/classify-ast/classify-ast.service.ts` | In `classifyInstance()`: look up `kindDef.properties` to find each member's `typeName`. Pass it to `extractMemberSymbol()`. Store on the `ArchSymbol` constructor. |
| `src/infrastructure/adapters/testing/mock-ast.adapter.ts` | No change needed — already supports `typeName` in properties. |
| `tests/unit/classify-ast.service.test.ts` | Add assertions that member `ArchSymbol`s have correct `kindTypeName`. |

**Key code change in `classifyInstance()`:**

```typescript
// Today (line ~165):
for (const prop of objProps) {
  if (prop.name === 'kind' || prop.name === 'location') continue;
  // ... creates ArchSymbol with ArchSymbolKind.Layer, no kindTypeName

// After:
for (const prop of objProps) {
  if (prop.name === 'kind' || prop.name === 'location') continue;
  const memberKindDef = kindDef.properties.find(p => p.name === prop.name);
  const memberKindTypeName = memberKindDef?.typeName;
  // ... creates ArchSymbol with kindTypeName set
```

**Notebook:** `notebooks/impl/02-kindtypename-wiring.ipynb`
- Set up MockASTAdapter with a Kind definition that has typed properties
- Run the classifier
- Assert that member ArchSymbols have `kindTypeName` set
- Test nested members (DomainLayer > EntitiesModule) — both levels should get kindTypeName

**Validation:** `npm test` — existing tests still pass; new assertions verify kindTypeName.

---

### Step 3: Recognize `locate<T>()` Calls

**Goal:** Add a new recognition path in the classifier for `locate<T>(root, members)` call expressions, parallel to the existing `defineContracts<T>()` recognition.

**Files changed:**

| File | Change |
|---|---|
| `src/application/use-cases/classify-ast/classify-ast.service.ts` | In the Phase 2 loop: when a variable's initializer is a call expression with name `locate`, extract type arg (Kind name), first arg (root string), second arg (member object). Build ArchSymbol tree. |
| `src/application/ports/ast.port.ts` | No change — `getCallExpressionName`, `getCallTypeArgumentNames`, `getCallArguments` already exist. |
| `src/infrastructure/adapters/testing/mock-ast.adapter.ts` | Add `withLocateCall()` helper method for tests (mirrors `withDefineContractsCall()`). |
| `tests/unit/classify-ast.service.test.ts` | New test group: "locate<T>() recognition". |

**What the classifier does with `locate<CleanContext>("src", { ... })`:**

1. Detects call expression with name `locate`
2. Reads type arg `CleanContext` → looks up in `kindDefs`
3. Reads first arg `"src"` → root location
4. Reads second arg (object literal) → member assignments
5. Creates an Instance `ArchSymbol` with `declaredLocation: "src"`, `kindTypeName: "CleanContext"`
6. For now: creates member ArchSymbols from the object literal using the existing `extractMemberSymbol` logic (path derivation comes in Step 4)

**Notebook:** `notebooks/impl/03-locate-recognition.ipynb`
- Set up a Kind definition + locate call in the mock AST
- Run the classifier
- Assert that an Instance symbol is created with the root location
- Assert that member symbols are created (locations still come from existing logic for now)
- Assert that `kindTypeName` is set on the instance

**Validation:** `npm test` — existing tests pass; locate tests pass with basic member handling.

---

### Step 4: Path Derivation (Kind-Tree Walker)

**Goal:** When processing a `locate<T>()` call, derive member paths from root + member name instead of reading `location` from the object literal.

**This is the core of Axis 1.** The classifier walks the Kind definition tree and derives `declaredLocation` as `parentLocation + "/" + memberName` at each level.

**Files changed:**

| File | Change |
|---|---|
| `src/application/use-cases/classify-ast/classify-ast.service.ts` | New private method: `classifyLocateInstance(callNode, kindDefs, projectRoot)`. Walks the Kind definition's property list, derives paths recursively, creates ArchSymbol tree with `locationDerived: true`. |

**The Kind-tree walk algorithm:**

```
deriveMembers(kindDef, parentPath, memberObj, projectRoot):
  for each property in kindDef.properties:
    memberPath = parentPath + "/" + property.name
    resolvedPath = resolveLocation(memberPath, projectRoot)

    // Get member's Kind definition (for recursion)
    childKindDef = kindDefs.get(property.typeName)

    // Get member's value from the object literal (for sub-members)
    memberValue = objectProperties[property.name]

    // Recurse if child has properties
    childMembers = childKindDef?.properties.length > 0
      ? deriveMembers(childKindDef, memberPath, memberValue, projectRoot)
      : new Map()

    yield ArchSymbol(property.name, Member, resolvedPath, childMembers, [], property.typeName, true)
```

**Notebook:** `notebooks/impl/04-path-derivation.ipynb`
- Set up `CleanContext` Kind with DomainLayer > (EntitiesModule, PortsModule)
- Set up `locate<CleanContext>("src", { domain: { entities: {}, ports: {} }, ... })`
- Run classifier
- Assert derived paths: `src/domain`, `src/domain/entities`, `src/domain/ports`, `src/application`, `src/infrastructure`
- Assert all member symbols have `locationDerived: true`
- Assert `kindTypeName` propagates correctly at every level

**Validation:** `npm test` — existing tests pass (they use the legacy path); new tests validate derivation.

---

### Step 5: Variable Reference Resolution (Axis 2)

**Goal:** When a member's value in the `locate(...)` object literal is an identifier (not an object literal), resolve it to its variable declaration and read its type/initializer.

**Files changed:**

| File | Change |
|---|---|
| `src/application/ports/ast.port.ts` | Add `isIdentifier(node): boolean` and `getIdentifierName(node): string | undefined` to `ASTNodePort`. |
| `src/infrastructure/adapters/ast/ast.adapter.ts` | Implement `isIdentifier` and `getIdentifierName` using `ts.isIdentifier`. |
| `src/infrastructure/adapters/testing/mock-ast.adapter.ts` | Add `MockIdentifierNode` type and implement the new methods. Add `withStandaloneVariable()` helper. |
| `src/application/use-cases/classify-ast/classify-ast.service.ts` | In `classifyLocateInstance()`: before processing a member's value, check if it's an identifier. If so, look up the variable in a pre-built map of file-scope variables (built during Phase 2's first pass). Read its type annotation (to get kindTypeName) and its initializer (to get sub-member assignments). |

**Variable resolution flow:**

```
locate<CleanContext>("src", { domain, application: {}, infrastructure: {} })
                              ^^^^^^
                              identifier → resolve to:
                                const domain: DomainLayer = { entities: {}, ports: {} }
                                       ^^^^^^^^^^^          ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       type annotation      initializer (sub-members)
```

**Pre-built variable map:** During the Phase 2 scan, build a `Map<string, { typeName: string, initializer: ASTNode }>` from all variable declarations in the current file. When an identifier is encountered in a locate call, look it up.

**Notebook:** `notebooks/impl/05-variable-resolution.ipynb`
- Set up standalone variable: `const domain: DomainLayer = { entities: {}, ports: {} }`
- Set up locate call referencing it: `locate<CleanContext>("src", { domain, ... })`
- Run classifier
- Assert that `domain` member gets `kindTypeName: "DomainLayer"` from the variable's type annotation
- Assert sub-members (`entities`, `ports`) are correctly derived
- Test mixed: some members standalone, some inline

**Validation:** `npm test` — all tests pass.

---

### Step 6: Path Override Mechanism

**Goal:** Support `{ path: "value-objects" }` syntax in member object literals to override the default memberName→path convention.

**Files changed:**

| File | Change |
|---|---|
| `src/application/use-cases/classify-ast/classify-ast.service.ts` | In `classifyLocateInstance()` / the Kind-tree walker: when processing a member's object literal, check for a `path` property. If present, use its string value instead of the member name as the directory segment. |

**Override detection:**

```typescript
// In the Kind-tree walker:
const pathOverride = memberObjProps.find(p => p.name === 'path');
const segment = pathOverride
  ? this.astPort.getStringValue(pathOverride.value) ?? property.name
  : property.name;
const memberPath = parentPath + "/" + segment;
```

**Notebook:** `notebooks/impl/06-path-override.ipynb`
- Set up Kind with `valueObjects: ValueObjectsModule`
- Set up instance with `valueObjects: { path: "value-objects" }`
- Run classifier
- Assert derived path is `src/domain/value-objects` (not `src/domain/valueObjects`)
- Test without override — confirm default behavior
- Test override with sub-members — ensure children derive from overridden path

**Validation:** `npm test` — all tests pass.

---

### Step 7: Location Existence Checking (Axis 3)

**Goal:** After path derivation, verify that every derived location exists as a directory on the filesystem.

**Files changed:**

| File | Change |
|---|---|
| `src/application/use-cases/check-contracts/check-contracts.service.ts` | Add `checkExistence(symbol)` private method. Called for every Instance symbol before contract evaluation. Uses `this.fsPort.directoryExists()`. Creates `Diagnostic.locationNotFound()` for missing paths. |
| `src/application/use-cases/check-contracts/check-contracts.request.ts` or types | Optionally: add `checkExistence?: boolean` flag to request (default `true` for locate-based, `false` for legacy). |
| `tests/unit/check-contracts.service.test.ts` | New test group: "existence checking". |

**When it runs:** After the contract validation loop, iterate all Instance symbols. For each member with `locationDerived: true`, check `fsPort.directoryExists(member.declaredLocation)`. This is a structural check, not a contract — it runs automatically for locate-based instances.

**Notebook:** `notebooks/impl/07-existence-checking.ipynb`
- Create ArchSymbol tree with derived locations
- Mock FileSystemPort: some directories exist, some don't
- Run the check
- Assert diagnostics for missing directories
- Assert no diagnostics for existing directories
- Assert diagnostic message format matches design (KS70010)

**Validation:** `npm test` — all tests pass.

---

### Step 8: Runtime API (`locate`, `MemberMap`)

**Goal:** Add the `locate` function and `MemberMap` type to the runtime package. Export them from the public API.

**Files changed:**

| File | Change |
|---|---|
| `src/runtime/locate.ts` | **New file.** Export `locate<T>(root, members)` identity function and `MemberMap<T>` mapped type. |
| `src/runtime/kind.ts` | No change to `Kind<N>` type alias. |
| `src/index.ts` | Add `export { locate, MemberMap } from './runtime/locate'`. |

**`locate.ts` content:**

```typescript
import { Kind } from './kind';

/** Strips kind/location, maps members to MemberMap or empty object. */
export type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};

/**
 * Declare an instance of a Kind at a root location.
 *
 * At runtime this is an identity function. The classifier reads
 * the type argument and root string from the AST.
 */
export function locate<T extends Kind>(
  root: string,
  members: MemberMap<T>
): MemberMap<T> {
  return members;
}
```

**Notebook:** `notebooks/impl/08-runtime-api.ipynb`
- Import `Kind`, `locate`, `MemberMap` from the runtime
- Define a Kind type alias
- Use `locate<T>()` — verify TypeScript catches missing members, extra members, wrong nesting
- Verify `{ path: "override" }` is accepted by the type
- Verify `{}` is accepted for members without sub-members

**Validation:** `npm run build` (type checking); `npm test`.

---

### Step 9: Stdlib Package Updates

**Goal:** Update `@kindscript/clean-architecture`, `@kindscript/hexagonal`, and `@kindscript/onion` packages to inline the `locate` function and `MemberMap` type (same pattern they use for `Kind` and `defineContracts`).

**Files changed:**

| File | Change |
|---|---|
| `packages/clean-architecture/index.ts` | Add `locate` function and `MemberMap` type. Keep existing exports. |
| `packages/hexagonal/index.ts` | Same. |
| `packages/onion/index.ts` | Same. |

**No breaking changes.** The packages continue to export everything they do today. They add `locate` and `MemberMap` as new exports. Users can adopt `locate` at their own pace.

**Notebook:** `notebooks/impl/09-stdlib-packages.ipynb`
- Import from each updated package
- Use `locate<CleanContext>(...)` — verify type checking
- Use `locate<HexagonalContext>(...)` — verify type checking
- Verify legacy syntax still type-checks

**Validation:** `npm test`.

---

### Step 10: Integration Tests, Fixture Migration, and Cleanup

**Goal:** Add integration test fixtures using the new `locate<T>()` syntax. Clean up deprecated enum variants. Validate end-to-end.

**Sub-steps:**

**10a. New integration fixtures:**

| Fixture | Tests |
|---|---|
| `tests/integration/fixtures/locate-clean-arch/` | Basic locate with clean architecture |
| `tests/integration/fixtures/locate-nested/` | Nested sub-structure with path derivation |
| `tests/integration/fixtures/locate-standalone-member/` | Axis 2 — standalone typed variables |
| `tests/integration/fixtures/locate-path-override/` | Path override mechanism |
| `tests/integration/fixtures/locate-existence-violation/` | Missing directory → KS70010 |
| `tests/integration/fixtures/locate-multi-instance/` | Multiple locate calls in one file |

**10b. Enum cleanup:**

| File | Change |
|---|---|
| `src/domain/types/arch-symbol-kind.ts` | Remove `Layer`, `Module`, `Context`, `Port`, `Adapter`. Keep `Kind`, `Instance`, `Member`. |
| All test files using dead variants | Replace `ArchSymbolKind.Layer` → `ArchSymbolKind.Member`, `.Module` → `.Member`, `.Context` → `.Instance`. (~80 test assertions.) |
| `src/application/services/config-symbol-builder.ts` | Update to use `ArchSymbolKind.Member`. |

**10c. Fixture migration:**

All fixtures migrated to `locate<T>()` syntax. Legacy `const: T = { ... }` path removed.

**Notebook:** `notebooks/impl/10-integration-validation.ipynb`
- Summarize all changes made across Steps 1–9
- Show before/after of a complete architecture.ts file
- Demonstrate the full `ksc check` flow on a locate-based fixture
- Confirm all fixtures use locate<T>() syntax

**Validation:** Full test suite: `npm test`, integration tests, E2E tests.

---

### Step Summary

| Step | What | Key Files | Depends On | Risk |
|---|---|---|---|---|
| 1 | Domain entity changes | arch-symbol.ts, arch-symbol-kind.ts, diagnostic.ts, diagnostic-codes.ts | — | Low |
| 2 | kindTypeName wiring | classify-ast.service.ts | 1 | Low |
| 3 | locate() recognition | classify-ast.service.ts, mock-ast.adapter.ts | 2 | Medium |
| 4 | Path derivation | classify-ast.service.ts | 3 | Medium |
| 5 | Variable resolution | ast.port.ts, ast.adapter.ts, classify-ast.service.ts | 4 | Medium |
| 6 | Path override | classify-ast.service.ts | 4 | Low |
| 7 | Existence checking | check-contracts.service.ts | 1 | Low |
| 8 | Runtime API | locate.ts, index.ts | — | Low |
| 9 | Stdlib packages | packages/*/index.ts | 8 | Low |
| 10 | Integration + cleanup | fixtures, tests, enum cleanup | All | Medium |

**Parallelizable:** Steps 7 and 8 can run in parallel with Steps 4–6. Step 9 can start as soon as Step 8 is done. The critical path is 1 → 2 → 3 → 4 → 5 → 10.

---

## Implementation Progress

### Step 1: Domain Entity Changes — DONE

**Changes made:**
- `src/domain/types/arch-symbol-kind.ts` — Added `Member = 'member'` variant
- `src/domain/entities/arch-symbol.ts` — Added `kindTypeName?: string` and `locationDerived?: boolean` constructor params
- `src/domain/constants/diagnostic-codes.ts` — Added `LocationNotFound: 70010`
- `src/domain/entities/diagnostic.ts` — Added `static locationNotFound()` factory method

**Tests:** 405/405 pass. All existing tests unaffected (new params are optional).

### Step 2: Wire kindTypeName in Existing Classifier — DONE

**Changes made:**
- `src/application/use-cases/classify-ast/classify-ast.service.ts` — In `classifyInstance()`: look up `kindDef.properties` to find each member's `typeName`, pass to `extractMemberSymbol()`. Both methods now propagate `kindTypeName` and `kindDefs` through recursion.
- `tests/unit/classify-ast.service.test.ts` — Added 2 tests: "sets kindTypeName on instance and member symbols" and "sets kindTypeName on deeply nested members"

**Tests:** 407/407 pass.

### Step 3: Recognize locate<T>() Calls — DONE (merged with Step 4)

**Changes made:**
- `src/infrastructure/adapters/testing/mock-ast.adapter.ts` — Added `withLocateCall()` method
- `src/application/use-cases/classify-ast/classify-ast.service.ts` — Added locate detection in Phase 2 loop, `classifyLocateInstance()` method, `deriveMembers()` method for recursive Kind-tree walking
- `tests/unit/classify-ast.service.test.ts` — Added 6 locate tests: basic recognition, path derivation, nested members, Member kind, defineContracts integration, error handling

**Tests:** 413/413 pass.

### Step 4: Path Derivation (Kind-Tree Walker) — DONE

Implemented as part of Step 3. The `deriveMembers()` method walks the Kind definition tree and derives paths as `parentPath + "/" + memberName`. All members get `locationDerived: true` and `ArchSymbolKind.Member`.

### Step 5: Variable Reference Resolution (Axis 2) — DONE

**Changes made:**
- `src/application/ports/ast.port.ts` — Added `isIdentifier()` and `getIdentifierName()` to `ASTNodePort`
- `src/infrastructure/adapters/ast/ast.adapter.ts` — Implemented `isIdentifier()`, `getIdentifierName()`, added `ShorthandPropertyAssignment` handling in `getObjectProperties()`
- `src/infrastructure/adapters/testing/mock-ast.adapter.ts` — Added `MockIdentifierNode` type, `static identifier()` factory, implemented new methods
- `src/application/use-cases/classify-ast/classify-ast.service.ts` — Added varMap building (pre-scan of variable declarations), updated `deriveMembers()` to resolve identifier references
- `tests/unit/classify-ast.service.test.ts` — Added 2 tests: standalone variable resolution, mixed standalone/inline

**Tests:** 415/415 pass.

### Step 6: Path Override Mechanism — DONE

**Changes made:**
- `src/application/use-cases/classify-ast/classify-ast.service.ts` — In `deriveMembers()`: check for `path` property in member object literal before computing path segment
- `tests/unit/classify-ast.service.test.ts` — Added 1 test: path override via `{ path: "value-objects" }`

**Tests:** 416/416 pass.

### Step 7: Location Existence Checking (Axis 3) — DONE

**Changes made:**
- `src/application/use-cases/check-contracts/check-contracts.service.ts` — Added existence checking loop after contract validation, added `checkExistence()` private method iterating descendants with `locationDerived === true`
- `tests/unit/check-contracts.service.test.ts` — Added 3 tests: missing location diagnostic, existing location OK, skips non-derived members

**Tests:** 419/419 pass.

### Step 8: Runtime API (locate, MemberMap) — DONE

**Changes made:**
- `src/runtime/locate.ts` — **New file.** `MemberMap<T>` mapped type and `locate<T>()` identity function
- `src/index.ts` — Added `export { locate, MemberMap } from './runtime/locate'`
- Type check: `npx tsc --noEmit` clean (no errors)

**Tests:** 419/419 pass.

### Step 9: Stdlib Package Updates — DONE

**Changes made:**
- `packages/clean-architecture/index.ts` — Added `locate` and `MemberMap` imports/re-exports from `kindscript`
- `packages/hexagonal/index.ts` — Same
- `packages/onion/index.ts` — Same

**Tests:** 419/419 pass. Type check clean.

### Step 10: Integration Tests — DONE

**Changes made:**
- `tests/integration/fixtures/locate-clean-arch/` — New fixture: locate syntax with clean architecture, no violations
- `tests/integration/fixtures/locate-violation/` — New fixture: locate syntax with forbidden dependency violation
- `tests/integration/fixtures/locate-existence/` — New fixture: locate syntax with missing derived directory
- `tests/integration/tier2-locate.integration.test.ts` — 5 integration tests covering full classify→check pipeline with locate syntax

**Tests:** 424/424 pass (419 unit + 5 new integration).

**Enum cleanup complete.** Legacy `ArchSymbolKind.Layer`, `.Module`, `.Context`, `.Port`, `.Adapter` variants have been removed. The legacy classifier path (`const: T = { ... }` syntax) has also been removed. All instances use `locate<T>()` exclusively, producing `ArchSymbolKind.Member`.
