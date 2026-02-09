# Storybook Architecture Modeling in KindScript

**Date:** 2026-02-08
**Status:** Design exploration
**Scope:** Modeling Induction Studio's storybook design system architecture in KindScript

---

## 1. Purpose

Analyze the Induction Studio storybook codebase (`apps/storybook/`) to:

1. Identify its implicit architectural rules in structural terms
2. Model as much as possible in KindScript
3. Determine what KindScript supports today vs. what requires new features
4. Use the result as both a demo and a functionality test for KindScript's real-world applicability

---

## 2. The Architecture in Structural Terms

The storybook has **three levels of architectural rules**, from macro to micro:

### Level 1 — Atomic Design Layer Hierarchy (top-level)

```
atoms       -> pure presentational, depends on: nothing (only cn(), icons)
molecules   -> composite UI, depends on: atoms
organisms   -> domain containers, depends on: atoms, molecules, core
pages       -> full features, depends on: atoms, molecules, organisms, core
core        -> shared infra (auth, providers, routing), depends on: nothing UI-level
mocks       -> MSW handlers, depends on: nothing (consumed by storybook config only)
```

The dependency graph is strictly **downward** — higher layers never depend on lower ones, and production code never depends on mocks.

### Level 2 — Sibling Isolation (inter-component)

- Pages are **independent**: `DashboardPage` never imports from `ReleasesPage`
- Organisms are **independent**: `ReleasesManager` never imports from `DocumentManager`
- Each component is a self-contained vertical slice

### Level 3 — Page Internal Architecture (intra-component)

Mature pages like DashboardPage have an internal layered architecture:

```
v1.0.0/
  ui/          -> presentation (depends on: domain/, atoms, molecules)
  domain/      -> business logic hooks + context (depends on: data/, types/)
  data/        -> React Query hooks (depends on: types/)
  types/       -> type definitions (standalone)
  validation/  -> Zod schemas (depends on: types/)
```

The flow is strictly `ui -> domain -> data -> types`, with validation as a sibling of types.

---

## 3. Filesystem Structure

### Top-Level

```
apps/storybook/src/
  components/
    atoms/           # Presentational (Button, Input, Badge, Icon, etc.)
    molecules/       # Composite (Card, Form, Alert, Sidebar, Tabs, etc.)
    organisms/       # Domain containers (ReleasesManager, DocumentManager, etc.)
    Pages/           # Full features (DashboardPage, ReleasesPage, etc.)
    templates/       # Layout wrappers (PlatformLayout)
  core/              # Shared infra (auth, providers, routing)
  common/            # Shared utilities (cn, hooks, validation)
  mocks/             # MSW setup + handlers
  utils/             # More shared utilities (duplicated with common/)
  providers/         # Re-exports (compatibility layer)
  services/
  styles/
  test/              # Test utilities
  index.ts           # Main barrel export
```

### Component Directory Conventions

Every component is nested inside a `v1.0.0/` directory with an `index.ts` barrel at the root:

```
Button/
  index.ts              # export { Button } from './v1.0.0/Button'
  v1.0.0/
    Button.tsx
    Button.stories.tsx
```

### Organism Structure (Frontend Container Pattern)

Organisms colocate everything they need:

```
ReleasesManager/
  index.ts
  v1.0.0/
    ReleasesManager.tsx         # UI component
    ReleasesManager.stories.tsx # Stories
    useReleases.ts              # Business logic hook
    release.service.ts          # API service layer
    release.types.ts            # TypeScript interfaces
    release.validation.ts       # Zod schemas
```

### Page Structure (Layered Architecture)

Pages have the richest internal structure:

```
DashboardPage/
  index.ts
  v1.0.0/
    ui/
      DashboardPage.tsx
      DashboardPage.stories.tsx
      DashboardPage.test.tsx
      sections/
        QuickActionsSection.tsx
        RecentActivitySection.tsx
        StatsSection.tsx
    domain/
      useDashboard.ts
      useDashboard.test.tsx
      DashboardPageContext.tsx
    data/
      dashboard.queries.ts
      dashboard.queries.validated.ts
      dashboard.mocks.ts
    types/
      dashboard.types.ts
    validation/
      dashboard.validation.ts
    tests/
      dashboard.integration.test.tsx
    dashboard.service.ts
```

---

## 4. Coupling Analysis

### Page-Specific (tightly coupled within a page)

