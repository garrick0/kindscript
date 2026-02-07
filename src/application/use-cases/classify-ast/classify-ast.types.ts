import { SourceFile, TypeChecker } from '../../ports/typescript.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { Contract } from '../../../domain/entities/contract';

/**
 * Request DTO for the ClassifyAST use case.
 */
export interface ClassifyASTRequest {
  /** Source files containing kind definitions */
  definitionFiles: SourceFile[];

  /** TypeChecker for resolving types (needed for heritage clauses and variable types) */
  checker: TypeChecker;

  /** Absolute project root for resolving relative locations */
  projectRoot: string;
}

/**
 * Response DTO for the ClassifyAST use case.
 */
export interface ClassifyASTResponse {
  /** Architectural symbols extracted from the definitions */
  symbols: ArchSymbol[];

  /** Contracts extracted from the definitions */
  contracts: Contract[];

  /** Errors encountered during classification */
  errors: string[];
}
