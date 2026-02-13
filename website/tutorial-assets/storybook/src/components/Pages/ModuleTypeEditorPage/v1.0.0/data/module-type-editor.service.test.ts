/**
 * ModuleTypeEditorService Tests
 * 
 * Unit tests for the module type editor service functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModuleTypeEditorService } from './module-type-editor.service';
import type { ModuleType } from '../../MigrationsPage/v1.0.0/types/module.types';
import type { ModuleTypeFormData } from '../types/module-type-editor.types';

const mockModuleType: ModuleType = {
  id: 'test-module-type',
  name: 'Test Module Type',
  description: 'A test module type',
  version: '1.0.0',
  discovery: {
    basePattern: 'src/test',
    instancePattern: '*/v*',
    filePatterns: {
      required: ['Test.tsx'],
      optional: ['Test.stories.tsx'],
      forbidden: ['*.backup']
    }
  },
  structure: {
    folders: [
      { path: 'ui', required: true, description: 'UI components' }
    ],
    files: [
      { path: 'ui/Test.tsx', required: true, validation: { schema: 'react-component' } }
    ],
    dependencies: []
  },
  assertions: [],
  metadata: {
    author: 'Test Author',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    tags: ['test'],
    documentation: 'https://docs.test.com'
  }
};

const mockFormData: ModuleTypeFormData = {
  id: 'new-module-type',
  name: 'New Module Type',
  description: 'A new module type',
  version: '1.0.0',
  discovery: {
    basePattern: 'src/new',
    instancePattern: '*/v*',
    filePatterns: {
      required: ['New.tsx'],
      optional: [],
      forbidden: []
    }
  },
  structure: {
    folders: [],
    files: [],
    dependencies: []
  },
  assertions: [],
  metadata: {
    author: 'Test Author',
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    tags: [],
    documentation: ''
  }
};

