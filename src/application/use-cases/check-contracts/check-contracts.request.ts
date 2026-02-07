import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { KindScriptConfig } from '../../ports/config.port';

/**
 * Request DTO for the CheckContracts use case.
 *
 * Contains all the data needed to check architectural contracts.
 */
export interface CheckContractsRequest {
  /** The architectural symbols to check */
  symbols: ArchSymbol[];

  /** The contracts to evaluate */
  contracts: Contract[];

  /** KindScript configuration */
  config: KindScriptConfig;

  /** Root files to include in the TypeScript program */
  programRootFiles: string[];
}
