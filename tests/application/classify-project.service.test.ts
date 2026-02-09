import { ClassifyProjectService } from '../../src/application/classification/classify-project/classify-project.service';
import { ClassifyASTUseCase } from '../../src/application/classification/classify-ast/classify-ast.use-case';
import { MockConfigAdapter } from '../helpers/mocks/mock-config.adapter';
import { MockFileSystemAdapter } from '../helpers/mocks/mock-filesystem.adapter';
import { MockTypeScriptAdapter } from '../helpers/mocks/mock-typescript.adapter';

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
        symbols: [{ name: 'app', kind: 'Instance' }],
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

  it('returns error when no Kind definitions found in program', () => {
    // Has TS files, but none contain Kind definitions
    mockFS.withFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');

    // Override default to return no symbols
    mockClassify = {
      execute: jest.fn().mockReturnValue({
        symbols: [],
        contracts: [],
        instanceTypeNames: new Map(),
        errors: [],
      }),
    };
    service = new ClassifyProjectService(mockConfig, mockFS, mockTS, mockClassify);

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No Kind definitions found');
    }
  });

  it('passes all source files to classifier for discovery', () => {
    mockFS.withFile('/project/src/app.ts', '');
    mockFS.withFile('/project/src/context.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.ts', '');

    // Classifier returns symbols so it counts as "definitions found"
    mockClassify = {
      execute: jest.fn().mockReturnValue({
        symbols: [{ name: 'app', kind: 'Instance' }],
        contracts: [],
        instanceTypeNames: new Map(),
        errors: [],
      }),
    };
    service = new ClassifyProjectService(mockConfig, mockFS, mockTS, mockClassify);

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
    expect(mockClassify.execute).toHaveBeenCalledTimes(1);
  });

  it('works without kindscript.json', () => {
    // No kindscript.json configured — should still work
    mockFS.withFile('/project/src/app.ts', '');
    mockFS.withFile('/project/src/context.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.ts', '');

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
    mockFS.withFile('/project/src/context.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.ts', '');

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
  });

  it('uses tsConfig files array when provided', () => {
    mockConfig.withTSConfig('/project/tsconfig.json', {
      files: ['/project/src/main.ts'],
    });
    mockTS.withSourceFile('/project/src/main.ts', '');
    mockTS.withSourceFile('/project/src/context.ts', '');

    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
  });

  it('returns cached result on second call with same source files', () => {
    mockFS.withFile('/project/src/app.ts', '');
    mockFS.withFile('/project/src/context.ts', '');
    mockTS.withSourceFile('/project/src/app.ts', '');
    mockTS.withSourceFile('/project/src/context.ts', '');

    const result1 = service.execute({ projectRoot: '/project' });
    const result2 = service.execute({ projectRoot: '/project' });

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    // classify should only be called once (cached on second call)
    expect(mockClassify.execute).toHaveBeenCalledTimes(1);
  });
});
