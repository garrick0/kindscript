import { convertToTSDiagnostic, convertToCodeFixAction } from '../../../src/apps/plugin/diagnostic-converter';
import { Diagnostic } from '../../../src/domain/entities/diagnostic';
import { SourceRef } from '../../../src/domain/value-objects/source-ref';
import { Program } from '../../../src/domain/entities/program';

// Minimal mock of TypeScript module
const mockTypescript = {
  DiagnosticCategory: {
    Warning: 0,
    Error: 1,
    Suggestion: 2,
    Message: 3,
  },
} as any;

// Mock source file with line starts
function createMockSourceFile(fileName: string, text: string) {
  const lineStarts: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      lineStarts.push(i + 1);
    }
  }
  return {
    fileName,
    text,
    getLineStarts: () => lineStarts,
    getEnd: () => text.length,
  };
}

// Mock ts.Program
function createMockTsProgram(files: Map<string, ReturnType<typeof createMockSourceFile>>) {
  return {
    getSourceFile: (name: string) => files.get(name),
  };
}

describe('convertToTSDiagnostic', () => {
  it('converts domain Diagnostic to ts.Diagnostic with correct fields', () => {
    const fileText = 'import { db } from "../infrastructure/database";\nexport class Service {}\n';
    const sourceFile = createMockSourceFile('/project/src/domain/service.ts', fileText);
    const files = new Map([[sourceFile.fileName, sourceFile]]);
    const tsProgram = createMockTsProgram(files);
    const program = new Program([sourceFile.fileName], {}, tsProgram);

    const diagnostic = new Diagnostic(
      'Forbidden dependency: service.ts -> database.ts',
      70001,
      SourceRef.at('/project/src/domain/service.ts', 1, 0),
    );

    const result = convertToTSDiagnostic(diagnostic, program, mockTypescript);

    expect(result.messageText).toBe('Forbidden dependency: service.ts -> database.ts');
    expect(result.code).toBe(70001);
    expect(result.source).toBe('kindscript');
  });

  it('sets source to kindscript', () => {
    const sourceFile = createMockSourceFile('/project/src/index.ts', 'console.log("hello");');
    const files = new Map([[sourceFile.fileName, sourceFile]]);
    const tsProgram = createMockTsProgram(files);
    const program = new Program([sourceFile.fileName], {}, tsProgram);

    const diagnostic = new Diagnostic('Test message', 70001, SourceRef.at('/project/src/index.ts', 1, 0));
    const result = convertToTSDiagnostic(diagnostic, program, mockTypescript);

    expect(result.source).toBe('kindscript');
  });

  it('sets category to Error', () => {
    const sourceFile = createMockSourceFile('/project/src/index.ts', '');
    const files = new Map([[sourceFile.fileName, sourceFile]]);
    const tsProgram = createMockTsProgram(files);
    const program = new Program([sourceFile.fileName], {}, tsProgram);

    const diagnostic = new Diagnostic('Test', 70001, SourceRef.at('/project/src/index.ts', 0, 0));
    const result = convertToTSDiagnostic(diagnostic, program, mockTypescript);

    expect(result.category).toBe(mockTypescript.DiagnosticCategory.Error);
  });

  it('computes start offset from line and column', () => {
    const fileText = 'line 1\nline 2\nline 3\n';
    const sourceFile = createMockSourceFile('/project/src/index.ts', fileText);
    const files = new Map([[sourceFile.fileName, sourceFile]]);
    const tsProgram = createMockTsProgram(files);
    const program = new Program([sourceFile.fileName], {}, tsProgram);

    // Line 2 (1-indexed), column 3 (0-indexed)
    const diagnostic = new Diagnostic('Test', 70001, SourceRef.at('/project/src/index.ts', 2, 3));
    const result = convertToTSDiagnostic(diagnostic, program, mockTypescript);

    // Line 2 starts at offset 7 ("line 1\n"), column 3 -> offset 10
    expect(result.start).toBe(10);
    expect(result.length).toBe(6); // "line 2"
  });

  it('handles missing source file gracefully', () => {
    const files = new Map<string, ReturnType<typeof createMockSourceFile>>();
    const tsProgram = createMockTsProgram(files);
    const program = new Program([], {}, tsProgram);

    const diagnostic = new Diagnostic('Test', 70001, SourceRef.at('/nonexistent.ts', 1, 0));
    const result = convertToTSDiagnostic(diagnostic, program, mockTypescript);

    expect(result.start).toBeUndefined();
    expect(result.length).toBeUndefined();
    expect(result.messageText).toBe('Test');
    expect(result.code).toBe(70001);
  });

  it('preserves diagnostic code (70001, 70003, etc.)', () => {
    const sourceFile = createMockSourceFile('/project/src/index.ts', '');
    const files = new Map([[sourceFile.fileName, sourceFile]]);
    const tsProgram = createMockTsProgram(files);
    const program = new Program([sourceFile.fileName], {}, tsProgram);

    const diag1 = new Diagnostic('Forbidden', 70001, SourceRef.at('/project/src/index.ts', 0, 0));
    const diag3 = new Diagnostic('Impure', 70003, SourceRef.at('/project/src/index.ts', 0, 0));

    expect(convertToTSDiagnostic(diag1, program, mockTypescript).code).toBe(70001);
    expect(convertToTSDiagnostic(diag3, program, mockTypescript).code).toBe(70003);
  });
});

describe('convertToCodeFixAction', () => {
  it('creates a CodeFixAction with correct fields', () => {
    const fix = {
      fixName: 'kindscript-remove-forbidden-import',
      description: 'Remove this import (forbidden dependency)',
      diagnosticCode: 70001,
    };

    const result = convertToCodeFixAction(fix);

    expect(result.fixName).toBe('kindscript-remove-forbidden-import');
    expect(result.description).toBe('Remove this import (forbidden dependency)');
    expect(result.changes).toEqual([]);
    expect(result.fixId).toBe('kindscript-remove-forbidden-import');
  });

  it('sets empty changes array (description-only fix for M5)', () => {
    const fix = {
      fixName: 'test-fix',
      description: 'Test fix',
      diagnosticCode: 70001,
    };

    const result = convertToCodeFixAction(fix);

    expect(result.changes).toEqual([]);
  });
});
