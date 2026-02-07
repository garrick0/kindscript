import * as ts from 'typescript';
import {
  TypeScriptPort,
  SourceFile,
  TypeChecker,
} from '../../../application/ports/typescript.port';
import { Program } from '../../../domain/entities/program';
import { ImportEdge } from '../../../domain/value-objects/import-edge';
import { Diagnostic } from '../../../domain/entities/diagnostic';
import { CompilerOptions } from '../../../domain/types/compiler-options';

/**
 * Real implementation of TypeScriptPort using the TypeScript compiler API.
 *
 * This adapter bridges the domain's pure abstractions to the real ts.Program,
 * ts.SourceFile, and ts.TypeChecker. It keeps the TypeScript dependency
 * confined to the infrastructure layer.
 *
 * Internally uses a Map to associate domain TypeChecker objects back to
 * their ts.Program, since the port interface doesn't pass the Program
 * to getImports.
 */
export class TypeScriptAdapter implements TypeScriptPort {
  /**
   * Maps domain TypeChecker (which is really a ts.TypeChecker) back to
   * the ts.Program it came from. Needed because getImports() receives
   * a checker but needs the program to find the real ts.SourceFile.
   */
  private checkerToProgram = new Map<unknown, ts.Program>();

  createProgram(rootFiles: string[], options: CompilerOptions): Program {
    const tsCompilerOptions = this.toTsCompilerOptions(options);
    const tsProgram = ts.createProgram(rootFiles, tsCompilerOptions);
    return new Program(rootFiles, options, tsProgram);
  }

  getSourceFile(program: Program, fileName: string): SourceFile | undefined {
    const tsProgram = this.unwrapProgram(program);
    const sf = tsProgram.getSourceFile(fileName);
    if (!sf) return undefined;
    return { fileName: sf.fileName, text: sf.getFullText() };
  }

  getSourceFiles(program: Program): SourceFile[] {
    const tsProgram = this.unwrapProgram(program);
    return tsProgram.getSourceFiles()
      .filter(sf => !sf.fileName.includes('node_modules') && !sf.isDeclarationFile)
      .map(sf => ({ fileName: sf.fileName, text: sf.getFullText() }));
  }

  getTypeChecker(program: Program): TypeChecker {
    const tsProgram = this.unwrapProgram(program);
    const checker = tsProgram.getTypeChecker();
    // Store the association so getImports can find the program later
    this.checkerToProgram.set(checker, tsProgram);
    return checker as unknown as TypeChecker;
  }

  getImports(sourceFile: SourceFile, checker: TypeChecker): ImportEdge[] {
    const tsChecker = checker as unknown as ts.TypeChecker;
    const tsProgram = this.checkerToProgram.get(tsChecker);
    if (!tsProgram) return [];

    const tsSourceFile = tsProgram.getSourceFile(sourceFile.fileName);
    if (!tsSourceFile) return [];

    const edges: ImportEdge[] = [];

    ts.forEachChild(tsSourceFile, function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleSpecifier = node.moduleSpecifier.text;
        const symbol = tsChecker.getSymbolAtLocation(node.moduleSpecifier);

        if (symbol) {
          const declarations = symbol.getDeclarations();
          if (declarations && declarations.length > 0) {
            const resolvedFile = declarations[0].getSourceFile();
            if (!resolvedFile.fileName.includes('node_modules') && !resolvedFile.isDeclarationFile) {
              const pos = ts.getLineAndCharacterOfPosition(tsSourceFile, node.getStart());
              edges.push(new ImportEdge(
                tsSourceFile.fileName,
                resolvedFile.fileName,
                pos.line + 1,
                pos.character,
                moduleSpecifier
              ));
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    });

    return edges;
  }

  getDiagnostics(program: Program): Diagnostic[] {
    const tsProgram = this.unwrapProgram(program);
    const tsDiags = ts.getPreEmitDiagnostics(tsProgram);

    return tsDiags
      .filter(d => d.file)
      .map(d => {
        const file = d.file!;
        const pos = d.start !== undefined
          ? ts.getLineAndCharacterOfPosition(file, d.start)
          : { line: 0, character: 0 };

        return new Diagnostic(
          ts.flattenDiagnosticMessageText(d.messageText, '\n'),
          d.code,
          file.fileName,
          pos.line + 1,
          pos.character
        );
      });
  }

  getImportModuleSpecifiers(program: Program, sourceFile: SourceFile): Array<{ moduleName: string; line: number; column: number }> {
    const tsSourceFile = this.getTsSourceFile(program, sourceFile);
    if (!tsSourceFile) return [];

    const results: Array<{ moduleName: string; line: number; column: number }> = [];

    ts.forEachChild(tsSourceFile, function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const pos = ts.getLineAndCharacterOfPosition(tsSourceFile, node.getStart());
        results.push({
          moduleName: node.moduleSpecifier.text,
          line: pos.line + 1,
          column: pos.character,
        });
      }
      ts.forEachChild(node, visit);
    });

    return results;
  }

