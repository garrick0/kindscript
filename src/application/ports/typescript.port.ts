import { Program } from '../../domain/entities/program';
import { ImportEdge } from '../../domain/value-objects/import-edge';
import { Diagnostic } from '../../domain/entities/diagnostic';
import { CompilerOptions } from '../../domain/types/compiler-options';

/**
 * Domain abstraction for a TypeScript source file.
 *
 * This is defined in the application layer as a port concept,
 * not in domain, because it's specific to how we interact with TypeScript.
 */
export interface SourceFile {
  fileName: string;
  text: string;
  /** Opaque handle for infrastructure adapters. Domain code must not inspect this. */
  readonly handle?: unknown;
}

/**
 * Domain abstraction for a TypeScript type checker.
 */
export interface TypeChecker {
  // Intentionally empty — acts as an opaque branded type at the port boundary.
}

/**
 * Program lifecycle operations.
 */
export interface CompilerPort {
  createProgram(rootFiles: string[], options: CompilerOptions): Program;
  getSourceFile(program: Program, fileName: string): SourceFile | undefined;
  getSourceFiles(program: Program): SourceFile[];
  getTypeChecker(program: Program): TypeChecker;
  getDiagnostics(program: Program): Diagnostic[];
}

/**
 * Source-level code analysis operations.
 */
export interface CodeAnalysisPort {
  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[];
  getImportModuleSpecifiers(program: Program, sourceFile: SourceFile): Array<{ moduleName: string; line: number; column: number }>;
  getExportedInterfaceNames(program: Program, sourceFile: SourceFile): string[];
  hasClassImplementing(program: Program, sourceFile: SourceFile, interfaceName: string): boolean;
}

/**
 * Full TypeScript port — composition of all sub-ports.
 *
 * Consumers should depend on the specific sub-port they need.
 * This composite type is kept for backward compatibility.
 */
export type TypeScriptPort = CompilerPort & CodeAnalysisPort;
