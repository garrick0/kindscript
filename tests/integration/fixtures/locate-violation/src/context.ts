/**
 * Architectural kind definitions using satisfies InstanceConfig<T> syntax -- with a violation.
 */

import type { Kind, InstanceConfig } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanContext>;
