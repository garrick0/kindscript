import type * as ts from 'typescript';
import { GetPluginDiagnosticsService } from './use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service';
import { GetPluginCodeFixesService } from './use-cases/get-plugin-code-fixes/get-plugin-code-fixes.service';
import { LanguageServiceAdapter } from './adapters/language-service.adapter';
import { createLanguageServiceProxy } from './language-service-proxy';
import { createEngine } from '../../infrastructure/engine-factory';

/**
 * TypeScript language service plugin entry point.
 *
 * This is the composition root for the plugin context.
 * It creates the shared Engine, then wires plugin-specific adapters.
 *
 * Usage in tsconfig.json:
 * ```json
 * {
 *   "compilerOptions": {
 *     "plugins": [{ "name": "kindscript" }]
 *   }
 * }
 * ```
 */
function init(modules: { typescript: typeof ts }): ts.server.PluginModule {
  const engine = createEngine();

  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      const lsAdapter = new LanguageServiceAdapter(info);

      const diagnosticsService = new GetPluginDiagnosticsService(
        engine.pipeline
      );
      const codeFixesService = new GetPluginCodeFixesService(engine.plugins);

      return createLanguageServiceProxy(
        info, modules.typescript, lsAdapter, diagnosticsService, codeFixesService
      );
    },
  };
}

export default init;
