import * as path from 'path';
import * as ts from 'typescript';
import { InferArchitectureService } from '../../src/application/use-cases/infer-architecture/infer-architecture.service';
import { DetectArchitectureService } from '../../src/application/use-cases/detect-architecture/detect-architecture.service';
import { GenerateProjectRefsService } from '../../src/application/use-cases/generate-project-refs/generate-project-refs.service';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { ArchitecturePattern } from '../../src/domain/types/architecture-pattern';
import { LayerRole } from '../../src/domain/types/layer-role';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('Detect and Infer Architecture Integration Tests', () => {
  let tsAdapter: TypeScriptAdapter;
  let fsAdapter: FileSystemAdapter;
  let detectService: DetectArchitectureService;
  let inferService: InferArchitectureService;
  let generateService: GenerateProjectRefsService;

  beforeEach(() => {
    tsAdapter = new TypeScriptAdapter();
    fsAdapter = new FileSystemAdapter();
    detectService = new DetectArchitectureService(fsAdapter, tsAdapter);
    inferService = new InferArchitectureService(detectService, fsAdapter);
    generateService = new GenerateProjectRefsService(fsAdapter);
  });

  describe('DetectArchitectureService', () => {
    it('detects Clean Architecture from detect-clean-arch fixture', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');

      const result = detectService.execute({ projectRoot: fixturePath });

      expect(result.detected.pattern).toBe(ArchitecturePattern.CleanArchitecture);
      expect(result.detected.layers).toHaveLength(3);
      expect(result.warnings).toHaveLength(0);

      const roles = result.detected.layers.map(l => l.role);
      expect(roles).toContain(LayerRole.Domain);
      expect(roles).toContain(LayerRole.Application);
      expect(roles).toContain(LayerRole.Infrastructure);

      // Verify dependency edges
      const appToDomain = result.detected.dependencies.find(
        e => e.from === 'application' && e.to === 'domain'
      );
      expect(appToDomain).toBeDefined();
      expect(appToDomain!.weight).toBeGreaterThanOrEqual(1);

      const infraToDomain = result.detected.dependencies.find(
        e => e.from === 'infrastructure' && e.to === 'domain'
      );
      expect(infraToDomain).toBeDefined();
      expect(infraToDomain!.weight).toBeGreaterThanOrEqual(1);

      // Domain should have no outward deps
      const domainOutward = result.detected.getDependenciesOf('domain');
      expect(domainOutward).toHaveLength(0);
    });

    it('detects Hexagonal from detect-hexagonal fixture', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-hexagonal');

      const result = detectService.execute({ projectRoot: fixturePath });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Hexagonal);
      expect(result.detected.layers).toHaveLength(3);

      const roles = result.detected.layers.map(l => l.role);
      expect(roles).toContain(LayerRole.Domain);
      expect(roles).toContain(LayerRole.Ports);
      expect(roles).toContain(LayerRole.Adapters);
    });

    it('returns Unknown from detect-unknown fixture', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-unknown');

      const result = detectService.execute({ projectRoot: fixturePath });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Unknown);
      expect(result.detected.layers).toHaveLength(0);
      expect(result.warnings).toContain('No architectural layers detected');
    });

    it('generates project refs for detected Clean Architecture', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');

      const detectResult = detectService.execute({ projectRoot: fixturePath });
      const genResult = generateService.execute({
        detected: detectResult.detected,
        projectRoot: fixturePath,
      });

      expect(genResult.configs).toHaveLength(3);
      expect(genResult.rootConfig).toBeDefined();
      expect(genResult.warnings).toHaveLength(0);

      // Verify domain has no references
      const domainConfig = genResult.configs.find(c =>
        c.outputPath.includes('domain')
      );
      expect(domainConfig).toBeDefined();
      expect(domainConfig!.content.references).toBeUndefined();

      // Verify application references domain
      const appConfig = genResult.configs.find(c =>
        c.outputPath.includes('application')
      );
      expect(appConfig).toBeDefined();
      const appRefs = appConfig!.content.references as Array<{ path: string }>;
      expect(appRefs).toHaveLength(1);
      expect(appRefs[0].path).toContain('domain');

      // Verify root config
      const rootRefs = genResult.rootConfig!.content.references as Array<{ path: string }>;
      expect(rootRefs).toHaveLength(3);

      // Verify composite and declaration flags
      for (const config of genResult.configs) {
        const opts = config.content.compilerOptions as Record<string, unknown>;
        expect(opts.composite).toBe(true);
        expect(opts.declaration).toBe(true);
      }
    });
  });

  describe('InferArchitectureService', () => {
    it('infers Clean Architecture from detect-clean-arch fixture', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');
      const result = inferService.execute({ projectRoot: fixturePath });

      expect(result.detected.pattern).toBe(ArchitecturePattern.CleanArchitecture);
      expect(result.detected.layers).toHaveLength(3);
      expect(result.warnings).toHaveLength(0);

      // Kind definition contains context and layer interfaces
      expect(result.definitions.kindDefinition).toContain('CleanArchitectureContext');
      expect(result.definitions.kindDefinition).toContain('DomainLayer');
      expect(result.definitions.kindDefinition).toContain('ApplicationLayer');
      expect(result.definitions.kindDefinition).toContain('InfrastructureLayer');

      // Instance declaration maps layers via locate
      expect(result.definitions.instanceDeclaration).toContain('export const app = locate<CleanArchitectureContext>');
      expect(result.definitions.instanceDeclaration).toContain('domain: {},');
      expect(result.definitions.instanceDeclaration).toContain('application: {},');
      expect(result.definitions.instanceDeclaration).toContain('infrastructure: {},');

      // Contracts: noDependency inferred, purity inferred for domain
      expect(result.definitions.contracts).toContain('noDependency');
      expect(result.definitions.contracts).toContain('["domain", "application"]');
      expect(result.definitions.contracts).toContain('["domain", "infrastructure"]');
      expect(result.definitions.contracts).toContain('purity');
      expect(result.definitions.contracts).toContain('"domain"');
    });

    it('infers Hexagonal from detect-hexagonal fixture', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-hexagonal');
      const result = inferService.execute({ projectRoot: fixturePath });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Hexagonal);
      expect(result.definitions.kindDefinition).toContain('HexagonalContext');
      expect(result.definitions.contracts).toContain('mustImplement');
      expect(result.definitions.contracts).toContain('["ports", "adapters"]');
    });

    it('returns Unknown from detect-unknown fixture', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-unknown');
      const result = inferService.execute({ projectRoot: fixturePath });

      expect(result.detected.pattern).toBe(ArchitecturePattern.Unknown);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('generated output is syntactically valid TypeScript', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');
      const result = inferService.execute({ projectRoot: fixturePath });
      const content = result.definitions.toFileContent();

      // Check for parse errors (syntax diagnostics)
      const diagnostics = getDiagnostics(content);
      expect(diagnostics).toHaveLength(0);
    });

    it('generated output round-trips through ClassifyAST', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch');
      const result = inferService.execute({ projectRoot: fixturePath });
      const content = result.definitions.toFileContent();

      // Write the generated content to a virtual file and parse it with ClassifyAST
      const archFileName = path.join(fixturePath, 'architecture.ts');
      const compilerHost = ts.createCompilerHost({});
      const originalGetSourceFile = compilerHost.getSourceFile;

      compilerHost.getSourceFile = (name, languageVersion) => {
        if (name === archFileName) {
          return ts.createSourceFile(name, content, languageVersion, true);
        }
        return originalGetSourceFile.call(compilerHost, name, languageVersion);
      };
      compilerHost.fileExists = (name) => {
        if (name === archFileName) return true;
        return ts.sys.fileExists(name);
      };
      compilerHost.readFile = (name) => {
        if (name === archFileName) return content;
        return ts.sys.readFile(name);
      };

      const program = ts.createProgram([archFileName], {
        noEmit: true,
        strict: false,
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
      }, compilerHost);

      const sourceFile = program.getSourceFile(archFileName);
      expect(sourceFile).toBeDefined();

      const checker = program.getTypeChecker();
      const astAdapter = new ASTAdapter();
      const classifyService = new ClassifyASTService(astAdapter);

      const classifyResult = classifyService.execute({
        definitionFiles: [sourceFile!],
        checker,
        projectRoot: fixturePath,
      });

      // Should have no classification errors
      expect(classifyResult.errors).toHaveLength(0);

      // Should find Kind definitions (CleanArchitectureContext + 3 layer types)
      const kinds = classifyResult.symbols.filter(s => s.kind === ArchSymbolKind.Kind);
      expect(kinds.length).toBeGreaterThanOrEqual(1);
      expect(kinds.some(k => k.name === 'CleanArchitectureContext')).toBe(true);

      // Should find the instance declaration
      const instances = classifyResult.symbols.filter(s => s.kind === ArchSymbolKind.Instance);
      expect(instances).toHaveLength(1);
      expect(instances[0].name).toBe('app');

      // Instance should have layer members
      const domainMember = instances[0].findMember('domain');
      expect(domainMember).toBeDefined();
      expect(domainMember!.declaredLocation).toContain('src/domain');

      // Should find contracts
      expect(classifyResult.contracts.length).toBeGreaterThanOrEqual(1);

      // Should have noDependency contracts
      const noDeps = classifyResult.contracts.filter(c => c.type === ContractType.NoDependency);
      expect(noDeps.length).toBeGreaterThanOrEqual(1);

      // Should have purity contracts
      const purityContracts = classifyResult.contracts.filter(c => c.type === ContractType.Purity);
      expect(purityContracts.length).toBeGreaterThanOrEqual(1);
    });

    it('does not infer purity for impure domain (real files with fs import)', () => {
      const fixturePath = path.join(FIXTURES_DIR, 'detect-clean-arch-impure');
      const result = inferService.execute({ projectRoot: fixturePath });

      expect(result.detected.pattern).toBe(ArchitecturePattern.CleanArchitecture);

      // Domain imports 'fs', so purity should NOT include "domain"
      const contracts = result.definitions.contracts;
      if (contracts.includes('purity')) {
        // If purity section exists, extract the layer names
        const purityMatch = contracts.match(/purity:\s*\[([^\]]*)\]/);
        if (purityMatch) {
          const pureLayers = purityMatch[1];
          expect(pureLayers).not.toContain('"domain"');
        }
      }

      // application and infrastructure don't import impure modules, so they may be pure
      // The key assertion is that domain is NOT in the purity list
    });
  });
});

/** Get syntax diagnostics for a TypeScript source string. */
function getDiagnostics(source: string): ts.Diagnostic[] {
  const fileName = 'test-architecture.ts';
  const compilerHost = ts.createCompilerHost({});
  const originalGetSourceFile = compilerHost.getSourceFile;

  compilerHost.getSourceFile = (name, languageVersion) => {
    if (name === fileName) {
      return ts.createSourceFile(name, source, languageVersion, true);
    }
    return originalGetSourceFile.call(compilerHost, name, languageVersion);
  };

  compilerHost.fileExists = (name) => {
    if (name === fileName) return true;
    return ts.sys.fileExists(name);
  };

  compilerHost.readFile = (name) => {
    if (name === fileName) return source;
    return ts.sys.readFile(name);
  };

  const program = ts.createProgram([fileName], {
    noEmit: true,
    strict: false,
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
  }, compilerHost);

  return [...program.getSyntacticDiagnostics()];
}
