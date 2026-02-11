<div align="center">

# KindScript

**TypeScript for Architecture**

Define architectural patterns as types. Enforce them at compile time.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.8.0--m8-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-350%20passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

[Documentation](https://kindscript.ai/docs) · [Interactive Tutorial](https://kindscript.ai/tutorial) · [Examples](docs/05-examples.md) · [Agent](https://kindscript.ai/agent)

</div>

---

TypeScript checks if values match types. KindScript checks if codebases match architectures. Same idea, same toolchain.

```
          TypeScript                         KindScript
   ─────────────────────────        ─────────────────────────────

   type User = {                    type App = Kind<"App", {
     name: string;                    domain: DomainLayer;
     age: number;                     infra: InfraLayer;
   }                                }>

   const user: User = {             export const app = {
     name: "Alice",                   domain: {},
     age: 30,                         infra: {},
   }                                } satisfies Instance<App, '.'>

   "does this value                 "does this codebase
    match the type?"                 match the architecture?"
```

## Why KindScript?

**Before KindScript:** A new developer imports a database client from the domain layer. It ships. Someone catches it in a PR review three days later -- or nobody catches it, and the architecture quietly erodes.

**After KindScript:** The import gets a red squiggly the moment it's typed. `KS70001: Forbidden dependency: domain → infra`. It never reaches code review. The architecture is enforced by the same compiler that checks your types.

- **New developers can't accidentally break architecture** -- violations surface in the IDE, not in code review
- **Restructuring is safe** -- rename or move a layer and the compiler shows you every violation
- **The architecture is always documented** -- definition files are the living source of truth
- **Adopt incrementally** -- enforce one rule at a time on an existing codebase
- **Nothing ships to production** -- compile-time only, zero runtime overhead

## Quick Start

### 1. Define your architecture (`src/context.ts`)

```typescript
import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type InfraLayer  = Kind<"InfraLayer">;

type App = Kind<"App", {
  domain: DomainLayer;
  infra: InfraLayer;
}, {
  noDependency: [["domain", "infra"]];  // domain cannot import from infra
}>;

export const app = { domain: {}, infra: {} } satisfies Instance<App, '.'>;
```

That's it. `domain/` maps to `src/domain/`, `infra/` maps to `src/infra/`. The compiler now enforces that nothing in `domain/` imports from `infra/`.

### 2. Check

```bash
$ ksc check
src/domain/service.ts:12:1 - error KS70001: Forbidden dependency: domain → infra (src/domain/service.ts → src/infra/database.ts)

  12 import { Db } from '../infra/database';
     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Found 1 architectural violation.
```

### 3. IDE integration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "kindscript" }]
  }
}
```

Violations appear inline in VS Code, Vim, Emacs, WebStorm -- any editor using tsserver. Same red squiggles as a type error.

## What Can It Enforce?

**Dependency direction** -- forbid imports between layers:

```typescript
noDependency: [["domain", "infra"]]
```
```
src/domain/service.ts:3:1 - error KS70001: Forbidden dependency: domain → infra (src/domain/service.ts → src/infra/database.ts)
```

**Purity** -- mark a layer side-effect-free (no `fs`, `http`, `crypto`, etc.):

```typescript
type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;
```
```
src/domain/service.ts:1:1 - error KS70003: Impure import in 'domain': 'fs'
```

**Cycle detection** -- no circular dependencies between layers:

```typescript
noCycles: ["domain", "application", "infra"];
```
```
error KS70004: Circular dependency detected: domain → infra → domain
```

**Wrapped Kind composability** -- group exports by architectural role and enforce constraints between groups:

```typescript
import type { Kind, InstanceOf } from 'kindscript';

type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;
type Effector = Kind<"Effector", {}, {}, { wraps: EffectorFn }>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
  effectors: Effector;
}, {
  noDependency: [["deciders", "effectors"]];
}>;

