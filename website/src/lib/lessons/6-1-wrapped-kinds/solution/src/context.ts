import type { Kind, Instance } from 'kindscript';

// A wrapped Kind: wraps a TypeScript function type
type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;

// Composite Kind with a wrapped Kind member
type OrderModule = Kind<"OrderModule", {
  deciders: Decider;
}>;

export const order = {
  deciders: {},
} satisfies Instance<OrderModule, '.'>;
