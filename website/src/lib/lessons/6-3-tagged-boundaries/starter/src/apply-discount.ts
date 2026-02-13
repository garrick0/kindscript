import type { Kind } from 'kindscript';
import { NOTIFICATION_PREFIX } from './notify-order';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;

export const applyDiscount: Decider = (cmd) => {
  console.log(NOTIFICATION_PREFIX);
  return [{ type: 'DiscountApplied', data: cmd }];
};