// Export declarations using InstanceOf
export const applyDiscount: InstanceOf<Decider> = (order) => { /* ... */ };
export const notifyOrder: InstanceOf<Effector> = (order) => { /* ... */ };
```
```
src/domain/apply-discount.ts:1:1 - error KS70001: Forbidden dependency: deciders → effectors (src/domain/apply-discount.ts → src/domain/notify-order.ts)
```

Three user-declared constraint types, plus three structural constraints that are checked automatically. See [Constraints documentation](docs/03-constraints.md) for full details.

<details>
<summary>All diagnostic codes</summary>

| Code | Constraint | Description |
|------|-----------|-------------|
| KS70001 | noDependency | Forbidden dependency |
| KS70003 | purity | Impure import in pure layer |
| KS70004 | noCycles | Circular dependency |
| KS70005 | scope | Scope mismatch (instance location vs Kind scope) |
| KS70006 | overlap | Two sibling members claim the same file(s) |
| KS70007 | exhaustive | File not assigned to any member (opt-in) |

</details>

## How does it compare?

| Feature | KindScript | dependency-cruiser | Nx boundaries | eslint-plugin-boundaries |
|---------|:---:|:---:|:---:|:---:|
| Dependency rules | ✓ | ✓ | ✓ | ✓ |
| Cycle detection | ✓ | ✓ | | |
| IDE inline errors | ✓ | | ✓ | ✓ |
| Behavioral rules (purity) | ✓ | | | |
| TS-native definitions (no config/DSL) | ✓ | | | |
| Works with any tsserver editor | ✓ | | | ✓ |

Other tools solve pieces of this. KindScript is the only one that covers dependency and behavioral rules from a single TS-native mechanism -- with IDE support out of the box.

## How It Works

KindScript piggybacks on TypeScript's own compiler -- same scanner, parser, and type checker -- then adds four stages that produce standard `ts.Diagnostic` objects:

```
TypeScript phases (reused as-is):     scan → parse → bind → check
                                                                ↓
KindScript stages (new):              KS scan → KS parse → KS bind → KS check
                                                                          ↓
                                                                    ts.Diagnostic
                                                                    (same format)
                                                                          ↓
                                                            IDE / CLI / CI exit code
```

Violations appear alongside regular TypeScript errors -- same format, same tooling, zero new infrastructure. See [Architecture](docs/01-architecture.md) for the full pipeline walkthrough.

## Learn More

| Resource | What it covers |
|----------|---------------|
| [Architecture](docs/01-architecture.md) | Full pipeline walkthrough, layers, data flow |
| [Kind System](docs/02-kind-system.md) | Kind syntax, instances, location resolution, discovery |
| [Constraints](docs/03-constraints.md) | All 6 constraint types, plugin architecture |
| [Examples](docs/05-examples.md) | Real-world modeling (Clean Architecture, Atomic Design, monorepos) |
| [Decisions](docs/decisions/) | Architecture Decision Records (32 ADRs) |

### Interactive notebooks

Jupyter notebooks in `notebooks/` provide hands-on walkthroughs:

| Notebook | What you'll learn |
|----------|-------------------|
| [01-quickstart](notebooks/01-quickstart.ipynb) | Define, check, break, fix — all 3 constraint types |
| [02-real-world](notebooks/02-real-world.ipynb) | Multi-instance bounded contexts with a real codebase |
| [03-typekind](notebooks/03-typekind.ipynb) | Wrapped Kind composability: declaration-level enforcement |

For a static walkthrough (no Deno kernel required), see [Tutorial](docs/06-tutorial.md).

### Interactive tutorial

The `tutorial/` directory contains a browser-based interactive tutorial built with [TutorialKit](https://tutorialkit.dev). Edit files and run `npx ksc check .` directly in the browser. See [tutorial/README.md](tutorial/README.md) for setup.

### Documentation Website

The KindScript documentation site is built with Next.js 15 and Nextra 4, featuring:

- Complete documentation from `docs/`
- All 32 Architecture Decision Records (ADRs)
- Interactive tutorial with live Monaco editor and WebContainer-powered terminal
- Full-text search via Pagefind

**Live site:** https://website-five-theta-38.vercel.app

**Local development:**
```bash
cd website
npm install
npm run dev  # http://localhost:3000
```

The site is deployed automatically via GitHub Actions. See [website/README.md](website/README.md) and [website/DEPLOYMENT.md](website/DEPLOYMENT.md) for details.

## Project Status

All core functionality is implemented and tested. 31 test suites, 350 tests, 100% passing.

**What's working:** All 6 constraint types (3 user-declared + 3 structural), Wrapped Kind composability, CLI (`ksc check`), TypeScript language service plugin (inline diagnostics + code fixes).

**Roadmap:** Watch mode, incremental compilation, diagnostic `relatedInformation` linking to contract definitions.

## Contributing

```bash
npm install && npm run build && npm test   # Clone, build, verify
```

KindScript itself follows strict Clean Architecture -- the domain layer has zero external dependencies. See [Architecture](docs/01-architecture.md) for the source layout and [Testing Guide](tests/README.md) for how to write tests. [CLAUDE.md](CLAUDE.md) is the full development guide.

## License

MIT
