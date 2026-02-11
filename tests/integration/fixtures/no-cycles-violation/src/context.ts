import type { Kind, Instance } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type AppContext = Kind<"AppContext", {
  domain: [DomainLayer, './domain'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
}, {
  noCycles: ["domain", "infrastructure"];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<AppContext, '.'>;
