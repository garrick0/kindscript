/**
 * Architectural kind definitions for the violation fixture.
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
