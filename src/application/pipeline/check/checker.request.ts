import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';
import { Program } from '../../../domain/entities/program';
import { KindScriptConfig } from '../../ports/config.port';
import { OwnershipTree } from '../ownership-tree';

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
   * Pre-resolved mapping from carrier key → files on disk.
   * Built by the Binder stage.
   */
  resolvedFiles: Map<string, string[]>;

  /**
   * Instance carrier key → ALL files in scope (for containment checking).
   * Built by the Binder stage.
   */
  containerFiles?: Map<string, string[]>;

  /**
   * The ownership tree — parent-child relationships between instances.
   * Built by the Pipeline between bind and check stages.
   */
  ownershipTree?: OwnershipTree;

  /**
   * file → Map<declarationName, carrierKey> — which member owns each typed declaration.
   * Built by the Binder for wrapped Kind member resolution.
   */
  declarationOwnership?: Map<string, Map<string, string>>;
}
