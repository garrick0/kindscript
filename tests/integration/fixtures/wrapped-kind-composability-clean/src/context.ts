/**
 * Wrapped Kind composability fixture — clean (no violations).
 *
 * Decider-typed exports cannot import from Effector-typed exports.
 * In this fixture, neither group imports from the other.
 */

import type { Kind, Instance, InstanceOf } from 'kindscript';

// Base function types
type DeciderFn = (command: unknown) => unknown[];
type EffectorFn = (event: unknown) => void;

// Wrapped Kind definitions — wrapping function types with architectural role
type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;
type Effector = Kind<"Effector", {}, {}, { wraps: EffectorFn }>;

// Composite Kind with wrapped Kind members
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
