/**
 * Direct annotation fixture — uses Kind type name directly.
 *
 * Decider has { pure: true } constraint. Exports use `Decider` type annotation
 * directly instead of `InstanceOf<Decider>`.
 */

import type { Kind, Instance } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
}>;

export const order = {
  deciders: {},
} satisfies Instance<OrderModule, '.'>;
