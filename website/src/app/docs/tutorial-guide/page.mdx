# Tutorial: From Zero to Enforced Architecture

> A progressive walkthrough of KindScript — from first constraint to real-world modeling.
> For hands-on practice, see the [interactive notebooks](../notebooks/).

---

## Part 1: Your First Architecture

KindScript needs one file — a definition file that declares your architectural rules. Create `src/context.ts`:

```typescript
import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<CleanContext, '.'>;
```

This defines:
- **Kind types** — `DomainLayer` and `InfrastructureLayer` are leaf Kinds. `CleanContext` is a composite that groups them.
- **A constraint** — `noDependency: [["domain", "infrastructure"]]` forbids imports from `domain/` into `infrastructure/`.
- **An instance** — `satisfies Instance<CleanContext, '.'>` maps member names to directories. The second type parameter (`'.'`) is the location path — `'.'` means "this file's directory is the root". With root at `src/`, `domain` maps to `src/domain/`, `infrastructure` maps to `src/infrastructure/`.

All KindScript APIs are pure types — zero runtime footprint. Definition files are auto-discovered; no config file needed.

### Check

```
$ ksc check
All architectural contracts satisfied. (1 contracts, 2 files)
```

### Break a rule

Now add a forbidden import in `src/domain/service.ts`:

```typescript
import { Database } from '../infrastructure/database';
```

```
$ ksc check
src/domain/service.ts:2:0 - error KS70001: Forbidden dependency: domain → infrastructure
  (src/domain/service.ts → src/infrastructure/database.ts)
  Contract 'noDependency(domain -> infrastructure)' (noDependency) defined at type:CleanContext

Found 1 architectural violation(s).
```

The error tells you **where** (file and line), **what** (forbidden dependency between two layers), **which contract** caught it, and **where the contract is defined** (the Kind type).

Remove the import, run again — clean.

---

## Part 2: All Three Constraint Types

KindScript enforces three types of architectural constraints.

### noDependency — Forbidden imports (KS70001)

The most common constraint. Forbids imports from one layer to another.

```typescript
type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "infrastructure"],    // domain cannot import from infra
    ["domain", "application"],       // domain cannot import from application
  ];
}>;
```

```
src/domain/service.ts:2:0 - error KS70001: Forbidden dependency: domain → infrastructure
  (src/domain/service.ts → src/infrastructure/database.ts)
  Contract 'noDependency(domain -> infrastructure)' (noDependency) defined at type:CleanContext
```

**Fix pattern:** Dependency injection. Define interfaces in the inner layer; implement them in the outer layer.

### purity — No I/O in pure layers (KS70003)

Ensures a layer has no side effects — no `fs`, `http`, `net`, `child_process`, or any of Node's ~50 built-in I/O modules.

Purity is declared as an **intrinsic constraint** on the leaf Kind:

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
```

When a composite Kind contains a `DomainLayer` member, purity is automatically enforced for all files in that member's directory.

```
src/domain/service.ts:2:0 - error KS70003: Impure import in 'domain': 'fs'
  Contract 'purity(domain)' (purity) defined at type:AppContext
```

**Fix pattern:** Inject I/O through constructor parameters or port interfaces.

### noCycles — No circular dependencies (KS70004)

Detects circular dependency chains between layers.

```typescript
type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noCycles: ["domain", "infrastructure"];
}>;
```

```
[domain] - error KS70004: Circular dependency detected: domain → infrastructure → domain
  Contract 'noCycles(domain, infrastructure)' (noCycles) defined at type:AppContext
```

Note: Cycle errors use scope-based locations (`[domain]`) instead of file paths, because cycles are a structural (project-wide) concern.

**Fix pattern:** Break the cycle with interfaces (Dependency Inversion Principle).

### Summary

| Constraint | Code | Catches | Fix pattern |
|-----------|------|---------|-------------|
| `noDependency` | KS70001 | Forbidden imports between layers | Dependency injection |
| `purity` | KS70003 | I/O imports (`fs`, `http`, etc.) in pure layers | Inject I/O through ports |
| `noCycles` | KS70004 | Circular dependency chains | Break the cycle with interfaces |

Constraints are declared on the Kind type's third parameter. Purity can also be declared as an intrinsic on a leaf Kind (`{ pure: true }`), which propagates automatically when used as a member.

---

## Part 3: Multi-Instance Bounded Contexts

The same Kind type can be instantiated multiple times. Each instance gets its own root directory and its own set of contracts.

### Single instance

A shop project with three layers:

```typescript
type BoundedContext = Kind<"BoundedContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "application"],
    ["domain", "infrastructure"],
    ["application", "infrastructure"],
  ];
}>;

