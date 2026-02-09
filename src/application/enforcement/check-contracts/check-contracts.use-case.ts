import { CheckContractsRequest } from './check-contracts.request';
import { CheckContractsResponse } from './check-contracts.response';

/**
 * Use case interface for checking architectural contracts.
 *
 * Evaluates contracts against a pre-built model of the project
 * (resolved files + TypeScript program) and reports violations.
 * The caller is responsible for resolving symbol locations to
 * files before invoking this use case.
 *
 * Implemented in CheckContractsService.
 */
export interface CheckContractsUseCase {
  execute(request: CheckContractsRequest): CheckContractsResponse;
}
