import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type ApplicationLayer = Kind<"ApplicationLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

type CleanArchitectureContext = Kind<"CleanArchitectureContext", {
  domain: [DomainLayer, './domain'];
  application: [ApplicationLayer, './application'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
}, {
  noDependency: [["domain", "infrastructure"], ["domain", "application"]];
}>;

export const app = {
  domain: {},
  application: {},
  infrastructure: {},
} satisfies Instance<CleanArchitectureContext, '.'>;
