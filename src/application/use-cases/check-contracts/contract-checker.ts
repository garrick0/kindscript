import { TypeScriptPort, TypeChecker } from '../../ports/typescript.port';
import { Contract } from '../../../domain/entities/contract';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { Program } from '../../../domain/entities/program';
import { ContractType } from '../../../domain/types/contract-type';

export interface CheckContext {
  tsPort: TypeScriptPort;
  program: Program;
  checker: TypeChecker;
  resolvedFiles: Map<string, string[]>;
}

export interface CheckResult {
  diagnostics: Diagnostic[];
  filesAnalyzed: number;
}

export interface ContractChecker {
  readonly type: ContractType;
  check(contract: Contract, context: CheckContext): CheckResult;
}
