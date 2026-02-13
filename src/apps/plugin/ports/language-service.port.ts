import { Program } from '../../../domain/entities/program.js';

/**
 * Port defining how KindScript interacts with the TypeScript
 * language service in the plugin context.
 *
 * This is separate from TypeScriptPort because it encapsulates
 * plugin-specific operations (project root discovery, program access)
 * that don't apply to the CLI context.
 *
 * The real adapter wraps ts.server.PluginCreateInfo;
 * a mock enables unit testing without tsserver.
 */
export interface LanguageServicePort {
  /** Get the project root directory */
  getProjectRoot(): string;

  /** Get the current ts.Program from the language service */
  getProgram(): Program | undefined;
}
