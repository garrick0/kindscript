import { InferArchitectureUseCase } from './infer-architecture.use-case';
import { InferArchitectureRequest, InferArchitectureResponse } from './infer-architecture.types';
import { DetectArchitectureUseCase } from '../detect-architecture/detect-architecture.use-case';
import { FileSystemPort } from '../../ports/filesystem.port';
import { DetectedArchitecture } from '../../../domain/entities/detected-architecture';
import { InferredDefinitions, InferredContracts } from '../../../domain/value-objects/inferred-definitions';
import { ArchitecturePattern } from '../../../domain/types/architecture-pattern';
import { DetectedLayer } from '../../../domain/value-objects/detected-layer';
import { isNodeBuiltin } from '../../../domain/constants/node-builtins';

/**
 * Real implementation of InferArchitectureUseCase.
 *
 * Wraps DetectArchitectureService with code generation — detects project
 * architecture, then produces boilerplate, Kind definitions, instance
 * declarations, and inferred contracts.
 */
export class InferArchitectureService implements InferArchitectureUseCase {
  constructor(
    private readonly detectArchitecture: DetectArchitectureUseCase,
    private readonly fsPort: FileSystemPort
  ) {}

  execute(request: InferArchitectureRequest): InferArchitectureResponse {
    const warnings: string[] = [];

    // Phase 1: Detect architecture
    const detectResult = this.detectArchitecture.execute({
      projectRoot: request.projectRoot,
      srcDir: request.srcDir,
    });

    warnings.push(...detectResult.warnings);

    const { detected } = detectResult;

    // Early exit if unknown or no layers
    if (detected.pattern === ArchitecturePattern.Unknown || detected.layers.length === 0) {
      if (!warnings.some(w => w.includes('No architectural layers'))) {
        warnings.push('No recognized architectural pattern detected');
      }
      const emptyContracts: InferredContracts = { noDependency: [], mustImplement: [], purity: [] };
      return {
        definitions: new InferredDefinitions('', '', '', emptyContracts, ''),
        detected,
        warnings,
      };
    }

    // Phase 2: Generate sections
    const contextName = toContextName(detected.pattern);
    const boilerplate = this.generateBoilerplate();
    const kindDefinition = this.generateKindDefinition(detected);
    const instanceDeclaration = this.generateInstanceDeclaration(detected, request.projectRoot);
    const contractData = this.buildContractData(detected);

    return {
      definitions: new InferredDefinitions(boilerplate, kindDefinition, instanceDeclaration, contractData, contextName),
      detected,
      warnings,
    };
  }

  private generateBoilerplate(): string {
    return `interface Kind<N extends string = string> {
  readonly kind: N;
  readonly location: string;
}

interface ContractConfig {
  noDependency?: [string, string][];
  mustImplement?: [string, string][];
  purity?: string[];
  noCycles?: string[];
  colocated?: [string, string][];
}
function defineContracts<_T = unknown>(config: ContractConfig): ContractConfig {
  return config;
}
`;
  }

