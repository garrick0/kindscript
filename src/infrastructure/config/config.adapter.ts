import * as ts from 'typescript';
import {
  ConfigPort,
  KindScriptConfig,
  TSConfig,
} from '../../application/ports/config.port';
import { FileSystemPort } from '../../application/ports/filesystem.port';

/**
 * Real implementation of ConfigPort that reads config files from disk.
 *
 * Uses FileSystemPort for all file/path operations instead of importing
 * Node's fs and path modules directly.
 */
export class ConfigAdapter implements ConfigPort {
  constructor(private readonly fsPort: FileSystemPort) {}

  readKindScriptConfig(projectPath: string): KindScriptConfig | undefined {
    const configPath = this.fsPort.joinPath(projectPath, 'kindscript.json');
    try {
      const raw = this.fsPort.readFile(configPath);
      if (!raw) return undefined;
      return JSON.parse(raw) as KindScriptConfig;
    } catch {
      return undefined;
    }
  }

  readTSConfig(path: string): TSConfig | undefined {
    try {
      const configFile = ts.readConfigFile(path, (p) => this.fsPort.readFile(p) ?? '');
      if (configFile.error) return undefined;

      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        this.fsPort.dirname(path)
      );

      return {
        compilerOptions: this.simplifyCompilerOptions(parsed.options),
        include: configFile.config.include,
        exclude: configFile.config.exclude,
        files: parsed.fileNames,
        references: configFile.config.references,
      };
    } catch {
      return undefined;
    }
  }

  private simplifyCompilerOptions(options: ts.CompilerOptions): TSConfig['compilerOptions'] {
    return {
      rootDir: options.rootDir,
      outDir: options.outDir,
      strict: options.strict,
      target: options.target !== undefined ? ts.ScriptTarget[options.target] : undefined,
      module: options.module !== undefined ? ts.ModuleKind[options.module] : undefined,
      esModuleInterop: options.esModuleInterop,
      skipLibCheck: options.skipLibCheck,
      declaration: options.declaration,
      composite: options.composite,
      baseUrl: options.baseUrl,
    };
  }
}
