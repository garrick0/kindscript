import type { TypeKind } from 'kindscript';

type EffectorFn = (event: unknown) => void;
type Effector = TypeKind<"Effector", EffectorFn>;

export const notifyOrder: Effector = (evt) => {
  console.log('Order notification:', evt);
};
