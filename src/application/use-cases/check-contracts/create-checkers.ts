import { ContractChecker } from './contract-checker';
import { NoDependencyChecker } from './no-dependency/no-dependency.checker';
import { PurityChecker } from './purity/purity.checker';
import { NoCyclesChecker } from './no-cycles/no-cycles.checker';
import { MustImplementChecker } from './must-implement/must-implement.checker';
import { ExistsChecker } from './exists/exists.checker';
import { MirrorsChecker } from './mirrors/mirrors.checker';

export function createAllCheckers(): ContractChecker[] {
  return [
    new NoDependencyChecker(),
    new PurityChecker(),
    new NoCyclesChecker(),
    new MustImplementChecker(),
    new ExistsChecker(),
    new MirrorsChecker(),
  ];
}
