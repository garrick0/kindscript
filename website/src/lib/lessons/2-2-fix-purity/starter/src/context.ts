import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

type AppContext = Kind<"AppContext", {
  domain: [DomainLayer, './domain'];
}>;

export const app = {
  domain: {},
} satisfies Instance<AppContext, '.'>;
