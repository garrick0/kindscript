import type { TypeKind } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = TypeKind<"Decider", DeciderFn, { pure: true }>;

export const validateOrder: Decider = (cmd) => {
  return [{ type: 'OrderValidated', data: cmd }];
};
