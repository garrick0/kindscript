/**
 * TypeKind purity fixture — violation.
 *
 * Decider has { pure: true } constraint directly on the TypeKind.
 * The Decider export file imports from 'fs' — impure.
 */

import type { Kind, Instance, TypeKind } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = TypeKind<"Decider", DeciderFn, { pure: true }>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
}>;

export const order = {
  deciders: {},
} satisfies Instance<OrderModule, '.'>;
