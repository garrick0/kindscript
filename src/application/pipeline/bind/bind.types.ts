import { Contract } from '../../../domain/entities/contract';
import { ParseResult } from '../parse/parse.types';
import { ScanResult } from '../scan/scan.types';

/**
 * Output of the Binder stage.
 *
 * Contracts generated from constraint trees and intrinsic propagation.
 * Each Contract connects ArchSymbols to the rules they must obey.
 */
export interface BindResult {
  contracts: Contract[];
  /** Resolved files for all members (filesystem + wrapped Kind) */
  resolvedFiles: Map<string, string[]>;
  /** Instance root → ALL files in scope (for containment checking) */
  containerFiles: Map<string, string[]>;
  /** file → Map<declarationName, carrierKey> — which member owns each typed declaration */
  declarationOwnership: Map<string, Map<string, string>>;
  errors: string[];
}

export interface BindUseCase {
  execute(parseResult: ParseResult, scanResult: ScanResult): BindResult;
}
