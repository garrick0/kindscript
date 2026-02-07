import { GetPluginCodeFixesUseCase } from './get-plugin-code-fixes.use-case';
import { GetPluginCodeFixesRequest, GetPluginCodeFixesResponse, PluginCodeFix } from './get-plugin-code-fixes.types';

/** KindScript error code range */
const KS_CODE_MIN = 70001;
const KS_CODE_MAX = 70099;

/** Known fix descriptions for each KindScript error code */
const KS_FIXES: Record<number, { fixName: string; description: string }> = {
  70001: {
    fixName: 'kindscript-remove-forbidden-import',
    description: 'Remove this import (forbidden dependency)',
  },
  70003: {
    fixName: 'kindscript-remove-impure-import',
    description: 'Remove this import (impure import in pure layer)',
  },
};

/**
 * Implementation of GetPluginCodeFixesUseCase.
 *
 * Generates code fix suggestions for KindScript diagnostic codes.
 * Filters incoming error codes to the KindScript range (70001-70099)
 * and returns appropriate fix metadata.
 */
export class GetPluginCodeFixesService implements GetPluginCodeFixesUseCase {
  execute(request: GetPluginCodeFixesRequest): GetPluginCodeFixesResponse {
    const fixes: PluginCodeFix[] = [];

    for (const code of request.errorCodes) {
      if (code < KS_CODE_MIN || code > KS_CODE_MAX) continue;

      const fixInfo = KS_FIXES[code];
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
