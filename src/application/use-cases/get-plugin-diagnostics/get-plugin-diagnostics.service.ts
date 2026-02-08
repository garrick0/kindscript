import { GetPluginDiagnosticsUseCase } from './get-plugin-diagnostics.use-case';
import { GetPluginDiagnosticsRequest, GetPluginDiagnosticsResponse } from './get-plugin-diagnostics.types';
import { CheckContractsUseCase } from '../check-contracts/check-contracts.use-case';
import { ClassifyProjectUseCase } from '../classify-project/classify-project.use-case';
import { FileSystemPort } from '../../ports/filesystem.port';
import { resolveSymbolFiles } from '../../services/resolve-symbol-files';
import { Diagnostic } from '../../../domain/entities/diagnostic';

/**
 * Implementation of GetPluginDiagnosticsUseCase.
 *
 * Checks architectural contracts for a single file by delegating to
 * ClassifyProjectUseCase (which handles config reading, program creation,
 * and definition classification with built-in caching) and then filtering
 * the resulting diagnostics to only those relevant to the requested file.
 */
export class GetPluginDiagnosticsService implements GetPluginDiagnosticsUseCase {
  constructor(
    private readonly checkContracts: CheckContractsUseCase,
    private readonly classifyProject: ClassifyProjectUseCase,
    private readonly fsPort: FileSystemPort,
  ) {}

  execute(request: GetPluginDiagnosticsRequest): GetPluginDiagnosticsResponse {
    const startTime = Date.now();

    try {
      const diagnostics = this.getDiagnostics(request);
      return {
        diagnostics,
        elapsedMs: Date.now() - startTime,
      };
    } catch {
      // Never crash — return empty diagnostics on error
      return {
        diagnostics: [],
        elapsedMs: Date.now() - startTime,
      };
    }
  }

  private getDiagnostics(request: GetPluginDiagnosticsRequest): Diagnostic[] {
    const result = this.classifyProject.execute({ projectRoot: request.projectRoot });
    if (!result.ok) return [];

    if (result.contracts.length === 0) return [];

    const checkResult = this.checkContracts.execute({
      symbols: result.symbols,
      contracts: result.contracts,
      config: result.config,
      program: result.program,
      resolvedFiles: resolveSymbolFiles(result.symbols, this.fsPort),
    });

    return checkResult.diagnostics.filter(d => this.isRelevantToFile(d, request.fileName));
  }

  /**
   * Check if a diagnostic is relevant to a specific file.
   */
  private isRelevantToFile(diagnostic: Diagnostic, fileName: string): boolean {
    const normalizedDiagFile = diagnostic.file.replace(/\\/g, '/');
    const normalizedFileName = fileName.replace(/\\/g, '/');
    return normalizedDiagFile === normalizedFileName;
  }
}
