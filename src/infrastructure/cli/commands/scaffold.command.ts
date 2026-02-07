import * as nodePath from 'path';
import { ScaffoldUseCase } from '../../../application/use-cases/scaffold/scaffold.use-case';
import { ClassifyASTUseCase } from '../../../application/use-cases/classify-ast/classify-ast.use-case';
import { ConfigPort } from '../../../application/ports/config.port';
import { FileSystemPort } from '../../../application/ports/filesystem.port';
import { TypeScriptPort } from '../../../application/ports/typescript.port';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { OperationType } from '../../../domain/value-objects/scaffold-operation';
import { resolvePackageDefinitions } from '../resolve-package-definitions';

export class ScaffoldCommand {
  constructor(
    private readonly scaffoldService: ScaffoldUseCase,
    private readonly classifyService: ClassifyASTUseCase,
    private readonly tsPort: TypeScriptPort,
    private readonly configPort: ConfigPort,
    private readonly fsPort: FileSystemPort,
  ) {}

  execute(projectPath: string, options: { write: boolean; instance?: string }): number {
    const resolvedPath = nodePath.resolve(projectPath);

    // Read kindscript.json
    const ksConfig = this.configPort.readKindScriptConfig(resolvedPath);
    if (!ksConfig) {
      process.stderr.write('Error: No kindscript.json found. Run `ksc infer --write` first.\n');
      return 1;
    }

    if (!ksConfig.definitions || ksConfig.definitions.length === 0) {
      process.stderr.write('Error: No definitions found in kindscript.json. Run `ksc infer --write` first.\n');
      return 1;
    }

    // Resolve package definition files (standard library packages)
    const packagePaths = resolvePackageDefinitions(ksConfig.packages ?? [], resolvedPath, this.fsPort);

    // Resolve definition file paths (package defs first, then user defs)
    const definitionPaths = [
      ...packagePaths,
      ...ksConfig.definitions.map(d => nodePath.resolve(resolvedPath, d)),
    ];

    // Create TS program
    const program = this.tsPort.createProgram(definitionPaths, {});
    const checker = this.tsPort.getTypeChecker(program);

    // Get source files for definitions
    const definitionSourceFiles = definitionPaths
      .map(p => this.tsPort.getSourceFile(program, p))
      .filter((sf): sf is NonNullable<typeof sf> => sf !== undefined);

    if (definitionSourceFiles.length === 0) {
      process.stderr.write('Error: Could not load any definition files.\n');
      return 1;
    }

    // Classify to extract symbols
    const classifyResult = this.classifyService.execute({
      definitionFiles: definitionSourceFiles,
      checker,
      projectRoot: resolvedPath,
    });

    for (const error of classifyResult.errors) {
      process.stderr.write(`Classification error: ${error}\n`);
    }

    // Find instances
    const instances = classifyResult.symbols.filter(
      s => s.kind === ArchSymbolKind.Instance
    );

    if (instances.length === 0) {
      process.stderr.write('Error: No instances found in definition files.\n');
      return 1;
    }

    // Select instance
    let selected;
    if (options.instance) {
      selected = instances.find(s => s.name === options.instance);
      if (!selected) {
        process.stderr.write(`Error: Instance '${options.instance}' not found.\n`);
        process.stderr.write(`Available instances: ${instances.map(s => s.name).join(', ')}\n`);
        return 1;
      }
    } else if (instances.length === 1) {
      selected = instances[0];
    } else {
      process.stderr.write('Multiple instances found. Use --instance <name> to select one:\n');
      for (const inst of instances) {
        process.stderr.write(`  ${inst.name}\n`);
      }
      return 1;
    }

    // Find the Kind type name for this instance by reading the definition file
    // and matching the variable's type annotation (e.g., `export const app: CleanContext`)
    const kindName = this.findKindName(selected.name, definitionPaths) ?? selected.name;

    // Generate plan
    const { plan, warnings } = this.scaffoldService.plan({
      instanceSymbol: selected,
      kindName,
      projectRoot: resolvedPath,
    });

    // Print warnings
    for (const warning of warnings) {
      process.stderr.write(`Warning: ${warning}\n`);
    }

    // Print plan summary
    process.stdout.write(`Scaffold plan for '${selected.name}':\n\n`);
    for (const op of plan.operations) {
      const relPath = this.fsPort.relativePath(resolvedPath, op.path);
      const label = op.type === OperationType.CreateDirectory ? 'createDirectory' : 'createFile';
      process.stdout.write(`  ${label.padEnd(16)} ${relPath}\n`);
    }
    process.stdout.write(`\n${plan.directoryCount} directories, ${plan.fileCount} files\n`);

    if (options.write) {
      const result = this.scaffoldService.apply(plan);

      process.stdout.write('\nScaffold complete:\n');
      for (const r of result.results) {
        const relPath = this.fsPort.relativePath(resolvedPath, r.operation.path);
        if (r.skipped) {
          process.stdout.write(`  skipped  ${relPath} (${r.error})\n`);
        } else if (r.success) {
          process.stdout.write(`  created  ${relPath}\n`);
        } else {
          process.stderr.write(`  FAILED   ${relPath}: ${r.error}\n`);
        }
      }

      process.stdout.write(`\nNext steps:\n`);
      process.stdout.write(`  - Implement your domain logic in the scaffolded directories\n`);
      process.stdout.write(`  - Run 'ksc check' to verify contracts\n`);

      return result.allSucceeded ? 0 : 1;
    }

    process.stdout.write('\nDry run complete. Use --write to execute scaffold.\n');
    return 0;
  }

  private findKindName(instanceName: string, definitionPaths: string[]): string | undefined {
    const pattern = new RegExp(`export\\s+const\\s+${instanceName}\\s*:\\s*(\\w+)`);
    for (const defPath of definitionPaths) {
      const content = this.fsPort.readFile(defPath);
      if (content) {
        const match = content.match(pattern);
        if (match) return match[1];
      }
    }
    return undefined;
  }
}
