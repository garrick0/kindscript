/**
 * Wrapped Kind purity fixture — violation.
 *
 * Decider has { pure: true } constraint directly on the wrapped Kind.
 * The Decider export file imports from 'fs' — impure.
 */

import type { Kind, Instance, InstanceOf } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
}>;

export const order = {
  deciders: {},
} satisfies Instance<OrderModule, '.'>;