describe('ModuleTypeEditorService', () => {
  let service: ModuleTypeEditorService;

  beforeEach(() => {
    service = new ModuleTypeEditorService();
    // Reset internal state
    service['moduleTypes'] = [];
  });

  describe('getModuleTypes', () => {
    it('should return empty array initially', async () => {
      const result = await service.getModuleTypes();
      expect(result).toEqual([]);
    });

    it('should return stored module types', async () => {
      service['moduleTypes'] = [mockModuleType];
      const result = await service.getModuleTypes();
      expect(result).toEqual([mockModuleType]);
    });
  });

  describe('getModuleType', () => {
    it('should return null for non-existent type', async () => {
      const result = await service.getModuleType('non-existent');
      expect(result).toBeNull();
    });

    it('should return specific module type by ID', async () => {
      service['moduleTypes'] = [mockModuleType];
      const result = await service.getModuleType(mockModuleType.id);
      expect(result).toEqual(mockModuleType);
    });
  });

  describe('saveModuleType', () => {
    it('should create new module type', async () => {
      const result = await service.saveModuleType(mockFormData);
      
      expect(result.id).toBe(mockFormData.id);
      expect(result.name).toBe(mockFormData.name);
      expect(result.metadata.updatedAt).toBeDefined();
      
      const stored = await service.getModuleTypes();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual(result);
    });

    it('should update existing module type', async () => {
      // First create
      await service.saveModuleType(mockFormData);
      
      // Then update
      const updatedFormData = {
        ...mockFormData,
        name: 'Updated Name'
      };
      
      const result = await service.saveModuleType(updatedFormData);
      
      expect(result.name).toBe('Updated Name');
      expect(result.metadata.updatedAt).toBeDefined();
      
      const stored = await service.getModuleTypes();
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Updated Name');
    });

    it('should set createdAt for new module types', async () => {
      const result = await service.saveModuleType(mockFormData);
      
      expect(result.metadata.createdAt).toBeDefined();
      expect(new Date(result.metadata.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('deleteModuleType', () => {
    it('should return false for non-existent type', async () => {
      const result = await service.deleteModuleType('non-existent');
      expect(result).toBe(false);
    });

    it('should delete existing module type', async () => {
      await service.saveModuleType(mockFormData);
      
      const result = await service.deleteModuleType(mockFormData.id);
      expect(result).toBe(true);
      
      const stored = await service.getModuleTypes();
      expect(stored).toHaveLength(0);
    });
  });

  describe('testDiscoveryPatterns', () => {
    it('should return matching paths', async () => {
      const result = await service.testDiscoveryPatterns('src/components/Pages', '*/v*');
      
      expect(result.matches).toBeInstanceOf(Array);
      expect(result.total).toBe(result.matches.length);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.errors).toEqual([]);
      
      // Should find pages that match the pattern
      const hasPages = result.matches.some(path => path.includes('Pages'));
      expect(hasPages).toBe(true);
    });

    it('should return empty results for non-matching patterns', async () => {
      const result = await service.testDiscoveryPatterns('non/existent/path', '*/v*');
      
      expect(result.matches).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.errors).toEqual([]);
    });

    it('should handle discovery errors gracefully', async () => {
      // Mock an error scenario by using invalid regex
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await service.testDiscoveryPatterns('', '');
      
      // Should still return a valid result structure
      expect(result).toHaveProperty('matches');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('errors');
      
      consoleSpy.mockRestore();
    });
  });

  describe('testAssertion', () => {
    it('should test assertion with mock results', async () => {
      const assertion = {
        id: 'test-assertion',
        name: 'Test Assertion',
        type: 'eslint',
        config: { eslint: { rules: {} } }
      };
      
      const result = await service.testAssertion(
        assertion.id,
        assertion,
        ['module1', 'module2']
      );
      
      expect(result.id).toBe(assertion.id);
      expect(result.name).toBe(assertion.name);
      expect(result.status).toMatch(/^(passed|failed|warning)$/);
      expect(result.message).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('validateModuleType', () => {
    it('should validate complete form data', () => {
      const result = service.validateModuleType(mockFormData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing required fields', () => {
      const invalidFormData = {
        ...mockFormData,
        name: '',
        description: '',
        discovery: {
          basePattern: '',
          instancePattern: '',
          filePatterns: { required: [], optional: [], forbidden: [] }
        }
      };
      
      const result = service.validateModuleType(invalidFormData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Description is required');
      expect(result.errors).toContain('Base pattern is required');
      expect(result.errors).toContain('Instance pattern is required');
    });

    it('should validate version format', () => {
      const invalidVersionData = {
        ...mockFormData,
        version: 'invalid-version'
      };
      
      const result = service.validateModuleType(invalidVersionData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Version must be in format x.y.z');
    });

    it('should warn about missing structure and assertions', () => {
      const result = service.validateModuleType(mockFormData);
      
      expect(result.warnings).toContain('No structure requirements defined');
      expect(result.warnings).toContain('No assertions configured - consider adding quality checks');
    });
  });

  describe('importModuleTypes', () => {
    it('should import valid module types', async () => {
      const importData = [mockModuleType];
      
      const result = await service.importModuleTypes(importData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockModuleType.id,
        name: mockModuleType.name
      }));
      expect(result[0].metadata.importedAt).toBeDefined();
      
      const stored = await service.getModuleTypes();
      expect(stored).toHaveLength(1);
    });

    it('should handle ID conflicts', async () => {
      // First add the original
      await service.saveModuleType({ ...mockModuleType, ...mockModuleType.metadata });
      
      // Then try to import the same ID
      const result = await service.importModuleTypes([mockModuleType]);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).not.toBe(mockModuleType.id);
      expect(result[0].id).toMatch(/^test-module-type-imported-\d+$/);
    });

    it('should skip invalid import data', async () => {
      const invalidData = [
        { invalid: 'data' },
        mockModuleType,
        { another: 'invalid' }
      ];
      
      const result = await service.importModuleTypes(invalidData as any);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockModuleType.name);
    });
  });

  describe('exportModuleTypes', () => {
    it('should export specified module types', async () => {
      await service.saveModuleType({ ...mockModuleType, ...mockModuleType.metadata });
      
      const result = await service.exportModuleTypes([mockModuleType.id]);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockModuleType.id,
        name: mockModuleType.name
      }));
      expect(result[0].exportedAt).toBeDefined();
    });

    it('should filter by specified IDs', async () => {
      const type1 = { ...mockFormData, id: 'type1' };
      const type2 = { ...mockFormData, id: 'type2' };
      
      await service.saveModuleType(type1);
      await service.saveModuleType(type2);
      
      const result = await service.exportModuleTypes(['type1']);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('type1');
    });
  });

  describe('searchModuleTypes', () => {
    const searchTypes = [
      { ...mockModuleType, id: 'type1', name: 'React Component', metadata: { ...mockModuleType.metadata, tags: ['react', 'component'] } },
      { ...mockModuleType, id: 'type2', name: 'Vue Component', metadata: { ...mockModuleType.metadata, tags: ['vue', 'component'] } },
      { ...mockModuleType, id: 'type3', name: 'Angular Service', metadata: { ...mockModuleType.metadata, tags: ['angular', 'service'] } }
    ];

    it('should return all types for empty query', () => {
      const result = service.searchModuleTypes('', searchTypes);
      expect(result).toHaveLength(3);
    });

    it('should search by name', () => {
      const result = service.searchModuleTypes('react', searchTypes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('React Component');
    });

    it('should search by description', () => {
      const typesWithDescription = searchTypes.map(type => ({
        ...type,
        description: type.name.includes('React') ? 'React component description' : 'Other description'
      }));
      
      const result = service.searchModuleTypes('React component', typesWithDescription);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('React Component');
    });

    it('should search by tags', () => {
      const result = service.searchModuleTypes('service', searchTypes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Angular Service');
    });

    it('should be case insensitive', () => {
      const result = service.searchModuleTypes('REACT', searchTypes);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('React Component');
    });
  });

  describe('getPresetStructures', () => {
    it('should return preset structures', () => {
      const presets = service.getPresetStructures();
      
      expect(presets).toHaveProperty('pages');
      expect(presets).toHaveProperty('component');
      
      expect(presets.pages.folders).toBeInstanceOf(Array);
      expect(presets.pages.files).toBeInstanceOf(Array);
      expect(presets.component.folders).toBeInstanceOf(Array);
      expect(presets.component.files).toBeInstanceOf(Array);
      
      // Check Pages preset structure
      const pagesFolders = presets.pages.folders;
      expect(pagesFolders.some(f => f.path === 'ui' && f.required === true)).toBe(true);
      expect(pagesFolders.some(f => f.path === 'domain' && f.required === true)).toBe(true);
      expect(pagesFolders.some(f => f.path === 'data' && f.required === true)).toBe(true);
    });
  });
});