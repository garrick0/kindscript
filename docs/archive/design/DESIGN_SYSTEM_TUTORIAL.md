# Enforcing a Design System with KindScript

**A walkthrough using a real production codebase**

This tutorial applies KindScript to a real React design system with 200+ source files. It demonstrates incremental adoption: start with no enforcement, add constraints, learn from violations, and refine the model.

For the interactive version, see `notebooks/05-design-system.ipynb`.

---

## The Codebase

The target is a design system following **Atomic Design** — a hierarchy of component complexity:

```
src/
├── components/
│   ├── atoms/         → pure presentational (Button, Input, Icon)
│   ├── molecules/     → composite UI (Card, Alert, Form, Sidebar)
│   ├── organisms/     → domain containers (ReleasesManager, DocumentManager)
│   └── Pages/         → full features (DashboardPage, SettingsPage)
├── core/
│   ├── auth/          → authentication infrastructure
│   └── providers/     → DI composition root (ServiceProvider)
├── common/            → shared utilities
└── mocks/             → MSW handlers for testing
```

The architectural rules exist in documentation:
- Atoms can't depend on molecules, organisms, or pages
- Molecules can't depend on organisms or pages
- Organisms can't depend on pages
- Core infrastructure is independent of UI layers
- Production code shouldn't depend on mock data

Nothing enforces these rules. Let's change that.

---

## Step 1: First Pass — Discover Violations

Write `src/context.k.ts` in the project root:

```typescript
import type { Kind, ConstraintConfig, InstanceConfig } from 'kindscript';

type AtomLayer = Kind<"AtomLayer">;
type MoleculeLayer = Kind<"MoleculeLayer">;
type OrganismLayer = Kind<"OrganismLayer">;
type PageLayer = Kind<"PageLayer">;
type CoreLayer = Kind<"CoreLayer">;
type CommonLayer = Kind<"CommonLayer">;
type MockLayer = Kind<"MockLayer">;

type DesignSystem = Kind<"DesignSystem", {
  atoms: AtomLayer;
  molecules: MoleculeLayer;
  organisms: OrganismLayer;
  pages: PageLayer;
  core: CoreLayer;
  common: CommonLayer;
  mocks: MockLayer;
}, {
  noDependency: [
    // Atoms: leaf nodes
    ["atoms", "molecules"], ["atoms", "organisms"], ["atoms", "pages"],
    // Molecules: can use atoms, nothing above
    ["molecules", "organisms"], ["molecules", "pages"],
    // Organisms: can't depend on pages
    ["organisms", "pages"],
    // Core: independent of UI layers
    ["core", "atoms"], ["core", "molecules"], ["core", "organisms"], ["core", "pages"],
    // Production code can't depend on mocks
    ["atoms", "mocks"], ["molecules", "mocks"], ["organisms", "mocks"],
    ["pages", "mocks"], ["core", "mocks"],
  ];
  filesystem: {
    exists: ["atoms", "molecules", "organisms", "pages", "core"];
  };
}>;

export const designSystem = {
  atoms:     { path: "components/atoms" },
  molecules: { path: "components/molecules" },
  organisms: { path: "components/organisms" },
  pages:     { path: "components/Pages" },
  core:      {},
  common:    {},
  mocks:     {},
} satisfies InstanceConfig<DesignSystem>;
```

Run:

```bash
ksc check .
```

This first pass found **real violations** in the codebase:

1. **ServiceProvider** (`core/providers/ServiceProvider.tsx`) imports services from organisms and pages — this is the DI composition root, which legitimately crosses layers
2. **Test/story files** inside `Pages/` import from `mocks/` — tests legitimately need mock data

These aren't bugs. They're places where our model doesn't match reality yet.

---

## Step 2: Refine the Model

Two changes:

1. **Split `core` into `providers` + `auth`** — the DI container is a composition root with special privileges. Give it its own member with no constraints. Auth keeps its UI-independence rules.

2. **Remove `pages -> mocks` constraint** — test files colocated in page directories need mock data.

Updated `src/context.k.ts`:

```typescript
import type { Kind, ConstraintConfig, InstanceConfig } from 'kindscript';

type AtomLayer = Kind<"AtomLayer">;
type MoleculeLayer = Kind<"MoleculeLayer">;
type OrganismLayer = Kind<"OrganismLayer">;
type PageLayer = Kind<"PageLayer">;
type ProvidersLayer = Kind<"ProvidersLayer">;   // DI composition root
type AuthLayer = Kind<"AuthLayer">;             // Auth infrastructure
type CommonLayer = Kind<"CommonLayer">;
type MockLayer = Kind<"MockLayer">;

type DesignSystem = Kind<"DesignSystem", {
  atoms: AtomLayer;
  molecules: MoleculeLayer;
  organisms: OrganismLayer;
  pages: PageLayer;
  providers: ProvidersLayer;
  auth: AuthLayer;
  common: CommonLayer;
  mocks: MockLayer;
}, {
  noDependency: [
    ["atoms", "molecules"], ["atoms", "organisms"], ["atoms", "pages"],
    ["molecules", "organisms"], ["molecules", "pages"],
    ["organisms", "pages"],
    ["auth", "atoms"], ["auth", "molecules"], ["auth", "organisms"], ["auth", "pages"],
    ["atoms", "mocks"], ["molecules", "mocks"], ["organisms", "mocks"],
  ];
  filesystem: {
    exists: ["atoms", "molecules", "organisms", "pages"];
  };
}>;

export const designSystem = {
  atoms:     { path: "components/atoms" },
  molecules: { path: "components/molecules" },
  organisms: { path: "components/organisms" },
  pages:     { path: "components/Pages" },
  providers: { path: "core/providers" },
  auth:      { path: "core/auth" },
  common:    {},
  mocks:     {},
} satisfies InstanceConfig<DesignSystem>;
```