// Root: src/ (location path '.' means this file's directory)
export const shop = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<BoundedContext, '.'>;
```

### Multi-instance

Restructure into two bounded contexts — **orders** and **payments** — each with its own definition file:

```
src/
  orders/
    orders.ts          ← definition file (root: src/orders/)
    domain/
    application/
    infrastructure/
  payments/
    payments.ts        ← definition file (root: src/payments/)
    domain/
    application/
    infrastructure/
```

Both definition files share the same `BoundedContext` Kind type. Each creates a separate instance:

```typescript
// src/orders/orders.ts
export const orders = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<BoundedContext, '.'>;

// src/payments/payments.ts
export const payments = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<BoundedContext, '.'>;
```

Violations in either context are caught independently. A purity violation in `payments/domain/money.ts` is reported as:

```
src/payments/domain/money.ts:1:0 - error KS70003: Impure import in 'domain': 'crypto'
  Contract 'purity(domain)' (purity) defined at type:BoundedContext
```

**Key insight:** Same Kind type = same rules. If you need different constraints per context, use different Kind types.

---

## Part 4: Real-World Modeling — Design System

This section walks through applying KindScript to a design system following **Atomic Design** — a real-world pattern with ~300 source files.

### The architecture

Atomic Design defines a hierarchy of component complexity:

```
atoms       → pure presentational (Button, Input, Icon)
molecules   → composite UI (Card, Alert, FormField)
organisms   → domain containers (ReleasesManager, DocumentManager)
pages       → full features (DashboardPage, SettingsPage)
```

The rules: atoms can't import from molecules, organisms, or pages. Molecules can't import from organisms or pages. Organisms can't import from pages.

### First-pass model

```typescript
import type { Kind, Instance } from 'kindscript';

type Atoms = Kind<"Atoms">;
type Molecules = Kind<"Molecules">;
type Organisms = Kind<"Organisms">;
type Pages = Kind<"Pages">;

type DesignSystem = Kind<"DesignSystem", {
  atoms: Atoms;
  molecules: Molecules;
  organisms: Organisms;
  pages: Pages;
}, {
  noDependency: [
    ["atoms", "molecules"], ["atoms", "organisms"], ["atoms", "pages"],
    ["molecules", "organisms"], ["molecules", "pages"],
    ["organisms", "pages"],
  ];
}>;

export const ui = {
  atoms: {},
  molecules: {},
  organisms: {},
  pages: {},
} satisfies Instance<DesignSystem, '.'>;
```

Running `ksc check` on a compliant codebase:

```
$ ksc check
All architectural contracts satisfied. (6 contracts, 6 files)
```

Injecting a violation — an atom importing from an organism:

```
src/atoms/Button.tsx:2:0 - error KS70001: Forbidden dependency: atoms → organisms
  (src/atoms/Button.tsx → src/organisms/LoginForm.tsx)
  Contract 'noDependency(atoms -> organisms)' (noDependency) defined at type:DesignSystem

Found 1 architectural violation(s).
```

### The adoption workflow

On a real codebase, the first run often reveals violations that aren't bugs — they're places where the model doesn't match reality:

1. **ServiceProvider crosses layers.** The dependency injection composition root legitimately imports from all layers to wire them together. **Fix:** Give it its own member with no constraints.

2. **Test files import mocks.** Files like `DashboardPage.test.tsx` import mock data from `mocks/`. Tests need mock data. **Fix:** Remove the `pages → mocks` constraint.

The workflow is: **run, learn, refine, repeat.** KindScript doesn't require perfect modeling from day one. Violations reveal where the model doesn't match reality, and you iterate.

### Page internal architecture

Larger pages have their own internal layered architecture (ui, domain, data, types). You can enforce this with a **second definition file** scoped to the page:

```typescript
// src/components/Pages/DashboardPage/v1.0.0/dashboard.ts
type PageArchitecture = Kind<"PageArchitecture", {
  ui: UILayer;
  domain: DomainLayer;
  data: DataLayer;
  types: TypesLayer;
}, {
  noDependency: [
    ["types", "ui"], ["types", "domain"], ["types", "data"],
    ["data", "ui"],
    ["domain", "ui"],
  ];
}>;

