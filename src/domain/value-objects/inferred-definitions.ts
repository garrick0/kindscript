import { InferredContract } from './inferred-contract';
import { ContractType, contractTypeToKey } from '../types/contract-type';

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
    public readonly contractData: InferredContract[],

    /** Context type name used in defineContracts<T> */
    public readonly contextName: string,
  ) {}

  /** Generate the contracts source text from structured data. */
  get contracts(): string {
    if (this.contractData.length === 0) return '';

    // Group contracts by type, preserving insertion order
    const grouped = new Map<ContractType, InferredContract[]>();
    for (const c of this.contractData) {
      const list = grouped.get(c.type) ?? [];
      list.push(c);
      grouped.set(c.type, list);
    }

    const lines: string[] = [];
    lines.push(`export const contracts = defineContracts<${this.contextName}>({`);

    for (const [type, contracts] of grouped) {
      const key = contractTypeToKey(type);
      if (type === ContractType.Purity) {
        // Purity args are individual member names: purity: ["domain", "application"]
        const allArgs = contracts.flatMap(c => c.args);
        lines.push(`  ${key}: [${allArgs.map(a => `"${a}"`).join(', ')}],`);
      } else {
        // Tuple-pair types: noDependency: [["domain", "infrastructure"]]
        lines.push(`  ${key}: [`);
        for (const c of contracts) {
          lines.push(`    [${c.args.map(a => `"${a}"`).join(', ')}],`);
        }
        lines.push('  ],');
      }
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
    const importLine = `import { ${contextType}, locate } from '${packageName}';\n\n`;
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
