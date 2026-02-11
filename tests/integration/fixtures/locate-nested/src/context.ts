/**
 * Fixture for nested Kind tree path derivation.
 * DomainLayer has sub-members: entities and ports.
 */

import type { Kind, Instance } from 'kindscript';

export type EntitiesModule = Kind<"EntitiesModule">;
export type PortsModule = Kind<"PortsModule">;

export type DomainLayer = Kind<"DomainLayer", {
  entities: [EntitiesModule, './entities'];
  ports: [PortsModule, './ports'];
}>;

export type CleanContext = Kind<"CleanContext", {
  domain: [DomainLayer, './domain'];
}, {
  noDependency: [["domain", "domain"]];
}>;

export const app = {
  domain: {
    entities: {},
    ports: {},
  },
} satisfies Instance<CleanContext, '.'>;
