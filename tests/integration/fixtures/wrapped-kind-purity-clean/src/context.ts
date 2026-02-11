/**
 * Wrapped Kind purity fixture — clean (no violations).
 *
 * Decider has { pure: true } constraint directly on the wrapped Kind.
 * The Decider export file has no impure imports.
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
