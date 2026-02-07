import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ScaffoldPlan } from '../../../domain/value-objects/scaffold-plan';

export interface ScaffoldRequest {
  instanceSymbol: ArchSymbol;
  kindName: string;
  projectRoot: string;
}

export interface ScaffoldPlanResponse {
  plan: ScaffoldPlan;
  warnings: string[];
}
