import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type InfrastructureLayer = Kind<"InfrastructureLayer">;

// Define the architecture once
type BoundedContext = Kind<"BoundedContext", {
  domain: [DomainLayer, './domain'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

// Instance 1: ordering
export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies Instance<BoundedContext, './ordering'>;

// Instance 2: billing
export const billing = {
  domain: {},
  infrastructure: {},
} satisfies Instance<BoundedContext, './billing'>;
