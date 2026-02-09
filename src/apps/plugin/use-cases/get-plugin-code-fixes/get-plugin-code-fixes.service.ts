import { GetPluginCodeFixesUseCase } from './get-plugin-code-fixes.use-case';
import { GetPluginCodeFixesRequest, GetPluginCodeFixesResponse, PluginCodeFix } from './get-plugin-code-fixes.types';
import { ContractPlugin } from '../../../../application/enforcement/check-contracts/contract-plugin';

/** KindScript error code range */
const KS_CODE_MIN = 70001;
const KS_CODE_MAX = 70099;

/**
 * Implementation of GetPluginCodeFixesUseCase.
 *
 * Generates code fix suggestions for KindScript diagnostic codes.
 * The fix map is derived from ContractPlugin metadata rather than
 * being hardcoded, so adding a codeFix to a new plugin automatically
 * makes it available in the IDE.
 */
export class GetPluginCodeFixesService implements GetPluginCodeFixesUseCase {
  private readonly fixMap: Map<number, { fixName: string; description: string }>;

  constructor(plugins: ContractPlugin[]) {
    this.fixMap = new Map();
    for (const plugin of plugins) {
      if (plugin.codeFix) {
        this.fixMap.set(plugin.diagnosticCode, plugin.codeFix);
      }
    }
  }

  execute(request: GetPluginCodeFixesRequest): GetPluginCodeFixesResponse {
    const fixes: PluginCodeFix[] = [];

    for (const code of request.errorCodes) {
      if (code < KS_CODE_MIN || code > KS_CODE_MAX) continue;

      const fixInfo = this.fixMap.get(code);
      if (fixInfo) {
        fixes.push({
          fixName: fixInfo.fixName,
          description: fixInfo.description,
          diagnosticCode: code,
        });
      }
    }

    return { fixes };
  }
}