  private generateKindDefinition(detected: DetectedArchitecture): string {
    const contextName = toContextName(detected.pattern);
    const lines: string[] = [];

    // Context interface
    lines.push(`export interface ${contextName} extends Kind<"${contextName}"> {`);
    for (const layer of detected.layers) {
      const typeName = toLayerTypeName(layer.name);
      lines.push(`  ${layer.name}: ${typeName};`);
    }
    lines.push('}');
    lines.push('');

    // Layer interfaces
    for (const layer of detected.layers) {
      const typeName = toLayerTypeName(layer.name);
      lines.push(`export interface ${typeName} extends Kind<"${typeName}"> {`);
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateInstanceDeclaration(detected: DetectedArchitecture, projectRoot: string): string {
    const contextName = toContextName(detected.pattern);
    const lines: string[] = [];

    // Determine the src dir prefix by finding the common relative root
    const srcPrefix = this.inferSrcPrefix(detected.layers, projectRoot);

    lines.push(`export const app: ${contextName} = {`);
    lines.push(`  kind: "${contextName}",`);
    lines.push(`  location: "${srcPrefix}",`);

    for (const layer of detected.layers) {
      const typeName = toLayerTypeName(layer.name);
      const relPath = this.fsPort.relativePath(projectRoot, layer.path);
      lines.push(`  ${layer.name}: {`);
      lines.push(`    kind: "${typeName}",`);
      lines.push(`    location: "${relPath}",`);
      lines.push('  },');
    }

    lines.push('};');
    lines.push('');

    return lines.join('\n');
  }

  private buildContractData(detected: DetectedArchitecture): InferredContracts {
    return {
      noDependency: this.inferNoDependencyContracts(detected),
      mustImplement: this.inferMustImplementContracts(detected),
      purity: this.inferPureLayers(detected),
    };
  }

  private inferNoDependencyContracts(detected: DetectedArchitecture): [string, string][] {
    const pairs: [string, string][] = [];
    const depSet = new Set(detected.dependencies.map(e => `${e.from}->${e.to}`));

    switch (detected.pattern) {
      case ArchitecturePattern.CleanArchitecture: {
        const layerNames = detected.layers.map(l => l.name);
        // domain should not depend on anything
        for (const target of layerNames) {
          if (target !== 'domain' && !depSet.has(`domain->${target}`)) {
            pairs.push(['domain', target]);
          }
        }
        // application should not depend on infrastructure
        if (!depSet.has('application->infrastructure')) {
          const hasInfra = layerNames.includes('infrastructure');
          if (hasInfra) {
            pairs.push(['application', 'infrastructure']);
          }
        }
        break;
      }
      case ArchitecturePattern.Hexagonal: {
        const layerNames = detected.layers.map(l => l.name);
        // domain should not depend on adapters
        if (layerNames.includes('adapters') && !depSet.has('domain->adapters')) {
          pairs.push(['domain', 'adapters']);
        }
        break;
      }
      case ArchitecturePattern.Layered: {
        // For layered: propose no-dependency for inner->outer pairs with no observed deps
        // Use a simple heuristic: layers ordered by dependency count (fewer deps = more inner)
        const layerNames = detected.layers.map(l => l.name);
        for (const from of layerNames) {
          for (const to of layerNames) {
            if (from === to) continue;
            // Only propose if no observed edge AND from has fewer outward deps than to
            if (!depSet.has(`${from}->${to}`)) {
              const fromOutward = detected.getDependenciesOf(from).length;
              const toOutward = detected.getDependenciesOf(to).length;
              if (fromOutward <= toOutward && fromOutward === 0) {
                pairs.push([from, to]);
              }
            }
          }
        }
        break;
      }
    }

    return pairs;
  }

  private inferPureLayers(detected: DetectedArchitecture): string[] {
    const pureLayers: string[] = [];

    for (const layer of detected.layers) {
      if (this.isLayerPure(layer)) {
        pureLayers.push(layer.name);
      }
    }

    return pureLayers;
  }

  private isLayerPure(layer: DetectedLayer): boolean {
    const files = this.fsPort.readDirectory(layer.path, true);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;

      const content = this.fsPort.readFile(file);
      if (!content) continue;

      // Extract import specifiers from source text
      const importRegex = /(?:from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const specifier = match[1] || match[2];
        if (isNodeBuiltin(specifier)) {
          return false;
        }
      }
    }

    return true;
  }

  private inferMustImplementContracts(detected: DetectedArchitecture): [string, string][] {
    if (detected.pattern !== ArchitecturePattern.Hexagonal) {
      return [];
    }

    const layerNames = detected.layers.map(l => l.name);
    if (layerNames.includes('ports') && layerNames.includes('adapters')) {
      return [['ports', 'adapters']];
    }

    return [];
  }

  private inferSrcPrefix(layers: DetectedLayer[], projectRoot: string): string {
    if (layers.length === 0) return 'src';

    // Find the common parent of all layer paths relative to project root
    const relPaths = layers.map(l => this.fsPort.relativePath(projectRoot, l.path));

    // Extract common prefix — e.g., if paths are "src/domain", "src/application", prefix is "src"
    const parts = relPaths.map(p => p.split('/'));
    const commonParts: string[] = [];

    if (parts.length > 0) {
      for (let i = 0; i < parts[0].length - 1; i++) {
        const segment = parts[0][i];
        if (parts.every(p => p[i] === segment)) {
          commonParts.push(segment);
        } else {
          break;
        }
      }
    }

    return commonParts.length > 0 ? commonParts.join('/') : '.';
  }
}

/** Convert ArchitecturePattern to a context type name. */
function toContextName(pattern: ArchitecturePattern): string {
  switch (pattern) {
    case ArchitecturePattern.CleanArchitecture:
      return 'CleanArchitectureContext';
    case ArchitecturePattern.Hexagonal:
      return 'HexagonalContext';
    case ArchitecturePattern.Layered:
      return 'LayeredContext';
    default:
      return 'UnknownContext';
  }
}

/** Convert a layer directory name to a TypeScript type name. */
function toLayerTypeName(name: string): string {
  // Split on hyphens and capitalize each segment, then append "Layer"
  const capitalized = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return capitalized + 'Layer';
}
