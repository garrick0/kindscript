# KindScript Documentation

This directory contains the architectural design documents and implementation plans for KindScript.

## Current Documents

These are the active, authoritative documents:

### [ANALYSIS_COMPILER_ARCHITECTURE_V4.md](ANALYSIS_COMPILER_ARCHITECTURE_V4.md)
**The complete architectural specification.**

- **Purpose:** Define how KindScript should be built, structurally parallel to TypeScript's compiler
- **Audience:** Developers implementing KindScript, future maintainers, architectural reviewers
- **Key Sections:**
  - Part 1: TypeScript's internal architecture (what we're building on)
  - Part 2: Single front-end architecture (corrected from earlier versions)
  - Part 3: Structural mapping (TypeScript ↔ KindScript component correspondence)
  - Part 4: What KindScript adds beyond TypeScript (binder, checker, host, inference, generator)
  - Part 5: Language Service Plugin architecture (not custom LSP)
  - Part 6: Watch mode and incremental compilation
  - Part 7: Standard library distribution (npm packages)
  - Part 8: Module structure
  - Part 9: Build order (phases 0-7)
  - Part 10: Summary (Build/Wrap/Skip decisions)

**Key Decisions:**
- Use TypeScript's own scanner, parser, AST
- Plugin API instead of custom LSP server
- Direct ts.Diagnostic (no custom ArchDiagnostic type)
- No ts-morph dependency (raw compiler API throughout)
- npm packages for standard library (@kindscript/*)

**When to read:** Before implementing any component. This is the source of truth for "what" and "why."

---

### [BUILD_PLAN_INCREMENTAL.md](BUILD_PLAN_INCREMENTAL.md)
**The incremental implementation roadmap.**

- **Purpose:** Define *how* to build KindScript incrementally with customer validation at each milestone
- **Audience:** Development team, project managers, stakeholders
- **Key Sections:**
  - Architectural Foundation: Ports & Adapters (Clean Architecture layers)
  - Milestone 0: Domain + Ports + Test Infrastructure (1 week)
  - Milestone 1: Single Contract End-to-End (2 weeks) — First customer value
  - Milestone 2: Real Classifier (3 weeks) — Type-safe definitions
  - Milestone 3: Full Contract Suite (3 weeks) — Complete checking
  - Milestone 4: Project References (1 week) — Zero-config quick start
  - Milestone 5: Language Service Plugin (2 weeks) — IDE integration
  - Milestone 6: Inference Engine (2 weeks) — Adoption accelerator
  - Milestone 7: Generator (2 weeks) — Code generation
  - Milestone 8: Standard Library Packages (ongoing) — Ecosystem
  - Appendix: Jupyter Notebooks for UX Demonstrations

**Milestone Structure:**
Each milestone includes:
- Duration estimate
- Customer value delivered
- What we build (with code examples)
- Success criteria
- Reference to relevant V4 architecture sections

**Key Principles:**
- Strict Clean Architecture (domain → application → infrastructure)
- Ports defined in application layer, implemented in infrastructure
- Mock implementations for testing (validate architecture early)
- Customer validation gate at each milestone
- Jupyter notebooks for UX validation before customer release

**Total Timeline:** 16 weeks (4 months) to full feature set

**When to read:** Before starting implementation, when planning sprints, when onboarding new developers.

---

### [REVIEW_LEVERAGING_TS_INFRASTRUCTURE.md](REVIEW_LEVERAGING_TS_INFRASTRUCTURE.md)
**Critical review of V3 with corrections that led to V4.**

- **Purpose:** Document the decision-making process, evaluation of "build vs leverage TypeScript"
- **Audience:** Developers wanting to understand *why* specific architectural choices were made
- **Key Sections:**
  - Opportunity 1: Language Service Plugin (STRONGLY AGREE — use TS plugin API)
  - Opportunity 2: TS Module Resolution (REFINE — keep host abstraction)
  - Opportunity 3: Project References (AGREE with caveats — opt-in, not foundational)
  - Opportunity 4: TS Watch Infrastructure (REJECT — need separate .ksbuildinfo)
  - Opportunity 5: ts-morph (PARTIAL — use for generator only) → Later changed to REJECT
  - Opportunity 6: npm Package Distribution (STRONGLY AGREE — like @types/*)
  - Summary: Decision Matrix (Build/Wrap/Skip for each component)

**Key Insights:**
- Plugin architecture is simpler and more correct than custom LSP
- getDependencyEdges is genuinely novel (combines import graph + symbol-to-files)
- Project references have real costs (destructive, requires declaration emit)
- .ksbuildinfo needed for architectural facts (different from source code facts)
- Raw TypeScript API sufficient for classifier (~100-150 lines)

**When to read:** When questioning an architectural decision, when someone proposes changing a Build/Wrap/Skip choice.

---

## Document Evolution

### V1 → V2
**Problem:** V1 claimed "dual front-end" (definition parser + fact extractors)
**Fix:** V2 showed single front-end (TypeScript parser for all .ts files, filesystem accessed via host)

### V2 → V3
**Problems in V2:**
- Binder-checker boundary contradiction
- resolveFilesForSymbol treated as trivial
- Incremental only handled file content changes (not structural changes)
- No error recovery strategy
- Contract trust problem unaddressed
- lib.d.ts mapping was wrong
- Inference undersold
- Diagnostic deduplication unaddressed
- Host cache methods leaked implementation

**Fixes in V3:**
- Clarified binder records, checker resolves
- Symbol-to-files resolution as first-class design concern
- Three-trigger invalidation (content, structural, definition)
- Error recovery strategy (partial analysis)
- Two-tier contract system (safe descriptors + powerful functions)
- Standard kind library (lib.clean-architecture.ts, etc.)
- Inference as separate component (not emitter in reverse)
- Diagnostic deduplication via relatedInformation
- Removed cache methods from host interface

### V3 → V4
**Problems in V3:**
- Still proposed more custom components than necessary
- Didn't leverage TypeScript's plugin API
- Over-engineering in several areas

**Fixes in V4 (based on ecosystem evidence):**
- Plugin API instead of custom LSP (like Angular Language Service)
- Direct ts.Diagnostic (no custom ArchDiagnostic type)
- Project references as opt-in Phase 0.5 (with honest costs)
- Simplified watch mode (hook tsserver, add structural watcher)
- No ts-morph dependency (raw API throughout)
- npm packages for standard library (like @types/*)

---

## How to Read These Documents

**If you're implementing a feature:**
1. Read the relevant V4 Part (e.g., Part 4.1 for the binder)
2. Read the corresponding milestone in BUILD_PLAN (e.g., M2 for the binder)
3. Check REVIEW if you want to understand why a specific choice was made

**If you're reviewing the architecture:**
1. Start with V4 (complete specification)
2. Check REVIEW for the decision-making process
3. Check BUILD_PLAN for feasibility and sequencing

**If you're onboarding:**
1. Read README.md (project overview)
2. Read BUILD_PLAN M0-M2 (first three milestones)
3. Read V4 Parts 1-4 (core architecture)
4. Refer back as needed during implementation

**If you're questioning a decision:**
1. Check V4 for the current spec
2. Check REVIEW for the rationale
3. If still unclear, check archive/ for historical context

---

## Archive

Old versions preserved in [archive/](archive/) for historical reference:

- `ANALYSIS_COMPILER_ARCHITECTURE.md` (V1) — Original design, dual front-end (incorrect)
- `ANALYSIS_COMPILER_ARCHITECTURE_V2.md` (V2) — Corrected to single front-end
- `ANALYSIS_COMPILER_ARCHITECTURE_V2 copy.md` — Duplicate (can be deleted)
- `ANALYSIS_COMPILER_ARCHITECTURE_V3.md` (V3) — Fixed 9 major issues from V2
- `kindscript-compiler-design.md` — Early exploration, superseded by V1

**Do not use these for implementation.** They contain outdated decisions and have been superseded by V4.

**Why keep them?** Historical context, understanding the evolution of the design, learning from mistakes.

---

## Contributing to Documentation

**When to update V4:**
- Architectural decision changes (requires review and approval)
- New component designs
- Significant corrections to existing designs

**When to update BUILD_PLAN:**
- Milestone scope changes
- New milestones added
- Timeline adjustments
- Success criteria refinements

**When to add to REVIEW:**
- Major architectural alternatives were considered
- Design decisions that need detailed justification

**Documentation standards:**
- Use clear headers and structure
- Include ASCII diagrams for complex concepts
- Reference other docs explicitly (e.g., "See V4 Part 4.1")
- Include code examples (TypeScript preferred)
- Mark decisions clearly (✅ ADOPT, ❌ REJECT, 🟡 REFINE)

---

## Quick Reference

| Question | Document | Section |
|----------|----------|---------|
| How does the binder work? | V4 | Part 4.1 |
| How do contracts work? | V4 | Part 4.3 |
| Why plugin instead of LSP? | REVIEW | Opportunity 1 |
| Why no ts-morph? | REVIEW | Opportunity 5 |
| What's the build order? | V4 | Part 9 |
| What's in Milestone 1? | BUILD_PLAN | Milestone 1 |
| How do we use ports/adapters? | BUILD_PLAN | Architectural Foundation |
| What's the timeline? | BUILD_PLAN | Timeline section |
| Why keep .ksbuildinfo? | REVIEW | Opportunity 4 |
| How does inference work? | V4 | Part 4.6 |
| What are Jupyter notebooks for? | BUILD_PLAN | Appendix |

---

## Version History

- **V4** (Current) — Feb 2024 — Simplified based on ecosystem evidence
- **V3** — Feb 2024 — Fixed 9 major issues from V2
- **V2** — Feb 2024 — Corrected dual front-end mistake
- **V1** — Feb 2024 — Original design

All versions preserved in archive/ for reference.
