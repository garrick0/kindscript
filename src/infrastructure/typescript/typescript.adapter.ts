import * as ts from 'typescript';
import {
  TypeScriptPort,
  SourceFile,
  TypeChecker,
} from '../../application/ports/typescript.port.js';
import { Program } from '../../domain/entities/program.js';
import { ImportEdge } from '../../application/pipeline/check/import-edge.js';
import { IntraFileEdge } from '../../application/pipeline/check/intra-file-edge.js';
import { CompilerOptions } from '../../domain/types/compiler-options.js';

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
  private checkerToProgram = new WeakMap<object, ts.Program>();

  createProgram(rootFiles: string[], options: CompilerOptions): Program {
    const tsCompilerOptions = this.toTsCompilerOptions(options);
    const tsProgram = ts.createProgram(rootFiles, tsCompilerOptions);
    return new Program(rootFiles, options, tsProgram);
  }

  getSourceFile(program: Program, fileName: string): SourceFile | undefined {
    const tsProgram = this.unwrapProgram(program);
    const sf = tsProgram.getSourceFile(fileName);
    if (!sf) return undefined;
    return { fileName: sf.fileName, text: sf.getFullText(), handle: sf };
  }

  getSourceFiles(program: Program): SourceFile[] {
    const tsProgram = this.unwrapProgram(program);
    return tsProgram.getSourceFiles()
      .filter(sf => !sf.fileName.includes('node_modules') && !sf.isDeclarationFile)
      .map(sf => ({ fileName: sf.fileName, text: sf.getFullText(), handle: sf }));
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
    if (!tsProgram) {
      throw new Error(
        'TypeChecker not associated with a Program. Was getTypeChecker() called on this adapter?'
      );
    }

    const tsSourceFile = tsProgram.getSourceFile(sourceFile.fileName);
    if (!tsSourceFile) return [];

    const edges: ImportEdge[] = [];

    for (const imp of this.walkImportDeclarations(tsSourceFile)) {
      const symbol = tsChecker.getSymbolAtLocation(imp.node.moduleSpecifier);
      if (symbol) {
        const declarations = symbol.getDeclarations();
        if (declarations && declarations.length > 0) {
          const resolvedFile = declarations[0].getSourceFile();
          if (!resolvedFile.fileName.includes('node_modules') && !resolvedFile.isDeclarationFile) {
            edges.push(new ImportEdge(
              tsSourceFile.fileName,
              resolvedFile.fileName,
              imp.line,
              imp.column,
              imp.specifier
            ));
          }
        }
      }
    }

    return edges;
  }

  getIntraFileReferences(sourceFile: SourceFile, checker: TypeChecker): IntraFileEdge[] {
    const tsChecker = checker as unknown as ts.TypeChecker;
    const tsProgram = this.checkerToProgram.get(tsChecker);
    if (!tsProgram) {
      throw new Error(
        'TypeChecker not associated with a Program. Was getTypeChecker() called on this adapter?'
      );
    }

    const tsSourceFile = tsProgram.getSourceFile(sourceFile.fileName);
    if (!tsSourceFile) return [];

    // Collect top-level declaration symbols and their bodies
    const topLevelSymbols = new Map<ts.Symbol, string>();
    const topLevelBodies: Array<{ name: string; body: ts.Node }> = [];

    for (const stmt of tsSourceFile.statements) {
      if (ts.isFunctionDeclaration(stmt) && stmt.name) {
        const sym = tsChecker.getSymbolAtLocation(stmt.name);
        if (sym) topLevelSymbols.set(sym, stmt.name.text);
        if (stmt.body) topLevelBodies.push({ name: stmt.name.text, body: stmt.body });
      } else if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name)) continue;
          const sym = tsChecker.getSymbolAtLocation(decl.name);
          if (sym) topLevelSymbols.set(sym, decl.name.text);
          if (decl.initializer) topLevelBodies.push({ name: decl.name.text, body: decl.initializer });
        }
      } else if (ts.isClassDeclaration(stmt) && stmt.name) {
        const sym = tsChecker.getSymbolAtLocation(stmt.name);
        if (sym) topLevelSymbols.set(sym, stmt.name.text);
        topLevelBodies.push({ name: stmt.name.text, body: stmt });
      }
    }

    // Walk each body, find references to other top-level declarations
    const edges: IntraFileEdge[] = [];
    const seen = new Set<string>();

    for (const { name: fromName, body } of topLevelBodies) {
      const walk = (node: ts.Node): void => {
        if (ts.isIdentifier(node)) {
          const sym = tsChecker.getSymbolAtLocation(node);
          if (sym && topLevelSymbols.has(sym)) {
            const toName = topLevelSymbols.get(sym)!;
            if (toName !== fromName) {
              const key = `${fromName}->${toName}:${node.getStart()}`;
              if (!seen.has(key)) {
                seen.add(key);
                const pos = ts.getLineAndCharacterOfPosition(tsSourceFile, node.getStart());
                edges.push({
                  fromDeclaration: fromName,
                  toDeclaration: toName,
                  line: pos.line + 1,
                  column: pos.character,
                });
              }
            }
          }
        }
        ts.forEachChild(node, walk);
      };
      ts.forEachChild(body, walk);
    }

    return edges;
  }

  getImportModuleSpecifiers(program: Program, sourceFile: SourceFile): Array<{ moduleName: string; line: number; column: number }> {
    const tsSourceFile = this.getTsSourceFile(program, sourceFile);
    if (!tsSourceFile) return [];

    return this.walkImportDeclarations(tsSourceFile).map(imp => ({
      moduleName: imp.specifier,
      line: imp.line,
      column: imp.column,
    }));
  }

  private walkImportDeclarations(
    tsSourceFile: ts.SourceFile
  ): Array<{ node: ts.ImportDeclaration; specifier: string; line: number; column: number }> {
    const results: Array<{ node: ts.ImportDeclaration; specifier: string; line: number; column: number }> = [];

    ts.forEachChild(tsSourceFile, function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const pos = ts.getLineAndCharacterOfPosition(tsSourceFile, node.getStart());
        results.push({
          node,
          specifier: node.moduleSpecifier.text,
          line: pos.line + 1,
          column: pos.character,
        });
      }
      ts.forEachChild(node, visit);
    });

    return results;
  }

  private getTsSourceFile(program: Program, sourceFile: SourceFile): ts.SourceFile | undefined {
    const tsProgram = this.unwrapProgram(program);
    return tsProgram.getSourceFile(sourceFile.fileName);
  }

  private unwrapProgram(program: Program): ts.Program {
    const handle = program.handle;
    if (
      !handle ||
      typeof (handle as ts.Program).getSourceFiles !== 'function' ||
      typeof (handle as ts.Program).getTypeChecker !== 'function' ||
      typeof (handle as ts.Program).getSourceFile !== 'function'
    ) {
      throw new Error('Program does not contain a valid ts.Program handle. Was it created by this adapter?');
    }
    return handle as ts.Program;
  }

  private toTsCompilerOptions(options: CompilerOptions): ts.CompilerOptions {
    const { options: parsed } = ts.convertCompilerOptionsFromJson(options, '.');
    return parsed;
  }
}
