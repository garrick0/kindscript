import { ClassifyProjectService } from '../../src/application/use-cases/classify-project/classify-project.service';
import { ClassifyASTUseCase } from '../../src/application/use-cases/classify-ast/classify-ast.use-case';
import { MockConfigAdapter } from '../../src/infrastructure/adapters/testing/mock-config.adapter';
import { MockFileSystemAdapter } from '../../src/infrastructure/adapters/testing/mock-filesystem.adapter';
import { MockTypeScriptAdapter } from '../../src/infrastructure/adapters/testing/mock-typescript.adapter';

describe('ClassifyProjectService', () => {
  let mockConfig: MockConfigAdapter;
  let mockFS: MockFileSystemAdapter;
  let mockTS: MockTypeScriptAdapter;
  let mockClassify: ClassifyASTUseCase;
  let service: ClassifyProjectService;

  beforeEach(() => {
    mockConfig = new MockConfigAdapter();
    mockFS = new MockFileSystemAdapter();
    mockTS = new MockTypeScriptAdapter();
    mockClassify = {
      execute: jest.fn().mockReturnValue({
        symbols: [],
        contracts: [],
        instanceTypeNames: new Map(),
        errors: [],
      }),
    };
    service = new ClassifyProjectService(mockConfig, mockFS, mockTS, mockClassify);
  });

  afterEach(() => {
    mockConfig.reset();
    mockFS.reset();
    mockTS.reset();
  });

  it('returns error when no TypeScript files found', () => {
    // No files in the filesystem → readDirectory returns []

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No TypeScript files found');
    }
  });

  it('returns error when no .k.ts files found in program', () => {
    // Has TS files, but none end with .k.ts
    mockFS.withFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No .k.ts definition files found');
    }
  });

  it('discovers .k.ts files from program source files', () => {
    mockFS.withFile('/project/src/app.ts', '');
    mockFS.withFile('/project/src/context.k.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.k.ts', '');

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
    expect(mockClassify.execute).toHaveBeenCalledTimes(1);
  });

  it('works without kindscript.json', () => {
    // No kindscript.json configured — should still work
    mockFS.withFile('/project/src/app.ts', '');
    mockFS.withFile('/project/src/context.k.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.k.ts', '');

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
  });

  it('uses rootDir from compilerOptions when tsConfig has no files', () => {
    mockConfig.withKindScriptConfig('/project', {
      compilerOptions: { rootDir: 'src' },
    });
    mockConfig.withTSConfig('/project/tsconfig.json', {
      compilerOptions: {},
    });
    // Add files under /project/src
    mockFS.withFile('/project/src/app.ts', '');
    mockFS.withFile('/project/src/context.k.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.k.ts', '');

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
  });

  it('uses tsConfig files array when provided', () => {
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: ['/project/src/main.ts'],
    });
    mockTS.withSourceFile('/project/src/main.ts', '');
    mockTS.withSourceFile('/project/src/context.k.ts', '');

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
  });

  it('returns cached result on second call with same .k.ts files', () => {
    mockFS.withFile('/project/src/app.ts', '');
    mockFS.withFile('/project/src/context.k.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.k.ts', '');

    const result1 = service.execute({ projectRoot: '/project' });
    const result2 = service.execute({ projectRoot: '/project' });

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    // classify should only be called once (cached on second call)
    expect(mockClassify.execute).toHaveBeenCalledTimes(1);
  });
});
