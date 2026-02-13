import { ConfigPort, KindScriptConfig } from '../ports/config.port.js';
import { FileSystemPort } from '../ports/filesystem.port.js';
import { CompilerPort, SourceFile, TypeChecker } from '../ports/typescript.port.js';
import { CompilerOptions } from '../../domain/types/compiler-options.js';
import { Program } from '../../domain/entities/program.js';

/**
 * Everything needed to run the pipeline stages.
 * Produced by ProgramFactory, consumed by PipelineService.
 */
export interface ProgramSetup {
  program: Program;
  sourceFiles: SourceFile[];
  checker: TypeChecker;
  config: KindScriptConfig;
}

/**
 * Port for creating a TypeScript program from a project root.
 *
 * Encapsulates config reading, file discovery, and TS program creation
 * so the pipeline orchestrator can focus on stage chaining.
 */
export interface ProgramPort {
  create(projectRoot: string): ProgramSetup | { error: string };
}

/**
 * Creates a TypeScript program from a project root.
 *
 * Reads kindscript.json + tsconfig.json, discovers root files,
 * creates ts.Program, and returns everything needed to run stages.
 */
export class ProgramFactory implements ProgramPort {
  constructor(
    private readonly configPort: ConfigPort,
    private readonly fsPort: FileSystemPort,
    private readonly tsPort: CompilerPort,
  ) {}

  create(projectRoot: string): ProgramSetup | { error: string } {
    // 1. Read kindscript.json (optional — used for settings only)
    let ksConfig: KindScriptConfig;
    try {
      ksConfig = this.configPort.readKindScriptConfig(projectRoot) ?? {};
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : String(e) };
    }

    // 2. Read tsconfig.json and merge compiler options
    const tsconfigPath = this.fsPort.resolvePath(projectRoot, 'tsconfig.json');
    const tsConfig = this.configPort.readTSConfig(tsconfigPath);

    const compilerOptions: CompilerOptions = {
      ...(tsConfig?.compilerOptions ?? {}),
      ...(ksConfig.compilerOptions ?? {}),
    };

    // 3. Determine root files
    let rootFiles: string[];
    if (tsConfig?.files && tsConfig.files.length > 0) {
      rootFiles = tsConfig.files;
    } else {
      const rootDir = compilerOptions.rootDir
        ? this.fsPort.resolvePath(projectRoot, compilerOptions.rootDir as string)
        : projectRoot;
      rootFiles = this.fsPort.readDirectory(rootDir, true);
    }

    if (rootFiles.length === 0) {
      return { error: 'No TypeScript files found.' };
    }

    // 4. Create TS program
    const program = this.tsPort.createProgram(rootFiles, compilerOptions);
    const checker = this.tsPort.getTypeChecker(program);

    // 5. Get all source files
    const sourceFiles = this.tsPort.getSourceFiles(program);
    if (sourceFiles.length === 0) {
      return { error: 'No source files found in the project.' };
    }

    return { program, sourceFiles, checker, config: ksConfig };
  }
}
