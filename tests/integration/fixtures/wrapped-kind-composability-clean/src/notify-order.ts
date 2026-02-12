import type { Kind } from 'kindscript';

type EffectorFn = (event: unknown) => void;
type Effector = Kind<"Effector", {}, {}, { wraps: EffectorFn }>;

export const notifyOrder: Effector = (evt) => {
  console.log('Order notification:', evt);
};
