import { ClassifyASTUseCase } from './classify-ast.use-case';
import { ClassifyASTRequest, ClassifyASTResponse } from './classify-ast.types';
import { ASTPort, ASTNode } from '../../ports/ast.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { Contract } from '../../../domain/entities/contract';
import { ContractType } from '../../../domain/types/contract-type';
import { joinPath } from '../../../domain/utils/path-matching';

/**
 * Intermediate representation of a Kind definition found in the AST.
 */
interface KindDefinition {
  name: string;
  kindNameLiteral: string;
  properties: Array<{ name: string; typeName?: string }>;
}

/**
 * Real implementation of ClassifyASTUseCase.
 *
 * This is the "KindScript Binder" from V4 Part 4.1. It has three responsibilities:
 * 1. Find Kind definitions (interfaces extending Kind<N>)
 * 2. Find Instance declarations (variables typed as Kind types)
 * 3. Find Contract descriptors (defineContracts<T>(...) calls)
 *
 * The classifier does NOT query the filesystem. It does NOT validate locations.
 * It classifies and records what it finds in the AST.
 */
export class ClassifyASTService implements ClassifyASTUseCase {
  constructor(
    private readonly astPort: ASTPort
  ) {}

  execute(request: ClassifyASTRequest): ClassifyASTResponse {
    const symbols: ArchSymbol[] = [];
    const contracts: Contract[] = [];
    const errors: string[] = [];

    // Maps for cross-referencing between phases
    const kindDefs = new Map<string, KindDefinition>();
    const instanceSymbols = new Map<string, ArchSymbol>(); // kindName → instance ArchSymbol
    const instanceTypeNames = new Map<string, string>(); // instanceName → kindTypeName

    // First pass: Find Kind definitions and Instance declarations across all files.
    // This ensures all instances are available before contract binding (Phase 3),
    // which is critical when contracts live in a package file and instances
    // live in the user's architecture.ts.
    for (const sourceFile of request.definitionFiles) {
      const statements = this.astPort.getStatements(sourceFile);

      // Phase 1: Find Kind definitions
      for (const stmt of statements) {
        if (this.astPort.isInterfaceDeclaration(stmt)) {
          const result = this.classifyKindDefinition(stmt);
          if (result) {
            kindDefs.set(result.name, result);
          }
        }
      }

      // Build variable map for identifier resolution in locate() calls
      const varMap = new Map<string, { typeName?: string; initializer?: ASTNode }>();
      for (const stmt of statements) {
        if (this.astPort.isVariableStatement(stmt)) {
          const decls = this.astPort.getVariableDeclarations(stmt);
          for (const decl of decls) {
            const varName = this.astPort.getDeclarationName(decl);
            if (varName) {
              varMap.set(varName, {
                typeName: this.astPort.getVariableTypeName(decl),
                initializer: this.astPort.getInitializer(decl),
              });
            }
          }
        }
      }

      // Phase 2: Find Instance declarations (locate<T>() calls)
      for (const stmt of statements) {
        if (this.astPort.isVariableStatement(stmt)) {
          const decls = this.astPort.getVariableDeclarations(stmt);
          for (const decl of decls) {
            // Check for locate<T>(root, members) call first
            const init = this.astPort.getInitializer(decl);
            if (init && this.astPort.isCallExpression(init)) {
              const funcName = this.astPort.getCallExpressionName(init);
              if (funcName === 'locate') {
                const result = this.classifyLocateInstance(decl, init, kindDefs, request.projectRoot, varMap);
                if (result.error) {
                  errors.push(result.error);
                } else if (result.symbol) {
                  symbols.push(result.symbol);
                  const kindName = this.astPort.getCallTypeArgumentNames(init)[0];
                  if (kindName) {
                    instanceSymbols.set(kindName, result.symbol);
                    instanceTypeNames.set(result.symbol.name, kindName);
                  }
                }
                continue;
              }
            }

            // Not a locate<T>() call — skip
          }
        }
      }
    }

    // Second pass: Find Contract descriptors (all instances now available)
    for (const sourceFile of request.definitionFiles) {
      const statements = this.astPort.getStatements(sourceFile);

      // Phase 3: Find Contract descriptors
      for (const stmt of statements) {
        if (this.astPort.isVariableStatement(stmt)) {
          const decls = this.astPort.getVariableDeclarations(stmt);
          for (const decl of decls) {
            const init = this.astPort.getInitializer(decl);
            if (init && this.astPort.isCallExpression(init)) {
              const result = this.classifyContracts(init, instanceSymbols, sourceFile.fileName);
              contracts.push(...result.contracts);
              errors.push(...result.errors);
            }
          }
        }
      }
    }

    // Also add kind definitions to symbol list as Kind-type ArchSymbols
    for (const [name] of kindDefs) {
      const kindSymbol = new ArchSymbol(
        name,
        ArchSymbolKind.Kind,
        undefined, // Kinds don't have locations, instances do
      );
      symbols.push(kindSymbol);
    }

    return { symbols, contracts, instanceTypeNames, errors };
  }

