import { ContractPlugin } from './contract-plugin';
import { noDependencyPlugin } from './no-dependency/no-dependency.plugin';
import { purityPlugin } from './purity/purity.plugin';
import { noCyclesPlugin } from './no-cycles/no-cycles.plugin';
import { scopePlugin } from './scope/scope.plugin';

export function createAllPlugins(): ContractPlugin[] {
  return [
    noDependencyPlugin,
    purityPlugin,
    noCyclesPlugin,
    scopePlugin,
  ];
}
