import type { Kind, Instance } from 'kindscript';

type Core = Kind<"Core">;
type Helpers = Kind<"Helpers">;

type App = Kind<"App", {
  core: [Core, './core'];
  helpers: [Helpers, './helpers.ts'];
}, {
  exhaustive: true;
}>;

export const app = {
  core: {},
  helpers: {},
} satisfies Instance<App, '.'>;