  /**
   * Phase 1: Check if an interface declaration extends Kind<N>.
   * If so, extract the kind name and member properties.
   */
  private classifyKindDefinition(node: ASTNode): KindDefinition | undefined {
    const heritageNames = this.astPort.getHeritageTypeNames(node);
    if (!heritageNames.includes('Kind')) return undefined;

    const name = this.astPort.getDeclarationName(node);
    if (!name) return undefined;

    const kindNameLiterals = this.astPort.getHeritageTypeArgLiterals(node);
    const kindNameLiteral = kindNameLiterals[0] ?? name;

    const properties = this.astPort.getPropertySignatures(node);

    return { name, kindNameLiteral, properties };
  }

  /**
   * Phase 2 (locate path): Classify a locate<T>(root, members) call.
   * Derives member paths from root + member name using the Kind definition tree.
   */
  private classifyLocateInstance(
    decl: ASTNode,
    callNode: ASTNode,
    kindDefs: Map<string, KindDefinition>,
    projectRoot: string,
    varMap: Map<string, { typeName?: string; initializer?: ASTNode }> = new Map(),
  ): { symbol?: ArchSymbol; error?: string } {
    const typeArgNames = this.astPort.getCallTypeArgumentNames(callNode);
    const kindName = typeArgNames[0];

    if (!kindName) {
      return { error: `locate() call has no type argument. Expected locate<KindName>(...).` };
    }

    const kindDef = kindDefs.get(kindName);
    if (!kindDef) {
      return { error: `locate<${kindName}>: no Kind definition found for '${kindName}'.` };
    }

    const args = this.astPort.getCallArguments(callNode);
    if (args.length < 2) {
      return { error: `locate<${kindName}>: expected locate<T>(root, members).` };
    }

    const rootLocation = this.astPort.getStringValue(args[0]);
    if (!rootLocation) {
      return { error: `locate<${kindName}>: first argument must be a string literal (root location).` };
    }

    const membersArg = args[1];
    if (!this.astPort.isObjectLiteral(membersArg)) {
      return { error: `locate<${kindName}>: second argument must be an object literal (members).` };
    }

    const resolvedRoot = this.resolveLocation(rootLocation, projectRoot);

    // Derive member symbols from the Kind definition tree
    const members = this.deriveMembers(
      kindDef, resolvedRoot, membersArg, kindDefs, projectRoot, varMap
    );

    const instanceName = this.astPort.getDeclarationName(decl) ?? kindName;
    const symbol = new ArchSymbol(
      instanceName,
      ArchSymbolKind.Instance,
      resolvedRoot,
      members,
      kindName,
    );

    return { symbol };
  }

  /**
   * Recursively derive member ArchSymbols from a Kind definition tree.
   * Each member's path is derived as parentPath + "/" + memberName.
   */
  private deriveMembers(
    kindDef: KindDefinition,
    parentPath: string,
    membersObj: ASTNode,
    kindDefs: Map<string, KindDefinition>,
    projectRoot: string,
    varMap: Map<string, { typeName?: string; initializer?: ASTNode }> = new Map(),
  ): Map<string, ArchSymbol> {
    const members = new Map<string, ArchSymbol>();
    const objProps = this.astPort.getObjectProperties(membersObj);

    for (const property of kindDef.properties) {
      const memberName = property.name;
      const memberKindTypeName = property.typeName;

      // Get child Kind definition for recursion
      const childKindDef = memberKindTypeName ? kindDefs.get(memberKindTypeName) : undefined;

      // Find corresponding property in the object literal (for sub-member assignments)
      const objProp = objProps.find(p => p.name === memberName);
      let memberValue = objProp?.value;

      // Resolve identifier references: { domain } or { domain: domainVar }
      if (memberValue && this.astPort.isIdentifier(memberValue)) {
        const identName = this.astPort.getIdentifierName(memberValue);
        if (identName) {
          const resolved = varMap.get(identName);
          if (resolved?.initializer) {
            memberValue = resolved.initializer;
          }
        }
      }

      // Check for path override: { path: "value-objects" }
      let pathSegment = memberName;
      if (memberValue && this.astPort.isObjectLiteral(memberValue)) {
        const memberObjProps = this.astPort.getObjectProperties(memberValue);
        const pathProp = memberObjProps.find(p => p.name === 'path');
        if (pathProp) {
          const overridePath = this.astPort.getStringValue(pathProp.value);
          if (overridePath) {
            pathSegment = overridePath;
          }
        }
      }

      const memberPath = joinPath(parentPath, pathSegment);
      const resolvedPath = this.resolveLocation(memberPath, projectRoot);

      // Recurse if child Kind has properties and member value is an object literal
      let childMembers = new Map<string, ArchSymbol>();
      if (childKindDef && childKindDef.properties.length > 0 && memberValue && this.astPort.isObjectLiteral(memberValue)) {
        childMembers = this.deriveMembers(
          childKindDef, resolvedPath, memberValue, kindDefs, projectRoot, varMap
        );
      }

      const memberSymbol = new ArchSymbol(
        memberName,
        ArchSymbolKind.Member,
        resolvedPath,
        childMembers,
        memberKindTypeName,
        true, // locationDerived
      );
      members.set(memberName, memberSymbol);
    }

    return members;
  }

