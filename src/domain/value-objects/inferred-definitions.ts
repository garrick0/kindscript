/**
 * Structured representation of inferred contracts.
 */
export interface InferredContracts {
  noDependency: [string, string][];
  mustImplement: [string, string][];
  purity: string[];
}

/**
 * Value object holding the generated architecture.ts output sections.
 *
 * Each section (boilerplate, kindDefinition, instanceDeclaration, contracts)
 * is a self-contained block of TypeScript source text. Combined via
 * toFileContent() they form a valid architecture.ts file.
 */
export class InferredDefinitions {
  constructor(
    /** Type stubs (Kind<N>, ContractConfig, defineContracts) */
    public readonly boilerplate: string,

    /** Context interface + per-layer interfaces */
    public readonly kindDefinition: string,

    /** Const object mapping layers to locations */
    public readonly instanceDeclaration: string,

    /** Structured contract data for programmatic access */
    public readonly contractData: InferredContracts,

    /** Context type name used in defineContracts<T> */
    public readonly contextName: string,
  ) {}

  /** Generate the contracts source text from structured data. */
  get contracts(): string {
    const { noDependency, mustImplement, purity } = this.contractData;
    if (noDependency.length === 0 && mustImplement.length === 0 && purity.length === 0) {
      return '';
    }

    const lines: string[] = [];
    lines.push(`export const contracts = defineContracts<${this.contextName}>({`);

    if (noDependency.length > 0) {
      lines.push('  noDependency: [');
      for (const [from, to] of noDependency) {
        lines.push(`    ["${from}", "${to}"],`);
      }
      lines.push('  ],');
    }

    if (mustImplement.length > 0) {
      lines.push('  mustImplement: [');
      for (const [port, adapter] of mustImplement) {
        lines.push(`    ["${port}", "${adapter}"],`);
      }
      lines.push('  ],');
    }

    if (purity.length > 0) {
      lines.push(`  purity: [${purity.map(l => `"${l}"`).join(', ')}],`);
    }

    lines.push('});');
    lines.push('');

    return lines.join('\n');
  }

  toFileContent(): string {
    return [
      this.boilerplate,
      this.kindDefinition,
      this.instanceDeclaration,
      this.contracts,
    ].join('\n');
  }

  /**
   * Generate import-based architecture.ts that imports from a stdlib package
   * instead of inlining type stubs and contracts.
   */
  toImportBasedContent(packageName: string, contextType: string): string {
    const importLine = `import { ${contextType} } from '${packageName}';\n\n`;
    return importLine + this.instanceDeclaration;
  }

  equals(other: InferredDefinitions): boolean {
    return (
      this.boilerplate === other.boilerplate &&
      this.kindDefinition === other.kindDefinition &&
      this.instanceDeclaration === other.instanceDeclaration &&
      this.contracts === other.contracts
    );
  }

  toString(): string {
    const lines = this.toFileContent().split('\n');
    return `InferredDefinitions(${lines.length} lines)`;
  }
}
