import { GenerateProjectRefsUseCase } from './generate-project-refs.use-case';
import { GenerateProjectRefsRequest, GenerateProjectRefsResponse } from './generate-project-refs.types';
import { FileSystemPort } from '../../ports/filesystem.port';
import { GeneratedTSConfig } from '../../../domain/value-objects/generated-tsconfig';

/**
 * Real implementation of GenerateProjectRefsUseCase.
 *
 * Generates per-layer tsconfig.json files with TypeScript project references
 * based on the detected architecture's dependency graph.
 */
export class GenerateProjectRefsService implements GenerateProjectRefsUseCase {
  constructor(
    private readonly fsPort: FileSystemPort
  ) {}

  execute(request: GenerateProjectRefsRequest): GenerateProjectRefsResponse {
    const { detected, projectRoot } = request;
    const warnings: string[] = [];
    const configs: GeneratedTSConfig[] = [];

    if (detected.layers.length === 0) {
      warnings.push('No layers to generate configs for');
      return { configs, warnings };
    }

    // Generate per-layer tsconfig.json files
    for (const layer of detected.layers) {
      const deps = detected.getDependenciesOf(layer.name);

      const content: Record<string, unknown> = {
        compilerOptions: {
          composite: true,
          declaration: true,
          outDir: './dist',
          rootDir: '.',
        },
        include: ['./**/*.ts'],
        exclude: ['./dist'],
      };

      if (deps.length > 0) {
        const references = deps.map(dep => {
          const targetLayer = detected.layers.find(l => l.name === dep.to);
          if (!targetLayer) return null;
          const relPath = this.fsPort.relativePath(layer.path, targetLayer.path);
          return { path: relPath };
        }).filter(ref => ref !== null);

        if (references.length > 0) {
          content.references = references;
        }
      }

      const outputPath = this.fsPort.resolvePath(layer.path, 'tsconfig.json');
      configs.push(new GeneratedTSConfig(outputPath, content));
    }

    // Generate root tsconfig.build.json
    const rootReferences = detected.layers.map(layer => {
      const relPath = this.fsPort.relativePath(projectRoot, layer.path);
      return { path: relPath };
    });

    const rootConfig = new GeneratedTSConfig(
      this.fsPort.resolvePath(projectRoot, 'tsconfig.build.json'),
      {
        files: [],
        references: rootReferences,
      }
    );

    return { configs, rootConfig, warnings };
  }
}
