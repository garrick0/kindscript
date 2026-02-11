# Architecture Decision Records

> Key architectural decisions and their rationale.

This directory contains KindScript's Architecture Decision Records (ADRs). Each decision is documented in a separate file for easy navigation, git history tracking, and stable linking.

## Format

Each ADR follows this structure:
- **Context** — The problem or situation requiring a decision
- **Decision** — What was decided
- **Rationale** — Why this decision was made, including alternatives considered
- **Impact** — Consequences and implementation details

## All Decisions

| ADR | Title | Date | Status |
|-----|-------|------|--------|
| [ADR-0032](0032-declarationownership-for-typekind-member-attribution.md) | DeclarationOwnership for TypeKind Member Attribution | 2026-02-11 | Done |
| [ADR-0031](0031-intrinsic-constraint-propagation-pattern.md) | Intrinsic Constraint Propagation Pattern | 2026-02-10 | Done |
| [ADR-0030](0030-pure-path-utilities-extracted-to-infrastructure.md) | Pure Path Utilities Extracted to Infrastructure | 2026-02-10 | Done |
| [ADR-0029](0029-aapps-architecture-onion-core-with-per-product-apps.md) | A+Apps Architecture — Onion Core with Per-Product Apps | 2026-02-08 | Done |
| [ADR-0028](0028-container-resolution-as-separate-binder-concern.md) | Container Resolution as Separate Binder Concern | 2026-02-11 | Done |
| [ADR-0027](0027-scope-plugin-and-kindconfigscope-for-declared-instance-scope.md) | Scope Plugin and KindConfig.scope for Declared Instance Scope | 2026-02-10 | Done |
| [ADR-0026](0026-isp-split-ports-into-sub-interfaces.md) | ISP Split — Ports into Sub-Interfaces | 2026-02-07 | Done |
| [ADR-0025](0025-importedge-moved-from-domain-to-application-layer.md) | ImportEdge Moved from Domain to Application Layer | 2026-02-10 | Done |
| [ADR-0024](0024-instancet-path-explicit-location-replaces-convention-based-derivation.md) | Instance\<T, Path\> — Explicit Location Replaces Convention-Based Derivation | 2026-02-10 | Done |
| [ADR-0023](0023-sourceref-value-object-replacing-raw-location-fields.md) | SourceRef Value Object Replacing Raw Location Fields | 2026-02-10 | Done |
| [ADR-0022](0022-intra-file-dependency-checking-for-typekind-members.md) | Intra-File Dependency Checking for TypeKind Members | 2026-02-11 | Done |
| [ADR-0021](0021-opt-in-exhaustiveness-via-exhaustive-true.md) | Opt-In Exhaustiveness via `exhaustive: true` | 2026-02-11 | Done |
| [ADR-0020](0020-auto-generated-implicit-contracts-for-overlap-detection.md) | Auto-Generated Implicit Contracts for Overlap Detection | 2026-02-11 | Done |
| [ADR-0019](0019-ownership-tree-for-recursive-instance-containment.md) | Ownership Tree for Recursive Instance Containment | 2026-02-11 | Done |
| [ADR-0018](0018-semantic-error-messages.md) | Semantic Error Messages | 2026-02-10 | Done |
| [ADR-0017](0017-remove-mustimplement-exists-mirrors-plugins.md) | Remove mustImplement, exists, mirrors Plugins | 2026-02-10 | Done |
| [ADR-0016](0016-resolution-moves-from-parser-to-binder.md) | Resolution Moves from Parser to Binder | 2026-02-10 | Done |
| [ADR-0015](0015-unified-kind-type-typekind-as-sugar.md) | Unified Kind Type — TypeKind as Sugar | 2026-02-10 | Done |
| [ADR-0014](0014-file-scoped-leaf-instances.md) | File-Scoped Leaf Instances | 2026-02-08 | Superseded by D24 |
| [ADR-0013](0013-rename-constraintconfig-to-constraints.md) | Rename `ConstraintConfig` to `Constraints` | 2026-02-08 | Done |
| [ADR-0012](0012-rename-instanceconfigt-to-instancet.md) | Rename `InstanceConfig<T>` to `Instance<T>` | 2026-02-08 | Done |
| [ADR-0011](0011-pipeline-cleanup-separation-of-concerns.md) | Pipeline Cleanup — Separation of Concerns | 2026-02-08 | Done |
| [ADR-0010](0010-four-stage-pipeline-alignment.md) | Four-Stage Pipeline Alignment | 2026-02-08 | Done |
| [ADR-0009](0009-drop-kts-piggyback-on-typescript-type-checker.md) | Drop `.k.ts`, Piggyback on TypeScript Type Checker | 2026-02-08 | Done |
| [ADR-0008](0008-remove-contractconfigt.md) | Remove `ContractConfig<T>` | 2026-02-07 | Done |
| [ADR-0007](0007-flatten-srcruntime.md) | Flatten `src/runtime/` | 2026-02-08 | Done |
| [ADR-0006](0006-remove-standard-library-packages.md) | Remove Standard Library Packages | 2026-02-07 | Done |
| [ADR-0005](0005-self-registering-contract-plugins.md) | Self-Registering Contract Plugins | 2026-02-07 | Done |
| [ADR-0004](0004-use-satisfies-instead-of-runtime-markers.md) | Use `satisfies` Instead of Runtime Markers | 2026-02-07 | Done |
| [ADR-0003](0003-type-alias-instead-of-interface-extends.md) | Type Alias Instead of `interface extends` | 2026-02-07 | Done |
| [ADR-0002](0002-no-ts-morph.md) | No ts-morph | 2026-02-07 | Done |
| [ADR-0001](0001-language-service-plugin-instead-of-custom-lsp.md) | Language Service Plugin Instead of Custom LSP | 2026-02-07 | Done |

## Creating a New ADR

1. Copy `template.md` to `NNNN-title-slug.md` (use next number)
2. Fill in the sections
3. Add entry to this README
4. Commit both files

## Legend

- **Done** — Decision implemented
- **Superseded** — Replaced by a newer decision (see notes in ADR)
- **Deprecated** — No longer recommended but not replaced
