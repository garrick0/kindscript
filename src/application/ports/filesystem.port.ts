/**
 * Port defining how KindScript interacts with the file system.
 *
 * This interface is defined in the application layer and implemented
 * in the infrastructure layer. It abstracts away Node's fs module
 * so that use cases remain pure and testable.
 */
export interface FileSystemPort {
  /**
   * Check if a directory exists at the given path.
   */
  directoryExists(path: string): boolean;

  /**
   * Check if a file exists at the given path.
   */
  fileExists(path: string): boolean;

  /**
   * Read the contents of a file.
   *
   * @returns file contents as string, or undefined if file doesn't exist
   */
  readFile(path: string): string | undefined;

  /**
   * Read TypeScript source files (.ts, .tsx) in a directory, excluding .d.ts.
   *
   * This is a filtered read — only TypeScript source files are returned.
   * Non-TS files (e.g., .js, .json, .css) are excluded by the adapter.
   *
   * @param path - Directory path
   * @param recursive - Whether to include subdirectories
   * @returns Array of absolute file paths to .ts/.tsx source files
   */
  readDirectory(path: string, recursive: boolean): string[];

  /**
   * Resolve path segments into an absolute path.
   *
   * Example: resolvePath('/usr', 'local', 'bin') → '/usr/local/bin'
   */
  resolvePath(...segments: string[]): string;

  /**
   * Get the directory name of a path.
   *
   * Example: dirname('/usr/local/bin') → '/usr/local'
   */
  dirname(path: string): string;

  /**
   * Join path segments without resolving against CWD.
   *
   * Normalizes trailing/leading slashes between segments.
   * Unlike resolvePath, this does NOT make the result absolute.
   *
   * Example: joinPath('src/domain', 'entities') → 'src/domain/entities'
   */
  joinPath(...segments: string[]): string;

  /**
   * Get the modification time of a file in milliseconds since epoch.
   *
   * Returns 0 if the file doesn't exist.
   */
  getModifiedTime(path: string): number;
}
