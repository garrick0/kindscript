import { ContractType } from '../../domain/types/contract-type';
import { CompilerOptions } from '../../domain/types/compiler-options';

/**
 * KindScript configuration file format.
 *
 * This represents the kindscript.json file that users create
 * to configure architectural contracts.
 */
export interface KindScriptConfig {
  /** Contract definitions (simple config format for Tier 1) */
  contracts?: Partial<Record<ContractType, unknown[]>>;

  /** Paths to kind definition files (for Tier 2+) */
  definitions?: string[];

  /** Standard library package names (e.g., "@kindscript/clean-architecture") */
  packages?: string[];

  /** Root directory for the project */
  rootDir?: string;

  /** Additional compiler options to merge with tsconfig.json */
  compilerOptions?: CompilerOptions;
}

/**
 * TypeScript tsconfig.json format.
 *
 * This is a simplified representation - only includes the fields
 * we care about for KindScript.
 */
export interface TSConfig {
  /** Compiler options */
  compilerOptions?: CompilerOptions;

  /** Files to include */
  include?: string[];

  /** Files to exclude */
  exclude?: string[];

  /** Specific files to include */
  files?: string[];

  /** Project references (for zero-config enforcement) */
  references?: Array<{ path: string }>;
}

/**
 * Port defining how KindScript reads configuration files.
 *
 * This interface is defined in the application layer and implemented
 * in the infrastructure layer.
 */
export interface ConfigPort {
  /**
   * Read the KindScript configuration file.
   *
   * @param projectPath - Path to the project directory
   * @returns Configuration object, or undefined if not found
   */
  readKindScriptConfig(projectPath: string): KindScriptConfig | undefined;

  /**
   * Read a TypeScript configuration file.
   *
   * @param path - Path to tsconfig.json
   * @returns Configuration object, or undefined if not found
   */
  readTSConfig(path: string): TSConfig | undefined;

  /**
   * Find a configuration file by walking up the directory tree.
   *
   * @param startPath - Directory to start searching from
   * @param fileName - Name of the config file to find
   * @returns Path to the config file, or undefined if not found
   */
  findConfigFile(startPath: string, fileName: string): string | undefined;
}
