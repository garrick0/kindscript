import type { Kind } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;

// Annotate this export as a Decider
export const validateOrder: Decider = (cmd) => {
  return [{ type: 'OrderValidated', data: cmd }];
};
