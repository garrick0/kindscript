import { CleanContext } from '@kindscript/clean-architecture';

export const app: CleanContext = {
  kind: "CleanContext",
  location: "src",
  domain: {
    kind: "DomainLayer",
    location: "src/domain",
  },
  application: {
    kind: "ApplicationLayer",
    location: "src/application",
  },
  infrastructure: {
    kind: "InfrastructureLayer",
    location: "src/infrastructure",
  },
};
