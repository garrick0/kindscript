import { InferArchitectureUseCase } from '../../../application/use-cases/infer-architecture/infer-architecture.use-case';
import { ConfigPort } from '../../../application/ports/config.port';
import { FileSystemPort } from '../../../application/ports/filesystem.port';
import { PATTERN_TO_PACKAGE, PACKAGE_CONTEXT_TYPE } from '../../../domain/constants/architecture-packages';
import { InferredContract } from '../../../domain/value-objects/inferred-contract';
import { ContractType } from '../../../domain/types/contract-type';

/**
 * CLI command: ksc infer
 *
 * Thin adapter: calls InferArchitectureService, formats output,
 * and optionally writes files.
 */
export class InferCommand {
  constructor(
    private readonly inferArchitecture: InferArchitectureUseCase,
    private readonly fsPort: FileSystemPort,
    private readonly configPort: ConfigPort,
  ) {}

  execute(projectPath: string, options: { write: boolean }): number {
    const result = this.inferArchitecture.execute({
      projectRoot: projectPath,
    });

    for (const warning of result.warnings) {
      process.stderr.write(`Warning: ${warning}\n`);
    }

    if (result.detected.layers.length === 0) {
      process.stderr.write('Error: No architectural layers detected. Cannot infer architecture.\n');
      return 1;
    }

    // Print summary
    process.stdout.write(`Detected pattern: ${result.detected.pattern}\n`);

    process.stdout.write('\nLayers found:\n');
    for (const layer of result.detected.layers) {
      const relPath = this.fsPort.relativePath(projectPath, layer.path);
      process.stdout.write(`  ${layer.name} (${relPath})\n`);
    }

    this.printContracts(result.definitions.contractData);

    // Generate file content
    const fileContent = this.resolveFileContent(result, projectPath);

    process.stdout.write('\nGenerated architecture.ts:\n');
    const matchingPackage = PATTERN_TO_PACKAGE[result.detected.pattern];
    if (matchingPackage && this.isPackageInstalled(projectPath, matchingPackage)) {
      process.stdout.write(`  (using import from ${matchingPackage})\n`);
    }
    process.stdout.write('---\n');
    process.stdout.write(fileContent);
    process.stdout.write('---\n');

    if (options.write) {
      const archPath = this.fsPort.resolvePath(projectPath, 'architecture.ts');
      this.fsPort.writeFile(archPath, fileContent);

      const matchPkg = PATTERN_TO_PACKAGE[result.detected.pattern];
      const installedPkg = matchPkg && this.isPackageInstalled(projectPath, matchPkg) ? matchPkg : undefined;
      this.configPort.mergeKindScriptConfig(projectPath, {
        definitions: ['architecture.ts'],
        ...(installedPkg ? { packages: [installedPkg] } : {}),
      });

      process.stdout.write('\nFiles written:\n');
      process.stdout.write('  architecture.ts\n');
      process.stdout.write('  kindscript.json\n');
    } else {
      process.stdout.write('\nDry run complete. Use --write to save architecture.ts.\n');
    }

    return 0;
  }

  private printContracts(contracts: InferredContract[]): void {
    if (contracts.length === 0) return;

    process.stdout.write('\nInferred contracts:\n');

    const noDeps = contracts.filter(c => c.type === ContractType.NoDependency);
    const mustImpl = contracts.filter(c => c.type === ContractType.MustImplement);
    const purity = contracts.filter(c => c.type === ContractType.Purity);

    if (noDeps.length > 0) {
      process.stdout.write(`  noDependency: ${noDeps.map(c => `${c.args[0]} -> ${c.args[1]}`).join(', ')}\n`);
    }
    if (mustImpl.length > 0) {
      process.stdout.write(`  mustImplement: ${mustImpl.map(c => `${c.args[0]} -> ${c.args[1]}`).join(', ')}\n`);
    }
    if (purity.length > 0) {
      process.stdout.write(`  purity: ${purity.flatMap(c => c.args).join(', ')}\n`);
    }
  }

  private resolveFileContent(result: ReturnType<InferArchitectureUseCase['execute']>, projectRoot: string): string {
    const matchingPackage = PATTERN_TO_PACKAGE[result.detected.pattern];
    if (matchingPackage && this.isPackageInstalled(projectRoot, matchingPackage)) {
      const contextType = PACKAGE_CONTEXT_TYPE[matchingPackage] ?? 'Context';
      return result.definitions.toImportBasedContent(matchingPackage, contextType);
    }
    return result.definitions.toFileContent();
  }

  private isPackageInstalled(projectRoot: string, packageName: string): boolean {
    return this.fsPort.fileExists(
      this.fsPort.resolvePath(projectRoot, 'node_modules', packageName, 'index.ts')
    );
  }
}
