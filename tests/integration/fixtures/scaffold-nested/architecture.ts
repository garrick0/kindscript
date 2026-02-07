interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
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

export const app: NestedContext = {
  kind: "NestedContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
    entities: {
      kind: "EntitiesSub",
      location: "src/domain/entities",
    },
    ports: {
      kind: "PortsSub",
      location: "src/domain/ports",
    },
  },
};
