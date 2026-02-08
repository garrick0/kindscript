import { ContractGenerator } from './contract-generator';
import { generateNoDependency } from './no-dependency/no-dependency.generator';
import { generateMustImplement } from './must-implement/must-implement.generator';
import { generateNoCycles } from './no-cycles/no-cycles.generator';
import { generateExists } from './exists/exists.generator';
import { generateMirrors } from './mirrors/mirrors.generator';

/**
 * Registry mapping constraint property names (dotted paths) to their generators.
 *
 * 'pure' is handled separately via intrinsic propagation (see purity.generator.ts).
 */
export const GENERATORS: Record<string, { generate: ContractGenerator; intrinsic?: false } | { intrinsic: true }> = {
  'noDependency':       { generate: generateNoDependency },
  'mustImplement':      { generate: generateMustImplement },
  'noCycles':           { generate: generateNoCycles },
  'pure':               { intrinsic: true },
  'filesystem.exists':  { generate: generateExists },
  'filesystem.mirrors': { generate: generateMirrors },
};
