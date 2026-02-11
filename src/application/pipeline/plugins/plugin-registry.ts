import { ContractPlugin } from './contract-plugin';
import { noDependencyPlugin } from './no-dependency/no-dependency.plugin';
import { purityPlugin } from './purity/purity.plugin';
import { noCyclesPlugin } from './no-cycles/no-cycles.plugin';
import { scopePlugin } from './scope/scope.plugin';
import { overlapPlugin } from './overlap/overlap.plugin';
import { exhaustivenessPlugin } from './exhaustiveness/exhaustiveness.plugin';

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
