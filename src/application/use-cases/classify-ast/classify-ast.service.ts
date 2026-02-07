import { ClassifyASTUseCase } from './classify-ast.use-case';
import { ClassifyASTRequest, ClassifyASTResponse } from './classify-ast.types';
import { ASTPort, ASTNode } from '../../ports/ast.port';
import { ArchSymbol } from '../../../domain/entities/arch-symbol';
import { ArchSymbolKind } from '../../../domain/types/arch-symbol-kind';
import { Contract } from '../../../domain/entities/contract';
import { ContractType } from '../../../domain/types/contract-type';

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

      // Phase 2: Find Instance declarations
      for (const stmt of statements) {
        if (this.astPort.isVariableStatement(stmt)) {
          const decls = this.astPort.getVariableDeclarations(stmt);
          for (const decl of decls) {
            const result = this.classifyInstance(decl, kindDefs, request.projectRoot);
            if (result) {
              if (result.error) {
                errors.push(result.error);
              } else if (result.symbol) {
                symbols.push(result.symbol);
                const typeName = this.astPort.getVariableTypeName(decl);
                if (typeName) {
                  instanceSymbols.set(typeName, result.symbol);
                }
              }
            }
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

    return { symbols, contracts, errors };
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
   * Phase 2: Check if a variable declaration is typed as a known Kind type.
   * If so, extract the instance location and member locations from the initializer.
   */
  private classifyInstance(
    decl: ASTNode,
    kindDefs: Map<string, KindDefinition>,
    projectRoot: string
  ): { symbol?: ArchSymbol; error?: string } | undefined {
    const typeName = this.astPort.getVariableTypeName(decl);
    if (!typeName) return undefined;

    const kindDef = kindDefs.get(typeName);
    if (!kindDef) return undefined;

    const init = this.astPort.getInitializer(decl);
    if (!init || !this.astPort.isObjectLiteral(init)) {
      return { error: `Instance '${this.astPort.getDeclarationName(decl)}' typed as '${typeName}' has no object literal initializer.` };
    }

    const objProps = this.astPort.getObjectProperties(init);
    const locationProp = objProps.find(p => p.name === 'location');
    const rawLocation = locationProp ? this.astPort.getStringValue(locationProp.value) : undefined;
    const location = rawLocation ? this.resolveLocation(rawLocation, projectRoot) : undefined;

    // Build member symbols from the object literal
    const members = new Map<string, ArchSymbol>();

    for (const prop of objProps) {
      if (prop.name === 'kind' || prop.name === 'location') continue;

      // Check if this member's value is a nested object literal (sub-kind instance)
      if (this.astPort.isObjectLiteral(prop.value)) {
        const memberSymbol = this.extractMemberSymbol(prop.name, prop.value, projectRoot);
        if (memberSymbol) {
          members.set(prop.name, memberSymbol);
        }
      } else {
        // String member — leaf location relative to parent
        const memberLocation = this.astPort.getStringValue(prop.value);
        if (memberLocation && rawLocation) {
          const resolvedMemberLocation = this.resolveLocation(
            this.joinPath(rawLocation, memberLocation),
            projectRoot
          );
          const memberSymbol = new ArchSymbol(
            prop.name,
            ArchSymbolKind.Layer,
            resolvedMemberLocation,
          );
          members.set(prop.name, memberSymbol);
        }
      }
    }

    const instanceName = this.astPort.getDeclarationName(decl) ?? typeName;
    const symbol = new ArchSymbol(
      instanceName,
      ArchSymbolKind.Instance,
      location,
      members,
    );

    return { symbol };
  }

  /**
   * Extract a member ArchSymbol from a nested object literal.
   */
  private extractMemberSymbol(
    name: string,
    objNode: ASTNode,
    projectRoot: string
  ): ArchSymbol | undefined {
    const props = this.astPort.getObjectProperties(objNode);
    const locationProp = props.find(p => p.name === 'location');
    const rawLocation = locationProp ? this.astPort.getStringValue(locationProp.value) : undefined;
    const location = rawLocation ? this.resolveLocation(rawLocation, projectRoot) : undefined;

    // Recursively extract sub-members
    const members = new Map<string, ArchSymbol>();
    for (const prop of props) {
      if (prop.name === 'kind' || prop.name === 'location') continue;

      if (this.astPort.isObjectLiteral(prop.value)) {
        const subMember = this.extractMemberSymbol(prop.name, prop.value, projectRoot);
        if (subMember) {
          members.set(prop.name, subMember);
        }
      } else {
        // String member — leaf location relative to parent
        const memberLocation = this.astPort.getStringValue(prop.value);
        if (memberLocation && rawLocation) {
          const resolvedLocation = this.resolveLocation(
            this.joinPath(rawLocation, memberLocation),
            projectRoot
          );
          members.set(prop.name, new ArchSymbol(
            prop.name,
            ArchSymbolKind.Layer,
            resolvedLocation,
          ));
        }
      }
    }

    return new ArchSymbol(
      name,
      ArchSymbolKind.Layer,
      location,
      members,
    );
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
    return this.joinPath(projectRoot, location);
  }

  private joinPath(base: string, relative: string): string {
    const normalizedBase = base.replace(/\/$/, '');
    const normalizedRelative = relative.replace(/^\//, '');
    return `${normalizedBase}/${normalizedRelative}`;
  }
}
