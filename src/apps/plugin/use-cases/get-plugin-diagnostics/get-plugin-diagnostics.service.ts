import { GetPluginDiagnosticsUseCase } from './get-plugin-diagnostics.use-case';
import { GetPluginDiagnosticsRequest, GetPluginDiagnosticsResponse } from './get-plugin-diagnostics.types';
import { RunPipelineUseCase } from '../../../../application/enforcement/run-pipeline/run-pipeline.use-case';
import { Diagnostic } from '../../../../domain/entities/diagnostic';

/**
 * Implementation of GetPluginDiagnosticsUseCase.
 *
 * Checks architectural contracts for a single file by delegating to
 * RunPipelineService (which handles classification, resolution, and checking)
 * and then filtering the resulting diagnostics to only those relevant
 * to the requested file.
 */
export class GetPluginDiagnosticsService implements GetPluginDiagnosticsUseCase {
  constructor(
    private readonly runPipeline: RunPipelineUseCase,
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
    const result = this.runPipeline.execute({ projectRoot: request.projectRoot });
    if (!result.ok) return [];

    return result.diagnostics.filter(d => this.isRelevantToFile(d, request.fileName));
  }

  /**
   * Check if a diagnostic is relevant to a specific file.
   * Structural diagnostics (file === '') with a scope are shown for all files
   * (the definition file containing the Kind/InstanceConfig is a regular .ts file).
   */
  private isRelevantToFile(diagnostic: Diagnostic, fileName: string): boolean {
    if (!diagnostic.file && diagnostic.scope) {
      return true;
    }
    const normalizedDiagFile = diagnostic.file.replace(/\\/g, '/');
    const normalizedFileName = fileName.replace(/\\/g, '/');
    return normalizedDiagFile === normalizedFileName;
  }
}
