import { ScaffoldOperation, OperationType } from '../../src/domain/value-objects/scaffold-operation';
import { ScaffoldPlan } from '../../src/domain/value-objects/scaffold-plan';
import { OperationResult, ScaffoldResult } from '../../src/domain/value-objects/scaffold-result';

describe('ScaffoldOperation', () => {
  it('createDirectory sets correct type and path', () => {
    const op = ScaffoldOperation.createDirectory('/project/src/domain');
    expect(op.type).toBe(OperationType.CreateDirectory);
    expect(op.path).toBe('/project/src/domain');
    expect(op.content).toBeUndefined();
  });

  it('createFile sets correct type, path, and content', () => {
    const op = ScaffoldOperation.createFile('/project/src/domain/index.ts', 'export {};');
    expect(op.type).toBe(OperationType.CreateFile);
    expect(op.path).toBe('/project/src/domain/index.ts');
    expect(op.content).toBe('export {};');
  });

  it('toString returns readable format', () => {
    const op = ScaffoldOperation.createDirectory('/project/src/domain');
    expect(op.toString()).toBe('createDirectory: /project/src/domain');
  });

  it('equals returns true for identical operations', () => {
    const a = ScaffoldOperation.createFile('/p/index.ts', 'content');
    const b = ScaffoldOperation.createFile('/p/index.ts', 'content');
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different type', () => {
    const a = ScaffoldOperation.createDirectory('/p');
    const b = ScaffoldOperation.createFile('/p', '');
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns false for different path', () => {
    const a = ScaffoldOperation.createDirectory('/a');
    const b = ScaffoldOperation.createDirectory('/b');
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns false for different content', () => {
    const a = ScaffoldOperation.createFile('/p', 'a');
    const b = ScaffoldOperation.createFile('/p', 'b');
    expect(a.equals(b)).toBe(false);
  });
});

describe('ScaffoldPlan', () => {
  const ops = [
    ScaffoldOperation.createDirectory('/p/src'),
    ScaffoldOperation.createDirectory('/p/src/domain'),
    ScaffoldOperation.createFile('/p/src/domain/index.ts', 'export {};'),
    ScaffoldOperation.createDirectory('/p/src/infra'),
    ScaffoldOperation.createFile('/p/src/infra/index.ts', 'export {};'),
  ];

  it('directoryCount returns correct count', () => {
    const plan = new ScaffoldPlan(ops, 'app', 'CleanContext');
    expect(plan.directoryCount).toBe(3);
  });

  it('fileCount returns correct count', () => {
    const plan = new ScaffoldPlan(ops, 'app', 'CleanContext');
    expect(plan.fileCount).toBe(2);
  });

  it('toString returns formatted plan', () => {
    const plan = new ScaffoldPlan(ops, 'app', 'CleanContext');
    const str = plan.toString();
    expect(str).toContain("ScaffoldPlan for 'app' (CleanContext):");
    expect(str).toContain('createDirectory: /p/src');
    expect(str).toContain('createFile: /p/src/domain/index.ts');
  });

  it('equals returns true for identical plans', () => {
    const a = new ScaffoldPlan(ops, 'app', 'CleanContext');
    const b = new ScaffoldPlan([...ops.map(o =>
      o.type === OperationType.CreateDirectory
        ? ScaffoldOperation.createDirectory(o.path)
        : ScaffoldOperation.createFile(o.path, o.content!)
    )], 'app', 'CleanContext');
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different instance name', () => {
    const a = new ScaffoldPlan([], 'app', 'CleanContext');
    const b = new ScaffoldPlan([], 'billing', 'CleanContext');
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns false for different kind name', () => {
    const a = new ScaffoldPlan([], 'app', 'CleanContext');
    const b = new ScaffoldPlan([], 'app', 'HexContext');
    expect(a.equals(b)).toBe(false);
  });

  it('equals returns false for different operations', () => {
    const a = new ScaffoldPlan([ScaffoldOperation.createDirectory('/a')], 'app', 'C');
    const b = new ScaffoldPlan([ScaffoldOperation.createDirectory('/b')], 'app', 'C');
    expect(a.equals(b)).toBe(false);
  });
});

describe('OperationResult', () => {
  const op = ScaffoldOperation.createDirectory('/p');

  it('success() creates a successful result', () => {
    const result = OperationResult.success(op);
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.error).toBeUndefined();
    expect(result.operation).toBe(op);
  });

  it('skipped() creates a skipped result', () => {
    const result = OperationResult.skipped(op, 'already exists');
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.error).toBe('already exists');
  });

  it('failure() creates a failed result', () => {
    const result = OperationResult.failure(op, 'permission denied');
    expect(result.success).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.error).toBe('permission denied');
  });
});

describe('ScaffoldResult', () => {
  const op1 = ScaffoldOperation.createDirectory('/a');
  const op2 = ScaffoldOperation.createDirectory('/b');
  const op3 = ScaffoldOperation.createFile('/c', '');
  const op4 = ScaffoldOperation.createFile('/d', '');

  it('successCount counts non-skipped successes', () => {
    const result = new ScaffoldResult([
      OperationResult.success(op1),
      OperationResult.success(op2),
      OperationResult.skipped(op3, 'exists'),
      OperationResult.failure(op4, 'err'),
    ]);
    expect(result.successCount).toBe(2);
  });

  it('skippedCount counts skipped operations', () => {
    const result = new ScaffoldResult([
      OperationResult.success(op1),
      OperationResult.skipped(op2, 'exists'),
      OperationResult.skipped(op3, 'exists'),
    ]);
    expect(result.skippedCount).toBe(2);
  });

  it('failureCount counts failures', () => {
    const result = new ScaffoldResult([
      OperationResult.failure(op1, 'err1'),
      OperationResult.failure(op2, 'err2'),
      OperationResult.success(op3),
    ]);
    expect(result.failureCount).toBe(2);
  });

  it('allSucceeded returns true when all succeed (including skipped)', () => {
    const result = new ScaffoldResult([
      OperationResult.success(op1),
      OperationResult.skipped(op2, 'exists'),
    ]);
    expect(result.allSucceeded).toBe(true);
  });

  it('allSucceeded returns false when any failure exists', () => {
    const result = new ScaffoldResult([
      OperationResult.success(op1),
      OperationResult.failure(op2, 'err'),
    ]);
    expect(result.allSucceeded).toBe(false);
  });
});
