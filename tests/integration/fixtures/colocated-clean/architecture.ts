interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  colocated?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}

export interface AppContext extends Kind<"AppContext"> {
  components: ComponentsLayer;
  tests: TestsLayer;
}

export interface ComponentsLayer extends Kind<"ComponentsLayer"> {
}

export interface TestsLayer extends Kind<"TestsLayer"> {
}

export const app: AppContext = {
  kind: "AppContext",
  location: "src",
  components: {
    kind: "ComponentsLayer",
    location: "src/components",
  },
  tests: {
    kind: "TestsLayer",
    location: "src/tests",
  },
};

export const contracts = defineContracts<AppContext>({
  colocated: [["components", "tests"]],
});
