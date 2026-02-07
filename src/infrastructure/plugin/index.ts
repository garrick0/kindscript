import type * as ts from 'typescript';
import { CheckContractsService } from '../../application/use-cases/check-contracts/check-contracts.service';
import { ClassifyASTService } from '../../application/use-cases/classify-ast/classify-ast.service';
import { GetPluginDiagnosticsService } from '../../application/use-cases/get-plugin-diagnostics/get-plugin-diagnostics.service';
import { GetPluginCodeFixesService } from '../../application/use-cases/get-plugin-code-fixes/get-plugin-code-fixes.service';
import { TypeScriptAdapter } from '../adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../adapters/filesystem/filesystem.adapter';
import { ConfigAdapter } from '../adapters/config/config.adapter';
import { ASTAdapter } from '../adapters/ast/ast.adapter';
import { LanguageServiceAdapter } from '../adapters/plugin/language-service.adapter';
import { createLanguageServiceProxy } from './language-service-proxy';

/**
 * TypeScript language service plugin entry point.
 *
 * This is the composition root for the plugin context.
 * It wires up the same domain and application services as the CLI,
 * but with a plugin-specific adapter layer that integrates with tsserver.
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
  return {
    create(info: ts.server.PluginCreateInfo): ts.LanguageService {
      // Wire up infrastructure adapters
      const fsAdapter = new FileSystemAdapter();
      const configAdapter = new ConfigAdapter();
      const tsAdapter = new TypeScriptAdapter();
      const astAdapter = new ASTAdapter();
      const lsAdapter = new LanguageServiceAdapter(info, modules.typescript);

      // Wire up application services (shared with CLI)
      const checkService = new CheckContractsService(tsAdapter, fsAdapter);
      const classifyService = new ClassifyASTService(astAdapter);
      const diagnosticsService = new GetPluginDiagnosticsService(
        checkService, configAdapter, fsAdapter, classifyService, tsAdapter
      );
      const codeFixesService = new GetPluginCodeFixesService();

      // Create proxy language service
      return createLanguageServiceProxy(
        info, modules.typescript, lsAdapter, diagnosticsService, codeFixesService
      );
    },
  };
}

export = init;
