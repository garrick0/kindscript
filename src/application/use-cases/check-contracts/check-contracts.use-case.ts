import { CheckContractsRequest } from './check-contracts.request';
import { CheckContractsResponse } from './check-contracts.response';

/**
 * Use case interface for checking architectural contracts.
 *
 * This is the core use case of KindScript - it evaluates contracts
 * against the codebase and reports violations.
 *
 * The implementation will:
 * 1. Resolve each symbol to its files
 * 2. For each contract, evaluate it against the resolved files
 * 3. Collect diagnostics for violations
 * 4. Return results
 *
 * This interface is implemented in M1 with real logic.
 * In M0, it's validated with mocks.
 */
export interface CheckContractsUseCase {
  execute(request: CheckContractsRequest): CheckContractsResponse;
}
