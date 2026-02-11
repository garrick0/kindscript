/**
 * Fixture for location existence checking.
 * The "infrastructure" member derives path "src/infrastructure" which does NOT exist.
 */

import type { Kind, Instance } from 'kindscript';

export type DomainLayer = Kind<"DomainLayer">;

export type InfrastructureLayer = Kind<"InfrastructureLayer">;

export type CleanContext = Kind<"CleanContext", {
  domain: [DomainLayer, './domain'];
  infrastructure: [InfrastructureLayer, './infrastructure'];
}, {
  noDependency: [["domain", "infrastructure"]];
  filesystem: {
    exists: ["domain", "infrastructure"];
  };
}>;

// "infrastructure" maps to src/infrastructure which does NOT exist on disk
export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<CleanContext, '.'>;
