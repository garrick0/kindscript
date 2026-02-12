import type { Kind } from 'kindscript';

type EffectorFn = (event: unknown) => void;
type Effector = Kind<"Effector", {}, {}, { wraps: EffectorFn }>;

export const NOTIFICATION_PREFIX = 'ORDER:';

export const notifyOrder: Effector = (evt) => {
  console.log(NOTIFICATION_PREFIX, evt);
};
