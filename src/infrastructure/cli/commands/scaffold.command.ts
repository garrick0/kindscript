import { ScaffoldUseCase } from '../../../application/use-cases/scaffold/scaffold.use-case';
import { ClassifyProjectUseCase } from '../../../application/use-cases/classify-project/classify-project.use-case';
import { FileSystemPort } from '../../../application/ports/filesystem.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { OperationType } from '../../../domain/value-objects/scaffold-operation';

/**
 * CLI command: ksc scaffold
 *
 * Thin adapter: parses arguments, delegates to ClassifyProjectService
 * and ScaffoldService, formats output.
 */
export class ScaffoldCommand {
  constructor(
    private readonly scaffoldService: ScaffoldUseCase,
    private readonly classifyProject: ClassifyProjectUseCase,
    private readonly fsPort: FileSystemPort,
  ) {}

  execute(projectPath: string, options: { write: boolean; instance?: string }): number {
    const result = this.classifyProject.execute({ projectRoot: projectPath });

    if (!result.ok) {
      process.stderr.write(`Error: ${result.error}\n`);
      return 1;
    }

    for (const warning of result.packageWarnings) {
      process.stderr.write(`Warning: ${warning}\n`);
    }

    for (const error of result.classificationErrors) {
      process.stderr.write(`Classification error: ${error}\n`);
    }

    // Find instances
    const instances = result.symbols.filter(
      s => s.kind === ArchSymbolKind.Instance
    );

    if (instances.length === 0) {
      process.stderr.write('Error: No instances found in definition files.\n');
      return 1;
    }

    // Select instance
    const selected = this.selectInstance(instances, options.instance);
    if (!selected) return 1;

    // Get the Kind type name from the classification result
    const kindName = result.instanceTypeNames.get(selected.name) ?? selected.name;

    // Generate plan
    const { plan, warnings } = this.scaffoldService.plan({
      instanceSymbol: selected,
      kindName,
      projectRoot: projectPath,
    });

    for (const warning of warnings) {
      process.stderr.write(`Warning: ${warning}\n`);
    }

    // Print plan summary
    process.stdout.write(`Scaffold plan for '${selected.name}':\n\n`);
    for (const op of plan.operations) {
      const relPath = this.fsPort.relativePath(projectPath, op.path);
      const label = op.type === OperationType.CreateDirectory ? 'createDirectory' : 'createFile';
      process.stdout.write(`  ${label.padEnd(16)} ${relPath}\n`);
    }
    process.stdout.write(`\n${plan.directoryCount} directories, ${plan.fileCount} files\n`);

    if (options.write) {
      return this.applyPlan(plan, projectPath);
    }

    process.stdout.write('\nDry run complete. Use --write to execute scaffold.\n');
    return 0;
  }

  private selectInstance(
    instances: ArchSymbol[],
    instanceName?: string
  ): ArchSymbol | undefined {
    if (instanceName) {
      const found = instances.find(s => s.name === instanceName);
      if (!found) {
        process.stderr.write(`Error: Instance '${instanceName}' not found.\n`);
        process.stderr.write(`Available instances: ${instances.map(s => s.name).join(', ')}\n`);
      }
      return found;
    }

    if (instances.length === 1) {
      return instances[0];
    }

    process.stderr.write('Multiple instances found. Use --instance <name> to select one:\n');
    for (const inst of instances) {
      process.stderr.write(`  ${inst.name}\n`);
    }
    return undefined;
  }

  private applyPlan(
    plan: ReturnType<ScaffoldUseCase['plan']>['plan'],
    projectPath: string
  ): number {
    const applyResult = this.scaffoldService.apply(plan);

    process.stdout.write('\nScaffold complete:\n');
    for (const r of applyResult.results) {
      const relPath = this.fsPort.relativePath(projectPath, r.operation.path);
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

    return applyResult.allSucceeded ? 0 : 1;
  }
}
