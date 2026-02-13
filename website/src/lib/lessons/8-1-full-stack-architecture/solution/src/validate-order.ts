import type { Kind } from 'kindscript';

type HandlerFn = (command: unknown) => unknown[];
type CommandHandler = Kind<"CommandHandler", {}, { pure: true }, { wraps: HandlerFn }>;

export const validateOrder: CommandHandler = (cmd) => {
  return [{ type: 'OrderValidated', data: cmd }];
};
