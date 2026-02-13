import { ContractPlugin } from './contract-plugin.js';
import { noDependencyPlugin } from './no-dependency/no-dependency.plugin.js';
import { purityPlugin } from './purity/purity.plugin.js';
import { noCyclesPlugin } from './no-cycles/no-cycles.plugin.js';
import { scopePlugin } from './scope/scope.plugin.js';
import { overlapPlugin } from './overlap/overlap.plugin.js';
import { exhaustivenessPlugin } from './exhaustiveness/exhaustiveness.plugin.js';

export function createAllPlugins(): ContractPlugin[] {
  return [
    noDependencyPlugin,
    purityPlugin,
    noCyclesPlugin,
    scopePlugin,
    overlapPlugin,
    exhaustivenessPlugin,
  ];
}
