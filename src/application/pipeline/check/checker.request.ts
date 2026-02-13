import { ArchSymbol } from '../../../domain/entities/arch-symbol.js';
import { Contract } from '../../../domain/entities/contract.js';
import { Program } from '../../../domain/entities/program.js';
import { KindScriptConfig } from '../../ports/config.port.js';
import { OwnershipTree } from '../ownership-tree.js';

/**
 * Request DTO for the Checker stage.
 *
 * Contains all the data needed to check architectural contracts.
 * File resolution data lives directly on ArchSymbol (symbol.files,
 * symbol.declarations) — populated by the Binder stage.
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
   * The ownership tree — parent-child relationships between instances.
   * Built by the Pipeline between bind and check stages.
   */
  ownershipTree?: OwnershipTree;
}
