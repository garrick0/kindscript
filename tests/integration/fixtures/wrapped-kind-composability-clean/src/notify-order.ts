import type { Kind, InstanceOf } from 'kindscript';

type EffectorFn = (event: unknown) => void;
type Effector = Kind<"Effector", {}, {}, { wraps: EffectorFn }>;

export const notifyOrder: InstanceOf<Effector> = (evt) => {
  console.log('Order notification:', evt);
};
