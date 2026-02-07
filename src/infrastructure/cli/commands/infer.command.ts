import * as nodePath from 'path';
import { InferArchitectureUseCase } from '../../../application/use-cases/infer-architecture/infer-architecture.use-case';
import { FileSystemPort } from '../../../application/ports/filesystem.port';
import { ArchitecturePattern } from '../../../domain/types/architecture-pattern';

/** Mapping from detected architecture patterns to their stdlib package names. */
const PATTERN_TO_PACKAGE: Partial<Record<ArchitecturePattern, string>> = {
  [ArchitecturePattern.CleanArchitecture]: '@kindscript/clean-architecture',
  [ArchitecturePattern.Hexagonal]: '@kindscript/hexagonal',
};

/** Mapping from package names to their exported context type names. */
const PACKAGE_CONTEXT_TYPE: Record<string, string> = {
  '@kindscript/clean-architecture': 'CleanContext',
  '@kindscript/hexagonal': 'HexagonalContext',
};

/**
 * CLI command: ksc infer
 *
 * Analyzes an existing codebase, detects its architecture, then generates
 * a complete architecture.ts with Kind definitions, instance declarations,
 * and inferred contracts.
 *
 * Dry-run by default; use --write to persist files.
 *
 * When a matching stdlib package is installed in node_modules, generates
 * import-based output instead of inline stubs.
 */
export class InferCommand {
  constructor(
    private readonly inferArchitecture: InferArchitectureUseCase,
    private readonly fsPort: FileSystemPort
  ) {}

  execute(projectPath: string, options: { write: boolean }): number {
    const resolvedPath = nodePath.resolve(projectPath);

    const result = this.inferArchitecture.execute({
      projectRoot: resolvedPath,
    });

    // Print warnings to stderr
    for (const warning of result.warnings) {
      process.stderr.write(`Warning: ${warning}\n`);
    }

    // If no layers detected, exit with error
    if (result.detected.layers.length === 0) {
      process.stderr.write('Error: No architectural layers detected. Cannot infer architecture.\n');
      return 1;
    }

    // Print summary
    process.stdout.write(`Detected pattern: ${result.detected.pattern}\n`);

    process.stdout.write('\nLayers found:\n');
    for (const layer of result.detected.layers) {
      const relPath = this.fsPort.relativePath(resolvedPath, layer.path);
      process.stdout.write(`  ${layer.name} (${relPath})\n`);
    }

    // Print inferred contracts summary
    const contracts = result.definitions.contracts;
    if (contracts) {
      process.stdout.write('\nInferred contracts:\n');

      const noDeps = this.extractPairs(contracts, 'noDependency');
      if (noDeps.length > 0) {
        process.stdout.write(`  noDependency: ${noDeps.map(([a, b]) => `${a} -> ${b}`).join(', ')}\n`);
      }

      const mustImpl = this.extractPairs(contracts, 'mustImplement');
      if (mustImpl.length > 0) {
        process.stdout.write(`  mustImplement: ${mustImpl.map(([a, b]) => `${a} -> ${b}`).join(', ')}\n`);
      }

      const purityMatch = contracts.match(/purity:\s*\[([^\]]*)\]/);
      if (purityMatch) {
        const layers = purityMatch[1].replace(/"/g, '').split(',').map(s => s.trim()).filter(Boolean);
        if (layers.length > 0) {
          process.stdout.write(`  purity: ${layers.join(', ')}\n`);
        }
      }
    }

    // Check if a matching stdlib package is installed
    const matchingPackage = PATTERN_TO_PACKAGE[result.detected.pattern];
    const packageInstalled = matchingPackage
      ? this.fsPort.fileExists(
          this.fsPort.resolvePath(resolvedPath, 'node_modules', matchingPackage, 'index.ts')
        )
      : false;

    // Generate file content: import-based if package installed, inline otherwise
    const fileContent = packageInstalled && matchingPackage
      ? this.generateImportBased(matchingPackage, result.definitions.instanceDeclaration)
      : result.definitions.toFileContent();

    process.stdout.write('\nGenerated architecture.ts:\n');
    if (packageInstalled && matchingPackage) {
      process.stdout.write(`  (using import from ${matchingPackage})\n`);
    }
    process.stdout.write('---\n');
    process.stdout.write(fileContent);
    process.stdout.write('---\n');

    if (options.write) {
      // Write architecture.ts
      const archPath = this.fsPort.resolvePath(resolvedPath, 'architecture.ts');
      this.fsPort.writeFile(archPath, fileContent);

      // Write/update kindscript.json (with packages if applicable)
      this.updateKindScriptJson(resolvedPath, packageInstalled ? matchingPackage : undefined);

      process.stdout.write('\nFiles written:\n');
      process.stdout.write('  architecture.ts\n');
      process.stdout.write('  kindscript.json\n');
    } else {
      process.stdout.write('\nDry run complete. Use --write to save architecture.ts.\n');
    }

    return 0;
  }

  /**
   * Generate import-based architecture.ts that imports from a stdlib package
   * instead of inlining type stubs and contracts.
   */
  private generateImportBased(packageName: string, instanceDeclaration: string): string {
    const contextType = PACKAGE_CONTEXT_TYPE[packageName] ?? 'Context';
    const importLine = `import { ${contextType} } from '${packageName}';\n\n`;
    return importLine + instanceDeclaration;
  }

  private updateKindScriptJson(projectRoot: string, packageName?: string): void {
    const configPath = this.fsPort.resolvePath(projectRoot, 'kindscript.json');
    let config: Record<string, unknown> = {};

    const existing = this.fsPort.readFile(configPath);
    if (existing) {
      try {
        config = JSON.parse(existing);
      } catch {
        // If invalid JSON, start fresh
        config = {};
      }
    }

    // Merge definitions
    const defs = (config['definitions'] as string[]) || [];
    if (!defs.includes('architecture.ts')) {
      defs.push('architecture.ts');
    }
    config['definitions'] = defs;

    // Add packages if a stdlib package is being used
    if (packageName) {
      const pkgs = (config['packages'] as string[]) || [];
      if (!pkgs.includes(packageName)) {
        pkgs.push(packageName);
      }
      config['packages'] = pkgs;
    }

    this.fsPort.writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  }

  private extractPairs(contracts: string, key: string): [string, string][] {
    const pairs: [string, string][] = [];
    const regex = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`, 'm');
    const match = contracts.match(regex);
    if (match) {
      const pairRegex = /\["([^"]+)",\s*"([^"]+)"\]/g;
      let m;
      while ((m = pairRegex.exec(match[1])) !== null) {
        pairs.push([m[1], m[2]]);
      }
    }
    return pairs;
  }
}
