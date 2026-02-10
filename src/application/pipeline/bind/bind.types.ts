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
  /** Additional resolved files from TypeKind constraint binding */
  resolvedFiles: Map<string, string[]>;
  errors: string[];
}

export interface BindUseCase {
  execute(parseResult: ParseResult, scanResult: ScanResult): BindResult;
}
