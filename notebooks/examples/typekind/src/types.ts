export type DeciderFn = (command: unknown) => unknown[];
export type EffectorFn = (event: unknown) => void;
