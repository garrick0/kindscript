import * as fs from 'fs';
import * as nodePath from 'path';
import * as ts from 'typescript';
import {
  ConfigPort,
  KindScriptConfig,
  TSConfig,
} from '../../../application/ports/config.port';

/**
 * Real implementation of ConfigPort that reads config files from disk.
 */
export class ConfigAdapter implements ConfigPort {
  readKindScriptConfig(projectPath: string): KindScriptConfig | undefined {
    const configPath = nodePath.join(projectPath, 'kindscript.json');
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw) as KindScriptConfig;
    } catch {
      return undefined;
    }
  }

  readTSConfig(path: string): TSConfig | undefined {
    try {
      const configFile = ts.readConfigFile(path, (p) => fs.readFileSync(p, 'utf-8'));
      if (configFile.error) return undefined;

      const parsed = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        nodePath.dirname(path)
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

  findConfigFile(startPath: string, fileName: string): string | undefined {
    let current = nodePath.resolve(startPath);

    while (true) {
      const candidate = nodePath.join(current, fileName);
      try {
        if (fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // Not found at this level, continue up
      }

      const parent = nodePath.dirname(current);
      if (parent === current) return undefined; // Reached root
      current = parent;
    }
  }

  mergeKindScriptConfig(
    projectPath: string,
    updates: { definitions?: string[]; packages?: string[] }
  ): void {
    const configPath = nodePath.join(projectPath, 'kindscript.json');
    let config: Record<string, unknown> = {};

    try {
      const existing = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(existing);
    } catch {
      // If missing or invalid JSON, start fresh
    }

    if (updates.definitions) {
      const defs = (config['definitions'] as string[]) || [];
      for (const d of updates.definitions) {
        if (!defs.includes(d)) defs.push(d);
      }
      config['definitions'] = defs;
    }

    if (updates.packages) {
      const pkgs = (config['packages'] as string[]) || [];
      for (const p of updates.packages) {
        if (!pkgs.includes(p)) pkgs.push(p);
      }
      config['packages'] = pkgs;
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
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
