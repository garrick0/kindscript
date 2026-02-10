import type { DeciderFn } from './types';
import type { TypeKind } from 'kindscript';

type Decider = TypeKind<"Decider", DeciderFn>;

export const validateOrder: Decider = (command) => {
  return [{ type: 'OrderValidated', data: command }];
};
