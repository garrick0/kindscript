import { ContractPlugin } from './contract-plugin';
import { noDependencyPlugin } from './no-dependency/no-dependency.plugin';
import { purityPlugin } from './purity/purity.plugin';
import { noCyclesPlugin } from './no-cycles/no-cycles.plugin';
import { mustImplementPlugin } from './must-implement/must-implement.plugin';
import { existsPlugin } from './exists/exists.plugin';
import { mirrorsPlugin } from './mirrors/mirrors.plugin';

export function createAllPlugins(): ContractPlugin[] {
  return [
    noDependencyPlugin,
    purityPlugin,
    noCyclesPlugin,
    mustImplementPlugin,
    existsPlugin,
    mirrorsPlugin,
  ];
}
