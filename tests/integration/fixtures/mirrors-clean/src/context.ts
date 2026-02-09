import type { Kind, InstanceConfig } from 'kindscript';

export type ComponentsLayer = Kind<"ComponentsLayer">;

export type TestsLayer = Kind<"TestsLayer">;

export type AppContext = Kind<"AppContext", {
  components: ComponentsLayer;
  tests: TestsLayer;
}, {
  filesystem: {
    mirrors: [["components", "tests"]];
  };
}>;

export const app = {
  components: {},
  tests: {},
} satisfies InstanceConfig<AppContext>;