- UI component <-> custom domain hook (useDashboard)
- Domain hook <-> page context (DashboardPageContext)
- Domain hook <-> data layer queries (useDashboardStats, etc.)
- UI <-> SafeAuthProvider hook (authentication check)
- UI <-> useRouter hook (navigation)

### Shared Across Entire App (loosely coupled)

- `cn()` utility (`common/utils`) — Tailwind class merging
- `SafeAuthProvider` (`core/auth`) — error-resistant auth context
- `ServiceProvider` (`core/providers`) — dependency injection for services
- `QueryProvider` (`core/providers`) — React Query configuration
- `useRealtime` (`common/hooks`) — Supabase realtime subscriptions
- `useAuth`, `useRouter` (`utils/hooks`) — navigation and auth
- MSW handlers (`mocks/`) — API mocking

### Decoupling Patterns

1. Services are injected via ServiceProvider context — not hardcoded imports
2. Page logic is isolated in domain/data layers — not in UI
3. Molecules are truly reusable — no knowledge of consuming organism
4. Mocks are injected via MSW — not hardcoded in components
5. Types are defined per feature — shared only where needed

---

## 5. What KindScript Can Model Today

### 5.1 Top-Level Layer Hierarchy — fully supported

Maps directly to `noDependency`:

```typescript
// src/storybook.k.ts  (root = src/)

type AtomLayer = Kind<"AtomLayer">;
type MoleculeLayer = Kind<"MoleculeLayer">;
type OrganismLayer = Kind<"OrganismLayer">;
type PageLayer = Kind<"PageLayer">;
type CoreLayer = Kind<"CoreLayer">;
type CommonLayer = Kind<"CommonLayer">;
type MockLayer = Kind<"MockLayer">;

type StorybookDesignSystem = Kind<"StorybookDesignSystem", {
  atoms: AtomLayer;
  molecules: MoleculeLayer;
  organisms: OrganismLayer;
  pages: PageLayer;
  core: CoreLayer;
  common: CommonLayer;
  mocks: MockLayer;
}, {
  noDependency: [
    // Atoms: leaf nodes — depend on nothing in the hierarchy
    ["atoms", "molecules"],
    ["atoms", "organisms"],
    ["atoms", "pages"],

    // Molecules: can use atoms, nothing above
    ["molecules", "organisms"],
    ["molecules", "pages"],

    // Organisms: can't depend on pages
    ["organisms", "pages"],

    // Core infra: independent of all UI layers
    ["core", "atoms"],
    ["core", "molecules"],
    ["core", "organisms"],
    ["core", "pages"],

    // Production code can't depend on mocks
    ["atoms", "mocks"],
    ["molecules", "mocks"],
    ["organisms", "mocks"],
    ["pages", "mocks"],
    ["core", "mocks"],
  ];
  filesystem: {
    exists: ["atoms", "molecules", "organisms", "pages", "core"];
  };
}>;

export const storybook = {
  atoms:     { path: "components/atoms" },
  molecules: { path: "components/molecules" },
  organisms: { path: "components/organisms" },
  pages:     { path: "components/Pages" },    // capital P
  core:      {},
  common:    {},
  mocks:     {},
} satisfies InstanceConfig<StorybookDesignSystem>;
```

If someone in `atoms/Button/` imports from `organisms/ReleasesManager/`, KindScript catches it.

### 5.2 Page Internal Architecture — supported via multi-instance

Each page can have its own `.k.ts` declaring internal layers:

```typescript
// src/components/Pages/DashboardPage/v1.0.0/dashboard.k.ts
// root = src/components/Pages/DashboardPage/v1.0.0/

type UILayer = Kind<"UILayer">;
type DomainLogic = Kind<"DomainLogic">;
type DataLayer = Kind<"DataLayer">;
type TypesLayer = Kind<"TypesLayer">;
type ValidationLayer = Kind<"ValidationLayer">;

type PageArchitecture = Kind<"PageArchitecture", {
  ui: UILayer;
  domain: DomainLogic;
  data: DataLayer;
  types: TypesLayer;
  validation: ValidationLayer;
}, {
  noDependency: [
    // types and validation are standalone
    ["types", "ui"], ["types", "domain"], ["types", "data"],
    ["validation", "ui"], ["validation", "domain"],
    // data can't depend on UI or domain
    ["data", "ui"],
    // domain can't depend on UI
    ["domain", "ui"],
  ];
  filesystem: {
    exists: ["ui", "domain", "types"];
  };
}>;

export const dashboardPage = {
  ui: {},
  domain: {},
  data: {},
  types: {},
  validation: {},
} satisfies InstanceConfig<PageArchitecture>;
```

