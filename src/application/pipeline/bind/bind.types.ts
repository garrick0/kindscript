import { Contract } from '../../../domain/entities/contract.js';
import { ParseResult } from '../parse/parse.types.js';
import { ScanResult } from '../scan/scan.types.js';

/**
 * Output of the Binder stage.
 *
 * Contracts generated from constraint trees and intrinsic propagation.
 * Each Contract connects ArchSymbols to the rules they must obey.
 *
 * File resolution data lives directly on ArchSymbol (symbol.files,
 * symbol.declarations) — populated during binding.
 */
export interface BindResult {
  contracts: Contract[];
  errors: string[];
}

export interface BindUseCase {
  execute(parseResult: ParseResult, scanResult: ScanResult): BindResult;
}
