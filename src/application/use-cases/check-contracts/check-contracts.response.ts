import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Response DTO for the CheckContracts use case.
 *
 * Contains the results of contract checking.
 */
export interface CheckContractsResponse {
  /** Diagnostics for contract violations */
  diagnostics: Diagnostic[];

  /** Number of contracts that were evaluated */
  contractsChecked: number;

  /** Number of violations found */
  violationsFound: number;

  /** Number of files analyzed */
  filesAnalyzed: number;
}
