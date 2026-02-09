/**
 * Fixture for multiple instances in one project.
 * Ordering bounded context.
 */

import type { Kind, InstanceConfig } from 'kindscript';

export type OrderingDomain = Kind<"OrderingDomain">;
export type OrderingInfra = Kind<"OrderingInfra">;

export type OrderingContext = Kind<"OrderingContext", {
  domain: OrderingDomain;
  infrastructure: OrderingInfra;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const ordering = {
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<OrderingContext>;
