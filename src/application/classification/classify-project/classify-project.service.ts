import { ClassifyProjectUseCase } from './classify-project.use-case';
import { ClassifyProjectRequest, ClassifyProjectResult, ClassifyProjectSuccess } from './classify-project.types';
import { ClassifyASTUseCase } from '../classify-ast/classify-ast.use-case';
import { ConfigPort } from '../../ports/config.port';
import { FileSystemPort } from '../../ports/filesystem.port';
import { CompilerPort } from '../../ports/typescript.port';
import { CompilerOptions } from '../../../domain/types/compiler-options';

/**
 * Orchestrates the full project classification pipeline.
 *
 * Reads config, resolves definition files, creates a TypeScript program,
 * and classifies definitions to extract symbols and contracts.
 *
 * Supports optional caching keyed on definition file paths — useful in the
 * plugin context where classification is requested on every keystroke.
 */
export class ClassifyProjectService implements ClassifyProjectUseCase {
  private cache?: { definitionKey: string; result: ClassifyProjectSuccess };

  constructor(
    private readonly configPort: ConfigPort,
    private readonly fsPort: FileSystemPort,
    private readonly tsPort: CompilerPort,
    private readonly classifyService: ClassifyASTUseCase,
  ) {}

  execute(request: ClassifyProjectRequest): ClassifyProjectResult {
    const { projectRoot } = request;

    // 1. Read kindscript.json (optional — used for settings only)
    const ksConfig = this.configPort.readKindScriptConfig(projectRoot) ?? {};

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
      return { ok: false, error: 'No TypeScript files found.' };
    }

    // 4. Create TS program
    const program = this.tsPort.createProgram(rootFiles, compilerOptions);
    const checker = this.tsPort.getTypeChecker(program);

    // 5. Pass all source files for Kind/InstanceConfig discovery
    const allSourceFiles = this.tsPort.getSourceFiles(program);

    if (allSourceFiles.length === 0) {
      return { ok: false, error: 'No source files found in the project.' };
    }

    // 5b. Return cached result if source files haven't changed
    const definitionKey = allSourceFiles
      .map(sf => `${sf.fileName}:${this.fsPort.getModifiedTime(sf.fileName)}`)
      .sort()
      .join('|');
    if (this.cache && this.cache.definitionKey === definitionKey) {
      return this.cache.result;
    }

    // 6. Classify definitions — the adapter identifies Kind/InstanceConfig via
    //    the type checker, so all source files are passed through. Files without
    //    definitions produce empty results (fast no-op).
    const classifyResult = this.classifyService.execute({
      definitionFiles: allSourceFiles,
      checker,
      projectRoot,
    });

    if (classifyResult.symbols.length === 0) {
      return { ok: false, error: 'No Kind definitions found in the project.' };
    }

    const result: ClassifyProjectSuccess = {
      ok: true,
      symbols: classifyResult.symbols,
      contracts: classifyResult.contracts,
      classificationErrors: classifyResult.errors,
      instanceTypeNames: classifyResult.instanceTypeNames,
      program,
      rootFiles,
      config: ksConfig,
    };

    this.cache = { definitionKey, result };
    return result;
  }
}
