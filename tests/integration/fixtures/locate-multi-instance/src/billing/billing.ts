/**
 * Fixture for multiple instances in one project.
 * Billing bounded context.
 */

import type { Kind, Instance } from 'kindscript';

export type BillingDomain = Kind<"BillingDomain">;
export type BillingAdapters = Kind<"BillingAdapters">;

export type BillingContext = Kind<"BillingContext", {
  domain: BillingDomain;
  adapters: BillingAdapters;
}, {
  noDependency: [["domain", "adapters"]];
}>;

export const billing = {
  domain: {},
  adapters: {},
} satisfies Instance<BillingContext, '.'>;
