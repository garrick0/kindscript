import { GetPluginCodeFixesRequest, GetPluginCodeFixesResponse } from './get-plugin-code-fixes.types.js';

/**
 * Use case interface for generating code fix suggestions for KindScript diagnostics.
 *
 * This use case is invoked by the plugin when the editor requests code actions
 * at a position with KindScript error codes.
 */
export interface GetPluginCodeFixesUseCase {
  execute(request: GetPluginCodeFixesRequest): GetPluginCodeFixesResponse;
}