  /**
   * Phase 3: Check if a call expression is defineContracts<T>(...).
   * If so, parse the contract config object and create Contract objects.
   */
  private classifyContracts(
    callNode: ASTNode,
    instanceSymbols: Map<string, ArchSymbol>,
    fileName: string
  ): { contracts: Contract[]; errors: string[] } {
    const contracts: Contract[] = [];
    const errors: string[] = [];

    const funcName = this.astPort.getCallExpressionName(callNode);
    if (funcName !== 'defineContracts') return { contracts, errors };

    const typeArgNames = this.astPort.getCallTypeArgumentNames(callNode);
    const kindName = typeArgNames[0];

    if (!kindName) {
      errors.push(`defineContracts call at ${fileName} has no type argument. Expected defineContracts<KindName>(...).`);
      return { contracts, errors };
    }

    const instanceSymbol = instanceSymbols.get(kindName);
    if (!instanceSymbol) {
      errors.push(`defineContracts<${kindName}> at ${fileName}: no matching instance found for kind '${kindName}'.`);
      return { contracts, errors };
    }

    const args = this.astPort.getCallArguments(callNode);
    if (args.length === 0 || !this.astPort.isObjectLiteral(args[0])) {
      errors.push(`defineContracts<${kindName}> at ${fileName}: expected an object literal argument.`);
      return { contracts, errors };
    }

    const configObj = args[0];
    const configProps = this.astPort.getObjectProperties(configObj);

    // Contract type shape categorization
    const TUPLE_PAIR_TYPES = new Set([ContractType.NoDependency, ContractType.MustImplement, ContractType.Colocated]);
    const INDIVIDUAL_TYPES = new Set([ContractType.Purity]);
    const COLLECTIVE_TYPES = new Set([ContractType.NoCycles]);

    for (const prop of configProps) {
      const contractType = this.toContractType(prop.name);
      if (!contractType) {
        errors.push(`defineContracts<${kindName}>: unknown contract type '${prop.name}'.`);
        continue;
      }

      if (!this.astPort.isArrayLiteral(prop.value)) {
        errors.push(`defineContracts<${kindName}>: '${prop.name}' value must be an array.`);
        continue;
      }

      if (TUPLE_PAIR_TYPES.has(contractType)) {
        this.parseTuplePairContracts(
          contractType, prop.name, prop.value, instanceSymbol, kindName, fileName, contracts, errors
        );
      } else if (INDIVIDUAL_TYPES.has(contractType)) {
        this.parseIndividualContracts(
          contractType, prop.name, prop.value, instanceSymbol, kindName, fileName, contracts, errors
        );
      } else if (COLLECTIVE_TYPES.has(contractType)) {
        this.parseCollectiveContract(
          contractType, prop.name, prop.value, instanceSymbol, kindName, fileName, contracts, errors
        );
      }
    }

    return { contracts, errors };
  }

