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

    /** Inferred contracts (noDependency, purity, mustImplement) */
    public readonly contracts: string
  ) {}

  toFileContent(): string {
    return [
      this.boilerplate,
      this.kindDefinition,
      this.instanceDeclaration,
      this.contracts,
    ].join('\n');
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
