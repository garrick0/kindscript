/**
 * Architectural Kind System — Layer 1: Library Primitives
 *
 * These are generic building blocks for defining architectural patterns.
 * They know nothing about specific patterns (Clean Architecture, DDD, etc.)
 * or filesystem conventions — that belongs in Layer 2 (Pattern Definitions).
 *
 * Three-Layer Model:
 *   Layer 1 (this file) — Primitives: Kind, Leaf, File, Multiple, etc.
 *   Layer 2 (user/patterns) — Pattern Definitions: e.g. BoundedContext, CleanArchApp
 *   Layer 3 (user/instances) — Instances: concrete codebase declarations
 *
 * @example
 * // Layer 1: we provide the primitives
 * import type { Kind, Leaf, Multiple } from "./mod.ts";
 *
 * // Layer 2: user defines their pattern
 * type DomainLayer = Leaf<"DomainLayer">;
 * type CleanArchApp = Kind<"CleanArchApp"> & {
 *   domain: DomainLayer;
 * };
 *
 * // Layer 3: user declares instances
 * const app: CleanArchApp = {
 *   kind: "CleanArchApp",
 *   domain: { kind: "DomainLayer" },
 * };
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Base type for all kinds.
 * Every kind has a 'kind' discriminator field.
 *
 * @example
 * type DomainLayer = Kind<"DomainLayer">;
 * type CleanArchApp = Kind<"CleanArchApp"> & {
 *   domain: DomainLayer;
 *   application: ApplicationLayer;
 * };
 */
export type Kind<N extends string = string> = {
  readonly kind: N;
};

/**
 * Shorthand for a leaf kind (no children).
 * Equivalent to Kind<N> but communicates intent.
 *
 * @example
 * type Entity = Leaf<"Entity">;
 * type ValueObject = Leaf<"ValueObject">;
 */
export type Leaf<N extends string> = Kind<N>;

/**
 * Derives whether a kind is a leaf (has no children).
 *
 * A kind is a leaf if it has no properties beyond 'kind' and 'location'.
 * This is a structural check, not a declaration.
 *
 * @example
 * type Entity = Kind<"Entity">;
 * type DomainLayer = Kind<"DomainLayer"> & { entities: Entity[] };
 *
 * type Test1 = IsLeaf<Entity>;       // true
 * type Test2 = IsLeaf<DomainLayer>;  // false
 */
export type IsLeaf<T extends Kind> = Exclude<keyof T, "kind" | "location"> extends never ? true : false;

// =============================================================================
// File
// =============================================================================

/**
 * Represents a file. Use as a property on kinds to declare file children.
 *
 * @example
 * type Package = Kind<"Package"> & {
 *   "index.ts": File;
 *   "package.json": File;
 *   "README.md"?: File;
 * };
 */
export type File = {
  readonly location: string;
};

// =============================================================================
// Location Support
// =============================================================================

/**
 * Add a location to any kind (for filesystem mapping).
 *
 * @example
 * type DomainLayer = Kind<"DomainLayer">;
 *
 * const myDomain: WithLocation<DomainLayer> = {
 *   kind: "DomainLayer",
 *   location: "./src/domain",
 * };
 */
export type WithLocation<T extends Kind> = T & {
  readonly location: string;
};

// =============================================================================
// Collection Helpers
// =============================================================================

/**
 * Mark a child as allowing multiple instances.
 * (Just an alias for array, for documentation purposes)
 *
 * @example
 * type DomainLayer = Kind<"DomainLayer"> & {
 *   entities: Multiple<Entity>;  // Same as Entity[]
 * };
 */
export type Multiple<T> = T[];
