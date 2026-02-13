import { readFileSync } from 'fs';
import type { Kind } from 'kindscript';

type HandlerFn = (command: unknown) => unknown[];
type CommandHandler = Kind<"CommandHandler", {}, { pure: true }, { wraps: HandlerFn }>;

export const validateOrder: CommandHandler = (cmd) => {
  const rules = readFileSync('/tmp/rules.json', 'utf-8');
  return [{ type: 'OrderValidated', data: cmd, rules }];
};
