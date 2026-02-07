import { ClassifyProjectUseCase } from './classify-project.use-case';
import { ClassifyProjectRequest, ClassifyProjectResult, ClassifyProjectSuccess } from './classify-project.types';
import { ClassifyASTUseCase } from '../classify-ast/classify-ast.use-case';
import { ConfigPort } from '../../ports/config.port';
import { FileSystemPort } from '../../ports/filesystem.port';
import { TypeScriptPort } from '../../ports/typescript.port';
import { resolvePackageDefinitions } from '../../services/resolve-package-definitions';
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
    private readonly tsPort: TypeScriptPort,
    private readonly classifyService: ClassifyASTUseCase,
  ) {}

  execute(request: ClassifyProjectRequest): ClassifyProjectResult {
    const { projectRoot } = request;

    // 1. Read kindscript.json
    const ksConfig = this.configPort.readKindScriptConfig(projectRoot);
    if (!ksConfig) {
      return { ok: false, error: `No kindscript.json found in ${projectRoot}` };
    }

    if (!ksConfig.definitions || ksConfig.definitions.length === 0) {
      return { ok: false, error: 'No definitions found in kindscript.json. Run `ksc infer --write` first.' };
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
      return { ok: false, error: 'No TypeScript files found.' };
    }

    // 4. Resolve package definitions
    const packageResult = resolvePackageDefinitions(
      ksConfig.packages ?? [], projectRoot, this.fsPort
    );

    // 5. Resolve definition file paths
    const definitionPaths = [
      ...packageResult.paths,
      ...ksConfig.definitions.map(d => this.fsPort.resolvePath(projectRoot, d)),
    ];

    // 5b. Return cached result if definition files haven't changed
    const definitionKey = [...definitionPaths].sort().join('|');
    if (this.cache && this.cache.definitionKey === definitionKey) {
      return this.cache.result;
    }

    // 6. Create TS program (include root files + definition files)
    const allRootFiles = [...new Set([...rootFiles, ...definitionPaths])];
    const program = this.tsPort.createProgram(allRootFiles, compilerOptions);
    const checker = this.tsPort.getTypeChecker(program);

    // 7. Get source files for definitions
    const definitionSourceFiles = definitionPaths
      .map(path => this.tsPort.getSourceFile(program, path))
      .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

    if (definitionSourceFiles.length === 0) {
      return { ok: false, error: 'Could not load any definition files.' };
    }

    // 8. Classify definitions
    const classifyResult = this.classifyService.execute({
      definitionFiles: definitionSourceFiles,
      checker,
      projectRoot,
    });

    const result: ClassifyProjectSuccess = {
      ok: true,
      symbols: classifyResult.symbols,
      contracts: classifyResult.contracts,
      classificationErrors: classifyResult.errors,
      instanceTypeNames: classifyResult.instanceTypeNames,
      program,
      rootFiles,
      config: ksConfig,
      packageWarnings: packageResult.warnings,
    };

    this.cache = { definitionKey, result };
    return result;
  }
}
