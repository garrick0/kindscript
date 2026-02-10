import type { EffectorFn } from './types';
import type { TypeKind } from 'kindscript';

type Effector = TypeKind<"Effector", EffectorFn>;

export const notifyOrder: Effector = (event) => {
  console.log('Order notification:', event);
};
