import type { Kind, Instance } from 'kindscript';

export type Core = Kind<"Core">;

export type App = Kind<"App", {
  core: [Core, './core'];
}, {
  exhaustive: true;
}>;

export const app = {
  core: {},
} satisfies Instance<App, '.'>;
