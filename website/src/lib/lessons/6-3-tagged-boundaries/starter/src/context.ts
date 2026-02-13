import type { Kind, Instance } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type EffectorFn = (event: unknown) => void;

type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;
type Effector = Kind<"Effector", {}, {}, { wraps: EffectorFn }>;

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
