import { PipelineUseCase, PipelineRequest, PipelineResponse, PipelineSuccess } from './pipeline.types';
import { ScanUseCase } from './scan/scan.types';
import { ParseUseCase } from './parse/parse.types';
import { BindUseCase } from './bind/bind.types';
import { CheckerUseCase } from './check/checker.use-case';
import { ProgramPort } from './program';
import { FileSystemPort } from '../ports/filesystem.port';

/**
 * KindScript Pipeline — orchestrates the four compiler stages.
 *
 * Delegates program setup (config reading, file discovery, TS program
 * creation) to a ProgramPort, then chains the four stages:
 * Scanner → Parser → Binder → Checker.
 *
 * Pipeline: Scanner → Parser → Binder → Checker
 */
export class PipelineService implements PipelineUseCase {
  private cache?: { cacheKey: string; result: PipelineSuccess };

  constructor(
    private readonly programFactory: ProgramPort,
    private readonly fsPort: FileSystemPort,
    private readonly scanner: ScanUseCase,
    private readonly parser: ParseUseCase,
    private readonly binder: BindUseCase,
    private readonly checker: CheckerUseCase,
  ) {}

  execute(request: PipelineRequest): PipelineResponse {
    // --- Program setup ---
    const setup = this.programFactory.create(request.projectRoot);
    if ('error' in setup) {
      return { ok: false, error: setup.error };
    }

    // --- Cache check ---
    const cacheKey = setup.sourceFiles
      .map(sf => `${sf.fileName}:${this.fsPort.getModifiedTime(sf.fileName)}`)
      .sort()
      .join('|');
    if (this.cache && this.cache.cacheKey === cacheKey) {
      return this.cache.result;
    }

    // --- Stage 1: Scan ---
    const scanResult = this.scanner.execute({ sourceFiles: setup.sourceFiles, checker: setup.checker });

    // --- Stage 2: Parse ---
    const parseResult = this.parser.execute(scanResult);

    if (parseResult.symbols.length === 0) {
      return { ok: false, error: 'No Kind definitions found in the project.' };
    }

    // --- Stage 3: Bind ---
    const bindResult = this.binder.execute(parseResult);

    // Aggregate errors from all stages
    const classificationErrors = [
      ...scanResult.errors,
      ...parseResult.errors,
      ...bindResult.errors,
    ];

    // --- Stage 4: Check ---
    if (bindResult.contracts.length === 0) {
      const result: PipelineSuccess = {
        ok: true,
        diagnostics: [],
        contractsChecked: 0,
        filesAnalyzed: 0,
        classificationErrors,
      };
      this.cache = { cacheKey, result };
      return result;
    }

    const checkResult = this.checker.execute({
      contracts: bindResult.contracts,
      symbols: parseResult.symbols,
      config: setup.config,
      program: setup.program,
      resolvedFiles: parseResult.resolvedFiles,
    });

    const result: PipelineSuccess = {
      ok: true,
      diagnostics: checkResult.diagnostics,
      contractsChecked: checkResult.contractsChecked,
      filesAnalyzed: checkResult.filesAnalyzed,
      classificationErrors,
    };

    this.cache = { cacheKey, result };
    return result;
  }
}
