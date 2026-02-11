import type { Kind, InstanceOf } from 'kindscript';
// VIOLATION: Decider importing from an Effector file
import { NOTIFICATION_PREFIX } from './notify-order';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;

export const applyDiscount: InstanceOf<Decider> = (cmd) => {
  console.log(NOTIFICATION_PREFIX);
  return [{ type: 'DiscountApplied', data: cmd }];
};
