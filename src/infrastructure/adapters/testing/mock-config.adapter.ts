import {
  ConfigPort,
  KindScriptConfig,
  TSConfig,
} from '../../../application/ports/config.port';

/**
 * Mock implementation of ConfigPort for testing.
 *
 * This adapter allows tests to configure what config files exist
 * without actually reading from the file system.
 *
 * Uses a fluent API for easy test setup:
 * ```typescript
 * mockConfig
 *   .withKindScriptConfig('/project', { compilerOptions: { rootDir: 'src' } })
 *   .withTSConfig('/project/tsconfig.json', { compilerOptions: { ... } });
 * ```
 */
export class MockConfigAdapter implements ConfigPort {
  private kindscriptConfigs = new Map<string, KindScriptConfig>();
  private tsConfigs = new Map<string, TSConfig>();
  private configLocations = new Map<string, string>();

  // Fluent configuration API for tests

  /**
   * Add a KindScript config for a project path.
   */
  withKindScriptConfig(projectPath: string, config: KindScriptConfig): this {
    this.kindscriptConfigs.set(projectPath, config);
    return this;
  }

  /**
   * Add a TypeScript config at a specific path.
   */
  withTSConfig(path: string, config: TSConfig): this {
    this.tsConfigs.set(path, config);
    return this;
  }

  /**
   * Configure where a config file can be found.
   */
  withConfigLocation(
    startPath: string,
    fileName: string,
    location: string
  ): this {
    this.configLocations.set(`${startPath}:${fileName}`, location);
    return this;
  }

  /**
   * Reset all mock data (for test isolation).
   */
  reset(): void {
    this.kindscriptConfigs.clear();
    this.tsConfigs.clear();
    this.configLocations.clear();
  }

  // Implement ConfigPort interface

  readKindScriptConfig(projectPath: string): KindScriptConfig | undefined {
    return this.kindscriptConfigs.get(projectPath);
  }

  readTSConfig(path: string): TSConfig | undefined {
    return this.tsConfigs.get(path);
  }

  findConfigFile(startPath: string, fileName: string): string | undefined {
    return this.configLocations.get(`${startPath}:${fileName}`);
  }

  mergeKindScriptConfig(
    projectPath: string,
    _updates: Record<string, unknown>
  ): void {
    const existing = this.kindscriptConfigs.get(projectPath) ?? {};
    this.kindscriptConfigs.set(projectPath, existing);
  }
}
