# KindScript Documentation

## Directory Structure

```
docs/
├── architecture/          Core reference (start here)
│   ├── COMPILER_ARCHITECTURE.md   The complete architectural specification (V4)
│   ├── BUILD_PLAN.md              Incremental implementation roadmap (M0-M8)
│   └── DESIGN_DECISIONS.md        Decision rationale (Build/Wrap/Skip choices)
│
├── status/                Current state
│   ├── DONE_VS_TODO.md            Implementation progress (v0.8.0-m8)
│   ├── CODEBASE_REVIEW.md         Deep technical review & issues
│   └── CLEANUP_PLAN.md            Remaining cleanup work
│
├── design/                Active design explorations
│   ├── KIND_DERIVED_LOCATIONS.md   locate<T>() and derived locations
│   ├── KIND_INSTANCE_DESIGN.md     Location/instance model
│   ├── MEMBER_KIND_TYPES.md        Member Kind type analysis
│   └── FILESYSTEM_CONSTRAINTS.md   Filesystem constraint analysis
│
└── archive/               Historical (do not use for implementation)
    ├── architecture/      V1-V3 compiler architecture specs
    ├── milestones/        Completed milestone plans (M0-M8)
    └── test-consolidation/  Completed test consolidation work
```

---

## Reading Order

**Implementing a feature:**
1. [COMPILER_ARCHITECTURE.md](architecture/COMPILER_ARCHITECTURE.md) — relevant section
2. [BUILD_PLAN.md](architecture/BUILD_PLAN.md) — relevant milestone
3. [tests/README.md](../tests/README.md) — testing guide

**Reviewing the architecture:**
1. [COMPILER_ARCHITECTURE.md](architecture/COMPILER_ARCHITECTURE.md) — full spec
2. [DESIGN_DECISIONS.md](architecture/DESIGN_DECISIONS.md) — rationale
3. [CODEBASE_REVIEW.md](status/CODEBASE_REVIEW.md) — current issues

**Onboarding:**
1. [README.md](../README.md) — project overview
2. [CLAUDE.md](../CLAUDE.md) — development guide
3. [BUILD_PLAN.md](architecture/BUILD_PLAN.md) — M0-M2

---

## Quick Reference

| Question | Document |
|----------|----------|
| How does the binder work? | [COMPILER_ARCHITECTURE.md](architecture/COMPILER_ARCHITECTURE.md) Part 4.1 |
| How do contracts work? | [COMPILER_ARCHITECTURE.md](architecture/COMPILER_ARCHITECTURE.md) Part 4.3 |
| Why plugin instead of LSP? | [DESIGN_DECISIONS.md](architecture/DESIGN_DECISIONS.md) Opportunity 1 |
| Why no ts-morph? | [DESIGN_DECISIONS.md](architecture/DESIGN_DECISIONS.md) Opportunity 5 |
| What's the build order? | [COMPILER_ARCHITECTURE.md](architecture/COMPILER_ARCHITECTURE.md) Part 9 |
| What's in Milestone 1? | [BUILD_PLAN.md](architecture/BUILD_PLAN.md) Milestone 1 |
| What's done vs remaining? | [DONE_VS_TODO.md](status/DONE_VS_TODO.md) |
| What cleanup is needed? | [CLEANUP_PLAN.md](status/CLEANUP_PLAN.md) |
| How does inference work? | [COMPILER_ARCHITECTURE.md](architecture/COMPILER_ARCHITECTURE.md) Part 4.6 |

---

## Document Evolution

V1 → V2: Corrected "dual front-end" to single front-end (TypeScript parser for all .ts files).
V2 → V3: Fixed 9 major issues (binder-checker boundary, symbol-to-files resolution, contract trust, etc.).
V3 → V4: Simplified based on ecosystem evidence (plugin API, no ts-morph, npm stdlib packages).

Old versions preserved in `archive/architecture/` for historical context. **Do not use them for implementation.**

---

## Contributing

- Update `architecture/` docs when architectural decisions change
- Update `status/` docs when implementation progress changes
- Add to `design/` for new design explorations
- Move completed work to `archive/` when done