  getExportedInterfaceNames(program: Program, sourceFile: SourceFile): string[] {
    const tsSourceFile = this.getTsSourceFile(program, sourceFile);
    if (!tsSourceFile) return [];

    const names: string[] = [];

    for (const stmt of tsSourceFile.statements) {
      if (
        ts.isInterfaceDeclaration(stmt) &&
        stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
        stmt.name
      ) {
        names.push(stmt.name.text);
      }
    }

    return names;
  }

  hasClassImplementing(program: Program, sourceFile: SourceFile, interfaceName: string): boolean {
    const tsSourceFile = this.getTsSourceFile(program, sourceFile);
    if (!tsSourceFile) return false;

    for (const stmt of tsSourceFile.statements) {
      if (ts.isClassDeclaration(stmt) && stmt.heritageClauses) {
        for (const clause of stmt.heritageClauses) {
          if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
            for (const type of clause.types) {
              if (ts.isIdentifier(type.expression) && type.expression.text === interfaceName) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  private getTsSourceFile(program: Program, sourceFile: SourceFile): ts.SourceFile | undefined {
    const tsProgram = this.unwrapProgram(program);
    return tsProgram.getSourceFile(sourceFile.fileName);
  }

  private unwrapProgram(program: Program): ts.Program {
    if (!program.handle || typeof (program.handle as ts.Program).getSourceFiles !== 'function') {
      throw new Error('Program does not contain a valid ts.Program handle. Was it created by this adapter?');
    }
    return program.handle as ts.Program;
  }

  private toTsCompilerOptions(options: CompilerOptions): ts.CompilerOptions {
    const result: ts.CompilerOptions = {};

    if (options.rootDir) result.rootDir = options.rootDir;
    if (options.outDir) result.outDir = options.outDir;
    if (options.strict !== undefined) result.strict = options.strict;
    if (options.esModuleInterop !== undefined) result.esModuleInterop = options.esModuleInterop;
    if (options.skipLibCheck !== undefined) result.skipLibCheck = options.skipLibCheck;
    if (options.declaration !== undefined) result.declaration = options.declaration;
    if (options.composite !== undefined) result.composite = options.composite;
    if (options.baseUrl) result.baseUrl = options.baseUrl;

    if (options.target) {
      result.target = this.parseScriptTarget(options.target);
    }
    if (options.module) {
      result.module = this.parseModuleKind(options.module);
    }
    if (options.moduleResolution) {
      result.moduleResolution = this.parseModuleResolution(options.moduleResolution);
    }
    if (options.paths) {
      result.paths = options.paths;
    }

    return result;
  }

  private parseScriptTarget(target: string): ts.ScriptTarget {
    const map: Record<string, ts.ScriptTarget> = {
      'es5': ts.ScriptTarget.ES5,
      'es2015': ts.ScriptTarget.ES2015,
      'es2016': ts.ScriptTarget.ES2016,
      'es2017': ts.ScriptTarget.ES2017,
      'es2018': ts.ScriptTarget.ES2018,
      'es2019': ts.ScriptTarget.ES2019,
      'es2020': ts.ScriptTarget.ES2020,
      'es2021': ts.ScriptTarget.ES2021,
      'es2022': ts.ScriptTarget.ES2022,
      'esnext': ts.ScriptTarget.ESNext,
    };
    return map[target.toLowerCase()] ?? ts.ScriptTarget.ES2020;
  }

  private parseModuleKind(module: string): ts.ModuleKind {
    const map: Record<string, ts.ModuleKind> = {
      'commonjs': ts.ModuleKind.CommonJS,
      'amd': ts.ModuleKind.AMD,
      'es2015': ts.ModuleKind.ES2015,
      'es2020': ts.ModuleKind.ES2020,
      'es2022': ts.ModuleKind.ES2022,
      'esnext': ts.ModuleKind.ESNext,
      'node16': ts.ModuleKind.Node16,
      'nodenext': ts.ModuleKind.NodeNext,
    };
    return map[module.toLowerCase()] ?? ts.ModuleKind.CommonJS;
  }

  private parseModuleResolution(res: string): ts.ModuleResolutionKind {
    const map: Record<string, ts.ModuleResolutionKind> = {
      'node': ts.ModuleResolutionKind.NodeJs,
      'node10': ts.ModuleResolutionKind.NodeJs,
      'node16': ts.ModuleResolutionKind.Node16,
      'nodenext': ts.ModuleResolutionKind.NodeNext,
      'bundler': ts.ModuleResolutionKind.Bundler,
    };
    return map[res.toLowerCase()] ?? ts.ModuleResolutionKind.NodeJs;
  }
}
