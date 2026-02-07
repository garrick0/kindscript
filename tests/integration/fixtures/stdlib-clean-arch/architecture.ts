import { CleanContext, locate } from '@kindscript/clean-architecture';

export const app = locate<CleanContext>("src", {
  domain: {},
  application: {},
  infrastructure: {},
});
