interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

type MemberMap<T extends Kind> = {
  [K in keyof T as K extends 'kind' | 'location' ? never : K]:
    T[K] extends Kind
      ? MemberMap<T[K]> | { path: string } & Partial<MemberMap<T[K]>> | Record<string, never>
      : never;
};
function locate<T extends Kind>(root: string, members: MemberMap<T>): MemberMap<T> {
  void root;
  return members;
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

export const app = locate<AppContext>("src", {
  components: {},
  tests: {},
});

export const contracts = defineContracts<AppContext>({
  colocated: [["components", "tests"]],
});
