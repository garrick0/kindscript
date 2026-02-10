import type { TypeKind } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = TypeKind<"Decider", DeciderFn>;

export const applyDiscount: Decider = (cmd) => {
  return [{ type: 'DiscountApplied', data: cmd }];
};
