import type { Kind, InstanceOf } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, {}, { wraps: DeciderFn }>;

export const applyDiscount: InstanceOf<Decider> = (cmd) => {
  return [{ type: 'DiscountApplied', data: cmd }];
};
