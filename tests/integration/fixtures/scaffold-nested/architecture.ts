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

export interface NestedContext extends Kind<"NestedContext"> {
  domain: DomainLayer;
}

export interface DomainLayer extends Kind<"DomainLayer"> {
  entities: EntitiesSub;
  ports: PortsSub;
}

export interface EntitiesSub extends Kind<"EntitiesSub"> {}
export interface PortsSub extends Kind<"PortsSub"> {}

export const app = locate<NestedContext>("src", {
  domain: {
    entities: {},
    ports: {},
  },
});
