import { readFileSync } from 'fs';
import type { Kind, InstanceOf } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = Kind<"Decider", {}, { pure: true }, { wraps: DeciderFn }>;

export const validateOrder: InstanceOf<Decider> = (cmd) => {
  // Impure: reading from filesystem
  const _data = readFileSync('/tmp/config.json', 'utf-8');
  return [{ type: 'OrderValidated', data: cmd }];
};
