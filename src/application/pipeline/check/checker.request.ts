import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { Program } from '../../../domain/entities/program';
import { KindScriptConfig } from '../../ports/config.port';

/**
 * Request DTO for the Checker stage.
 *
 * Contains all the data needed to check architectural contracts.
 */
export interface CheckerRequest {
  /** The architectural symbols to check */
  symbols: ArchSymbol[];

  /** The contracts to evaluate */
  contracts: Contract[];

  /** KindScript configuration */
  config: KindScriptConfig;

  /** The TypeScript program to analyze */
  program: Program;

  /**
   * Pre-resolved mapping from symbol location → files on disk.
   * Built by the Parser stage.
   */
  resolvedFiles: Map<string, string[]>;
}
