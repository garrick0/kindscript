/**
 * A generated tsconfig.json file for project references.
 *
 * This is a value object — immutable and defined by its properties.
 */
export class GeneratedTSConfig {
  constructor(
    /** The output path where this config should be written */
    public readonly outputPath: string,

    /** The tsconfig content as a plain object */
    public readonly content: Record<string, unknown>
  ) {}

  /**
   * Returns the config as pretty-printed JSON with a trailing newline.
   */
  toJSON(): string {
    return JSON.stringify(this.content, null, 2) + '\n';
  }
}
