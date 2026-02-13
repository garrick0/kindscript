/**
 * Module Service
 * 
 * Service for discovering, validating, and managing code modules.
 */

import type {
  ModuleType,
  ModuleInstance,
  ModuleDiscoveryRequest,
  ModuleDiscoveryResponse,
  ModuleValidationRequest,
  ModuleValidationResponse,
  AssertionResult,
  DiscoveredFile,
  ModuleStatus,
  AssertionStatus,
  ValidationError,
  ValidationWarning
} from '../types/module.types';

// Default module types configuration
import { defaultModuleTypes } from './default-module-types';

export class ModuleService {
  private static instance: ModuleService;
  private moduleTypes: Map<string, ModuleType> = new Map();
  private moduleInstances: Map<string, ModuleInstance> = new Map();
  private discoveryCache: Map<string, ModuleInstance[]> = new Map();

  private constructor() {
    // Initialize with default module types
    this.loadDefaultModuleTypes();
  }

  static getInstance(): ModuleService {
    if (!ModuleService.instance) {
      ModuleService.instance = new ModuleService();
    }
    return ModuleService.instance;
  }

  /**
   * Load default module types
   */
  private loadDefaultModuleTypes(): void {
    defaultModuleTypes.forEach(type => {
      this.moduleTypes.set(type.id, type);
    });
  }

  /**
   * Get all module types
   */
  async getModuleTypes(): Promise<ModuleType[]> {
    return Array.from(this.moduleTypes.values());
  }

  /**
   * Get a specific module type
   */
  async getModuleType(id: string): Promise<ModuleType | null> {
    return this.moduleTypes.get(id) || null;
  }

  /**
   * Create a new module type
   */
  async createModuleType(moduleType: ModuleType): Promise<ModuleType> {
    if (this.moduleTypes.has(moduleType.id)) {
      throw new Error(`Module type with id ${moduleType.id} already exists`);
    }
    this.moduleTypes.set(moduleType.id, moduleType);
    return moduleType;
  }

  /**
   * Update an existing module type
   */
  async updateModuleType(id: string, updates: Partial<ModuleType>): Promise<ModuleType> {
    const existing = this.moduleTypes.get(id);
    if (!existing) {
      throw new Error(`Module type with id ${id} not found`);
    }
    const updated = { ...existing, ...updates, id };
    this.moduleTypes.set(id, updated);
    return updated;
  }

  /**
   * Delete a module type
   */
  async deleteModuleType(id: string): Promise<void> {
    if (!this.moduleTypes.has(id)) {
      throw new Error(`Module type with id ${id} not found`);
    }
    this.moduleTypes.delete(id);
    // Clear related instances from cache
    this.discoveryCache.delete(id);
  }

  /**
   * Discover modules of a specific type
   */
  async discoverModules(request: ModuleDiscoveryRequest): Promise<ModuleDiscoveryResponse> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      const moduleType = await this.getModuleType(request.typeId);
      if (!moduleType) {
        throw new Error(`Module type ${request.typeId} not found`);
      }

      // Check cache unless forced
      if (!request.force && this.discoveryCache.has(request.typeId)) {
        return {
          typeId: request.typeId,
          discovered: this.discoveryCache.get(request.typeId)!,
          errors: [],
          duration: 0
        };
      }

      // Simulate filesystem discovery (in production, this would scan actual files)
      const discovered = await this.simulateDiscovery(moduleType, request.basePath);
      
      // Cache results
      this.discoveryCache.set(request.typeId, discovered);
      
      // Store instances
      discovered.forEach(instance => {
        this.moduleInstances.set(instance.id, instance);
      });

