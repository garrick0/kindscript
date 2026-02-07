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
}

/**
 * Domain abstraction for a TypeScript type checker.
 *
 * Minimal interface for M0 - will be expanded in later milestones.
 */
export interface TypeChecker {
  // Expanded in M2 when we need actual type information
}

/**
 * Port defining how KindScript interacts with the TypeScript compiler API.
 *
 * This interface is defined in the application layer and implemented
 * in the infrastructure layer. It abstracts away the TypeScript API
 * so that use cases remain pure and testable.
 *
 * See ANALYSIS_COMPILER_ARCHITECTURE_V4.md Part 4.4 for design rationale.
 */
export interface TypeScriptPort {
  /**
   * Create a TypeScript program from root files and compiler options.
   */
  createProgram(rootFiles: string[], options: CompilerOptions): Program;

  /**
   * Get a single source file from a program.
   */
  getSourceFile(program: Program, fileName: string): SourceFile | undefined;

  /**
   * Get all source files in a program.
   */
  getSourceFiles(program: Program): SourceFile[];

  /**
   * Get the type checker for a program.
   */
  getTypeChecker(program: Program): TypeChecker;

  /**
   * Extract import edges from a source file.
   *
   * This is a core operation for dependency analysis - it tells us
   * which files import which other files.
   */
  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[];

  /**
   * Get TypeScript diagnostics from a program.
   */
  getDiagnostics(program: Program): Diagnostic[];

  /**
   * Get raw import module specifiers from a source file.
   *
   * Unlike getImports(), this does not resolve or filter specifiers.
   * Returns the raw module name as written in the import statement,
   * which is needed for purity checks (detecting Node.js built-ins).
   */
  getImportModuleSpecifiers(program: Program, sourceFile: SourceFile): Array<{ moduleName: string; line: number; column: number }>;

  /**
   * Get names of exported interfaces in a source file.
   */
  getExportedInterfaceNames(program: Program, sourceFile: SourceFile): string[];

  /**
   * Check if any class in the file has an `implements` clause for the given interface name.
   */
  hasClassImplementing(program: Program, sourceFile: SourceFile, interfaceName: string): boolean;
}
