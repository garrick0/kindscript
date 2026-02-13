import type { Kind, Instance } from 'kindscript';

type Core = Kind<"Core">;

type App = Kind<"App", {
  core: [Core, './core'];
}, {
  exhaustive: true;
}>;

export const app = {
  core: {},
} satisfies Instance<App, '.'>;
