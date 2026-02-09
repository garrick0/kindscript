import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Response DTO for the Checker stage.
 */
export interface CheckerResponse {
  /** Diagnostics for contract violations */
  diagnostics: Diagnostic[];

  /** Number of contracts that were evaluated */
  contractsChecked: number;

  /** Number of violations found */
  violationsFound: number;

  /** Number of files analyzed */
  filesAnalyzed: number;
}
