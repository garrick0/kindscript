import { ScaffoldRequest, ScaffoldPlanResponse } from './scaffold.types';
import { ScaffoldPlan } from '../../../domain/value-objects/scaffold-plan';
import { ScaffoldResult } from '../../../domain/value-objects/scaffold-result';

export interface ScaffoldUseCase {
  plan(request: ScaffoldRequest): ScaffoldPlanResponse;
  apply(plan: ScaffoldPlan): ScaffoldResult;
}
