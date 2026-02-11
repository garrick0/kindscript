import type { Kind, InstanceOf } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;

export const validateOrder: InstanceOf<Decider> = (cmd) => {
  return [{ type: 'OrderValidated', data: cmd }];
};