  /**
   * Parse tuple-pair contracts: [[a, b], [c, d]] → N contracts with 2 args each.
   * Used by noDependency, mustImplement, colocated.
   */
  private parseTuplePairContracts(
    contractType: ContractType,
    propName: string,
    arrayNode: ASTNode,
    instanceSymbol: ArchSymbol,
    kindName: string,
    fileName: string,
    contracts: Contract[],
    errors: string[]
  ): void {
    const entries = this.astPort.getArrayElements(arrayNode);
    for (const entry of entries) {
      if (!this.astPort.isArrayLiteral(entry)) {
        errors.push(`defineContracts<${kindName}>: each '${propName}' entry must be a [from, to] tuple.`);
        continue;
      }

      const tuple = this.astPort.getArrayElements(entry);
      if (tuple.length !== 2) {
        errors.push(`defineContracts<${kindName}>: ${propName} entry must have exactly 2 elements, got ${tuple.length}.`);
        continue;
      }

      const firstName = this.astPort.getStringValue(tuple[0]);
      const secondName = this.astPort.getStringValue(tuple[1]);

      if (!firstName || !secondName) {
        errors.push(`defineContracts<${kindName}>: ${propName} entry elements must be string literals.`);
        continue;
      }

      const firstSymbol = instanceSymbol.findByPath(firstName);
      const secondSymbol = instanceSymbol.findByPath(secondName);

      if (!firstSymbol) {
        errors.push(`defineContracts<${kindName}>: member '${firstName}' not found in instance '${instanceSymbol.name}'.`);
        continue;
      }
      if (!secondSymbol) {
        errors.push(`defineContracts<${kindName}>: member '${secondName}' not found in instance '${instanceSymbol.name}'.`);
        continue;
      }

      const contract = new Contract(
        contractType,
        `${propName}(${firstName} -> ${secondName})`,
        [firstSymbol, secondSymbol],
        fileName,
      );
      contracts.push(contract);
    }
  }

  /**
   * Parse individual contracts: ["a", "b"] → N contracts with 1 arg each.
   * Used by purity.
   */
  private parseIndividualContracts(
    contractType: ContractType,
    propName: string,
    arrayNode: ASTNode,
    instanceSymbol: ArchSymbol,
    kindName: string,
    fileName: string,
    contracts: Contract[],
    errors: string[]
  ): void {
    const entries = this.astPort.getArrayElements(arrayNode);
    for (const entry of entries) {
      const memberName = this.astPort.getStringValue(entry);
      if (!memberName) {
        errors.push(`defineContracts<${kindName}>: each '${propName}' entry must be a string literal.`);
        continue;
      }

      const symbol = instanceSymbol.findByPath(memberName);
      if (!symbol) {
        errors.push(`defineContracts<${kindName}>: member '${memberName}' not found in instance '${instanceSymbol.name}'.`);
        continue;
      }

      const contract = new Contract(
        contractType,
        `${propName}(${memberName})`,
        [symbol],
        fileName,
      );
      contracts.push(contract);
    }
  }

  /**
   * Parse collective contracts: ["a", "b", "c"] → 1 contract with N args.
   * Used by noCycles.
   */
  private parseCollectiveContract(
    contractType: ContractType,
    propName: string,
    arrayNode: ASTNode,
    instanceSymbol: ArchSymbol,
    kindName: string,
    fileName: string,
    contracts: Contract[],
    errors: string[]
  ): void {
    const entries = this.astPort.getArrayElements(arrayNode);
    const argSymbols: ArchSymbol[] = [];

    for (const entry of entries) {
      const memberName = this.astPort.getStringValue(entry);
      if (!memberName) {
        errors.push(`defineContracts<${kindName}>: each '${propName}' entry must be a string literal.`);
        continue;
      }

      const symbol = instanceSymbol.findByPath(memberName);
      if (!symbol) {
        errors.push(`defineContracts<${kindName}>: member '${memberName}' not found in instance '${instanceSymbol.name}'.`);
        continue;
      }

      argSymbols.push(symbol);
    }

    if (argSymbols.length > 0) {
      const argNames = argSymbols.map(s => s.name).join(', ');
      const contract = new Contract(
        contractType,
        `${propName}(${argNames})`,
        argSymbols,
        fileName,
      );
      contracts.push(contract);
    }
  }

  private toContractType(name: string): ContractType | undefined {
    const map: Record<string, ContractType> = {
      noDependency: ContractType.NoDependency,
      mustImplement: ContractType.MustImplement,
      purity: ContractType.Purity,
      noCycles: ContractType.NoCycles,
      colocated: ContractType.Colocated,
    };
    return map[name];
  }

  /**
   * Resolve a location relative to the project root.
   * If the location is already absolute, return it as-is.
   */
  private resolveLocation(location: string, projectRoot: string): string {
    if (location.startsWith('/')) return location;
    return joinPath(projectRoot, location);
  }
}
