import type { Kind, Instance } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer", {}, { pure: true }>;

export type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
}>;

export const app = {
  domain: {},
} satisfies Instance<AppContext>;
