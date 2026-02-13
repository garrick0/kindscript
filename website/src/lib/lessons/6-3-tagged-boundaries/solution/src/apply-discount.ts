import type { Kind } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;

export const applyDiscount: Decider = (cmd) => {
  return [{ type: 'DiscountApplied', data: cmd }];
};
