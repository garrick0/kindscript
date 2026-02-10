import type { TypeKind } from 'kindscript';

type EffectorFn = (event: unknown) => void;
type Effector = TypeKind<"Effector", EffectorFn>;

export const NOTIFICATION_PREFIX = 'ORDER:';

export const notifyOrder: Effector = (evt) => {
  console.log(NOTIFICATION_PREFIX, evt);
};
