import type { Kind, Instance, TypeKind } from 'kindscript';
import type { DeciderFn, EffectorFn } from './types';

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
