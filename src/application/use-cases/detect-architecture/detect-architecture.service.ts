import { DetectArchitectureUseCase } from './detect-architecture.use-case';
import { DetectArchitectureRequest, DetectArchitectureResponse } from './detect-architecture.types';
import { FileSystemPort } from '../../ports/filesystem.port';
import { TypeScriptPort } from '../../ports/typescript.port';
import { DetectedArchitecture } from '../../../domain/entities/detected-architecture';
import { DetectedLayer } from '../../../domain/value-objects/detected-layer';
import { LayerDependencyEdge } from '../../../domain/value-objects/layer-dependency-edge';
import { ArchitecturePattern } from '../../../domain/types/architecture-pattern';
import { LayerRole } from '../../../domain/types/layer-role';

/** Maps directory names to their architectural roles. */
const ROLE_MAP: Record<string, LayerRole> = {
  domain: LayerRole.Domain,
  core: LayerRole.Domain,
  entities: LayerRole.Domain,
  model: LayerRole.Domain,
  application: LayerRole.Application,
  'use-cases': LayerRole.Application,
  usecases: LayerRole.Application,
  app: LayerRole.Application,
  infrastructure: LayerRole.Infrastructure,
  infra: LayerRole.Infrastructure,
  ports: LayerRole.Ports,
  adapters: LayerRole.Adapters,
  presentation: LayerRole.Presentation,
  ui: LayerRole.Presentation,
  web: LayerRole.Presentation,
  api: LayerRole.Presentation,
};

/**
 * Real implementation of DetectArchitectureUseCase.
 *
 * Analyzes project directory structure and import graph to detect
 * architectural patterns.
 */
export class DetectArchitectureService implements DetectArchitectureUseCase {
  constructor(
    private readonly fsPort: FileSystemPort,
    private readonly tsPort: TypeScriptPort
  ) {}

  execute(request: DetectArchitectureRequest): DetectArchitectureResponse {
    const warnings: string[] = [];

    // Phase 1: Find source directory
    const srcDir = this.findSrcDir(request.projectRoot, request.srcDir);
    if (!srcDir) {
      warnings.push('No source directory found (checked src/, lib/, project root)');
      return {
        detected: new DetectedArchitecture(ArchitecturePattern.Unknown, [], []),
        warnings,
      };
    }

    // Phase 2: Analyze layers
    const layers = this.analyzeLayers(srcDir);
    if (layers.length === 0) {
      warnings.push('No architectural layers detected');
      return {
        detected: new DetectedArchitecture(ArchitecturePattern.Unknown, [], []),
        warnings,
      };
    }

    // Phase 3: Analyze imports
    const dependencies = this.analyzeImports(layers);

    // Phase 4: Pattern match
    const pattern = this.matchPattern(layers, dependencies);

    return {
      detected: new DetectedArchitecture(pattern, layers, dependencies),
      warnings,
    };
  }

  private findSrcDir(projectRoot: string, explicitSrcDir?: string): string | undefined {
    if (explicitSrcDir) {
      const fullPath = this.fsPort.resolvePath(projectRoot, explicitSrcDir);
      if (this.fsPort.directoryExists(fullPath)) {
        return fullPath;
      }
      return undefined;
    }

    // Check common source directories
    for (const candidate of ['src', 'lib']) {
      const fullPath = this.fsPort.resolvePath(projectRoot, candidate);
      if (this.fsPort.directoryExists(fullPath)) {
        return fullPath;
      }
    }

    // Fall back to project root if it has subdirectories
    const rootSubdirs = this.fsPort.listSubdirectories(projectRoot);
    if (rootSubdirs.length > 0) {
      return projectRoot;
    }

    return undefined;
  }

  private analyzeLayers(srcDir: string): DetectedLayer[] {
    const subdirs = this.fsPort.listSubdirectories(srcDir);
    const layers: DetectedLayer[] = [];

    for (const dirName of subdirs) {
      const role = ROLE_MAP[dirName.toLowerCase()];
      if (role) {
        const dirPath = this.fsPort.resolvePath(srcDir, dirName);
        layers.push(new DetectedLayer(dirName, dirPath, role));
      }
    }

    return layers;
  }

  private analyzeImports(layers: DetectedLayer[]): LayerDependencyEdge[] {
    // Collect all .ts files across all layers
    const allFiles: string[] = [];
    for (const layer of layers) {
      const files = this.fsPort.readDirectory(layer.path, true);
      allFiles.push(...files);
    }

    if (allFiles.length === 0) {
      return [];
    }

    // Create a TS program from all layer files
    const program = this.tsPort.createProgram(allFiles, {});
    const checker = this.tsPort.getTypeChecker(program);

    // Count imports between layers
    const edgeCounts = new Map<string, number>();

    for (const layer of layers) {
      const files = this.fsPort.readDirectory(layer.path, true);
      for (const file of files) {
        const sourceFile = this.tsPort.getSourceFile(program, file);
        if (!sourceFile) continue;

        const imports = this.tsPort.getImports(sourceFile, checker);
        for (const imp of imports) {
          // Check if this import targets another layer
          for (const targetLayer of layers) {
            if (targetLayer.name === layer.name) continue;
            if (this.isFileInLayer(imp.targetFile, targetLayer)) {
              const key = `${layer.name}->${targetLayer.name}`;
              edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
            }
          }
        }
      }
    }

    // Convert counts to edges
    const edges: LayerDependencyEdge[] = [];
    for (const [key, weight] of edgeCounts) {
      const [from, to] = key.split('->');
      edges.push(new LayerDependencyEdge(from, to, weight));
    }

    return edges;
  }

  private isFileInLayer(filePath: string, layer: DetectedLayer): boolean {
    const normalizedFile = filePath.replace(/\\/g, '/');
    const normalizedLayerPath = layer.path.replace(/\\/g, '/').replace(/\/$/, '');

    if (normalizedFile === normalizedLayerPath) return true;

    const prefix = normalizedLayerPath + '/';
    return normalizedFile.startsWith(prefix);
  }

  private matchPattern(layers: DetectedLayer[], dependencies: LayerDependencyEdge[]): ArchitecturePattern {
    const roles = new Set(layers.map(l => l.role));

    // Clean Architecture: has Domain + Application + Infrastructure; domain has 0 outward deps
    if (
      roles.has(LayerRole.Domain) &&
      roles.has(LayerRole.Application) &&
      roles.has(LayerRole.Infrastructure)
    ) {
      const domainLayer = layers.find(l => l.role === LayerRole.Domain)!;
      const domainOutwardDeps = dependencies.filter(e => e.from === domainLayer.name);
      if (domainOutwardDeps.length === 0) {
        return ArchitecturePattern.CleanArchitecture;
      }
    }

    // Hexagonal: has Domain + Ports + Adapters
    if (
      roles.has(LayerRole.Domain) &&
      roles.has(LayerRole.Ports) &&
      roles.has(LayerRole.Adapters)
    ) {
      return ArchitecturePattern.Hexagonal;
    }

    // Layered: 2+ recognized layers with directional deps
    if (layers.length >= 2 && dependencies.length > 0) {
      return ArchitecturePattern.Layered;
    }

    return ArchitecturePattern.Unknown;
  }
}
