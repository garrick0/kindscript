/**
 * Port defining how KindScript interacts with the file system.
 *
 * This interface is defined in the application layer and implemented
 * in the infrastructure layer. It abstracts away Node's fs module
 * so that use cases remain pure and testable.
 */
export interface FileSystemPort {
  // Existence checks

  /**
   * Check if a file exists at the given path.
   */
  fileExists(path: string): boolean;

  /**
   * Check if a directory exists at the given path.
   */
  directoryExists(path: string): boolean;

  // Read operations

  /**
   * Read the contents of a file.
   *
   * @returns file contents as string, or undefined if file doesn't exist
   */
  readFile(path: string): string | undefined;

  /**
   * Read all files in a directory.
   *
   * @param path - Directory path
   * @param recursive - Whether to include subdirectories
   * @returns Array of file paths
   */
  readDirectory(path: string, recursive: boolean): string[];

  /**
   * List immediate subdirectory names in a directory.
   *
   * @param path - Directory path
   * @returns Array of subdirectory names (not full paths), sorted, excluding node_modules
   */
  listSubdirectories(path: string): string[];

  // Write operations (for generator in M7)

  /**
   * Write content to a file.
   *
   * Creates the file if it doesn't exist, overwrites if it does.
   */
  writeFile(path: string, content: string): void;

  /**
   * Create a directory.
   *
   * Creates parent directories if they don't exist (like mkdir -p).
   */
  createDirectory(path: string): void;

  // Path operations

  /**
   * Resolve path segments into an absolute path.
   *
   * Example: resolvePath('/usr', 'local', 'bin') → '/usr/local/bin'
   */
  resolvePath(...segments: string[]): string;

  /**
   * Get the relative path from one location to another.
   *
   * Example: relativePath('/usr/local', '/usr/local/bin') → 'bin'
   */
  relativePath(from: string, to: string): string;

  /**
   * Get the directory name of a path.
   *
   * Example: dirname('/usr/local/bin') → '/usr/local'
   */
  dirname(path: string): string;

  /**
   * Get the base name of a path.
   *
   * Example: basename('/usr/local/bin') → 'bin'
   */
  basename(path: string): string;
}
