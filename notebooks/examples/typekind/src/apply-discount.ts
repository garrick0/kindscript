import type { DeciderFn } from './types';
import type { TypeKind } from 'kindscript';

type Decider = TypeKind<"Decider", DeciderFn>;

export const applyDiscount: Decider = (command) => {
  return [{ type: 'DiscountApplied', data: command }];
};
