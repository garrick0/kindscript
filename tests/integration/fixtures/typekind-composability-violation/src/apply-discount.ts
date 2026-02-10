import type { TypeKind } from 'kindscript';
// VIOLATION: Decider importing from an Effector file
import { NOTIFICATION_PREFIX } from './notify-order';

type DeciderFn = (command: unknown) => unknown[];
type Decider = TypeKind<"Decider", DeciderFn>;

export const applyDiscount: Decider = (cmd) => {
  console.log(NOTIFICATION_PREFIX);
  return [{ type: 'DiscountApplied', data: cmd }];
};