Multi-instance support means each page's `.k.ts` gets its own root — they don't interfere with each other or the top-level definition.

### 5.3 Organism Self-Containment — partially supported

The top-level `noDependency` prevents organisms from importing pages. The organism's internal structure is flat (all files in one directory), so there's nothing to enforce at the directory level — the rules are about file naming conventions, not import boundaries.

### 5.4 Mirrors — supported but less applicable here

The storybook colocates stories *within* the component directory (not a parallel tree), so `filesystem.mirrors` is less useful for the stories-per-component rule. It would be more applicable for enforcing that every platform page has a corresponding storybook page.

---

## 6. What Would Require New Features

### Feature 1: `isolated` constraint — HIGH VALUE

**The problem:** "No page imports from any other page" and "no organism imports from any other organism" are the most important structural rules, but KindScript can't express them.

`pages` is a single member. KindScript can't see *inside* it to enforce that `DashboardPage/` doesn't import from `ReleasesPage/`. The workaround — declaring each page as a separate member — requires O(n^2) noDependency pairs (105 pairs for 15 pages).

**Proposed constraint:**

```typescript
type PageLayer = Kind<"PageLayer", {}, { isolated: true }>;
```

Semantics: every **immediate child directory** of this member is treated as an isolation boundary. No child may import from any other child. Imports from parent/external members are unaffected.

This single boolean replaces the entire O(n^2) explosion. It captures the core architectural insight: pages and organisms are **independent vertical slices**.

**Implementation sketch:** During contract checking, enumerate child directories of the member's resolved path. For each child, verify no import resolves to a file in any sibling child. This reuses the existing `noDependency` checker logic — auto-generating the pairs from directory enumeration.

### Feature 2: `deniedExternals` / `allowedExternals` — HIGH VALUE

**The problem:** Atoms should only import styling packages (`react`, `clsx`, `class-variance-authority`, `@radix-ui/*`, `tailwind-merge`, `lucide-react`). They should never import `zustand`, `@tanstack/react-query`, `next/router`, etc. The `pure` constraint only blocks Node.js builtins.

**Proposed constraint:**

```typescript
type AtomLayer = Kind<"AtomLayer", {}, {
  deniedExternals: ["zustand", "@tanstack/*", "next/*", "msw"];
}>;

// or the allowlist form:
type AtomLayer = Kind<"AtomLayer", {}, {
  allowedExternals: ["react", "react-dom", "clsx", "class-variance-authority",
                     "@radix-ui/*", "tailwind-merge", "lucide-react"];
}>;
```

Prevents the most common form of architecture erosion in design systems — heavy dependencies creeping into leaf components.

### Feature 3: `eachChild` / Template Kinds — MEDIUM VALUE

**The problem:** "Every directory under `atoms/` should contain an `index.ts` barrel export" and "every directory under `organisms/` should have colocated types/service/hook files." KindScript can only name specific members — it can't express patterns over dynamic children.

**Proposed concept:**

```typescript
type OrganismTemplate = Kind<"OrganismTemplate", {}, {
  filesystem: {
    contains: ["index.ts"];  // new: requires specific files exist
  };
}>;

type OrganismLayer = Kind<"OrganismLayer", {}, {
  eachChild: OrganismTemplate;  // apply to every subdirectory
}>;
```

### Feature 4: Glob Path Patterns — LOW-MEDIUM VALUE

**The problem:** The `v1.0.0/` versioning convention means actual component code lives one level deeper. When defining instances, you'd need `{ path: "Button/v1.0.0" }` which hardcodes version numbers.

**Proposed enhancement:** Allow glob-like patterns in path overrides:

```typescript
export const storybook = {
  atoms: { path: "components/atoms/*/v*" },
} satisfies InstanceConfig<StorybookDesignSystem>;
```

**Workaround:** Place `.k.ts` inside the version directory, which already works with root inference.

---

## 7. Support Matrix

