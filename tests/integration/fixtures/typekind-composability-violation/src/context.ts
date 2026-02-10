/**
 * TypeKind composability fixture — violation.
 *
 * apply-discount.ts (Decider) imports from notify-order.ts (Effector),
 * violating the noDependency constraint.
 */

import type { Kind, Instance, TypeKind } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type EffectorFn = (event: unknown) => void;

type Decider = TypeKind<"Decider", DeciderFn>;
type Effector = TypeKind<"Effector", EffectorFn>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
  effectors: Effector;
}, {
  noDependency: [["deciders", "effectors"]];
}>;

export const order = {
  deciders: {},
  effectors: {},
} satisfies Instance<OrderModule, '.'>;
