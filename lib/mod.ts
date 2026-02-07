/**
 * Architectural Kind System — Layer 1: Library Primitives
 *
 * Generic building blocks for defining architectural patterns as TypeScript types.
 *
 * Three-Layer Model:
 *   Layer 1 (this library) — Primitives: Kind, Leaf, File, Multiple, etc.
 *   Layer 2 (patterns) — Pattern Definitions using these primitives
 *   Layer 3 (instances) — Concrete codebase declarations
 *
 * @example
 * // Layer 1: import primitives
 * import type { Kind, Leaf, Multiple } from "./lib/mod.ts";
 *
 * // Layer 2: define your pattern
 * type DomainLayer = Leaf<"DomainLayer">;
 * type CleanArchApp = Kind<"CleanArchApp"> & {
 *   domain: DomainLayer;
 *   application: ApplicationLayer;
 * };
 *
 * // Layer 3: declare instances
 * const app: CleanArchApp = {
 *   kind: "CleanArchApp",
 *   domain: { kind: "DomainLayer" },
 *   application: { kind: "ApplicationLayer" },
 * };
 */

export type { Kind, Leaf, IsLeaf, File, WithLocation, Multiple } from "./types.ts";
