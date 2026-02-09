import { GetPluginDiagnosticsRequest, GetPluginDiagnosticsResponse } from './get-plugin-diagnostics.types';

/**
 * Use case interface for getting KindScript diagnostics for a single file.
 *
 * This is the primary use case for the language service plugin.
 * It evaluates contracts relevant to the given file and returns
 * diagnostics, with caching for performance.
 */
export interface GetPluginDiagnosticsUseCase {
  execute(request: GetPluginDiagnosticsRequest): GetPluginDiagnosticsResponse;
}
