/**
 * Architectural kind definitions using satisfies Instance<T, '.'> syntax -- with a violation.
 */

import type { Kind, Instance } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type CleanContext = Kind<"CleanContext", {
  domain: [DomainLayer, './domain'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<CleanContext, '.'>;