      return {
        typeId: request.typeId,
        discovered,
        errors,
        duration: Date.now() - startTime
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        typeId: request.typeId,
        discovered: [],
        errors,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Simulate module discovery (placeholder for real filesystem scanning)
   */
  private async simulateDiscovery(moduleType: ModuleType, basePath?: string): Promise<ModuleInstance[]> {
    // This is a simulation - in production, this would scan the filesystem
    const mockInstances: ModuleInstance[] = [];
    
    if (moduleType.id === 'pages-v1') {
      // Simulate discovering page modules
      const pages = ['DashboardPage', 'SettingsPage', 'ReleasesPage', 'DocumentsPage', 'WorkflowsPage'];
      
      pages.forEach(pageName => {
        const instance: ModuleInstance = {
          id: `page-${pageName.toLowerCase()}`,
          typeId: moduleType.id,
          path: `apps/storybook/src/components/Pages/${pageName}/v1.0.0`,
          name: pageName,
          version: '1.0.0',
          discovery: {
            discoveredAt: new Date().toISOString(),
            files: [
              {
                path: `ui/${pageName}.tsx`,
                relativePath: `ui/${pageName}.tsx`,
                size: Math.floor(Math.random() * 10000) + 1000,
                lastModified: new Date().toISOString(),
                type: 'required',
                validation: {
                  status: 'valid',
                  messages: []
                }
              },
              {
                path: `domain/use${pageName.replace('Page', '')}.ts`,
                relativePath: `domain/use${pageName.replace('Page', '')}.ts`,
                size: Math.floor(Math.random() * 5000) + 500,
                lastModified: new Date().toISOString(),
                type: 'optional',
                validation: {
                  status: 'valid',
                  messages: []
                }
              },
              {
                path: 'metadata.json',
                relativePath: 'metadata.json',
                size: 256,
                lastModified: new Date().toISOString(),
                type: 'required',
                validation: {
                  status: Math.random() > 0.3 ? 'valid' : 'invalid',
                  messages: Math.random() > 0.3 ? [] : ['metadata.json is missing or invalid']
                }
              },
              {
                path: 'README.md',
                relativePath: 'README.md',
                size: 1024,
                lastModified: new Date().toISOString(),
                type: 'required',
                validation: {
                  status: Math.random() > 0.5 ? 'valid' : 'warning',
                  messages: Math.random() > 0.5 ? [] : ['README.md needs updating']
                }
              }
            ],
            folders: ['ui', 'domain', 'data', 'validation', 'types'],
            dependencies: [
              {
                module: 'react',
                type: 'external',
                version: '18.3.1',
                resolved: true
              },
              {
                module: '@induction/shared',
                type: 'internal',
                resolved: true
              }
            ]
          },
          validation: {
            lastChecked: new Date().toISOString(),
            status: Math.random() > 0.7 ? 'valid' : Math.random() > 0.3 ? 'warning' : 'invalid',
            assertions: [],
            errors: [],
            warnings: []
          },
          metrics: {
            linesOfCode: Math.floor(Math.random() * 1000) + 200,
            complexity: Math.floor(Math.random() * 20) + 5,
            testCoverage: Math.floor(Math.random() * 40) + 60,
            lastModified: new Date().toISOString(),
            contributors: ['developer1', 'developer2']
          }
        };
        
        mockInstances.push(instance);
      });
    } else if (moduleType.id === 'organisms-v1') {
      // Simulate discovering organism modules
      const organisms = ['ReleasesManager', 'DocumentManager', 'AIAssistant'];
      
      organisms.forEach(name => {
        const instance: ModuleInstance = {
          id: `organism-${name.toLowerCase()}`,
          typeId: moduleType.id,
          path: `apps/storybook/src/components/organisms/${name}/v1.0.0`,
          name,
          version: '1.0.0',
          discovery: {
            discoveredAt: new Date().toISOString(),
            files: [],
            folders: [],
            dependencies: []
          },
          validation: {
            lastChecked: new Date().toISOString(),
            status: Math.random() > 0.5 ? 'valid' : 'warning',
            assertions: [],
            errors: [],
            warnings: []
          },
          metrics: {
            linesOfCode: Math.floor(Math.random() * 500) + 100,
            complexity: Math.floor(Math.random() * 15) + 3,
            testCoverage: Math.floor(Math.random() * 30) + 50,
            lastModified: new Date().toISOString(),
            contributors: ['developer1']
          }
        };
        
        mockInstances.push(instance);
      });
    }
    
    return mockInstances;
  }

  /**
   * Get all discovered modules
   */
  async getModules(typeId?: string): Promise<ModuleInstance[]> {
    if (typeId) {
      return this.discoveryCache.get(typeId) || [];
    }
    
    const allModules: ModuleInstance[] = [];
    this.discoveryCache.forEach(modules => {
      allModules.push(...modules);
    });
    return allModules;
  }

  /**
   * Get a specific module
   */
  async getModule(id: string): Promise<ModuleInstance | null> {
    return this.moduleInstances.get(id) || null;
  }

  /**
   * Validate a module
   */
  async validateModule(request: ModuleValidationRequest): Promise<ModuleValidationResponse> {
    const startTime = Date.now();
    
    const module = await this.getModule(request.moduleId);
    if (!module) {
      throw new Error(`Module ${request.moduleId} not found`);
    }

    const moduleType = await this.getModuleType(module.typeId);
    if (!moduleType) {
      throw new Error(`Module type ${module.typeId} not found`);
    }

    // Run assertions
    const assertions = request.assertions 
      ? moduleType.assertions.filter(a => request.assertions!.includes(a.id))
      : moduleType.assertions;

    const results: AssertionResult[] = [];
    let fixed = 0;

    for (const assertion of assertions) {
      const result = await this.runAssertion(module, assertion, request.autoFix);
      results.push(result);
      if (request.autoFix && result.status === 'passed') {
        fixed += result.details.filesFailed; // Assumes they were fixed
      }
    }

    // Update module validation status
    const hasErrors = results.some(r => r.status === 'failed' && r.assertionName.includes('error'));
    const hasWarnings = results.some(r => r.status === 'failed' && !r.assertionName.includes('error'));
    
    const status: ModuleStatus = hasErrors ? 'invalid' : hasWarnings ? 'warning' : 'valid';
    
    module.validation = {
      lastChecked: new Date().toISOString(),
      status,
      assertions: results,
      errors: hasErrors ? [{ file: module.path, message: 'Validation failed', severity: 'error' }] : [],
      warnings: hasWarnings ? [{ file: module.path, message: 'Validation warnings', severity: 'warning' }] : []
    };

    return {
      moduleId: request.moduleId,
      status,
      results,
      fixed,
      duration: Date.now() - startTime
    };
  }

  /**
   * Run a single assertion (simulated)
   */
  private async runAssertion(
    module: ModuleInstance,
    assertion: any,
    autoFix?: boolean
  ): Promise<AssertionResult> {
    // Simulate assertion execution
    const startTime = Date.now();
    const passed = Math.random() > 0.3; // 70% pass rate
    
    return {
      assertionId: assertion.id,
      assertionName: assertion.name,
      status: passed ? 'passed' : 'failed',
      executedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      details: {
        filesChecked: module.discovery.files.length,
        filesPassed: passed ? module.discovery.files.length : Math.floor(module.discovery.files.length * 0.7),
        filesFailed: passed ? 0 : Math.ceil(module.discovery.files.length * 0.3),
        failures: passed ? [] : [
          {
            file: module.discovery.files[0]?.path || 'unknown',
            line: 42,
            column: 10,
            rule: assertion.name,
            message: `${assertion.name} check failed`,
            severity: assertion.severity || 'error',
            fixable: autoFix || false,
            fix: autoFix ? {
              range: [100, 150],
              text: '// Fixed'
            } : undefined
          }
        ]
      }
    };
  }

  /**
   * Run all assertions for a module type
   */
  async runAssertions(typeId: string): Promise<Map<string, AssertionResult[]>> {
    const modules = await this.getModules(typeId);
    const results = new Map<string, AssertionResult[]>();

    for (const module of modules) {
      const validation = await this.validateModule({
        moduleId: module.id,
        autoFix: false
      });
      results.set(module.id, validation.results);
    }

    return results;
  }

  /**
   * Generate module from template
   */
  async generateModule(
    typeId: string,
    name: string,
    variables?: Record<string, any>
  ): Promise<ModuleInstance> {
    const moduleType = await this.getModuleType(typeId);
    if (!moduleType) {
      throw new Error(`Module type ${typeId} not found`);
    }

    if (!moduleType.template) {
      throw new Error(`Module type ${typeId} has no template`);
    }

    // This would generate actual files in production
    // For now, return a mock instance
    const instance: ModuleInstance = {
      id: `${typeId}-${name.toLowerCase()}`,
      typeId,
      path: `generated/${name}`,
      name,
      version: '1.0.0',
      discovery: {
        discoveredAt: new Date().toISOString(),
        files: [],
        folders: [],
        dependencies: []
      },
      validation: {
        lastChecked: new Date().toISOString(),
        status: 'unchecked',
        assertions: [],
        errors: [],
        warnings: []
      },
      metrics: {
        linesOfCode: 0,
        complexity: 0,
        lastModified: new Date().toISOString(),
        contributors: []
      }
    };

    this.moduleInstances.set(instance.id, instance);
    return instance;
  }

  /**
   * Get module metrics summary
   */
  async getModuleMetrics(typeId?: string): Promise<{
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
    unchecked: number;
    averageCoverage: number;
    averageComplexity: number;
  }> {
    const modules = await this.getModules(typeId);
    
    const metrics = {
      total: modules.length,
      valid: modules.filter(m => m.validation.status === 'valid').length,
      invalid: modules.filter(m => m.validation.status === 'invalid').length,
      warnings: modules.filter(m => m.validation.status === 'warning').length,
      unchecked: modules.filter(m => m.validation.status === 'unchecked').length,
      averageCoverage: 0,
      averageComplexity: 0
    };

    if (modules.length > 0) {
      const coverages = modules
        .filter(m => m.metrics.testCoverage !== undefined)
        .map(m => m.metrics.testCoverage!);
      
      const complexities = modules.map(m => m.metrics.complexity);
      
      metrics.averageCoverage = coverages.length > 0 
        ? coverages.reduce((a, b) => a + b, 0) / coverages.length
        : 0;
      
      metrics.averageComplexity = complexities.reduce((a, b) => a + b, 0) / complexities.length;
    }

    return metrics;
  }
}