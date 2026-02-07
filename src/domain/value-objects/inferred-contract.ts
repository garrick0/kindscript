import { ContractType } from '../types/contract-type';

/**
 * A lightweight contract descriptor for code generation.
 *
 * Unlike Contract (which holds ArchSymbol references for runtime checking),
 * InferredContract holds member names as strings — just enough to render
 * a defineContracts<T>() call in generated output.
 */
export class InferredContract {
  constructor(
    public readonly type: ContractType,
    public readonly args: string[],
  ) {}
}
