import {
  LanguageServicePort,
  TSDiagnostic,
  TSCodeFixAction,
} from '../../../application/ports/language-service.port';
import { Program } from '../../../domain/entities/program';

/**
 * Mock implementation of LanguageServicePort for testing.
 *
 * This adapter simulates the TypeScript language service plugin context,
 * allowing tests to configure project root, programs, original diagnostics,
 * and root files without running tsserver.
 *
 * Uses a fluent API for easy test setup:
 * ```typescript
 * mockLS
 *   .withProjectRoot('/project')
 *   .withProgram(program)
 *   .withRootFiles(['/project/src/index.ts']);
 * ```
 */
export class MockLanguageServiceAdapter implements LanguageServicePort {
  private projectRoot = '/project';
  private program: Program | undefined;
  private originalDiagnostics = new Map<string, TSDiagnostic[]>();
  private originalCodeFixes = new Map<string, TSCodeFixAction[]>();
  private rootFiles: string[] = [];

  // Fluent configuration API for tests

  withProjectRoot(root: string): this {
    this.projectRoot = root;
    return this;
  }

  withProgram(program: Program): this {
    this.program = program;
    return this;
  }

  withOriginalDiagnostics(fileName: string, diagnostics: TSDiagnostic[]): this {
    this.originalDiagnostics.set(fileName, diagnostics);
    return this;
  }

  withOriginalCodeFixes(fileName: string, fixes: TSCodeFixAction[]): this {
    this.originalCodeFixes.set(fileName, fixes);
    return this;
  }

  withRootFiles(files: string[]): this {
    this.rootFiles = files;
    return this;
  }

  reset(): void {
    this.projectRoot = '/project';
    this.program = undefined;
    this.originalDiagnostics.clear();
    this.originalCodeFixes.clear();
    this.rootFiles = [];
  }

  // Implement LanguageServicePort interface

  getProjectRoot(): string {
    return this.projectRoot;
  }

  getProgram(): Program | undefined {
    return this.program;
  }

  getOriginalSemanticDiagnostics(fileName: string): TSDiagnostic[] {
    return this.originalDiagnostics.get(fileName) || [];
  }

  getOriginalCodeFixes(
    fileName: string,
    _start: number,
    _end: number,
    _errorCodes: readonly number[]
  ): TSCodeFixAction[] {
    return this.originalCodeFixes.get(fileName) || [];
  }

  getRootFileNames(): string[] {
    return this.rootFiles;
  }
}
