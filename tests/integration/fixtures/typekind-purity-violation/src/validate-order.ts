import { readFileSync } from 'fs';
import type { TypeKind } from 'kindscript';

type DeciderFn = (command: unknown) => unknown[];
type Decider = TypeKind<"Decider", DeciderFn, { pure: true }>;

export const validateOrder: Decider = (cmd) => {
  // Impure: reading from filesystem
  const _data = readFileSync('/tmp/config.json', 'utf-8');
  return [{ type: 'OrderValidated', data: cmd }];
};
