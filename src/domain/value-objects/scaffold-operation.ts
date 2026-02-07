export enum OperationType {
  CreateDirectory = 'createDirectory',
  CreateFile = 'createFile',
}

export class ScaffoldOperation {
  private constructor(
    public readonly type: OperationType,
    public readonly path: string,
    public readonly content?: string,
  ) {}

  static createDirectory(path: string): ScaffoldOperation {
    return new ScaffoldOperation(OperationType.CreateDirectory, path);
  }

  static createFile(path: string, content: string): ScaffoldOperation {
    return new ScaffoldOperation(OperationType.CreateFile, path, content);
  }

  toString(): string {
    return `${this.type}: ${this.path}`;
  }

  equals(other: ScaffoldOperation): boolean {
    return this.type === other.type
      && this.path === other.path
      && this.content === other.content;
  }
}
