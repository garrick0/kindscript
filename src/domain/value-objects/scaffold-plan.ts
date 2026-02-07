import { ScaffoldOperation, OperationType } from './scaffold-operation';

export class ScaffoldPlan {
  constructor(
    public readonly operations: ScaffoldOperation[],
    public readonly instanceName: string,
    public readonly kindName: string,
  ) {}

  get directoryCount(): number {
    return this.operations.filter(o => o.type === OperationType.CreateDirectory).length;
  }

  get fileCount(): number {
    return this.operations.filter(o => o.type === OperationType.CreateFile).length;
  }

  toString(): string {
    const lines = this.operations.map(o => `  ${o.toString()}`);
    return `ScaffoldPlan for '${this.instanceName}' (${this.kindName}):\n${lines.join('\n')}`;
  }

  equals(other: ScaffoldPlan): boolean {
    if (this.instanceName !== other.instanceName) return false;
    if (this.kindName !== other.kindName) return false;
    if (this.operations.length !== other.operations.length) return false;
    return this.operations.every((op, i) => op.equals(other.operations[i]));
  }
}
