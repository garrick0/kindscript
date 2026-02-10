import { Diagnostic } from '../../../src/domain/entities/diagnostic';
import { SourceRef } from '../../../src/domain/value-objects/source-ref';

/**
 * Tests for the language service proxy creation and interception logic.
 *
 * Since the proxy depends on ts.LanguageService and ts.server.PluginCreateInfo
 * (which require a running tsserver), these tests use simple mock objects
 * to verify the proxy behavior.
 */

// Minimal mock types
interface MockLanguageService {
  getSemanticDiagnostics: jest.Mock;
  getCodeFixesAtPosition: jest.Mock;
  getSyntacticDiagnostics: jest.Mock;
  getCompletionsAtPosition: jest.Mock;
}

function createMockLanguageService(): MockLanguageService {
  return {
    getSemanticDiagnostics: jest.fn().mockReturnValue([]),
    getCodeFixesAtPosition: jest.fn().mockReturnValue([]),
    getSyntacticDiagnostics: jest.fn().mockReturnValue([]),
    getCompletionsAtPosition: jest.fn().mockReturnValue(null),
  };
}

function createMockPluginCreateInfo(ls: MockLanguageService) {
  return {
    languageService: ls,
    project: {
      getCurrentDirectory: () => '/project',
      getFileNames: () => ['/project/src/index.ts'],
    },
  };
}

// Simplified proxy creation for testing (mirrors the real proxy logic)
function createTestProxy(
  info: ReturnType<typeof createMockPluginCreateInfo>,
  diagnosticsService: { execute: jest.Mock },
  codeFixesService: { execute: jest.Mock }
) {
  const proxy: Record<string, unknown> = {};
  const oldService = info.languageService;

  // Proxy all methods
  for (const k of Object.keys(oldService)) {
    const method = (oldService as unknown as Record<string, unknown>)[k];
    if (typeof method === 'function') {
      proxy[k] = (...args: unknown[]) => (method as Function).apply(oldService, args);
    }
  }

  // Intercept getSemanticDiagnostics
  proxy.getSemanticDiagnostics = (fileName: string) => {
    const tsDiags = oldService.getSemanticDiagnostics(fileName);
    try {
      const result = diagnosticsService.execute({ fileName, projectRoot: '/project' });
      if (result.diagnostics.length === 0) return tsDiags;
      // Convert domain diagnostics to simple objects
      const ksDiags = result.diagnostics.map((d: Diagnostic) => ({
        messageText: d.message,
        code: d.code,
        source: 'kindscript',
      }));
      return [...tsDiags, ...ksDiags];
    } catch {
      return tsDiags;
    }
  };

  // Intercept getCodeFixesAtPosition
  proxy.getCodeFixesAtPosition = (
    fileName: string,
    start: number,
    end: number,
    errorCodes: number[],
    _formatOptions: unknown,
    _preferences: unknown
  ) => {
    const tsFixes = oldService.getCodeFixesAtPosition(fileName, start, end, errorCodes, _formatOptions, _preferences);
    try {
      const result = codeFixesService.execute({
        fileName, start, end, errorCodes, projectRoot: '/project',
      });
      const ksFixes = result.fixes.map((f: { fixName: string; description: string }) => ({
        fixName: f.fixName,
        description: f.description,
        changes: [],
      }));
      return [...tsFixes, ...ksFixes];
    } catch {
      return tsFixes;
    }
  };

  return proxy;
}

