import { GetPluginDiagnosticsUseCase } from './get-plugin-diagnostics.use-case.js';
import { GetPluginDiagnosticsRequest, GetPluginDiagnosticsResponse } from './get-plugin-diagnostics.types.js';
import { PipelineUseCase } from '../../../../application/pipeline/pipeline.types.js';
import { Diagnostic } from '../../../../domain/entities/diagnostic.js';

/**
 * Implementation of GetPluginDiagnosticsUseCase.
 *
 * Checks architectural contracts for a single file by delegating to
 * PipelineService (which handles scanning, parsing, binding, and checking)
 * and then filtering the resulting diagnostics to only those relevant
 * to the requested file.
 */
export class GetPluginDiagnosticsService implements GetPluginDiagnosticsUseCase {
  constructor(
    private readonly pipeline: PipelineUseCase,
  ) {}

  execute(request: GetPluginDiagnosticsRequest): GetPluginDiagnosticsResponse {
    const startTime = Date.now();

    try {
      const diagnostics = this.getDiagnostics(request);
      return {
        diagnostics,
        elapsedMs: Date.now() - startTime,
      };
    } catch (_e: unknown) {
      // Never crash — return empty diagnostics on error
      return {
        diagnostics: [],
        elapsedMs: Date.now() - startTime,
      };
    }
  }

  private getDiagnostics(request: GetPluginDiagnosticsRequest): Diagnostic[] {
    const result = this.pipeline.execute({ projectRoot: request.projectRoot });
    if (!result.ok) return [];

    return result.diagnostics.filter(d => this.isRelevantToFile(d, request.fileName));
  }

  /**
   * Check if a diagnostic is relevant to a specific file.
   * Structural diagnostics (file === '') with a scope are shown for all files
   * (the definition file containing the Kind/Instance is a regular .ts file).
   */
  private isRelevantToFile(diagnostic: Diagnostic, fileName: string): boolean {
    if (!diagnostic.source.file && diagnostic.source.scope) {
      return true;
    }
    const normalizedDiagFile = diagnostic.source.file.replace(/\\/g, '/');
    const normalizedFileName = fileName.replace(/\\/g, '/');
    return normalizedDiagFile === normalizedFileName;
  }
}
