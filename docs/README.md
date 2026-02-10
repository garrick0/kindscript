# KindScript Documentation

## Chapters

| # | Chapter | What's in it |
|---|---------|-------------|
| 1 | [Architecture](01-architecture.md) | System overview, compiler pipeline, layers, data flow, source layout |
| 2 | [Kind System](02-kind-system.md) | Kind syntax, TypeKind, instances, location resolution, scope validation, discovery |
| 3 | [Constraints](03-constraints.md) | All 3 constraint types, plugin architecture, Constraints |
| 4 | [Decisions](04-decisions.md) | Key decisions log (D1–D18: plugin vs LSP, drop .k.ts, unified Kind, etc.) |
| 5 | [Examples](05-examples.md) | Real-world patterns: Clean Architecture, design systems, bounded contexts |
| 6 | [Tutorial](06-tutorial.md) | Progressive walkthrough: first constraint to real-world modeling |

---

## Reading Order

**Onboarding:**
1. [README.md](../README.md) — project overview
2. [CLAUDE.md](../CLAUDE.md) — development guide
3. [01-architecture.md](01-architecture.md) — system overview
4. [06-tutorial.md](06-tutorial.md) — step-by-step walkthrough

**Implementing a feature:**
1. [01-architecture.md](01-architecture.md) — relevant section
2. [03-constraints.md](03-constraints.md) — if adding/modifying constraints
3. [tests/README.md](../tests/README.md) — testing guide

**Understanding a decision:**
1. [04-decisions.md](04-decisions.md) — rationale for all major decisions

---

## Quick Reference

| Question | Chapter |
|----------|---------|
| How does the pipeline work? | [01-architecture.md](01-architecture.md) — Compiler Pipeline |
| How do I define a Kind? | [02-kind-system.md](02-kind-system.md) — Kind Definitions |
| What constraints are available? | [03-constraints.md](03-constraints.md) — Constraint Types |
| How do I add a new constraint? | [03-constraints.md](03-constraints.md) — Adding a New Constraint Type |
| Why plugin instead of LSP? | [04-decisions.md](04-decisions.md) — D1 |
| Why no .k.ts extension? | [04-decisions.md](04-decisions.md) — D9 |
| How do I model a design system? | [05-examples.md](05-examples.md) — Design System |
| How do bounded contexts work? | [05-examples.md](05-examples.md) — Bounded Contexts |
| How do I learn KindScript step by step? | [06-tutorial.md](06-tutorial.md) — Tutorial |
| How do I use TypeKind? | [02-kind-system.md](02-kind-system.md) — TypeKind |
| How does scope validation work? | [02-kind-system.md](02-kind-system.md) — Scope Validation |
| How do I write tests? | [tests/README.md](../tests/README.md) — Testing guide |

---

## Directory Structure

```
docs/                                Source of truth (checked in)
├── README.md                        This file (index)
├── 01-architecture.md               System overview + pipeline + layers
├── 02-kind-system.md                Kind syntax + instances + discovery
├── 03-constraints.md                All 3 constraints + plugin architecture
├── 04-decisions.md                  Key decisions log
├── 05-examples.md                   Real-world modeling examples
├── 06-tutorial.md                   Progressive walkthrough + real-world narrative
└── archive/                         Historical — do not use for implementation
    ├── architecture/                V1–V4 compiler specs + design decisions
    ├── design/                      24 completed design explorations
    ├── milestones/                  Completed milestone plans (M0–M8)
    └── test-consolidation/          Completed test consolidation work

.working/                            Working docs (gitignored, not checked in)
├── *.md                             Active design explorations
└── archive/                         Completed working docs
```

---

## Working Documents Convention

Active design explorations and scratch documents live in `.working/` at the project root (gitignored — not checked in). This keeps the committed `docs/` directory clean and authoritative.

**Lifecycle:**
1. Create a working document in `.working/` for design exploration
2. When the exploration is complete, uplift the relevant findings into the appropriate `docs/` chapter
3. Archive the working document by moving it to `.working/archive/`

**Key rule:** `.working/` documents are never the source of truth. If something is decided, it must be reflected in the `docs/` chapter files. Working documents are disposable scratchpads.

---

## Contributing

- **Update chapter files** when architectural decisions or constraints change
- **Add new decisions** as numbered entries in `04-decisions.md`
- **Use `.working/`** for design explorations (not checked in)
- **Uplift findings** from `.working/` into chapters when done, then archive the working doc
- **Update this README** if chapters are added or reorganized
