/**
 * Architectural kind definitions using satisfies InstanceConfig<T> syntax.
 */

import type { Kind, InstanceConfig } from 'kindscript';

// Kind definitions
export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
  infrastructure: InfrastructureLayer;
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

// Instance declaration using satisfies InstanceConfig<T>
export const app = {
  domain: {},
  infrastructure: {},
} satisfies InstanceConfig<CleanContext>;
