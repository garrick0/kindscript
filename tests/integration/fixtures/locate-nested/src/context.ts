/**
 * Fixture for nested Kind tree path derivation.
 * DomainLayer has sub-members: entities and ports.
 */

import type { Kind, InstanceConfig } from 'kindscript';

export type EntitiesModule = Kind<"EntitiesModule">;
export type PortsModule = Kind<"PortsModule">;

export type DomainLayer = Kind<"DomainLayer", {
  entities: EntitiesModule;
  ports: PortsModule;
}>;

export type CleanContext = Kind<"CleanContext", {
  domain: DomainLayer;
}, {
  noDependency: [["domain", "domain"]];
}>;

export const app = {
  domain: {
    entities: {},
    ports: {},
  },
} satisfies InstanceConfig<CleanContext>;
