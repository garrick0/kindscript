import { CheckerRequest } from './checker.request';
import { CheckerResponse } from './checker.response';

/**
 * Use case interface for the Checker stage.
 *
 * Evaluates contracts against a pre-built model of the project
 * (resolved files + TypeScript program) and reports violations.
 */
export interface CheckerUseCase {
  execute(request: CheckerRequest): CheckerResponse;
}
