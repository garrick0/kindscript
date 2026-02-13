import type { Kind, Instance } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;

type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
}>;

export const order = {
  deciders: {},
} satisfies Instance<OrderModule, '.'>;
