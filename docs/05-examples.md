# Examples

> Real-world architectural patterns modeled in KindScript.

---

## Clean Architecture

The canonical example — a three-layer architecture with strict dependency direction:

```typescript
import type { Kind, Instance } from 'kindscript';

// Layer kinds
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Context kind with constraints
type OrderingContext = Kind<"OrderingContext", {
  domain: DomainLayer;
  application: ApplicationLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [
    ["domain", "infrastructure"],   // domain cannot import from infrastructure
    ["domain", "application"],      // domain cannot import from application
  ];
  mustImplement: [["domain", "infrastructure"]];  // every port has an adapter
  noCycles: ["domain", "application", "infrastructure"];
  filesystem: {
    exists: ["domain", "application", "infrastructure"];
  };
}>;

// Instance — root derived from this file's directory
export const ordering = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<OrderingContext>;
```

**Filesystem:**
```
src/
  context.ts              # Kind definition + instance
  domain/
    entities/
    ports/
  application/
    use-cases/
  infrastructure/
    adapters/
```

**What KindScript checks:**
- `domain/` files cannot import from `infrastructure/` or `application/` (KS70001)
- The `domain/` layer is pure — no `fs`, `http`, or other Node.js built-in imports (KS70003)
- Every interface exported from `domain/` has a class implementing it in `infrastructure/` (KS70002)
- No circular import chains between the three layers (KS70004)
- All three member directories exist on disk (KS70010)

---

## Bounded Contexts (Multi-Instance)

Multiple instances of the same Kind enforce the same rules in different parts of the codebase:

```typescript
// src/ordering/ordering.ts
import type { Instance } from 'kindscript';
import type { CleanContext } from '../shared/kinds';

export const ordering = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<CleanContext>;

// src/billing/billing.ts
import type { Instance } from 'kindscript';
import type { CleanContext } from '../shared/kinds';

export const billing = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<CleanContext>;
```

**Filesystem:**
```
src/
  shared/
    kinds.ts              # Shared Kind definitions
  ordering/
    ordering.ts           # Instance → root is src/ordering/
    domain/
    application/
    infrastructure/
  billing/
    billing.ts            # Instance → root is src/billing/
    domain/
    application/
    infrastructure/
```

Each instance is checked independently. A violation in `src/ordering/domain/` doesn't affect `src/billing/`.

---

## Design System (Atomic Design)

A React design system following the Atomic Design hierarchy — atoms, molecules, organisms, pages:

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
    // Atoms: leaf nodes — depend on nothing above
    ["atoms", "molecules"], ["atoms", "organisms"], ["atoms", "pages"],
    // Molecules: can use atoms, nothing above
    ["molecules", "organisms"], ["molecules", "pages"],
    // Organisms: can use atoms + molecules, not pages
    ["organisms", "pages"],
  ];
}>;

export const ui = {
  atoms: {},
  molecules: {},
  organisms: {},
  pages: {},
} satisfies Instance<DesignSystem>;
```

**Filesystem:**
```
src/
  context.ts
  atoms/
    Button.tsx
    Input.tsx
    Icon.tsx
  molecules/
    Card.tsx
    FormField.tsx
  organisms/
    LoginForm.tsx
    ReleasesManager.tsx
  pages/
    DashboardPage.tsx
    SettingsPage.tsx
```

**What KindScript catches:**
- An atom importing from an organism → KS70001 (`atoms -> organisms`)
- A molecule importing from a page → KS70001 (`molecules -> pages`)

Atomic Design dependency rules typically live in documentation and PR review. KindScript moves them to the compiler. You can extend this further with additional members (e.g., `core`, `mocks`) and constraints like `filesystem.exists` as your design system grows.

---

## Nested Architecture (Page Internals)

Mature pages have internal layered architecture that can also be enforced:

```typescript
type UIModule = Kind<"UIModule">;
type DomainModule = Kind<"DomainModule">;
type DataModule = Kind<"DataModule">;
type TypesModule = Kind<"TypesModule">;

type PageArchitecture = Kind<"PageArchitecture", {
  ui: UIModule;
  domain: DomainModule;
  data: DataModule;
  types: TypesModule;
}, {
  noDependency: [
    ["types", "ui"], ["types", "domain"], ["types", "data"],
    ["data", "ui"], ["data", "domain"],
    ["domain", "ui"],
  ];
}>;
```

**Filesystem:**
```
pages/DashboardPage/
  context.ts
  ui/           → presentation layer (depends on domain/, atoms, molecules)
  domain/       → business logic hooks + context (depends on data/, types/)
  data/         → React Query hooks (depends on types/)
  types/        → type definitions (standalone)
```

This enforces the flow `ui -> domain -> data -> types` within a single page.

---

## Test-Code Mirroring

Ensure every component has a corresponding test file:

```typescript
type SourceLayer = Kind<"SourceLayer">;
type TestLayer = Kind<"TestLayer">;

type TestedProject = Kind<"TestedProject", {
  components: SourceLayer;
  tests: TestLayer;
}, {
  filesystem: {
    mirrors: [["components", "tests"]];
  };
}>;

export const project = {
  components: {},
  tests: {},
} satisfies Instance<TestedProject>;
```

**Filesystem:**
```
src/
  context.ts
  components/
    Button.tsx
    Input.tsx
    Card.tsx
  tests/
    Button.test.tsx     ✓ mirrors Button.tsx
    Input.test.tsx      ✓ mirrors Input.tsx
                        ✗ Card.test.tsx missing → KS70005
```

---

## Full-System Modeling (Monorepo)

For a monorepo with multiple applications, define separate Kinds for each app and shared packages:

```typescript
type FrontendApp = Kind<"FrontendApp", {
  components: ComponentsLayer;
  services: ServicesLayer;
  hooks: HooksLayer;
}, {
  noDependency: [["components", "services"]];
}>;

type BackendApp = Kind<"BackendApp", {
  routes: RoutesLayer;
  lib: LibLayer;
  db: DatabaseLayer;
}, {
  noDependency: [["lib", "routes"]];
}>;

// Each app gets its own instance in its directory
// apps/frontend/context.ts → root is apps/frontend/
// apps/backend/context.ts  → root is apps/backend/
```

Each application's architectural rules are independent — the frontend's dependency rules don't affect the backend, and vice versa. Shared packages can have their own Kind definitions with their own constraints.

---

## Incremental Adoption

KindScript supports gradual adoption. Start with one contract and expand:

**Step 1 — Start with existence checking:**
```typescript
type MyApp = Kind<"MyApp", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  filesystem: { exists: ["domain", "infrastructure"] };
}>;
```

**Step 2 — Add dependency rules:**
```typescript
type MyApp = Kind<"MyApp", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
  filesystem: { exists: ["domain", "infrastructure"] };
}>;
```

**Step 3 — Add purity and port/adapter completeness:**
```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

type MyApp = Kind<"MyApp", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
  mustImplement: [["domain", "infrastructure"]];
  filesystem: { exists: ["domain", "infrastructure"] };
}>;
```

Each step adds enforcement without disrupting existing code. Violations are reported as compiler errors — fix them one by one.
