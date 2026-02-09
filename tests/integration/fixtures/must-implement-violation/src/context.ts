import type { Kind, InstanceConfig } from 'kindscript';

export type PortsLayer = Kind<"PortsLayer">;

export type AdaptersLayer = Kind<"AdaptersLayer">;

export type AppContext = Kind<"AppContext", {
  ports: PortsLayer;
  adapters: AdaptersLayer;
}, {
  mustImplement: [["ports", "adapters"]];
}>;

export const app = {
  ports: {},
  adapters: {},
} satisfies InstanceConfig<AppContext>;
