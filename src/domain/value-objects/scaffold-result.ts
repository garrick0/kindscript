import { ScaffoldOperation } from './scaffold-operation';

export class OperationResult {
  private constructor(
    public readonly operation: ScaffoldOperation,
    public readonly success: boolean,
    public readonly skipped: boolean,
    public readonly error?: string,
  ) {}

  static success(op: ScaffoldOperation): OperationResult {
    return new OperationResult(op, true, false);
  }

  static skipped(op: ScaffoldOperation, reason: string): OperationResult {
    return new OperationResult(op, true, true, reason);
  }

  static failure(op: ScaffoldOperation, error: string): OperationResult {
    return new OperationResult(op, false, false, error);
  }
}

export class ScaffoldResult {
  constructor(
    public readonly results: OperationResult[],
  ) {}

  get successCount(): number {
    return this.results.filter(r => r.success && !r.skipped).length;
  }

  get skippedCount(): number {
    return this.results.filter(r => r.skipped).length;
  }

  get failureCount(): number {
    return this.results.filter(r => !r.success).length;
  }

  get allSucceeded(): boolean {
    return this.results.every(r => r.success);
  }
}
