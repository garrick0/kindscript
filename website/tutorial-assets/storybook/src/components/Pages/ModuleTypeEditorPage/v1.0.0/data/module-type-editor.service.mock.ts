/**
 * Mock ModuleTypeEditorService for testing and Storybook
 */

import type { ModuleType } from '../../MigrationsPage/v1.0.0/types/module.types';
import type { 
  ModuleTypeFormData, 
  DiscoveryTestResult, 
  AssertionTestResult,
  ValidationResult 
} from '../types/module-type-editor.types';
import { ModuleTypeEditorService } from './module-type-editor.service';

// Mock data
const mockModuleTypes: ModuleType[] = [
  {
    id: '1',
    name: 'API Endpoint',
    description: 'REST API endpoint with CRUD operations',
    version: '1.0.0',
    discovery: {
      basePattern: 'src/api',
      instancePattern: '*/v*',
      filePatterns: {
        required: ['route.ts', 'types.ts'],
        optional: ['middleware.ts'],
        forbidden: ['*.backup']
      }
    },
    structure: {
      folders: [
        { path: 'controllers', required: true, description: 'Request handlers' }
      ],
      files: [
        { path: 'index.ts', required: true, validation: { schema: 'typescript' } }
      ],
      dependencies: []
    },
    assertions: [],
    metadata: {
      author: 'Test Author',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z',
      tags: ['api', 'rest', 'crud'],
      documentation: ''
    }
  },
  {
    id: '2',
    name: 'React Component',
    description: 'Reusable React component with TypeScript',
    version: '1.0.0',
    discovery: {
      basePattern: 'src/components',
      instancePattern: '*/v*',
      filePatterns: {
        required: ['index.tsx', 'types.ts'],
        optional: ['styles.css', 'test.tsx'],
        forbidden: []
      }
    },
    structure: {
      folders: [
        { path: '__tests__', required: false, description: 'Component tests' }
      ],
      files: [
        { path: 'index.tsx', required: true, validation: { schema: 'react-component' } }
      ],
      dependencies: []
    },
    assertions: [],
    metadata: {
      author: 'Test Author',
      createdAt: '2024-01-10T09:15:00Z',
      updatedAt: '2024-01-18T16:20:00Z',
      tags: ['react', 'component', 'typescript'],
      documentation: ''
    }
  }
];

export class MockModuleTypeEditorService extends ModuleTypeEditorService {
  private moduleTypes: ModuleType[] = [...mockModuleTypes];
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async getModuleTypes(): Promise<ModuleType[]> {
    await this.delay(100); // Simulate network delay
    return [...this.moduleTypes];
  }

  async getModuleType(id: string): Promise<ModuleType | null> {
    await this.delay(50);
    return this.moduleTypes.find(type => type.id === id) || null;
  }

  async saveModuleType(formData: ModuleTypeFormData): Promise<ModuleType> {
    await this.delay(200);
    
    const moduleType: ModuleType = {
      ...formData,
      metadata: {
        ...formData.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    const existingIndex = this.moduleTypes.findIndex(type => type.id === moduleType.id);
    
    if (existingIndex >= 0) {
      this.moduleTypes[existingIndex] = moduleType;
    } else {
      this.moduleTypes.push(moduleType);
    }

    return moduleType;
  }

  async deleteModuleType(id: string): Promise<boolean> {
    await this.delay(150);
    const index = this.moduleTypes.findIndex(type => type.id === id);
    
    if (index >= 0) {
      this.moduleTypes.splice(index, 1);
      return true;
    }
    
    return false;
  }

  async testDiscoveryPatterns(basePattern: string, instancePattern: string): Promise<DiscoveryTestResult> {
    await this.delay(300);
    
    // Mock discovery results
    return {
      matches: [
        'src/components/Pages/TestPage/v1.0.0',
        'src/components/Pages/AuthPage/v1.0.0',
        'src/components/Pages/DashboardPage/v1.0.0'
      ],
      total: 3,
      executionTime: 125,
      errors: []
    };
  }

  validateModuleType(formData: ModuleTypeFormData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!formData.name || formData.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!formData.description || formData.description.trim() === '') {
      errors.push('Description is required');
    }

    if (!formData.version || !/^\d+\.\d+\.\d+$/.test(formData.version)) {
      errors.push('Version must be in format x.y.z');
    }

    if (!formData.discovery.basePattern) {
      errors.push('Base pattern is required');
    }

    if (!formData.discovery.instancePattern) {
      errors.push('Instance pattern is required');
    }

    // Warnings
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

  async testAssertion(
    assertionId: string,
    assertion: any,
    targetModules: string[]
  ): Promise<AssertionTestResult> {
    await this.delay(500);
    
    // Mock test results
    const statuses = ['passed', 'failed', 'warning'] as const;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: assertionId,
      name: assertion.name || 'Test Assertion',
      status,
      message: `Assertion ${status} for ${targetModules.length} modules`,
      details: targetModules.map(module => ({
        module,
        status,
        message: `Module ${module} ${status}`
      })),
      executionTime: Math.floor(Math.random() * 1000) + 100
    };
  }

  // Reset method for testing
  reset(): void {
    this.moduleTypes = [...mockModuleTypes];
  }
}

// Export a singleton mock instance for Storybook
export const mockModuleTypeEditorService = new MockModuleTypeEditorService();