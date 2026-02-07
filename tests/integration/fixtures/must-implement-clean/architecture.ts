interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface AppContext extends Kind<"AppContext"> {
  ports: PortsLayer;
  adapters: AdaptersLayer;
}

export interface PortsLayer extends Kind<"PortsLayer"> {
}

export interface AdaptersLayer extends Kind<"AdaptersLayer"> {
}

export const app: AppContext = {
  kind: "AppContext",
  location: "src",
  ports: {
    kind: "PortsLayer",
    location: "src/ports",
  },
  adapters: {
    kind: "AdaptersLayer",
    location: "src/adapters",
  },
};

export const contracts = defineContracts<AppContext>({
  mustImplement: [["ports", "adapters"]],
});
