import type { Kind, Instance } from 'kindscript';

export type A = Kind<"A">;
export type B = Kind<"B">;

export type App = Kind<"App", {
  a: [A, '.'];
  b: [B, './sub'];
}>;

export const app = {
  a: {},
  b: {},
} satisfies Instance<App, '.'>;
