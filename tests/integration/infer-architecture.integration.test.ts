import * as path from 'path';
import * as ts from 'typescript';
import { InferArchitectureService } from '../../src/application/use-cases/infer-architecture/infer-architecture.service';
import { DetectArchitectureService } from '../../src/application/use-cases/detect-architecture/detect-architecture.service';
import { ClassifyASTService } from '../../src/application/use-cases/classify-ast/classify-ast.service';
import { TypeScriptAdapter } from '../../src/infrastructure/adapters/typescript/typescript.adapter';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/filesystem/filesystem.adapter';
import { ASTAdapter } from '../../src/infrastructure/adapters/ast/ast.adapter';
import { ArchitecturePattern } from '../../src/domain/types/architecture-pattern';
import { ArchSymbolKind } from '../../src/domain/types/arch-symbol-kind';
import { ContractType } from '../../src/domain/types/contract-type';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('InferArchitecture Integration Tests', () => {
  let tsAdapter: TypeScriptAdapter;
  let fsAdapter: FileSystemAdapter;
  let detectService: DetectArchitectureService;
  let inferService: InferArchitectureService;

  beforeEach(() => {
    tsAdapter = new TypeScriptAdapter();
    fsAdapter = new FileSystemAdapter();
    detectService = new DetectArchitectureService(fsAdapter, tsAdapter);
    inferService = new InferArchitectureService(detectService, fsAdapter);
  });

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

    // Instance declaration maps layers
    expect(result.definitions.instanceDeclaration).toContain('export const app');
    expect(result.definitions.instanceDeclaration).toContain('src/domain');
    expect(result.definitions.instanceDeclaration).toContain('src/application');
    expect(result.definitions.instanceDeclaration).toContain('src/infrastructure');

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
