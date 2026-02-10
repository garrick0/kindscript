/**
 * TypeKind composability fixture — clean (no violations).
 *
 * Decider-typed exports cannot import from Effector-typed exports.
 * In this fixture, neither group imports from the other.
 */

import type { Kind, Instance, TypeKind } from 'kindscript';

// Base function types
type DeciderFn = (command: unknown) => unknown[];
type EffectorFn = (event: unknown) => void;

// TypeKind definitions — wrapping function types with architectural role
type Decider = TypeKind<"Decider", DeciderFn>;
type Effector = TypeKind<"Effector", EffectorFn>;

// Composite Kind with TypeKind members
type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
  effectors: Effector;
}, {
  noDependency: [["deciders", "effectors"]];
}>;

// Instance declaration
export const order = {
  deciders: {},
  effectors: {},
} satisfies Instance<OrderModule, '.'>;