export const page = {
  ui: {},
  domain: {},
  data: {},
  types: {},
} satisfies Instance<PageArchitecture, '.'>;
```

The root is inferred from the file's directory — so both the top-level design system constraints and the page-level constraints are enforced simultaneously.

### Current limitations

**Sibling isolation.** KindScript enforces boundaries *between* members, not *within* a member. It can't enforce that one organism doesn't import from another organism — they're both under the same `organisms` member. A future `isolated` constraint would address this.

### Enforcement summary

| Rule | Enforced? | How |
|------|-----------|-----|
| Atoms can't import organisms/pages | Yes | `noDependency` |
| Molecules can't import pages | Yes | `noDependency` |
| Page internal layers (types can't import ui) | Yes | Multi-instance definition file |
| Organisms can't import each other | Not yet | Needs `isolated` constraint |

---

## Part 5: Wrapped Kinds — Declaration-Level Enforcement

Structural Kinds classify **directories**. Wrapped Kinds classify **types** — individual exported declarations within a directory.

### The problem

In event-sourced systems, you might have:
- **Deciders** — pure functions that take a command and return events
- **Effectors** — side-effectful functions that react to events

Both live in the same directory. You want: "no Decider may depend on an Effector." Directories can't express this.

### The solution

A wrapped Kind associates a TypeScript type with architectural meaning by using `{ wraps: T }` in the Kind's 4th parameter:

```typescript
import type { Kind, Instance, InstanceOf } from 'kindscript';
import type { DeciderFn, EffectorFn } from './types';

type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;
type Effector = Kind<"Effector", {}, {}, { wraps: EffectorFn }>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
  effectors: Effector;
}, {
  noDependency: [["deciders", "effectors"]];
}>;

export const order = {
  deciders: {},
  effectors: {},
} satisfies Instance<OrderModule, '.'>;
```

Functions declare their role via `InstanceOf` type annotation:

```typescript
import type { InstanceOf } from 'kindscript';

export const validateOrder: InstanceOf<Decider> = (command) => {
  // ... pure decision logic
  return [{ type: 'OrderValidated', data: command }];
};

export const notifyOrder: InstanceOf<Effector> = (event) => {
  // ... side-effectful notification
  console.log('Notifying:', event.type);
};
```

The `: InstanceOf<Decider>` annotation is both the TypeScript type **and** the KindScript architectural declaration. No `satisfies`, no `register()`.

### Catching a violation

If `apply-discount.ts` (a Decider) imports from `notify-order.ts` (an Effector):

```
src/apply-discount.ts:3:0 - error KS70001: Forbidden dependency: deciders → effectors
  (src/apply-discount.ts → src/notify-order.ts)
  Contract 'noDependency(deciders -> effectors)' (noDependency) defined at type:OrderModule

Found 1 architectural violation(s).
```

**Key insight:** The binder and checker needed zero changes to support wrapped Kinds. The `resolvedFiles` abstraction hides whether a member is a directory or a typed-export group. Existing constraint plugins work unchanged.

---

## Summary

| Concept | What it does |
|---------|--------------|
| `Kind<N, Members, Constraints>` | Defines an architectural pattern with named members and constraints |
| `Kind<N, {}, C, { wraps: T }>` | Wraps a TypeScript type with architectural meaning (declaration-level) |
| `Instance<T, Path>` | Maps a structural Kind to real directories on disk (Path is the location) |
| `InstanceOf<K>` | Tags an export as an instance of a wrapped Kind |
| `noDependency` | Forbids imports between members |
| `purity` | Forbids I/O imports in pure members |
| `noCycles` | Detects circular dependencies between members |

### Learning progression

1. **Single instance** — define one context, check constraints
2. **Three constraint types** — noDependency, purity, noCycles
3. **Multi-instance** — bounded contexts sharing the same Kind type
4. **Real-world modeling** — incremental adoption, iterative refinement
5. **Wrapped Kinds** — declaration-level enforcement within a directory

### Next steps

- [Interactive notebooks](../notebooks/) — hands-on walkthroughs with runnable code
- [Kind System](02-kind-system.md) — full Kind reference (structural and wrapped)
- [Constraints](03-constraints.md) — complete constraint documentation and plugin architecture
- [Examples](05-examples.md) — more real-world modeling patterns