| Architectural Rule | KindScript Today | Needed Feature |
|---|---|---|
| Atoms can't import organisms/pages | **Yes** — `noDependency` | — |
| Molecules can't import pages | **Yes** — `noDependency` | — |
| Organisms can't import pages | **Yes** — `noDependency` | — |
| Production code can't import mocks | **Yes** — `noDependency` | — |
| Core independent of UI layers | **Yes** — `noDependency` | — |
| Key directories must exist | **Yes** — `filesystem.exists` | — |
| Page internal layers (ui->domain->data) | **Yes** — multi-instance `.k.ts` per page | — |
| Pages can't import each other | **No** | `isolated` constraint |
| Organisms can't import each other | **No** | `isolated` constraint |
| Atoms can't import zustand/tanstack | **No** | `deniedExternals` |
| Every component has `index.ts` | **No** | `eachChild` + `filesystem.contains` |
| File naming conventions (*.service.ts) | **No** | naming convention constraint |
| Version directory transparency | **Workaround** (`.k.ts` inside version dir) | glob path patterns |
| Cross-package barrel enforcement | **No** | cross-instance constraints |

---

## 8. Recommended Phased Approach

### Phase 1 — Immediate Demo (what works now)

Create a `.k.ts` for the storybook top-level that enforces the layer hierarchy via `noDependency`. This is ~30 lines and immediately validates the most fundamental rule (atoms don't depend on organisms, etc.). Also create a per-page `.k.ts` for DashboardPage to demonstrate internal layer enforcement. Run `ksc check` against the real storybook codebase to see if the rules actually hold.

### Phase 2 — Build `isolated` constraint

The single feature that unlocks the most architecturally meaningful enforcement. It lets you say "pages are independent" and "organisms are independent" — the two rules the storybook team cares about most. Implementation reuses existing `noDependency` logic (auto-generating sibling pairs from child directory enumeration).

### Phase 3 — Build `deniedExternals`

Enforces the boundary between "styling-only" atoms and "stateful" organisms — preventing `zustand` or `@tanstack/query` from leaking into design system primitives.

These three phases cover ~80% of the storybook's architectural rules.

---

## 9. Component Inventory Reference

### Atoms (8 components)

Button, Input, Badge, Icon, Link, Progress, Skeleton, OptimizedImage

- Pure presentational, NO dependencies except styling utilities
- Uses: `cn()`, CVA variants, `React.forwardRef`, Radix Slot
- Pattern: `Component/v1.0.0/{Component.tsx, Component.stories.tsx}`

### Molecules (15 components)

Alert, Breadcrumbs, Card, ErrorBoundary, Form, FormField, GlobalSearch, LoginButton, LoginForm, PageLoader, Sidebar, Tabs, TestModeIndicator, Toast, UserMenu

- Composite atoms + layout logic
- Some handle local state (Form, Tabs, Sidebar)
- NO domain services, NO page-specific logic

### Organisms (12 components)

AIAssistant, AuthGuard, AuthProvider, CreateReleaseForm, CreateReleaseManager, DocumentManager, PlatformLayout, ReleaseFilters, ReleaseViewer, ReleasesList, ReleasesManager, Studio

- Domain-specific containers with business logic
- Colocated: types, service, validation, custom hooks
- Uses ServiceProvider for API access, React Query for data fetching

### Pages (15 components)

DashboardPage, DevInterfacePage, DocumentsPage, HomePage, KnowledgePage, MigrationsPage, ModuleTypeEditorPage, PagesManagerPage, ReleasesPage, SettingsPage, SignInPage, SignOutPage, StudioPage, WorkflowsPage, AuthErrorPage

- Complete app features with multiple layers: ui/, domain/, data/, types/, validation/
- Each page is INDEPENDENT of others
- Uses: organisms, molecules, atoms, SafeAuthProvider, useRouter

---

## 10. Technology Stack

| Layer | Technology |
|---|---|
| Component Framework | React 18.3.1 |
| Build Tool | Vite 5.0.0 |
| Component Catalog | Storybook 9.1.2 (react-vite) |
| Styling | Tailwind CSS + CVA + clsx + tailwind-merge |
| Component API | React.forwardRef + Radix Slot + CVA VariantProps |
| Icons | Lucide React |
| API Mocking | MSW 2.10.5 |
| State Management | Zustand 4.5.4 + TanStack Query 5.85.5 |
| Validation | Zod |
| Testing | Vitest 2.1.9 + Testing Library + Playwright 1.54.2 |
| Visual Testing | Chromatic |
