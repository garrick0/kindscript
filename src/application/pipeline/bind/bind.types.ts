import { Contract } from '../../../domain/entities/contract';
import { ParseResult } from '../parse/parse.types';

/**
 * Output of the Binder stage.
 *
 * Contracts generated from constraint trees and intrinsic propagation.
 * Each Contract connects ArchSymbols to the rules they must obey.
 */
export interface BindResult {
  contracts: Contract[];
  errors: string[];
}

export interface BindUseCase {
  execute(parseResult: ParseResult): BindResult;
}