```bash
$ ksc check .
All architectural contracts satisfied. (14 contracts, 342 files)
```

The refined model matches reality. 200+ files, 14 contracts, ~30 lines of `.k.ts`.

---

## Step 3: Verify Enforcement

Add a forbidden import to a real atom — `Button.tsx` imports from an organism:

```typescript
// Button.tsx (top of file)
import { ReleaseService } from '../../../organisms/ReleasesManager/v1.0.0/release.service';
// ... rest of Button.tsx
```

```bash
$ ksc check .
src/components/atoms/Button/v1.0.0/Button.tsx:1:0 - error KS70001:
  Forbidden dependency: .../atoms/Button/v1.0.0/Button.tsx → .../organisms/ReleasesManager/v1.0.0/release.service.ts
  Contract 'noDependency(atoms -> organisms)' (noDependency) defined at type:DesignSystem

Found 1 architectural violation(s).
```

Caught immediately. Exit code 1 — in CI, the PR fails.

---

## Step 4: Page Internal Architecture (Multi-Instance)

Pages have their own internal layered architecture:

```
DashboardPage/v1.0.0/
  ui/             → presentation (React components)
  domain/         → business logic hooks + context
  data/           → React Query hooks (API layer)
  types/          → TypeScript interfaces
  validation/     → Zod schemas
```

Write a **second `.k.ts` file** inside the page:

`src/components/Pages/DashboardPage/v1.0.0/dashboard.k.ts`:

```typescript
import type { Kind, ConstraintConfig, InstanceConfig } from 'kindscript';

type UILayer = Kind<"UILayer">;
type DomainLayer = Kind<"DomainLayer">;
type DataLayer = Kind<"DataLayer">;
type TypesLayer = Kind<"TypesLayer">;
type ValidationLayer = Kind<"ValidationLayer">;

type PageArchitecture = Kind<"PageArchitecture", {
  ui: UILayer;
  domain: DomainLayer;
  data: DataLayer;
  types: TypesLayer;
  validation: ValidationLayer;
}, {
  noDependency: [
    ["types", "ui"], ["types", "domain"], ["types", "data"],
    ["validation", "ui"], ["validation", "domain"],
    ["data", "ui"],
    ["domain", "ui"],
  ];
}>;

export const page = {
  ui: {},
  domain: {},
  data: {},
  types: {},
  validation: {},
} satisfies InstanceConfig<PageArchitecture>;
```

```bash
$ ksc check .
All architectural contracts satisfied. (21 contracts, 354 files)
```

Both levels enforced simultaneously — 14 top-level + 7 page-level = 21 contracts. Each `.k.ts` file defines its own scope with its own root directory.

---

## The Gap: Sibling Isolation

The most important rule in a design system: **organisms don't import from other organisms** and **pages don't import from other pages**. Each is an independent vertical slice.

Inject a cross-organism import:

```typescript
// ReleasesManager.tsx
import { DocumentService } from '../../DocumentManager/v1.0.0/document.service';
```

```bash
$ ksc check .
All architectural contracts satisfied. (21 contracts, 354 files)
```

**Not caught.** `organisms` is a single member — KindScript enforces boundaries *between* members, not *within* them. It can't see that `ReleasesManager/` and `DocumentManager/` are siblings.

### Proposed: `isolated` constraint

```typescript
type OrganismLayer = Kind<"OrganismLayer", {}, { isolated: true }>;
type PageLayer = Kind<"PageLayer", {}, { isolated: true }>;
```

One line replaces O(n²) manual pairs. This is the highest-value feature for real-world design system enforcement.

---

## Summary

| Rule | Enforced? | How |
|------|-----------|-----|
| Atoms can't import organisms/pages | Yes | `noDependency` |
| Molecules can't import pages | Yes | `noDependency` |
| Organisms can't import pages | Yes | `noDependency` |
| Production code can't import mocks | Yes | `noDependency` |
| Page internal layers (ui→domain→data) | Yes | Multi-instance `.k.ts` |
| Key directories must exist | Yes | `filesystem.exists` |
| Pages can't import each other | No | Needs `isolated` |
| Organisms can't import each other | No | Needs `isolated` |
| Atoms can't import zustand/tanstack | No | Needs `deniedExternals` |

### Key takeaway

KindScript doesn't require perfect modeling from day one. The adoption process is:

1. Write a first-pass `.k.ts` with your understanding of the rules
2. Run `ksc check` — learn from violations
3. Refine the model based on what you learned (not all violations are bugs — some reveal where your model doesn't match reality)
4. Repeat until satisfied
5. Add to CI
