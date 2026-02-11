import type { Kind, Instance } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

export type AppContext = Kind<"AppContext", {
  domain: [DomainLayer, './domain'];
}>;

export const app = {
  domain: {},
} satisfies Instance<AppContext, '.'>;
