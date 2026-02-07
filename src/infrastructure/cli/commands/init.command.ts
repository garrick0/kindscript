import * as nodePath from 'path';
import { DetectArchitectureUseCase } from '../../../application/use-cases/detect-architecture/detect-architecture.use-case';
import { GenerateProjectRefsUseCase } from '../../../application/use-cases/generate-project-refs/generate-project-refs.use-case';
import { FileSystemPort } from '../../../application/ports/filesystem.port';

/**
 * CLI command: ksc init
 *
 * Detects architectural patterns and generates TypeScript project
 * reference configs for boundary enforcement.
 *
 * Dry-run by default; use --write to persist files.
 */
export class InitCommand {
  constructor(
    private readonly detectArchitecture: DetectArchitectureUseCase,
    private readonly generateProjectRefs: GenerateProjectRefsUseCase,
    private readonly fsPort: FileSystemPort
  ) {}

  execute(projectPath: string, options: { detect: boolean; write: boolean }): number {
    if (!options.detect) {
      process.stderr.write('Error: ksc init currently only supports --detect mode.\n');
      process.stderr.write('Usage: ksc init --detect [--write]\n');
      return 1;
    }

    const resolvedPath = nodePath.resolve(projectPath);

    // Phase 1: Detect architecture
    const detectResult = this.detectArchitecture.execute({
      projectRoot: resolvedPath,
    });

    for (const warning of detectResult.warnings) {
      process.stderr.write(`Warning: ${warning}\n`);
    }

    if (detectResult.detected.layers.length === 0) {
      process.stderr.write('Error: No architectural layers detected.\n');
      return 1;
    }

    // Phase 2: Generate project refs
    const genResult = this.generateProjectRefs.execute({
      detected: detectResult.detected,
      projectRoot: resolvedPath,
    });

    for (const warning of genResult.warnings) {
      process.stderr.write(`Warning: ${warning}\n`);
    }

    // Output results
    process.stdout.write(`Detected pattern: ${detectResult.detected.pattern}\n`);
    process.stdout.write('\nLayers found:\n');
    for (const layer of detectResult.detected.layers) {
      const relPath = this.fsPort.relativePath(resolvedPath, layer.path);
      process.stdout.write(`  ${layer.name} (${relPath})\n`);
    }

    if (detectResult.detected.dependencies.length > 0) {
      process.stdout.write('\nDependencies detected:\n');
      for (const dep of detectResult.detected.dependencies) {
        process.stdout.write(`  ${dep.from} -> ${dep.to}\n`);
      }
    }

    process.stdout.write('\nGenerated tsconfig files:\n');
    for (const config of genResult.configs) {
      const relPath = this.fsPort.relativePath(resolvedPath, config.outputPath);
      process.stdout.write(`  ${relPath}\n`);
    }
    if (genResult.rootConfig) {
      const relPath = this.fsPort.relativePath(resolvedPath, genResult.rootConfig.outputPath);
      process.stdout.write(`  ${relPath}\n`);
    }

    if (options.write) {
      // Write files to disk
      for (const config of genResult.configs) {
        this.fsPort.writeFile(config.outputPath, config.toJSON());
      }
      if (genResult.rootConfig) {
        this.fsPort.writeFile(genResult.rootConfig.outputPath, genResult.rootConfig.toJSON());
      }
      process.stdout.write('\nFiles written successfully.\n');
    } else {
      process.stdout.write('\nDry run complete. Use --write to create these files.\n');
    }

    return 0;
  }
}
