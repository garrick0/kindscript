/**
 * Fixture for Axis 2: standalone variable reference.
 * The domain member is declared as a standalone variable, then referenced by identifier.
 */

import type { Kind, Instance } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;

export type AppContext = Kind<"AppContext", {
  domain: DomainLayer;
}, {
  noDependency: [["domain", "domain"]];
}>;

// Standalone member variable -- referenced by identifier in the instance
const domainConfig = {};

export const app = {
  domain: domainConfig,
} satisfies Instance<AppContext>;
