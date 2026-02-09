import type { Kind, InstanceConfig } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noCycles: ["domain", "infrastructure"];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<AppContext>;
