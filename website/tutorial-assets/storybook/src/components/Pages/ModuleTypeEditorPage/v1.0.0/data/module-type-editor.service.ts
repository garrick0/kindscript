/**
 * ModuleTypeEditor Data Service
 * 
 * Data access layer for module type editor operations.
 */

import type { ModuleType } from '../../MigrationsPage/v1.0.0/types/module.types';
import type { 
  ModuleTypeFormData, 
  DiscoveryTestResult, 
  AssertionTestResult,
  ValidationResult 
} from '../types/module-type-editor.types';

export class ModuleTypeEditorService {
  private moduleTypes: ModuleType[] = [];

  /**
   * Get all module types
   */
  async getModuleTypes(): Promise<ModuleType[]> {
    // In a real implementation, this would fetch from an API or file system
    return this.moduleTypes;
  }

  /**
   * Get a specific module type by ID
   */
  async getModuleType(id: string): Promise<ModuleType | null> {
    return this.moduleTypes.find(type => type.id === id) || null;
  }

  /**
   * Save a module type (create or update)
   */
  async saveModuleType(formData: ModuleTypeFormData): Promise<ModuleType> {
    const moduleType: ModuleType = {
      ...formData,
      metadata: {
        ...formData.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    const existingIndex = this.moduleTypes.findIndex(type => type.id === moduleType.id);
    
    if (existingIndex >= 0) {
      // Update existing
      this.moduleTypes[existingIndex] = moduleType;
    } else {
      // Create new
      moduleType.metadata.createdAt = new Date().toISOString();
      this.moduleTypes.push(moduleType);
    }

    // In a real implementation, this would persist to storage
    console.log('Saving module type:', moduleType);
    
    return moduleType;
  }

  /**
   * Delete a module type
   */
  async deleteModuleType(id: string): Promise<boolean> {
    const index = this.moduleTypes.findIndex(type => type.id === id);
    if (index >= 0) {
      this.moduleTypes.splice(index, 1);
      console.log('Deleted module type:', id);
      return true;
    }
    return false;
  }

  /**
   * Test discovery patterns against the codebase
   */
  async testDiscoveryPatterns(
    basePattern: string, 
    instancePattern: string
  ): Promise<DiscoveryTestResult> {
    const startTime = Date.now();
    
    // Add small delay to ensure execution time is always > 0
    await new Promise(resolve => setTimeout(resolve, 1));
    
    try {
      // Simulate discovery pattern testing with mock data
      const mockPaths = [
        'src/components/Pages/HomePage/v1.0.0',
        'src/components/Pages/DashboardPage/v1.0.0',
        'src/components/Pages/SettingsPage/v1.0.0',
        'src/components/Pages/AuthErrorPage/v1.0.0',
        'src/components/Pages/DocumentsPage/v1.0.0',
        'src/components/Pages/ReleasesPage/v1.0.0',
        'src/components/Pages/WorkflowsPage/v1.0.0',
        'src/components/Pages/SignInPage/v1.0.0',
        'src/components/Pages/SignOutPage/v1.0.0',
        'src/components/Pages/MigrationsPage/v1.0.0'
      ];

      const matches = mockPaths.filter(path => {
        // Simple pattern matching - check if path contains the base pattern parts
        const baseParts = basePattern.split('/').filter(part => part && part !== '*');
        const baseMatch = baseParts.every(part => path.includes(part));
        
        // Instance pattern matching for version folders
        const instanceMatch = instancePattern === '*/v*' 
          ? path.match(/\/v\d+\.\d+\.\d+/)
          : true;
        
        return baseMatch && instanceMatch;
      });

      const executionTime = Date.now() - startTime;

      return {
        matches,
        total: matches.length,
        executionTime,
        errors: []
      };
    } catch (error) {
      return {
        matches: [],
        total: 0,
        executionTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Test an assertion against modules
   */
  async testAssertion(
    assertionId: string,
    assertion: any,
    modules: string[]
  ): Promise<AssertionTestResult> {
    const startTime = Date.now();

    // Simulate assertion testing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const executionTime = Date.now() - startTime;
    const success = Math.random() > 0.3; // 70% success rate for demo

    return {
      id: assertionId,
      name: assertion.name || 'Unnamed Assertion',
      status: success ? 'passed' : 'failed',
      message: success 
        ? `Assertion passed for ${modules.length} modules` 
        : `Assertion failed: ${Math.floor(Math.random() * 5) + 1} violations found`,
      executionTime
    };
  }

  /**
   * Validate module type definition
   */
  validateModuleType(formData: ModuleTypeFormData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.version.trim()) errors.push('Version is required');
    if (!formData.discovery.basePattern.trim()) errors.push('Base pattern is required');
    if (!formData.discovery.instancePattern.trim()) errors.push('Instance pattern is required');

    // Version format validation
    if (formData.version && !/^\d+\.\d+\.\d+$/.test(formData.version)) {
      errors.push('Version must be in format x.y.z');
    }

    // Discovery pattern validation
    try {
      if (formData.discovery.basePattern) {
        new RegExp(formData.discovery.basePattern.replace(/\*/g, '.*'));
      }
    } catch (e) {
      errors.push('Invalid base pattern');
    }

    // Structure warnings
    if (formData.structure.folders.length === 0 && formData.structure.files.length === 0) {
      warnings.push('No structure requirements defined');
    }

    if (formData.assertions.length === 0) {
      warnings.push('No assertions configured - consider adding quality checks');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Import module types from JSON
   */
  async importModuleTypes(jsonData: any[]): Promise<ModuleType[]> {
    const imported: ModuleType[] = [];
    
    for (const data of jsonData) {
      try {
        // Validate imported data
        if (data.id && data.name && data.version && data.discovery) {
          const moduleType: ModuleType = {
            ...data,
            metadata: {
              ...data.metadata,
              importedAt: new Date().toISOString()
            }
          };
          
          // Avoid ID conflicts
          if (this.moduleTypes.find(type => type.id === moduleType.id)) {
            moduleType.id = `${moduleType.id}-imported-${Date.now()}`;
          }
          
          this.moduleTypes.push(moduleType);
          imported.push(moduleType);
        }
      } catch (error) {
        console.warn('Failed to import module type:', data, error);
      }
    }
    
    return imported;
  }

  /**
   * Export module types to JSON
   */
  async exportModuleTypes(ids: string[]): Promise<any[]> {
    return this.moduleTypes
      .filter(type => ids.includes(type.id))
      .map(type => ({
        ...type,
        exportedAt: new Date().toISOString()
      }));
  }

  /**
   * Search module types
   */
  searchModuleTypes(query: string, moduleTypes: ModuleType[]): ModuleType[] {
    if (!query.trim()) return moduleTypes;
    
    const searchTerm = query.toLowerCase();
    return moduleTypes.filter(type =>
      type.name.toLowerCase().includes(searchTerm) ||
      type.description.toLowerCase().includes(searchTerm) ||
      type.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get preset structures for common patterns
   */
  getPresetStructures() {
    return {
      pages: {
        name: 'Pages Structure',
        description: 'Standard Pages component structure',
        folders: [
          { path: 'ui', required: true, description: 'User interface components' },
          { path: 'domain', required: true, description: 'Business logic and hooks' },
          { path: 'data', required: true, description: 'Data access layer' },
          { path: 'types', required: false, description: 'TypeScript definitions' },
          { path: 'validation', required: false, description: 'Input validation schemas' },
          { path: 'tests', required: false, description: 'Integration tests' }
        ],
        files: [
          { path: 'ui/{{PageName}}.tsx', required: true, validation: { schema: 'react-component' } },
          { path: 'ui/{{PageName}}.stories.tsx', required: true, validation: { schema: 'storybook-stories' } },
          { path: 'domain/use{{PageName}}.ts', required: true, validation: { schema: 'typescript' } },
          { path: 'data/{{pagename}}.queries.ts', required: true, validation: { schema: 'typescript' } },
          { path: 'metadata.json', required: true, validation: { schema: 'json' } },
          { path: 'dependencies.json', required: true, validation: { schema: 'json' } },
          { path: 'README.md', required: false, validation: { schema: 'markdown' } }
        ]
      },
      component: {
        name: 'Component Structure',
        description: 'Standard component structure',
        folders: [
          { path: 'hooks', required: false, description: 'Component-specific hooks' },
          { path: 'utils', required: false, description: 'Component utilities' }
        ],
        files: [
          { path: '{{ComponentName}}.tsx', required: true, validation: { schema: 'react-component' } },
          { path: '{{ComponentName}}.stories.tsx', required: true, validation: { schema: 'storybook-stories' } },
          { path: '{{ComponentName}}.test.tsx', required: false, validation: { schema: 'test-file' } },
          { path: 'index.ts', required: true, validation: { schema: 'typescript' } }
        ]
      }
    };
  }
}

// Singleton instance
export const moduleTypeEditorService = new ModuleTypeEditorService();