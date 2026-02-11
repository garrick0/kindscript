/**
 * Architectural kind definitions using satisfies Instance<T, '.'> syntax.
 */

import type { Kind, Instance } from 'kindscript';

// Kind definitions
export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type CleanContext = Kind<"CleanContext", {
  domain: [DomainLayer, './domain'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

// Instance declaration using satisfies Instance<T, '.'>
export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<CleanContext, '.'>;
