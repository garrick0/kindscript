import {
  TypeScriptPort,
  SourceFile,
  TypeChecker,
} from '../../../src/application/ports/typescript.port';
import { Program } from '../../../src/domain/entities/program';
import { ImportEdge } from '../../../src/application/pipeline/check/import-edge';
import { IntraFileEdge } from '../../../src/application/pipeline/check/intra-file-edge';
import { CompilerOptions } from '../../../src/domain/types/compiler-options';

/**
 * Mock implementation of TypeScriptPort for testing.
 *
 * This adapter allows tests to configure source files, imports, and diagnostics
 * without actually using the TypeScript compiler API.
 *
 * Uses a fluent API for easy test setup:
 * ```typescript
 * mockTS
 *   .withSourceFile('src/domain/entity.ts', 'export class Entity {}')
 *   .withImport('src/app/service.ts', 'src/domain/entity.ts', '../domain/entity');
 * ```
 */
export class MockTypeScriptAdapter implements TypeScriptPort {
  private sourceFiles = new Map<string, SourceFile>();
  private imports = new Map<string, ImportEdge[]>();
  private intraFileRefs = new Map<string, IntraFileEdge[]>();
  private moduleSpecifiers = new Map<string, Array<{ moduleName: string; line: number; column: number }>>();

  // Fluent configuration API for tests

  /**
   * Add a source file to the mock program.
   */
  withSourceFile(fileName: string, text: string): this {
    this.sourceFiles.set(fileName, { fileName, text });
    return this;
  }

  /**
   * Add an import edge between two files.
   */
  withImport(
    from: string,
    to: string,
    importPath: string,
    line: number = 1,
    column: number = 0
  ): this {
    const existing = this.imports.get(from) || [];
    existing.push(new ImportEdge(from, to, line, column, importPath));
    this.imports.set(from, existing);
    return this;
  }

  /**
   * Add an intra-file reference between two top-level declarations.
   */
  withIntraFileReference(
    fileName: string,
    from: string,
    to: string,
    line: number = 1,
    column: number = 0
  ): this {
    const existing = this.intraFileRefs.get(fileName) || [];
    existing.push({ fromDeclaration: from, toDeclaration: to, line, column });
    this.intraFileRefs.set(fileName, existing);
    return this;
  }

  /**
   * Add an import module specifier for a file.
   */
  withModuleSpecifier(fileName: string, moduleName: string, line: number = 1, column: number = 0): this {
    const existing = this.moduleSpecifiers.get(fileName) || [];
    existing.push({ moduleName, line, column });
    this.moduleSpecifiers.set(fileName, existing);
    return this;
  }

  /**
   * Reset all mock data (for test isolation).
   */
  reset(): void {
    this.sourceFiles.clear();
    this.imports.clear();
    this.intraFileRefs.clear();
    this.moduleSpecifiers.clear();
  }

  // Implement TypeScriptPort interface

  createProgram(rootFiles: string[], options: CompilerOptions): Program {
    return new Program(rootFiles, options);
  }

  getSourceFile(_program: Program, fileName: string): SourceFile | undefined {
    return this.sourceFiles.get(fileName);
  }

  getSourceFiles(_program: Program): SourceFile[] {
    return Array.from(this.sourceFiles.values());
  }

  getTypeChecker(_program: Program): TypeChecker {
    // Mock type checker - just an empty object for now
    return {} as TypeChecker;
  }

  getImports(sourceFile: SourceFile, _checker: TypeChecker): ImportEdge[] {
    return this.imports.get(sourceFile.fileName) || [];
  }

  getIntraFileReferences(sourceFile: SourceFile, _checker: TypeChecker): IntraFileEdge[] {
    return this.intraFileRefs.get(sourceFile.fileName) || [];
  }

  getImportModuleSpecifiers(_program: Program, sourceFile: SourceFile): Array<{ moduleName: string; line: number; column: number }> {
    return this.moduleSpecifiers.get(sourceFile.fileName) || [];
  }
}
