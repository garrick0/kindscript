import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { Program } from '../../../domain/entities/program';
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

  /** The TypeScript program to analyze (reuse from ClassifyProject) */
  program: Program;
}
