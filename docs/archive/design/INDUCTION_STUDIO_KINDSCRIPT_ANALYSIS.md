# Induction Studio: System Architecture & KindScript Modeling

**Date:** 2026-02-08
**Purpose:** Detailed architectural analysis of Induction Studio, mapping every concept to its filesystem location, documenting dependency flows, and proposing comprehensive KindScript enforcement for the entire system.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [The Three Applications](#2-the-three-applications)
3. [Storybook: The Frontend System](#3-storybook-the-frontend-system)
4. [Platform: The Backend System](#4-platform-the-backend-system)
5. [Studio: The Artifact Viewer](#5-studio-the-artifact-viewer)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [The Workflow Pipeline](#7-the-workflow-pipeline)
8. [Knowledge & Documentation System](#8-knowledge--documentation-system)
9. [Dependency Flow Summary](#9-dependency-flow-summary)
10. [KindScript Modeling: The Full System](#10-kindscript-modeling-the-full-system)
11. [Bottom-Up Implementation Plan: From Atom Versions to Full Design System](#11-bottom-up-implementation-plan-from-atom-versions-to-full-design-system)

---

## 1. System Overview

Induction Studio is an AI-powered application development platform structured as a **pnpm monorepo** with three applications, one shared package, and several non-code directories that form part of the product's content pipeline.

### Filesystem Root

```
induction-studio/
├── apps/
│   ├── platform/           # Next.js 14 — backend + thin page shells
│   ├── storybook/          # React component library — ALL frontend code
│   └── studio/             # Storybook-based release/artifact viewer
├── packages/
│   └── shared/             # Cross-app types, constants, generated API client
├── specs/                  # TypeSpec API contract definitions
├── workflows/              # Agent instruction pipeline (PRD → wireframes)
├── reference-designs/      # Example artifacts (40+ wireframe components)
├── platform-config/        # Business taxonomy (6 strategic documents)
├── knowledge/              # AI-aware documentation system
├── scripts/                # Build, generation, and utility scripts
├── tests/                  # E2E tests (Playwright)
├── domain-docs/            # Technical architecture standards
├── generated-content/      # Future: per-user AI-generated output
├── package.json            # Workspace root
├── turbo.json              # Build orchestration
├── vitest.config.ts        # Test configuration (4 projects)
├── playwright.config.ts    # E2E test configuration
├── CLAUDE.md               # AI agent development guide (45KB)
└── .envrc                  # Infisical secret loading via direnv
```

### Core Architectural Principle

The system follows a **strict separation** between three concerns:

```
┌─────────────────────────────────────┐
│  Storybook (Frontend)               │  ALL UI, hooks, services, types,
│  Port 6006                          │  validation, stories, tests
└──────────────┬──────────────────────┘
               │ HTTP only (fetch → /api/*)
┌──────────────┴──────────────────────┐
│  Platform (Backend)                  │  Thin pages + API routes +
│  Port 3000                          │  lib/api/ business logic
└──────────────┬──────────────────────┘
               │ Supabase client
┌──────────────┴──────────────────────┐
│  Supabase (Database)                 │  PostgreSQL, Row-Level Security
│  External service                    │
└─────────────────────────────────────┘
```

The **only coupling** between Storybook and Platform is:
1. Platform pages import Storybook components via `@induction/storybook`
2. Storybook services call Platform API routes via HTTP (`fetch('/api/...')`)
3. Both validate against the same TypeSpec-generated Zod schemas

---

## 2. The Three Applications

### 2.1 Dependency Graph Between Apps

```
packages/shared ─────────────────────────────────────────┐
    │                                                     │
    ├──→ apps/storybook (depends on shared)               │
    │        │                                            │
    │        ├──→ apps/platform (depends on storybook)    │
    │        │        │                                   │
    │        │        └──→ apps/platform depends on shared│
    │        │                                            │
    │        └──→ apps/studio (depends on storybook)      │
    │                                                     │
    └─────────────────────────────────────────────────────┘
```

**Dependency rules:**
- `packages/shared` depends on nothing (leaf)
- `apps/storybook` depends on `packages/shared` only
- `apps/platform` depends on `apps/storybook` (for page components) + `packages/shared`
- `apps/studio` depends on `apps/storybook` (for component library) + `packages/shared`
- **No app depends on another app's backend** — only on exported UI components

### 2.2 What Each App Owns

| Concern | Storybook | Platform | Studio |
|---------|-----------|----------|--------|
| React components | All UI | None (imports from Storybook) | Wireframe viewers only |
| React hooks | All (colocated) | None | Explorer hooks |
| API services | HTTP fetch wrappers | Route handlers + lib/api/ | None |
| Types | Component types | DB types, validation schemas | Artifact types |
| Validation | Client-side Zod | Server-side Zod (same schemas) | None |
| Stories | All Storybook stories | None | Release explorer stories |
| Tests | Component tests | API route tests | Viewer tests |
| Business logic | Frontend logic (hooks) | Backend logic (lib/api/) | None |
| Auth | Auth UI components | Auth0 + NextAuth config | None |
| Database | None (no DB access) | Supabase client | None |
| Styling | Tailwind + Radix | None (uses Storybook styles) | Own styles |

---

## 3. Storybook: The Frontend System

### 3.1 Directory Structure

```
apps/storybook/src/
├── index.ts                    # Barrel exports (121 lines)
├── components/
│   ├── atoms/                  # 8 components
│   │   ├── Badge/
│   │   │   ├── index.ts        # Re-exports from v1.0.0/
│   │   │   └── v1.0.0/
│   │   │       ├── Badge.tsx
│   │   │       └── Badge.stories.tsx
│   │   ├── Button/
│   │   ├── Icon/
│   │   ├── Input/
│   │   ├── Link/
│   │   ├── OptimizedImage/
│   │   ├── Progress/
│   │   └── Skeleton/
│   │
│   ├── molecules/              # 15 components
│   │   ├── Alert/
│   │   ├── Breadcrumbs/
│   │   ├── Card/
│   │   ├── ErrorBoundary/
│   │   ├── Form/
│   │   ├── FormField/
│   │   ├── GlobalSearch/
│   │   ├── LoginButton/
│   │   ├── LoginForm/
│   │   ├── PageLoader/
│   │   ├── Sidebar/
│   │   ├── Tabs/
│   │   ├── TestModeIndicator/
│   │   ├── Toast/
│   │   └── UserMenu/
│   │
│   ├── organisms/              # 12 components
│   │   ├── AIAssistant/        # Chat UI, operations dashboard
│   │   ├── AuthGuard/
│   │   ├── AuthProvider/
│   │   ├── CreateReleaseForm/  # Has v1.0.0 + v2.0.0
│   │   ├── CreateReleaseManager/
│   │   ├── DocumentManager/
│   │   ├── PlatformLayout/
│   │   ├── ReleaseFilters/
│   │   ├── ReleaseViewer/
│   │   ├── ReleasesList/
│   │   ├── ReleasesManager/
│   │   └── Studio/
│   │
│   ├── Pages/                  # 15 page components
│   │   ├── DashboardPage/      # Has v1.0.0 through v1.4.0
│   │   │   ├── index.ts
│   │   │   └── v1.0.0/
│   │   │       ├── ui/              # UI components
│   │   │       ├── domain/          # Business logic hooks
│   │   │       ├── data/            # API service layer
│   │   │       ├── types/           # TypeScript types
│   │   │       ├── validation/      # Zod schemas
│   │   │       ├── tests/           # Integration tests
│   │   │       ├── DashboardPage.tsx
│   │   │       ├── DashboardPage.stories.tsx
│   │   │       ├── DashboardPage.test.tsx
│   │   │       └── DashboardPageSimple.tsx
│   │   ├── DevInterfacePage/
│   │   ├── DocumentsPage/
│   │   ├── HomePage/
│   │   ├── KnowledgePage/
│   │   ├── MigrationsPage/
│   │   ├── ModuleTypesPage/
│   │   ├── PagesManagerPage/
│   │   ├── ReleasesPage/
│   │   ├── SettingsPage/
│   │   ├── SignInPage/
│   │   ├── SignOutPage/
│   │   ├── StudioPage/
│   │   ├── WorkflowsPage/
│   │   └── AuthErrorPage/
│   │
│   └── templates/
│       └── PlatformLayout/     # Shell layout template
│
├── common/                     # Shared utilities (storybook-only)
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── validation/
│
├── core/                       # Core infrastructure
│   ├── auth/                   # Auth state management
│   ├── config/                 # Frontend configuration
│   ├── providers/              # React context providers
│   └── routing/                # Route definitions
│
├── providers/                  # DI composition root
│   ├── ServiceProvider.tsx     # Wires all services together
│   └── EnhancedServiceProvider.tsx
│
├── mocks/                      # MSW mocking infrastructure
│   ├── generated/              # TypeSpec-generated handlers
│   ├── handlers/               # Custom handler overrides
│   ├── auth/                   # Auth mock scenarios
│   ├── providers/              # Mock context providers
│   ├── browser.ts              # MSW browser setup
│   └── server.ts               # MSW test setup
│
├── utils/                      # Cross-cutting utilities
│   ├── cn.ts                   # className utility
│   ├── hooks/                  # Cross-cutting hooks
│   ├── types/                  # Shared UI types
│   ├── ui-exports/             # UI barrel exports
│   └── validation/             # Shared validation schemas
│
├── styles/
│   └── globals.css             # Tailwind base styles
│
└── test/                       # Test utilities
    ├── setup.ts
    ├── test-utils.tsx
    └── utils.tsx
```

### 3.2 The Frontend Container Pattern

Every component follows the same self-contained structure. At its most complete (e.g., `ReleasesManager`):

```
ComponentName/
├── index.ts                          # Barrel re-exports from v1.0.0/
└── v1.0.0/
    ├── ComponentName.tsx             # UI component
    ├── ComponentName.stories.tsx     # Storybook stories
    ├── ComponentName.test.tsx        # Component tests
    ├── useComponentName.ts           # Business logic hook
    ├── useComponentName.test.ts      # Hook tests
    ├── componentName.service.ts      # API service (fetch wrapper)
    ├── componentName.types.ts        # TypeScript types
    ├── componentName.validation.ts   # Zod schemas
    └── __mocks__/
        └── componentName.mocks.ts    # Test mock data
```

**Page components** go further with internal layering (DashboardPage/v1.0.0):

```
v1.0.0/
├── ui/                    # Presentational components
│   ├── DashboardPage.tsx
│   ├── DashboardPageSimple.tsx
│   ├── sections/          # Sub-sections
│   └── styles/
├── domain/                # Business logic
│   ├── useDashboard.ts
│   ├── useDashboard.test.tsx
│   ├── hooks/
│   └── utils/
├── data/                  # API layer
│   ├── dashboard.service.ts
│   └── api/
├── types/                 # Type definitions
│   └── dashboard.types.ts
├── validation/            # Schemas
├── tests/                 # Integration tests
│   └── dashboard.integration.test.tsx
├── DashboardPage.tsx      # Top-level entry
├── DashboardPage.stories.tsx
└── DashboardPage.test.tsx
```

### 3.3 Versioning System

Every component sits inside a `v1.0.0/` directory. The `index.ts` at the component root selects which version to export:

```typescript
// Button/index.ts
export { Button } from './v1.0.0/Button';
```

DashboardPage has directories `v1.0.0/` through `v1.4.0/`, but versions above v1.0.0 contain only empty directory scaffolding (empty `domain/hooks/`, `ui/styles/` etc.) — the intent was to iterate page designs across versions, but only v1.0.0 has actual code.

### 3.4 Component Hierarchy Dependencies

The intended dependency flow is strictly downward:

```
Pages          can import from  →  organisms, molecules, atoms, templates, common, core, utils
Organisms      can import from  →  molecules, atoms, common, core, utils
Molecules      can import from  →  atoms, common, utils
Atoms          can import from  →  common, utils (nothing else)
Templates      can import from  →  molecules, atoms, common, utils
```

**Cross-layer violations to watch for:**
- Atoms importing from molecules/organisms/Pages (upward dependency)
- Organisms importing from Pages (upward dependency)
- Any component importing from `mocks/` in production code (test files are okay)
- `core/` importing from any component layer (should be independent)

### 3.5 The ServiceProvider Problem

`providers/ServiceProvider.tsx` is the **dependency injection composition root**. It legitimately imports services from organisms and Pages to wire them together. This breaks the normal layer hierarchy by design — it's the one place where all layers converge.

---

## 4. Platform: The Backend System

### 4.1 Directory Structure

```
apps/platform/src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Home page (renders HomeClient)
│   ├── globals.css
│   │
│   ├── (platform)/             # Auth-protected route group
│   │   ├── layout.tsx          # Platform shell layout
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # 13 lines: metadata + <DashboardClient/>
│   │   │   └── dashboard-client.tsx
│   │   ├── releases/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── knowledge/page.tsx
│   │   ├── workflows/page.tsx
│   │   ├── migrations/page.tsx
│   │   ├── module-types/page.tsx
│   │   ├── pages/page.tsx
│   │   ├── studio/page.tsx
│   │   └── dev-interface/page.tsx
│   │
│   ├── auth/                   # Auth pages (outside protected group)
│   │   ├── signin/page.tsx
│   │   ├── signin-test/page.tsx
│   │   ├── signout/page.tsx
│   │   └── error/page.tsx
│   │
│   └── api/                    # 43+ API route handlers
│       ├── ai/                 # 6 AI endpoints
│       │   ├── chat/route.ts
│       │   ├── consolidate/route.ts
│       │   ├── estimate-cost/route.ts
│       │   ├── templates/route.ts
│       │   ├── templates/customize/route.ts
│       │   └── usage-metrics/route.ts
│       ├── auth/               # 10 auth endpoints
│       ├── documents/          # CRUD + [id]
│       ├── releases/           # CRUD + [id]
│       ├── workflows/          # CRUD + [id]/execute
│       ├── modules/            # CRUD + [id]
│       ├── artifacts/route.ts
│       ├── search/route.ts
│       ├── settings/[userId]/route.ts
│       ├── sse/documents/route.ts  # Server-Sent Events
│       ├── health/route.ts
│       ├── dev-interface/      # 8 dev utility endpoints
│       ├── debug-auth/route.ts
│       ├── debug-env/route.ts
│       └── protected/route.ts
│
├── lib/
│   └── api/                    # ALL backend business logic
│       ├── ai/
│       │   ├── openai-client.ts          # OpenAI SDK config, models, pricing
│       │   ├── document-consolidator.ts  # Document merging (558 lines)
│       │   ├── prompt-templates.ts       # Prompt engineering (593 lines)
│       │   ├── middleware.ts
│       │   └── utils.ts
│       ├── auth/
│       │   ├── auth.ts                   # NextAuth export
│       │   └── config.ts                 # Auth0 + credentials + Supabase sync
│       ├── supabase/
│       │   ├── server.ts                 # createServerClient, createAdminClient
│       │   ├── middleware.ts
│       │   ├── types.ts                  # Generated DB types
│       │   └── test-connection.ts
│       ├── config/
│       │   ├── env.ts                    # Infisical→app env mapping (200 lines)
│       │   └── env-validation.ts
│       ├── modules/
│       │   ├── filesystem.scanner.ts
│       │   └── module.service.ts
│       ├── validation/
│       │   ├── middleware.ts             # withValidation() HOF (350 lines)
│       │   ├── openapi-validator.ts
│       │   ├── generated/               # TypeSpec-generated
│       │   │   ├── schemas.ts           # All Zod schemas
│       │   │   ├── types.ts             # All TypeScript types
│       │   │   └── index.ts             # Re-exports
│       │   └── validation.test.ts
│       └── index.ts
│
├── middleware.ts               # Edge runtime auth bouncer
│
└── test/
    └── generated-mocks/        # TypeSpec-generated MSW handlers
```

### 4.2 The Thin Page Pattern

Every platform page follows the same pattern — 10-15 lines maximum:

```typescript
// apps/platform/src/app/(platform)/dashboard/page.tsx
import { Metadata } from 'next';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | Induction Studio',
  description: 'AI-powered application development dashboard',
};

export default function DashboardPageWrapper() {
  return <DashboardClient />;
}
```

The `-client.tsx` file imports the actual component from Storybook:

```typescript
// dashboard-client.tsx
'use client';
import { DashboardPage } from '@induction/storybook';
export default function DashboardClient() {
  return <DashboardPage />;
}
```

### 4.3 Backend Business Logic Layers

Within `lib/api/`, there's an internal layering:

```
lib/api/
├── config/          # Environment & configuration (leaf — depends on nothing)
├── supabase/        # Database client (depends on config)
├── auth/            # Authentication (depends on config, supabase)
├── validation/      # Request/response validation (depends on generated schemas)
├── ai/              # AI processing (depends on config for API keys)
├── modules/         # Module discovery (depends on supabase)
└── index.ts         # Barrel exports
```

**Dependency flow within lib/api/:**
```
config → supabase → auth
config → ai
config → validation
supabase → modules
validation → (used by API routes, not by other lib/api/ modules)
```

### 4.4 API Route → lib/api/ Pattern

Routes are thin handlers that delegate to business logic:

```typescript
// Simplified: releases/route.ts
import { withValidation } from '@/lib/api/validation/middleware';
import { Releases_listQuerySchema } from '@/lib/api/validation/generated';

export const GET = withValidation(
  { query: Releases_listQuerySchema },
  async (req, { query }) => {
    const supabase = createRouteHandlerClient({ cookies });
    const { data } = await supabase.from('releases').select('*');
    return { releases: data };
  }
);
```

---

## 5. Studio: The Artifact Viewer

### 5.1 Directory Structure

```
apps/studio/
├── src/
│   └── components/wireframes/
│       ├── ReleaseExplorer/v1.0.0/
│       │   ├── ReleaseExplorer.tsx
│       │   ├── releaseExplorer.types.ts
│       │   ├── releaseExplorer.service.ts
│       │   ├── useReleaseExplorer.ts
│       │   └── index.ts
│       ├── ReleaseNavigation/v1.0.0/
│       └── VersionManager/v1.0.0/
├── generators/
├── loaders/
├── providers/
└── .storybook/
```

Studio follows the same versioning pattern (`v1.0.0/`) and Frontend Container Pattern as the main Storybook, but is a separate app focused specifically on viewing wireframe releases and navigating reference designs.

---

## 6. Cross-Cutting Concerns

### 6.1 TypeSpec → Generated Code Pipeline

```
specs/
├── api.tsp                 # Main API definition
└── models/                 # 7 domain models
    ├── ai.tsp
    ├── dashboard.tsp
    ├── document.tsp
    ├── release.tsp
    ├── system.tsp
    ├── user.tsp
    └── workflow.tsp
         │
         ▼  tsp compile
specs/tsp-output/
└── openapi.json            # Generated OpenAPI spec
         │
         ▼  generate scripts
┌────────┴────────────────────────────────────────┐
│                                                  │
▼                                                  ▼
apps/platform/src/lib/api/validation/generated/    apps/storybook/src/mocks/generated/
├── schemas.ts (Zod)                               ├── handlers.ts (MSW)
├── types.ts (TypeScript)                          ├── types.ts
└── index.ts                                       └── factories.ts
         │                                                  │
         ▼                                                  ▼
packages/shared/
└── api-client.generated.ts  # Type-safe fetch client
```

**Key insight:** TypeSpec is the single source of truth. All validation, types, mock handlers, and API client code are generated from it. Changes flow in one direction: `.tsp` → generated code → consumed by apps.

### 6.2 packages/shared

```
packages/shared/
├── index.ts
├── types.ts               # BaseEntity, User, ApiResponse<T>
├── constants.ts            # API_VERSION, DEFAULT_PAGE_SIZE, MAX_FILE_SIZE
├── utils.ts                # Shared utility functions
└── api-client.generated.ts # TypeSpec-generated API client (17KB)
```

**Rules:** `packages/shared` must never import from any `apps/*` package. It's a true leaf dependency.

### 6.3 Testing Infrastructure

```
Testing hierarchy:
├── Unit tests (Vitest, per-component)
│   ├── Storybook: src/**/*.test.{ts,tsx}
│   ├── Platform: src/**/*.test.{ts,tsx}
│   └── Studio: src/**/*.test.{ts,tsx}
│
├── Integration tests (Vitest, cross-component)
│   └── tests/integration/**/*.test.{ts,tsx}
│
└── E2E tests (Playwright, cross-app)
    └── tests/e2e/
        ├── global-setup.ts     # Auth initialization
        ├── smoke.spec.ts
        ├── auth/*.spec.ts
        └── pages/*.ts (Page Objects)
```

### 6.4 Authentication Flow

```
User → Platform middleware (edge) → NextAuth → Auth0
                                        ↓
                                  Supabase user sync
                                        ↓
                                  Session cookie set
                                        ↓
Storybook components → useAuth() hook → reads session
                                        ↓
                    → fetch('/api/*') → API route → validates session
```

---

## 7. The Workflow Pipeline

The workflows directory contains **agent instructions** (for AI assistants like Claude) that define a transformation pipeline:

```
workflows/
├── README.md
├── page_decomposition/
│   ├── instructions/
│   │   └── AGENT_INSTRUCTIONS_PAGE_DECOMPOSITION.md
│   └── examples/induction-studio/
│       ├── inputs/           # PRD_MVP.md, TECHNOLOGY_CHOICES.md, etc.
│       └── outputs/          # MVP_PAGE_DECOMPOSITION.md (15 pages)
│
├── page_specification/
│   ├── instructions/
│   │   └── AGENT_INSTRUCTIONS_PAGE_SPECIFICATION.md
│   └── examples/induction-studio/
│       ├── inputs/           # Decomposition output + PRD
│       └── outputs/          # 15 page specification files (00-login.md through 14-error.md)
│
└── wireframe_generation/
    ├── instructions/
    │   ├── AGENT_INSTRUCTIONS_WIREFRAME_GENERATION.md
    │   └── AGENT_INSTRUCTIONS_WIREFRAME_GENERATION_V2.md
    └── examples/induction-studio/
        ├── inputs/           # Page specifications
        └── outputs/          # 15 React wireframe .tsx files
```

**Pipeline flow:**

```
PRD documents
    ↓  (page_decomposition agent)
Page inventory (15 pages, P0/P1/P2 prioritized)
    ↓  (page_specification agent)
Detailed specifications (user stories, ASCII wireframes, component specs)
    ↓  (wireframe_generation agent)
Low-fidelity React components (monospace, grayscale, inline styles)
    ↓  (future: code_generation agent)
Production components (Tailwind, Radix, shadcn patterns)
    ↓  (future: deployment)
Deployed application
```

**Current status:** The pipeline has been demonstrated end-to-end as reference examples, but is not automated. Each stage is an agent instruction document that a human or AI operator follows manually.

---

## 8. Knowledge & Documentation System

### 8.1 Directory Structure with Access Controls

```
knowledge/
├── .ai-rules.md                   # Access control definitions
├── .protected/                    # READ-ONLY (source of truth)
│   ├── domain-docs/               # Technical standards
│   └── taxonomy/                  # Business domain
├── human/                         # WRITE WITH PERMISSION
│   ├── decisions/                 # Architecture Decision Records
│   ├── guides/                    # How-to guides
│   └── plans/                     # PRDs, roadmaps
├── ai-workspace/                  # AI CAN WRITE FREELY
│   ├── analyses/                  # Generated analyses
│   ├── plans/                     # Implementation plans
│   ├── summaries/                 # Generated summaries
│   └── temp/                      # Auto-deleted after 7 days
├── shared/                        # COLLABORATIVE
│   ├── meeting-notes/
│   └── investigations/
└── archive/                       # READ-ONLY (historical)
```

### 8.2 Platform Config (Business Taxonomy)

```
platform-config/
└── taxonomy/
    ├── 01-strategic-context.md     # Vision, mission, market, metrics
    ├── 02-product-definition.md    # Product capabilities
    ├── 03-user-context.md          # Personas, workflows
    ├── 04-technical-blueprint.md   # Architecture decisions
    ├── 05-execution-state.md       # Current progress
    └── 06-decision-log.md          # Decision history
```

### 8.3 Reference Designs

```
reference-designs/
├── wireframe-components/           # 40+ example components
│   ├── login/                      # Each has metadata.json + v1/ + latest.json
│   ├── dashboard/
│   ├── data-catalog/
│   ├── graph-studio/
│   └── ... (38 more)
├── releases/
│   └── mvp-wireframe/
│       ├── manifest.json           # 24-page release definition
│       └── MVPWireframes.stories.tsx
├── taxonomy-examples/              # 12 example taxonomy documents
├── templates/                      # Reusable wireframe templates
├── pages/                          # 27 page artifacts
├── conversation-examples/          # Iterative refinement demos
└── shared/                         # Shared wireframe utilities
```

---

## 9. Dependency Flow Summary

### 9.1 App-Level Dependencies

```
                    packages/shared
                   ╱       │       ╲
                  ╱        │        ╲
    apps/storybook    apps/platform    apps/studio
         │                  │
         └──────────────────┘
          (platform imports
           storybook components)
```

### 9.2 Within Storybook (Component Hierarchy)

```
atoms ← molecules ← organisms ← Pages
  │         │            │         │
  └─────────┴────────────┴─────────┘
              │
         common, core, utils
              │
          providers (DI root — imports from all layers)
              │
           mocks (test-only — never imported by production code)
```

### 9.3 Within Platform (Backend Layers)

```
app/api/* routes
    ↓ delegates to
lib/api/validation (middleware)
    ↓ wraps
lib/api/{ai, modules} (business logic)
    ↓ uses
lib/api/{supabase, auth} (infrastructure)
    ↓ configured by
lib/api/config (environment)
```

### 9.4 Within a Page Component (DashboardPage/v1.0.0)

```
types ← data ← domain ← ui
  │       │       │       │
  │       │       └───────┘  (ui imports domain hooks)
  │       └─────────────────  (domain imports data services)
  └─────────────────────────  (everyone imports types)
```

### 9.5 Cross-App Data Flow

```
Storybook UI component
    ↓ user action triggers
Storybook hook (e.g., useReleases)
    ↓ calls
Storybook service (e.g., release.service.ts)
    ↓ fetch('/api/releases')
Platform API route (releases/route.ts)
    ↓ validated by
Platform validation middleware (withValidation)
    ↓ delegates to
Platform business logic (lib/api/)
    ↓ queries
Supabase database
    ↓ returns
Response validated against TypeSpec schema
    ↓ returns JSON
Storybook hook receives data
    ↓ updates state
React re-renders UI
```

---

## 10. KindScript Modeling: The Full System

This section proposes how every architectural boundary, rule, and relationship in Induction Studio could be expressed through KindScript types and constraints. This goes beyond what KindScript can enforce today — it assumes future constraint types like `isolated`, `deniedExternals`, `requiredFiles`, `maxLines`, and `naming`.

### 10.1 Top-Level Monorepo Architecture

This `.k.ts` file sits at the repo root and enforces the macro-level boundaries between apps and packages.

```typescript
import type { Kind, Instance } from 'kindscript';

// ─── Member Kinds ───

type AppLayer = Kind<"AppLayer">;
type PackageLayer = Kind<"PackageLayer">;
type SpecLayer = Kind<"SpecLayer">;
type ContentLayer = Kind<"ContentLayer">;
type TestLayer = Kind<"TestLayer">;
type ScriptLayer = Kind<"ScriptLayer">;

// ─── Monorepo Kind ───

type InductionMonorepo = Kind<"InductionMonorepo", {
  storybook: AppLayer;
  platform: AppLayer;
  studio: AppLayer;
  shared: PackageLayer;
  specs: SpecLayer;
  workflows: ContentLayer;
  referenceDesigns: ContentLayer;
  platformConfig: ContentLayer;
  knowledge: ContentLayer;
  scripts: ScriptLayer;
  e2eTests: TestLayer;
}, {
  // Package dependency rules
  noDependency: [
    // shared is a leaf — depends on no app
    ["shared", "storybook"],
    ["shared", "platform"],
    ["shared", "studio"],

    // specs are pure definitions — depend on nothing
    ["specs", "storybook"],
    ["specs", "platform"],
    ["specs", "studio"],
    ["specs", "shared"],

    // storybook doesn't depend on platform or studio
    ["storybook", "platform"],
    ["storybook", "studio"],

    // studio doesn't depend on platform
    ["studio", "platform"],

    // platform doesn't depend on studio
    ["platform", "studio"],

    // Content directories are inert — no code dependencies
    ["workflows", "storybook"],
    ["workflows", "platform"],
    ["referenceDesigns", "storybook"],
    ["referenceDesigns", "platform"],
    ["platformConfig", "storybook"],
    ["platformConfig", "platform"],
    ["knowledge", "storybook"],
    ["knowledge", "platform"],

    // Scripts can depend on apps (for build), but apps don't depend on scripts
    ["storybook", "scripts"],
    ["platform", "scripts"],
    ["studio", "scripts"],

    // E2E tests can depend on everything (they test the whole system)
    // but nothing depends on e2e tests
    ["storybook", "e2eTests"],
    ["platform", "e2eTests"],
    ["shared", "e2eTests"],
  ];

  // Key directories must exist
  filesystem: {
    exists: [
      "storybook", "platform", "studio", "shared", "specs",
      "workflows", "referenceDesigns", "platformConfig", "knowledge"
    ];
  };
}>;

export const monorepo = {
  storybook:        { path: "apps/storybook/src" },
  platform:         { path: "apps/platform/src" },
  studio:           { path: "apps/studio/src" },
  shared:           { path: "packages/shared" },
  specs:            { path: "specs" },
  workflows:        { path: "workflows" },
  referenceDesigns: { path: "reference-designs" },
  platformConfig:   { path: "platform-config" },
  knowledge:        { path: "knowledge" },
  scripts:          { path: "scripts" },
  e2eTests:         { path: "tests/e2e" },
} satisfies Instance<InductionMonorepo>;
```

### 10.2 Storybook Design System (Atomic Design + Internal Layers)

This `.k.ts` file sits inside `apps/storybook/src/` and enforces the Atomic Design hierarchy and supporting infrastructure.

```typescript
import type { Kind, Instance } from 'kindscript';

// ─── Component Layer Kinds ───

type AtomLayer = Kind<"AtomLayer">;
type MoleculeLayer = Kind<"MoleculeLayer">;
type OrganismLayer = Kind<"OrganismLayer">;
type PageLayer = Kind<"PageLayer">;
type TemplateLayer = Kind<"TemplateLayer">;

// ─── Infrastructure Kinds ───

type CommonLayer = Kind<"CommonLayer">;
type CoreLayer = Kind<"CoreLayer">;
type UtilsLayer = Kind<"UtilsLayer">;
type ProvidersLayer = Kind<"ProvidersLayer">;
type MocksLayer = Kind<"MocksLayer">;
type StylesLayer = Kind<"StylesLayer">;
type TestUtilsLayer = Kind<"TestUtilsLayer">;

// ─── Design System Kind ───

type StorybookDesignSystem = Kind<"StorybookDesignSystem", {
  atoms: AtomLayer;
  molecules: MoleculeLayer;
  organisms: OrganismLayer;
  pages: PageLayer;
  templates: TemplateLayer;
  common: CommonLayer;
  core: CoreLayer;
  utils: UtilsLayer;
  providers: ProvidersLayer;
  mocks: MocksLayer;
  styles: StylesLayer;
  testUtils: TestUtilsLayer;
}, {
  // Atomic design hierarchy: strict upward dependency ban
  noDependency: [
    // Atoms: leaf UI — depend on nothing above
    ["atoms", "molecules"],
    ["atoms", "organisms"],
    ["atoms", "pages"],
    ["atoms", "templates"],

    // Molecules: can use atoms, nothing above
    ["molecules", "organisms"],
    ["molecules", "pages"],

    // Organisms: can use molecules + atoms, not pages
    ["organisms", "pages"],

    // Templates: layout shells, can use molecules + atoms
    ["templates", "organisms"],
    ["templates", "pages"],

    // Core infrastructure: independent of UI layers
    ["core", "atoms"],
    ["core", "molecules"],
    ["core", "organisms"],
    ["core", "pages"],
    ["core", "templates"],

    // Common: shared utilities, independent of UI layers
    ["common", "atoms"],
    ["common", "molecules"],
    ["common", "organisms"],
    ["common", "pages"],
    ["common", "templates"],

    // Utils: lowest-level utilities
    ["utils", "atoms"],
    ["utils", "molecules"],
    ["utils", "organisms"],
    ["utils", "pages"],
    ["utils", "templates"],
    ["utils", "core"],
    ["utils", "common"],

    // Styles: pure CSS, depends on nothing
    ["styles", "atoms"],
    ["styles", "molecules"],
    ["styles", "organisms"],
    ["styles", "pages"],
    ["styles", "core"],
    ["styles", "common"],
    ["styles", "utils"],

    // Mocks: test-only — no production code imports mocks
    ["atoms", "mocks"],
    ["molecules", "mocks"],
    ["organisms", "mocks"],
    ["templates", "mocks"],
    ["core", "mocks"],
    ["common", "mocks"],
    ["utils", "mocks"],
    ["styles", "mocks"],
    // Note: pages -> mocks is ALLOWED (test files in pages need mock data)

    // Test utils: only used by test files
    ["atoms", "testUtils"],
    ["molecules", "testUtils"],
    ["organisms", "testUtils"],
    ["pages", "testUtils"],
    ["core", "testUtils"],

    // Providers: DI root has NO constraints — it imports from everywhere
    // (intentionally omitted from noDependency)
  ];

  // Sibling isolation (PROPOSED: not yet in KindScript)
  // Each organism is independent; each page is independent
  // isolated: ["organisms", "pages"];

  // Key directories must exist
  filesystem: {
    exists: [
      "atoms", "molecules", "organisms", "pages",
      "common", "core", "utils", "mocks"
    ];
  };
}>;

export const designSystem = {
  atoms:      { path: "components/atoms" },
  molecules:  { path: "components/molecules" },
  organisms:  { path: "components/organisms" },
  pages:      { path: "components/Pages" },
  templates:  { path: "components/templates" },
  common:     {},
  core:       {},
  utils:      {},
  providers:  {},
  mocks:      {},
  styles:     {},
  testUtils:  { path: "test" },
} satisfies Instance<StorybookDesignSystem>;
```

### 10.3 Platform Backend Architecture

This `.k.ts` file sits inside `apps/platform/src/` and enforces the backend layering.

```typescript
import type { Kind, Instance } from 'kindscript';

// ─── Backend Layer Kinds ───

type PageShellLayer = Kind<"PageShellLayer">;
type ApiRouteLayer = Kind<"ApiRouteLayer">;
type ValidationLayer = Kind<"ValidationLayer">;
type BusinessLogicLayer = Kind<"BusinessLogicLayer">;
type InfraLayer = Kind<"InfraLayer">;
type ConfigLayer = Kind<"ConfigLayer">;
type MiddlewareLayer = Kind<"MiddlewareLayer">;
type TestLayer = Kind<"TestLayer">;

// ─── Platform Kind ───

type PlatformBackend = Kind<"PlatformBackend", {
  pageShells: PageShellLayer;      // (platform)/ route pages
  authPages: PageShellLayer;       // auth/ pages
  apiRoutes: ApiRouteLayer;        // app/api/ handlers
  validation: ValidationLayer;     // lib/api/validation/
  ai: BusinessLogicLayer;          // lib/api/ai/
  modules: BusinessLogicLayer;     // lib/api/modules/
  auth: InfraLayer;                // lib/api/auth/
  supabase: InfraLayer;            // lib/api/supabase/
  config: ConfigLayer;             // lib/api/config/
  testMocks: TestLayer;            // test/generated-mocks/
}, {
  noDependency: [
    // Config is a leaf — depends on nothing in this app
    ["config", "ai"],
    ["config", "modules"],
    ["config", "auth"],
    ["config", "supabase"],
    ["config", "validation"],
    ["config", "apiRoutes"],
    ["config", "pageShells"],
    ["config", "authPages"],

    // Supabase depends only on config
    ["supabase", "ai"],
    ["supabase", "modules"],
    ["supabase", "validation"],
    ["supabase", "apiRoutes"],
    ["supabase", "pageShells"],

    // Auth depends on config + supabase
    ["auth", "ai"],
    ["auth", "modules"],
    ["auth", "apiRoutes"],
    ["auth", "pageShells"],

    // Validation depends on generated schemas only
    ["validation", "ai"],
    ["validation", "modules"],
    ["validation", "apiRoutes"],
    ["validation", "pageShells"],

    // Business logic doesn't depend on routes or pages
    ["ai", "apiRoutes"],
    ["ai", "pageShells"],
    ["ai", "authPages"],
    ["modules", "apiRoutes"],
    ["modules", "pageShells"],

    // Page shells don't depend on API routes (they use Storybook components)
    ["pageShells", "apiRoutes"],
    ["authPages", "apiRoutes"],

    // Test mocks are test-only
    ["apiRoutes", "testMocks"],
    ["ai", "testMocks"],
    ["modules", "testMocks"],
    ["auth", "testMocks"],
    ["supabase", "testMocks"],
    ["config", "testMocks"],
  ];

  filesystem: {
    exists: [
      "apiRoutes", "validation", "ai", "auth", "supabase", "config"
    ];
  };

  // PROPOSED: Page shell line limits
  // maxLines: { pageShells: 15, authPages: 20 };

  // PROPOSED: API routes must use validation middleware
  // requiredPattern: { apiRoutes: "withValidation" };
}>;

export const platform = {
  pageShells:  { path: "app/(platform)" },
  authPages:   { path: "app/auth" },
  apiRoutes:   { path: "app/api" },
  validation:  { path: "lib/api/validation" },
  ai:          { path: "lib/api/ai" },
  modules:     { path: "lib/api/modules" },
  auth:        { path: "lib/api/auth" },
  supabase:    { path: "lib/api/supabase" },
  config:      { path: "lib/api/config" },
  testMocks:   { path: "test/generated-mocks" },
} satisfies Instance<PlatformBackend>;
```

### 10.4 Page-Level Architecture (DashboardPage)

This `.k.ts` file sits inside `apps/storybook/src/components/Pages/DashboardPage/v1.0.0/` and enforces the internal layering of the most complex page.

```typescript
import type { Kind, Instance } from 'kindscript';

type UILayer = Kind<"UILayer">;
type DomainLayer = Kind<"DomainLayer">;
type DataLayer = Kind<"DataLayer">;
type TypesLayer = Kind<"TypesLayer">;
type ValidationLayer = Kind<"ValidationLayer">;
type TestsLayer = Kind<"TestsLayer">;

type DashboardPageArch = Kind<"DashboardPageArch", {
  ui: UILayer;
  domain: DomainLayer;
  data: DataLayer;
  types: TypesLayer;
  validation: ValidationLayer;
  tests: TestsLayer;
}, {
  noDependency: [
    // Types: leaf — depends on nothing internal
    ["types", "ui"],
    ["types", "domain"],
    ["types", "data"],
    ["types", "validation"],

    // Validation: depends on types only
    ["validation", "ui"],
    ["validation", "domain"],
    ["validation", "data"],

    // Data: depends on types + validation
    ["data", "ui"],
    ["data", "domain"],

    // Domain: depends on data + types + validation
    ["domain", "ui"],

    // Tests can import from anywhere (no constraints)
  ];
}>;

export const page = {
  ui: {},
  domain: {},
  data: {},
  types: {},
  validation: {},
  tests: {},
} satisfies Instance<DashboardPageArch>;
```

### 10.5 TypeSpec Contract Pipeline

This `.k.ts` file enforces the generation pipeline: specs → generated code. It sits at the repo root alongside the monorepo `.k.ts`.

```typescript
import type { Kind, Instance } from 'kindscript';

type SpecSource = Kind<"SpecSource">;
type GeneratedPlatform = Kind<"GeneratedPlatform">;
type GeneratedStorybook = Kind<"GeneratedStorybook">;
type GeneratedShared = Kind<"GeneratedShared">;

type TypeSpecPipeline = Kind<"TypeSpecPipeline", {
  source: SpecSource;
  platformSchemas: GeneratedPlatform;
  storybookMocks: GeneratedStorybook;
  sharedClient: GeneratedShared;
}, {
  // Generated code never flows back to specs
  noDependency: [
    ["source", "platformSchemas"],
    ["source", "storybookMocks"],
    ["source", "sharedClient"],
  ];

  // Generated directories must mirror the spec models
  filesystem: {
    exists: ["source", "platformSchemas", "storybookMocks", "sharedClient"];
    mirrors: [
      // PROPOSED: generated outputs should mirror spec structure
      // ["source", "platformSchemas"],
    ];
  };
}>;

export const typespecPipeline = {
  source:           { path: "specs" },
  platformSchemas:  { path: "apps/platform/src/lib/api/validation/generated" },
  storybookMocks:   { path: "apps/storybook/src/mocks/generated" },
  sharedClient:     { path: "packages/shared" },
} satisfies Instance<TypeSpecPipeline>;
```

### 10.6 Knowledge System Access Control

This `.k.ts` models the documentation permission system. While KindScript today enforces import dependencies, future constraints could enforce write permissions.

```typescript
import type { Kind, Instance } from 'kindscript';

type ProtectedDocs = Kind<"ProtectedDocs">;
type HumanDocs = Kind<"HumanDocs">;
type AIWorkspace = Kind<"AIWorkspace">;
type SharedDocs = Kind<"SharedDocs">;
type ArchiveDocs = Kind<"ArchiveDocs">;

type KnowledgeSystem = Kind<"KnowledgeSystem", {
  protected: ProtectedDocs;
  human: HumanDocs;
  aiWorkspace: AIWorkspace;
  shared: SharedDocs;
  archive: ArchiveDocs;
}, {
  // Protected docs are source of truth — nothing modifies them
  // (This would be enforced by a future "readOnly" constraint)

  // Archive is historical — don't reference for implementation
  // (This would be enforced by a future "deprecated" constraint)

  filesystem: {
    exists: ["protected", "human", "aiWorkspace", "shared", "archive"];
  };

  // PROPOSED: Access control constraints
  // readOnly: ["protected", "archive"];
  // writePermission: {
  //   human: "ask-first",
  //   aiWorkspace: "free",
  //   shared: "free",
  // };
}>;

export const knowledge = {
  protected:    { path: ".protected" },
  human:        {},
  aiWorkspace:  { path: "ai-workspace" },
  shared:       {},
  archive:      {},
} satisfies Instance<KnowledgeSystem>;
```

### 10.7 Workflow Pipeline Stages

This models the agent workflow pipeline as architectural members.

```typescript
import type { Kind, Instance } from 'kindscript';

type WorkflowStage = Kind<"WorkflowStage">;
type ExampleContent = Kind<"ExampleContent">;

type AgentPipeline = Kind<"AgentPipeline", {
  decomposition: WorkflowStage;
  specification: WorkflowStage;
  wireframing: WorkflowStage;
  examples: ExampleContent;
}, {
  // Pipeline stages are independent (each is self-contained instructions)
  // But outputs flow in one direction: decomposition → specification → wireframing
  noDependency: [
    // Later stages don't feed back to earlier stages
    ["decomposition", "specification"],
    ["decomposition", "wireframing"],
    ["specification", "wireframing"],

    // Examples don't depend on workflow instructions (they're outputs)
    ["examples", "decomposition"],
    ["examples", "specification"],
    ["examples", "wireframing"],
  ];

  filesystem: {
    exists: ["decomposition", "specification", "wireframing"];
    // Each stage must have instructions + examples
    // PROPOSED: requiredFiles constraint
    // requiredFiles: {
    //   decomposition: ["instructions/*.md", "examples/*/inputs/*", "examples/*/outputs/*"],
    //   specification: ["instructions/*.md", "examples/*/inputs/*", "examples/*/outputs/*"],
    //   wireframing: ["instructions/*.md", "examples/*/inputs/*", "examples/*/outputs/*"],
    // };
  };
}>;

export const pipeline = {
  decomposition: { path: "page_decomposition" },
  specification: { path: "page_specification" },
  wireframing:   { path: "wireframe_generation" },
  examples:      { path: "reference-designs" },
} satisfies Instance<AgentPipeline>;
```

### 10.8 Organism-Level Self-Containment

This enforces the Frontend Container Pattern at the organism level. Each organism must be self-contained with its required files.

```typescript
import type { Kind, Instance } from 'kindscript';

type UIFile = Kind<"UIFile">;
type HookFile = Kind<"HookFile">;
type ServiceFile = Kind<"ServiceFile">;
type TypesFile = Kind<"TypesFile">;
type StoryFile = Kind<"StoryFile">;
type TestFile = Kind<"TestFile">;

// PROPOSED: Per-component enforcement
// This would use a future "componentShape" constraint that validates
// every child directory of a member follows a required file pattern.
//
// type OrganismPattern = Kind<"OrganismPattern", {
//   component: UIFile;
//   hook: HookFile;
//   service: ServiceFile;
//   types: TypesFile;
//   stories: StoryFile;
//   tests: TestFile;
// }, {
//   componentShape: {
//     pattern: "v1.0.0/",
//     requiredFiles: [
//       "*.tsx",           // UI component
//       "use*.ts",         // Hook
//       "*.service.ts",    // API service
//       "*.types.ts",      // Types
//       "*.stories.tsx",   // Stories
//     ];
//     optionalFiles: [
//       "*.validation.ts", // Validation
//       "*.test.ts",       // Tests
//       "__mocks__/*.ts",  // Mocks
//     ];
//   };
// }>;
```

### 10.9 Comprehensive Constraint Catalog

Here is every rule identified in the system, mapped to which KindScript constraint type would enforce it:

#### Currently Available Constraints

| Rule | Constraint | Status |
|------|-----------|--------|
| Atoms can't import molecules/organisms/pages | `noDependency` | Available |
| Molecules can't import organisms/pages | `noDependency` | Available |
| Organisms can't import pages | `noDependency` | Available |
| Core is independent of UI layers | `noDependency` | Available |
| Production code can't import mocks | `noDependency` | Available |
| Platform page shells don't import API routes | `noDependency` | Available |
| Config is a leaf (depends on nothing) | `noDependency` | Available |
| Business logic doesn't depend on routes | `noDependency` | Available |
| packages/shared depends on no app | `noDependency` | Available |
| TypeSpec specs don't depend on generated code | `noDependency` | Available |
| Key directories exist on disk | `filesystem.exists` | Available |
| Page internal layers (types←data←domain←ui) | `noDependency` (multi-instance) | Available |

#### Proposed Future Constraints

| Rule | Proposed Constraint | Description |
|------|-------------------|-------------|
| Organisms can't import sibling organisms | `isolated` | Children of a member can't cross-import |
| Pages can't import sibling pages | `isolated` | Same — highest-value feature |
| Platform pages must be <15 lines | `maxLines` | Enforce thin wrapper pattern |
| API routes must use `withValidation` | `requiredPattern` | Enforce validation middleware |
| Components must have `*.stories.tsx` | `requiredFiles` | Enforce story coverage |
| Components must have `*.types.ts` | `requiredFiles` | Enforce type colocality |
| Component dirs must have `index.ts` | `requiredFiles` | Enforce barrel exports |
| Components must follow `v1.0.0/` pattern | `naming` | Enforce versioning convention |
| Atoms can't import zustand/tanstack-query | `deniedExternals` | Atoms are pure presentational |
| Organisms can't import next/navigation | `deniedExternals` | Organisms are framework-agnostic |
| `.protected/` is read-only | `readOnly` | Enforce documentation access control |
| Generated code matches spec structure | `filesystem.mirrors` | Enforce spec↔generated alignment |
| No circular dependencies within layers | `noCycles` | Prevent circular imports |
| `purity` on atoms (no side effects) | `purity` | Atoms are pure functions |

### 10.10 Multi-Instance Deployment Summary

The complete system would use **7 `.k.ts` files** deployed across the monorepo:

```
induction-studio/
├── context.k.ts                                    # Monorepo-level (10.1)
├── typespec-pipeline.k.ts                          # TypeSpec pipeline (10.5)
├── apps/storybook/src/context.k.ts                 # Design system (10.2)
├── apps/storybook/src/components/Pages/
│   └── DashboardPage/v1.0.0/dashboard.k.ts        # Page internals (10.4)
├── apps/platform/src/context.k.ts                  # Backend layers (10.3)
├── knowledge/context.k.ts                          # Knowledge system (10.6)
└── workflows/context.k.ts                          # Pipeline stages (10.7)
```

Each `.k.ts` file is scoped to its directory — KindScript infers the root from the file's location. This means the monorepo-level constraints and the storybook-level constraints coexist without conflict, each enforcing rules at its own scope.

### 10.11 Contract Count Estimate

| `.k.ts` file | Members | noDependency pairs | exists | mirrors | Total contracts |
|--------------|:-------:|:------------------:|:------:|:-------:|:--------------:|
| Monorepo | 11 | 25 | 9 | 0 | 34 |
| Storybook design system | 12 | 31 | 8 | 0 | 39 |
| Platform backend | 10 | 22 | 6 | 0 | 28 |
| DashboardPage internals | 6 | 10 | 0 | 0 | 10 |
| TypeSpec pipeline | 4 | 5 | 4 | 0 | 9 |
| Knowledge system | 5 | 0 | 5 | 0 | 5 |
| Workflow pipeline | 4 | 6 | 3 | 0 | 9 |
| **Total** | **52** | **99** | **35** | **0** | **134** |

With the proposed `isolated` constraint on organisms and pages, 2 constraints would replace what would otherwise be O(n^2) noDependency pairs (132 pairs for 12 organisms alone).

---

## Appendix: Feature → Constraint Quick Reference

| Feature Area | Existing KindScript | Proposed Extensions |
|-------------|-------------------|-------------------|
| Atomic Design hierarchy | `noDependency` | `isolated` for sibling isolation |
| Page internal layers | `noDependency` (multi-instance) | `requiredFiles` for file patterns |
| Frontend Container Pattern | `filesystem.exists` | `requiredFiles` per component |
| Thin platform pages | `noDependency` (no route imports) | `maxLines` |
| TypeSpec pipeline | `noDependency` | `filesystem.mirrors` |
| Validation enforcement | Not enforceable | `requiredPattern` |
| External dependency control | Not enforceable | `deniedExternals` |
| Documentation access | Not enforceable | `readOnly`, `writePermission` |
| Component versioning | Not enforceable | `naming` patterns |
| Circular dependency prevention | `noCycles` | Already available |
| Purity enforcement (atoms) | `purity` | Already available |

---

## 11. Bottom-Up Implementation Plan: From Atom Versions to Full Design System

Section 10 modeled the system top-down — monorepo boundaries, design system layers, backend architecture. This section works **bottom-up**, starting from the smallest unit (what's inside a single atom's `v1.0.0/` directory) and building outward through molecules, organisms, and pages until it connects with the top-down model.

### 11.1 The Key Insight: File-Pattern Members

Current KindScript maps each member to a **directory**. This works perfectly for Page versions like `DashboardPage/v1.0.0/` which have real subdirectories (`domain/`, `data/`, `ui/`, `types/`). But atoms, molecules, and organisms are **flat** — all files sit in the same `v1.0.0/` directory with no subdirectories.

To model flat directories, KindScript needs a new concept: **file-pattern members**. Instead of mapping a member to a subdirectory path, you map it to a glob pattern within the current directory:

```typescript
// Current: member → subdirectory
export const page = {
  ui:     { path: "ui" },          // matches files in ui/
  domain: { path: "domain" },      // matches files in domain/
} satisfies Instance<PageVersion>;

// Proposed: member → file pattern (new)
export const atom = {
  component: { match: "*.tsx", exclude: ["*.stories.tsx", "*.test.tsx"] },
  stories:   { match: "*.stories.tsx" },
  tests:     { match: "*.test.tsx" },
} satisfies Instance<AtomVersion>;
```

With this extension, every flat directory becomes enforceable — file imports between pattern groups follow the same `noDependency` rules as directory-based members. The rest of this section assumes this feature exists.

### 11.2 The Second Insight: Template Kinds (forEach)

Without template Kinds, you'd need a separate `.k.ts` file inside every `v1.0.0/` directory of every atom. Instead, a **template Kind** declares the shape once and applies it to every matching child:

```typescript
// Proposed: declare once, enforce everywhere
type AtomsLayer = Kind<"AtomsLayer", {}, {
  // Every child matching */v*/ must conform to AtomVersion
  forEach: {
    pattern: "*/v*/";
    conformsTo: AtomVersion;
  };
}>;
```

This is how the bottom-up Kinds connect to the top-down design system Kind from 10.2 — the `atoms` member gains a `forEach` constraint that recursively enforces the version-level Kind on all atom version directories.

### 11.3 Level 1: Atom Version (`atoms/Button/v1.0.0/`)

**Observed structure** (10 atoms examined):

```
v1.0.0/
├── Button.tsx               # Always present (main component)
├── Button.stories.tsx        # Present in 3/10 atoms
└── Button.test.tsx           # Present in 1/10 atoms (Skeleton only)
```

All atoms are flat — no subdirectories. Files are siblings. The dependency flow is:

```
component ← stories    (stories import component to render it)
component ← tests      (tests import component to test it)
stories ✗ tests         (independent)
```

**Kind definition:**

```typescript
type ComponentFiles = Kind<"ComponentFiles">;
type StoryFiles = Kind<"StoryFiles">;
type TestFiles = Kind<"TestFiles">;

type AtomVersion = Kind<"AtomVersion", {
  component: ComponentFiles;
  stories: StoryFiles;
  tests: TestFiles;
}, {
  // Component is a leaf — never imports stories or tests
  noDependency: [
    ["component", "stories"],
    ["component", "tests"],
    ["stories", "tests"],
    ["tests", "stories"],
  ];

  // Main component file must exist
  filesystem: {
    exists: ["component"];
  };

  // Atoms are pure presentational — no state management, no routing
  deniedExternals: {
    component: [
      "zustand", "@tanstack/react-query", "next/navigation",
      "next/router", "swr"
    ];
  };

  // Atoms should be pure (no side effects in module scope)
  purity: ["component"];
}>;

// Applied to each atoms/*/v*/ directory
export const buttonV1 = {
  component: { match: "*.tsx", exclude: ["*.stories.tsx", "*.test.tsx"] },
  stories:   { match: "*.stories.tsx" },
  tests:     { match: "*.test.tsx" },
} satisfies Instance<AtomVersion>;
```

**What this enforces:**
- Component files never import story or test files (prevents test code leaking into production)
- Stories and tests are independent (don't import each other)
- Atoms can't use state management libraries (they're pure presentational)
- At least one component file must exist in every version

**Available today:** `noDependency` (once file-pattern members ship), `filesystem.exists`, `purity`
**Proposed:** `deniedExternals`

### 11.4 Level 2: Atom Component (`atoms/Button/`)

**Observed structure:**

```
Button/
├── index.ts                 # Barrel export (present in 8/10 atoms)
└── v1.0.0/                  # Version directory (always exactly one)
    ├── Button.tsx
    ├── Button.stories.tsx
    └── Button.test.tsx
```

The barrel export re-exports from the active version:
```typescript
export { Button } from './v1.0.0/Button';
export type { ButtonProps } from './v1.0.0/Button';
```

**Kind definition:**

```typescript
type BarrelExport = Kind<"BarrelExport">;
type VersionDir = Kind<"VersionDir">;

type AtomComponent = Kind<"AtomComponent", {
  barrel: BarrelExport;
  version: VersionDir;      // v1.0.0/ (could be multiple in future)
}, {
  // Barrel can import from version (that's its purpose)
  // Version must NOT import from barrel (prevents circular re-export)
  noDependency: [
    ["version", "barrel"],
  ];

  // Barrel file must exist
  filesystem: {
    exists: ["barrel"];
  };

  // Each version subdirectory conforms to AtomVersion
  forEach: {
    member: "version";
    conformsTo: AtomVersion;
  };
}>;

export const button = {
  barrel:  { match: "index.ts" },
  version: { path: "v1.0.0" },
} satisfies Instance<AtomComponent>;
```

**What this enforces:**
- Every atom has a barrel `index.ts`
- Version directories don't import back up to the barrel
- Each version directory recursively conforms to the `AtomVersion` Kind from 11.3

### 11.5 Level 3: Molecule Version (`molecules/Form/v1.0.0/`)

**Observed structure** (4 molecules examined — Form, Card, Alert, Toast):

```
# Simple (Alert, Card)
v1.0.0/
├── Alert.tsx
└── Alert.stories.tsx

# Complex (Form)
v1.0.0/
├── Form.tsx                 # Main component
├── FormField.tsx            # Sub-component
├── FormGroup.tsx            # Sub-component
├── FormLabel.tsx            # Sub-component
├── FormHelperText.tsx       # Sub-component
├── FormContext.tsx           # React Context + hooks
├── Form.types.ts            # Dedicated types file
├── README.md                # Documentation
├── MIGRATION_GUIDE.md
└── INTEGRATION_EXAMPLES.md
```

Molecules add **types files** and **context/hooks** that atoms don't have. The dependency flow grows:

```
types ← context ← component ← stories
                              ← tests
```

**Kind definition:**

```typescript
type ComponentFiles = Kind<"ComponentFiles">;
type TypesFiles = Kind<"TypesFiles">;
type ContextFiles = Kind<"ContextFiles">;
type StoryFiles = Kind<"StoryFiles">;
type TestFiles = Kind<"TestFiles">;
type DocFiles = Kind<"DocFiles">;

type MoleculeVersion = Kind<"MoleculeVersion", {
  types: TypesFiles;
  context: ContextFiles;
  component: ComponentFiles;
  stories: StoryFiles;
  tests: TestFiles;
  docs: DocFiles;
}, {
  noDependency: [
    // Types is a leaf
    ["types", "context"], ["types", "component"],
    ["types", "stories"], ["types", "tests"], ["types", "docs"],

    // Context depends only on types
    ["context", "component"], ["context", "stories"], ["context", "tests"],

    // Components depend on types + context
    ["component", "stories"], ["component", "tests"],

    // Stories and tests are independent
    ["stories", "tests"], ["tests", "stories"],

    // Docs depend on nothing
    ["docs", "types"], ["docs", "context"], ["docs", "component"],
    ["docs", "stories"], ["docs", "tests"],
  ];

  filesystem: {
    exists: ["component"];
  };

  // Molecules shouldn't have their own service layer (that's organisms)
  deniedExternals: {
    component: ["zustand", "next/navigation"];
  };
}>;

export const formV1 = {
  types:     { match: "*.types.ts" },
  context:   { match: "*Context.tsx" },
  component: { match: "*.tsx", exclude: ["*Context.tsx", "*.stories.tsx", "*.test.tsx"] },
  stories:   { match: "*.stories.tsx" },
  tests:     { match: "*.test.tsx" },
  docs:      { match: "*.md" },
} satisfies Instance<MoleculeVersion>;
```

**What's new vs atoms:**
- `types` member: dedicated `.types.ts` files are a leaf (everything can import types, types import nothing)
- `context` member: React Context files depend on types but components depend on context
- `docs` member: markdown files are inert (no imports, not imported)
- Molecules still can't use routing or state management (that's for organisms/pages)

### 11.6 Level 4: Organism Version (`organisms/DocumentManager/v1.0.0/`)

**Observed structure** (4 organisms examined):

```
# Complex (DocumentManager, ReleasesManager)
v1.0.0/
├── DocumentList.tsx           # UI component
├── DocumentSearch.tsx         # UI component
├── DocumentSettings.tsx       # UI component
├── DocumentTaxonomy.tsx       # UI component
├── DocumentTemplates.tsx      # UI component
├── DocumentVersionHistory.tsx # UI component
├── DocumentCollaboration.tsx  # UI component
├── RichTextEditor.tsx         # UI component
├── document.types.ts          # Types (58 lines)
├── document.service.ts        # API service class
├── document.validation.ts     # Zod schemas
├── useDocuments.ts            # State management hook
└── useDocuments.test.ts       # Hook tests

# Simple (Studio, CreateReleaseForm)
v1.0.0/
├── StudioHeader.tsx
└── StudioSidebar.tsx
```

Organisms introduce the **service layer** and **validation layer**. The dependency flow is the richest of any flat directory:

```
types ← validation ← service ← hook ← component ← stories
                                                   ← tests
```

**Kind definition:**

```typescript
type TypesFiles = Kind<"TypesFiles">;
type ValidationFiles = Kind<"ValidationFiles">;
type ServiceFiles = Kind<"ServiceFiles">;
type HookFiles = Kind<"HookFiles">;
type ComponentFiles = Kind<"ComponentFiles">;
type StoryFiles = Kind<"StoryFiles">;
type TestFiles = Kind<"TestFiles">;

type OrganismVersion = Kind<"OrganismVersion", {
  types: TypesFiles;
  validation: ValidationFiles;
  service: ServiceFiles;
  hook: HookFiles;
  component: ComponentFiles;
  stories: StoryFiles;
  tests: TestFiles;
}, {
  noDependency: [
    // Types is a leaf — depended on by everything, depends on nothing
    ["types", "validation"], ["types", "service"], ["types", "hook"],
    ["types", "component"], ["types", "stories"], ["types", "tests"],

    // Validation depends only on types
    ["validation", "service"], ["validation", "hook"],
    ["validation", "component"], ["validation", "stories"],

    // Service depends on types + validation (API calls + schema validation)
    ["service", "hook"], ["service", "component"], ["service", "stories"],

    // Hook depends on types + validation + service (orchestrates data flow)
    ["hook", "component"], ["hook", "stories"],

    // Component is the UI surface
    ["component", "stories"], ["component", "tests"],

    // Stories and tests are terminal
    ["stories", "tests"], ["tests", "stories"],
  ];

  filesystem: {
    exists: ["component", "types"];
  };

  // Organisms are framework-agnostic — no Next.js imports
  deniedExternals: {
    component: ["next/navigation", "next/router", "next/link"];
    service: ["react", "react-dom"];  // services are pure logic, no React
  };
}>;

export const documentManagerV1 = {
  types:      { match: "*.types.ts" },
  validation: { match: "*.validation.ts" },
  service:    { match: "*.service.ts" },
  hook:       { match: "use*.ts", exclude: ["*.test.ts"] },
  component:  { match: "*.tsx", exclude: ["*.stories.tsx", "*.test.tsx"] },
  stories:    { match: "*.stories.tsx" },
  tests:      { match: "*.test.ts{,x}" },
} satisfies Instance<OrganismVersion>;
```

**What's new vs molecules:**
- `service` member: class-based API client (depends on types + validation, independent of React)
- `validation` member: Zod schemas (depends only on types)
- `hook` member: React Query integration hooks (depends on service + types)
- Service files are banned from importing React (enforces separation of API logic from UI)
- Component files are banned from importing Next.js (organisms must be framework-agnostic)

### 11.7 Level 5: Page Version — Simple (`Pages/LoginPage/v1.0.0/`)

**Observed structure** (most pages are simple):

```
v1.0.0/
├── LoginPage.tsx
└── LoginPage.stories.tsx
```

Simple pages look exactly like atoms — a component file and optionally stories/tests. They use the same Kind shape as `AtomVersion` from 11.3 but with different external dependency rules:

```typescript
// Simple pages reuse AtomVersion shape but with relaxed externals
// Pages ARE allowed to use next/navigation, next/router, etc.
// Pages ARE allowed to import from organisms, molecules, atoms

type SimplePageVersion = Kind<"SimplePageVersion", {
  component: Kind<"ComponentFiles">;
  stories: Kind<"StoryFiles">;
  tests: Kind<"TestFiles">;
}, {
  noDependency: [
    ["component", "stories"],
    ["component", "tests"],
    ["stories", "tests"],
    ["tests", "stories"],
  ];

  filesystem: {
    exists: ["component"];
  };

  // Pages CAN use routing (unlike organisms/molecules/atoms)
  // No deniedExternals — pages are the integration point
}>;
```

### 11.8 Level 6: Page Version — Complex (`Pages/DashboardPage/v1.0.0/`)

**Observed structure** (DashboardPage is the only complex page):

```
v1.0.0/
├── dashboard.service.ts            # Root-level service
├── .version.json                   # Version metadata
├── metadata.json                   # Component metadata
├── dependencies.json               # Dependency tracking
├── README.md
├── GOLDEN_PAGE_REFERENCE.md
├── types/
│   └── dashboard.types.ts          # 7 interfaces
├── validation/
│   └── dashboard.validation.ts     # 13 Zod schemas
├── data/
│   ├── dashboard.queries.ts        # 5 React Query hooks
│   ├── dashboard.queries.validated.ts
│   ├── dashboard.queries.test.ts
│   └── dashboard.mocks.ts          # Mock data
├── domain/
│   ├── DashboardPageContext.tsx     # React Context
│   ├── useDashboard.ts             # Main hook (127 lines)
│   ├── useDashboard.test.tsx
│   ├── hooks/
│   └── utils/
├── ui/
│   ├── DashboardPage.tsx           # Main component (372 lines)
│   ├── DashboardPage.test.tsx
│   ├── DashboardPage.stories.tsx
│   ├── DashboardPageSimple.tsx
│   ├── DashboardPageSimple.stories.tsx
│   ├── DashboardPage.optimized.tsx
│   ├── sections/
│   │   ├── StatsSection.tsx
│   │   ├── RecentActivitySection.tsx
│   │   └── QuickActionsSection.tsx
│   └── styles/
└── tests/
    └── dashboard.integration.test.tsx
```

This is the one level where **current KindScript already works** — it has real subdirectories that map naturally to members. This is essentially what was modeled in 10.4, but now positioned in the bottom-up context:

```typescript
type TypesLayer = Kind<"TypesLayer">;
type ValidationLayer = Kind<"ValidationLayer">;
type DataLayer = Kind<"DataLayer">;
type DomainLayer = Kind<"DomainLayer">;
type UILayer = Kind<"UILayer">;
type TestsLayer = Kind<"TestsLayer">;

type ComplexPageVersion = Kind<"ComplexPageVersion", {
  types: TypesLayer;
  validation: ValidationLayer;
  data: DataLayer;
  domain: DomainLayer;
  ui: UILayer;
  tests: TestsLayer;
}, {
  noDependency: [
    // types is a leaf
    ["types", "validation"], ["types", "data"],
    ["types", "domain"], ["types", "ui"],

    // validation depends only on types
    ["validation", "data"], ["validation", "domain"], ["validation", "ui"],

    // data depends on types + validation
    ["data", "domain"], ["data", "ui"],

    // domain depends on types + validation + data
    ["domain", "ui"],

    // ui depends on everything above (it's the presentation surface)
    // tests can import from anywhere (no constraints on tests)
  ];

  filesystem: {
    exists: ["types", "domain", "data", "ui"];
  };
}>;

export const dashboardV1 = {
  types:      { path: "types" },
  validation: { path: "validation" },
  data:       { path: "data" },
  domain:     { path: "domain" },
  ui:         { path: "ui" },
  tests:      { path: "tests" },
} satisfies Instance<ComplexPageVersion>;
```

**This is implementable with KindScript today.** No new features needed — just a `.k.ts` file placed in `DashboardPage/v1.0.0/`.

### 11.9 Level 7: Component Wrapper (`<Component>/`)

Every component at every tier (atom, molecule, organism, page) follows the same wrapper pattern:

```
Button/               # or Form/, DocumentManager/, DashboardPage/
├── index.ts          # Barrel export
├── v1.0.0/           # Active version
├── v1.1.0/           # Future version (may be empty scaffold)
└── v2.0.0/           # Breaking change version
```

A single Kind covers all tiers:

```typescript
type BarrelExport = Kind<"BarrelExport">;
type ActiveVersion = Kind<"ActiveVersion">;
type FutureVersion = Kind<"FutureVersion">;

type VersionedComponent = Kind<"VersionedComponent", {
  barrel: BarrelExport;
  active: ActiveVersion;
}, {
  // Version directories don't import back to barrel
  noDependency: [
    ["active", "barrel"],
  ];

  filesystem: {
    exists: ["barrel", "active"];
  };

  // Active version must conform to the appropriate tier Kind
  // (AtomVersion, MoleculeVersion, OrganismVersion, or ComplexPageVersion)
  // This binding happens at the forEach level (see 11.10)
}>;
```

### 11.10 Assembly: How the Levels Connect

The bottom-up Kinds connect through `forEach` constraints on the design system Kind from 10.2. Here's how the full hierarchy wires together:

```typescript
type StorybookDesignSystem = Kind<"StorybookDesignSystem", {
  atoms: Kind<"AtomLayer">;
  molecules: Kind<"MoleculeLayer">;
  organisms: Kind<"OrganismLayer">;
  pages: Kind<"PageLayer">;
  // ... (common, core, utils, etc. from 10.2)
}, {
  // Top-down: atomic design hierarchy (from 10.2)
  noDependency: [
    ["atoms", "molecules"], ["atoms", "organisms"], ["atoms", "pages"],
    ["molecules", "organisms"], ["molecules", "pages"],
    ["organisms", "pages"],
    // ... rest of 10.2 constraints
  ];

  // Bottom-up: every child must conform to its tier's Kind
  forEach: [
    { member: "atoms";     pattern: "*/v*/"; conformsTo: AtomVersion; },
    { member: "molecules"; pattern: "*/v*/"; conformsTo: MoleculeVersion; },
    { member: "organisms"; pattern: "*/v*/"; conformsTo: OrganismVersion; },
    // Pages use mixed: simple pages get SimplePageVersion,
    // complex pages (with subdirectories) get ComplexPageVersion
    { member: "pages";     pattern: "*/v*/"; conformsTo: SimplePageVersion;
      unless: { hasSubdirectories: true; then: ComplexPageVersion; }; },
  ];
}>;
```

This creates a **two-dimensional enforcement grid**:
- **Horizontal** (top-down): atoms can't import molecules, molecules can't import organisms, etc.
- **Vertical** (bottom-up): inside each version directory, types can't import components, services can't import hooks, etc.

### 11.11 Implementation Roadmap

Start with what works today, build outward:

| Phase | What | KindScript Feature | Status |
|-------|------|-------------------|--------|
| **Phase 1** | `DashboardPage/v1.0.0/` internal layers | `noDependency` on subdirectories | **Available now** |
| **Phase 2** | Design system hierarchy (atoms→pages) | `noDependency` on `components/` children | **Available now** |
| **Phase 3** | Organism version layering | File-pattern members (`match`) | Needs implementation |
| **Phase 4** | Molecule version layering | File-pattern members (`match`) | Needs implementation |
| **Phase 5** | Atom version constraints | File-pattern members + `deniedExternals` | Needs implementation |
| **Phase 6** | Template application (forEach) | `forEach` constraint | Needs implementation |
| **Phase 7** | Full assembly | All of the above | Needs implementation |

**Recommended starting order:**

1. **Today:** Place a `.k.ts` in `DashboardPage/v1.0.0/` with the `ComplexPageVersion` Kind (11.8). This is immediately enforceable and validates the most architecturally complex component.

2. **Today:** Place a `.k.ts` in `apps/storybook/src/` with the design system Kind (10.2). This enforces atoms→molecules→organisms→pages hierarchy across the entire component library.

3. **Build next:** File-pattern members — this unlocks enforcement of flat directories (organisms, molecules, atoms). The organism version Kind (11.6) is the highest-value target because organisms have the richest internal layering.

4. **Build after:** `forEach` / template Kinds — this removes the need to place a `.k.ts` file in every single version directory. One declaration enforces the shape across all components of a tier.

5. **Build last:** `deniedExternals` — this enforces that atoms stay pure-presentational, organisms stay framework-agnostic, and services don't import React.

### 11.12 New KindScript Features Summary

| Feature | Description | Unlocks |
|---------|-------------|---------|
| **File-pattern members** | `{ match: "*.tsx", exclude: [...] }` in Instance | Enforcement of flat directories (Levels 1-4, 5, 7) |
| **`forEach` constraint** | Apply a Kind to every child matching a pattern | Template Kinds — one declaration, many directories (Level 8) |
| **`deniedExternals`** | Ban specific npm packages from a member | Tier-appropriate library restrictions (all levels) |
| **Conditional `forEach`** | Different Kind based on directory shape | Simple vs complex page detection (Level 8) |

The file-pattern members feature is the single most impactful addition — it transforms KindScript from a tool that only works on directory-structured code to one that can enforce **any** codebase's internal conventions, regardless of whether the code uses subdirectories or flat file colocation.

---

*Analysis performed against `induction-studio` codebase on branch `backup/pnpm-setup` as of 2026-02-08, correlated with gap analysis and dev directory analysis provided by the user.*
