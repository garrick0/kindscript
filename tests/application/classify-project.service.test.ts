import { PipelineService } from '../../src/application/pipeline/pipeline.service';
import { ProgramPort, ProgramSetup } from '../../src/application/pipeline/program';
import { ScanResult, ScanUseCase } from '../../src/application/pipeline/scan/scan.types';
import { ParseResult, ParseUseCase } from '../../src/application/pipeline/parse/parse.types';
import { BindResult, BindUseCase } from '../../src/application/pipeline/bind/bind.types';
import { CheckerUseCase } from '../../src/application/pipeline/check/checker.use-case';
import { MockFileSystemAdapter } from '../helpers/mocks/mock-filesystem.adapter';

function makeProgramSetup(overrides?: Partial<ProgramSetup>): ProgramSetup {
  return {
    program: { rootFiles: [], options: {}, handle: {} },
    sourceFiles: [{ fileName: '/project/src/app.ts', text: '' }],
    checker: {},
    config: {},
    ...overrides,
  };
}

function makeScanResult(overrides?: Partial<ScanResult>): ScanResult {
  return {
    kindDefs: new Map(),
    instances: [],
    annotatedExports: [],
    errors: [],
    ...overrides,
  };
}

function makeParseResult(overrides?: Partial<ParseResult>): ParseResult {
  return {
    symbols: [{ name: 'app', kind: 'Instance' } as never],
    kindDefs: new Map(),
    instanceSymbols: new Map(),
    instanceTypeNames: new Map(),
    errors: [],
    ...overrides,
  };
}

function makeBindResult(overrides?: Partial<BindResult>): BindResult {
  return {
    contracts: [],
    errors: [],
    ...overrides,
  };
}

describe('PipelineService', () => {
  let mockProgramFactory: ProgramPort;
  let mockFS: MockFileSystemAdapter;
  let mockScanner: ScanUseCase;
  let mockParser: ParseUseCase;
  let mockBinder: BindUseCase;
  let mockChecker: CheckerUseCase;

  function createService(): PipelineService {
    return new PipelineService(
      mockProgramFactory,
      mockFS,
      mockScanner,
      mockParser,
      mockBinder,
      mockChecker,
    );
  }

  beforeEach(() => {
    mockProgramFactory = {
      create: jest.fn().mockReturnValue(makeProgramSetup()),
    };
    mockFS = new MockFileSystemAdapter();
    mockScanner = { execute: jest.fn().mockReturnValue(makeScanResult()) };
    mockParser = { execute: jest.fn().mockReturnValue(makeParseResult()) };
    mockBinder = { execute: jest.fn().mockReturnValue(makeBindResult()) };
    mockChecker = {
      execute: jest.fn().mockReturnValue({
        diagnostics: [],
        contractsChecked: 0,
        filesAnalyzed: 0,
        violationsFound: 0,
      }),
    };
  });

  afterEach(() => {
    mockFS.reset();
  });

  it('returns error when program setup fails', () => {
    mockProgramFactory = {
      create: jest.fn().mockReturnValue({ error: 'No TypeScript files found.' }),
    };

    const service = createService();
    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No TypeScript files found');
    }
  });

  it('returns error when no Kind definitions found in program', () => {
    mockParser = {
      execute: jest.fn().mockReturnValue(makeParseResult({ symbols: [] })),
    };

    const service = createService();
    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('No Kind definitions found');
    }
  });

  it('passes all source files through scanner', () => {
    mockProgramFactory = {
      create: jest.fn().mockReturnValue(makeProgramSetup({
        sourceFiles: [
          { fileName: '/project/src/app.ts', text: '' },
          { fileName: '/project/src/context.ts', text: '' },
        ],
      })),
    };

    const service = createService();
    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
    expect(mockScanner.execute).toHaveBeenCalledTimes(1);
    expect(mockParser.execute).toHaveBeenCalledTimes(1);
    expect(mockBinder.execute).toHaveBeenCalledTimes(1);
  });

  it('delegates to program factory for setup', () => {
    const service = createService();
    service.execute({ projectRoot: '/project' });

    expect(mockProgramFactory.create).toHaveBeenCalledWith('/project');
  });

  it('aggregates errors from all stages', () => {
    mockScanner = { execute: jest.fn().mockReturnValue(makeScanResult({ errors: ['scan-err'] })) };
    mockParser = { execute: jest.fn().mockReturnValue(makeParseResult({ errors: ['parse-err'] })) };
    mockBinder = { execute: jest.fn().mockReturnValue(makeBindResult({ errors: ['bind-err'] })) };

    const service = createService();
    const result = service.execute({ projectRoot: '/project' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.classificationErrors).toEqual(['scan-err', 'parse-err', 'bind-err']);
    }
  });

  it('returns cached result on second call with same source files', () => {
    mockFS.withFile('/project/src/app.ts', '');

    const service = createService();
    const result1 = service.execute({ projectRoot: '/project' });
    const result2 = service.execute({ projectRoot: '/project' });

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
    // scanner should only be called once (cached on second call)
    expect(mockScanner.execute).toHaveBeenCalledTimes(1);
  });
});
