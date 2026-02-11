/**
 * Explicit location fixture — context file outside the target directory.
 *
 * The context file lives at the project root, but declares that the
 * instance governs code inside './src'. This tests that explicit paths
 * decouple the declaration site from the instance location.
 */

import type { Kind, Instance } from 'kindscript';

type DomainLayer = Kind<"DomainLayer">;
type InfraLayer = Kind<"InfraLayer">;

type App = Kind<"App", {
  domain: [DomainLayer, './domain'];
  infrastructure: [InfraLayer, './infrastructure'];
}, {
  noDependency: [["domain", "infrastructure"]];
}>;

export const app = {
  domain: {},
  infrastructure: {},
} satisfies Instance<App, './src'>;
