/**
 * Architectural kind definitions for the clean-arch fixture.
 */

import type { Kind, Instance } from 'kindscript';

// Kind definitions
export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

// Instance declaration using satisfies Instance<T, '.'>
export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<CleanContext, '.'>;