describe('Language Service Proxy', () => {
  let mockLS: MockLanguageService;
  let mockInfo: ReturnType<typeof createMockPluginCreateInfo>;
  let mockDiagnosticsService: { execute: jest.Mock };
  let mockCodeFixesService: { execute: jest.Mock };

  beforeEach(() => {
    mockLS = createMockLanguageService();
    mockInfo = createMockPluginCreateInfo(mockLS);
    mockDiagnosticsService = {
      execute: jest.fn().mockReturnValue({ diagnostics: [], elapsedMs: 0 }),
    };
    mockCodeFixesService = {
      execute: jest.fn().mockReturnValue({ fixes: [] }),
    };
  });

  it('proxies all original language service methods', () => {
    const proxy = createTestProxy(mockInfo, mockDiagnosticsService, mockCodeFixesService);

    // Call a non-intercepted method
    (proxy as Record<string, Function>).getSyntacticDiagnostics('/project/src/index.ts');
    expect(mockLS.getSyntacticDiagnostics).toHaveBeenCalledWith('/project/src/index.ts');

    (proxy as Record<string, Function>).getCompletionsAtPosition('/project/src/index.ts', 5);
    expect(mockLS.getCompletionsAtPosition).toHaveBeenCalledWith('/project/src/index.ts', 5);
  });

  it('appends KindScript diagnostics to original diagnostics', () => {
    const tsDiag = { messageText: 'TS error', code: 2304 };
    mockLS.getSemanticDiagnostics.mockReturnValue([tsDiag]);

    const ksDiag = new Diagnostic(
      'Forbidden dependency: a -> b',
      70001,
      SourceRef.at('/project/src/domain/service.ts', 1, 0),
    );
    mockDiagnosticsService.execute.mockReturnValue({
      diagnostics: [ksDiag],
      elapsedMs: 5,
    });

    const proxy = createTestProxy(mockInfo, mockDiagnosticsService, mockCodeFixesService);
    const result = (proxy as Record<string, Function>).getSemanticDiagnostics('/project/src/domain/service.ts');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(tsDiag);
    expect(result[1].messageText).toBe('Forbidden dependency: a -> b');
    expect(result[1].code).toBe(70001);
    expect(result[1].source).toBe('kindscript');
  });

  it('returns only original diagnostics when KindScript throws', () => {
    const tsDiag = { messageText: 'TS error', code: 2304 };
    mockLS.getSemanticDiagnostics.mockReturnValue([tsDiag]);
    mockDiagnosticsService.execute.mockImplementation(() => {
      throw new Error('Plugin crash');
    });

    const proxy = createTestProxy(mockInfo, mockDiagnosticsService, mockCodeFixesService);
    const result = (proxy as Record<string, Function>).getSemanticDiagnostics('/project/src/index.ts');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(tsDiag);
  });

  it('appends KindScript code fixes to original fixes', () => {
    const tsFix = { fixName: 'ts-fix', description: 'TS fix', changes: [] };
    mockLS.getCodeFixesAtPosition.mockReturnValue([tsFix]);

    mockCodeFixesService.execute.mockReturnValue({
      fixes: [{
        fixName: 'kindscript-remove-forbidden-import',
        description: 'Remove this import',
        diagnosticCode: 70001,
      }],
    });

    const proxy = createTestProxy(mockInfo, mockDiagnosticsService, mockCodeFixesService);
    const result = (proxy as Record<string, Function>).getCodeFixesAtPosition(
      '/project/src/index.ts', 0, 50, [70001], {}, {}
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(tsFix);
    expect(result[1].fixName).toBe('kindscript-remove-forbidden-import');
    expect(result[1].description).toBe('Remove this import');
  });

  it('returns only original fixes when KindScript throws', () => {
    const tsFix = { fixName: 'ts-fix', description: 'TS fix', changes: [] };
    mockLS.getCodeFixesAtPosition.mockReturnValue([tsFix]);
    mockCodeFixesService.execute.mockImplementation(() => {
      throw new Error('Plugin crash');
    });

    const proxy = createTestProxy(mockInfo, mockDiagnosticsService, mockCodeFixesService);
    const result = (proxy as Record<string, Function>).getCodeFixesAtPosition(
      '/project/src/index.ts', 0, 50, [70001], {}, {}
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(tsFix);
  });

  it('does not modify original diagnostics (non-destructive append)', () => {
    const tsDiag = { messageText: 'TS error', code: 2304 };
    const originalArray = [tsDiag];
    mockLS.getSemanticDiagnostics.mockReturnValue(originalArray);

    mockDiagnosticsService.execute.mockReturnValue({
      diagnostics: [new Diagnostic('KS error', 70001, SourceRef.at('test.ts', 1, 0))],
      elapsedMs: 0,
    });

    const proxy = createTestProxy(mockInfo, mockDiagnosticsService, mockCodeFixesService);
    (proxy as Record<string, Function>).getSemanticDiagnostics('/project/src/index.ts');

    // Original array should not be modified
    expect(originalArray).toHaveLength(1);
    expect(originalArray[0]).toEqual(tsDiag);
  });
});
