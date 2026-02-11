import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type AppContext = Kind<"AppContext", {
  domain: [DomainLayer, './domain'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
}, {
  noCycles: ["domain", "infrastructure"];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<AppContext, '.'>;
