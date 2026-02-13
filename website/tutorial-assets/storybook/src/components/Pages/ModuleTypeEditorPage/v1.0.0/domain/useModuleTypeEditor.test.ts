/**
 * useModuleTypeEditor Hook Tests
 * 
 * Unit tests for the module type editor hook functionality.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModuleTypeEditor } from './useModuleTypeEditor';
import { moduleTypeEditorService } from '../data/module-type-editor.service';
import type { ModuleType } from '../../MigrationsPage/v1.0.0/types/module.types';

// Mock the service
vi.mock('../data/module-type-editor.service', () => ({
  moduleTypeEditorService: {
    getModuleTypes: vi.fn(),
    getModuleType: vi.fn(),
    saveModuleType: vi.fn(),
    deleteModuleType: vi.fn(),
    testDiscoveryPatterns: vi.fn(),
    validateModuleType: vi.fn(),
    importModuleTypes: vi.fn(),
    exportModuleTypes: vi.fn(),
    searchModuleTypes: vi.fn()
  }
}));

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

describe('useModuleTypeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(moduleTypeEditorService.getModuleTypes).mockResolvedValue([mockModuleType]);
    vi.mocked(moduleTypeEditorService.searchModuleTypes).mockImplementation((query, types) => 
      types.filter(type => type.name.toLowerCase().includes(query.toLowerCase()))
    );
    vi.mocked(moduleTypeEditorService.validateModuleType).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
  });

  it('should initialize with correct default state', async () => {
    const { result } = renderHook(() => useModuleTypeEditor());

    expect(result.current.mode).toBe('list');
    expect(result.current.activeTab).toBe('basic');
    expect(result.current.selectedType).toBeNull();
    expect(result.current.searchQuery).toBe('');
    expect(result.current.validationErrors).toEqual([]);
    expect(result.current.discoveryPreview).toEqual([]);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.isDirty).toBe(false);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.moduleTypes).toEqual([mockModuleType]);
  });

  it('should load module types on mount', async () => {
    renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(moduleTypeEditorService.getModuleTypes).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle initial module type selection', async () => {
    const { result } = renderHook(() => useModuleTypeEditor(mockModuleType.id));

    await waitFor(() => {
      expect(result.current.selectedType).toEqual(mockModuleType);
      expect(result.current.mode).toBe('edit');
    });
  });

  it('should set mode correctly', async () => {
    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMode('create');
    });

    expect(result.current.mode).toBe('create');
    expect(result.current.selectedType).toBeNull();
    expect(result.current.formData.id).toMatch(/^module-type-\d+$/);
    expect(result.current.isDirty).toBe(false);
  });

  it('should set active tab', async () => {
    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setActiveTab('discovery');
    });

    expect(result.current.activeTab).toBe('discovery');
  });

  it('should select type and populate form data', async () => {
    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.selectType(mockModuleType);
    });

    expect(result.current.selectedType).toEqual(mockModuleType);
    expect(result.current.formData.name).toBe(mockModuleType.name);
    expect(result.current.formData.description).toBe(mockModuleType.description);
    expect(result.current.isDirty).toBe(false);
  });

  it('should update form data and mark as dirty', async () => {
    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateFormData({ name: 'Updated Name' });
    });

    expect(result.current.formData.name).toBe('Updated Name');
    expect(result.current.isDirty).toBe(true);
  });

  it('should set search query and filter module types', async () => {
    vi.mocked(moduleTypeEditorService.getModuleTypes).mockResolvedValue([
      mockModuleType,
      { ...mockModuleType, id: 'other', name: 'Other Type' }
    ]);

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery('test');
    });

    expect(result.current.searchQuery).toBe('test');
    expect(result.current.filteredModuleTypes).toHaveLength(1);
    expect(result.current.filteredModuleTypes[0].name).toBe('Test Module Type');
  });

  it('should validate form and return errors', async () => {
    vi.mocked(moduleTypeEditorService.validateModuleType).mockReturnValue({
      isValid: false,
      errors: ['Name is required'],
      warnings: []
    });

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let errors: string[] = [];
    act(() => {
      errors = result.current.validateForm();
    });

    expect(errors).toEqual(['Name is required']);
    expect(result.current.validationErrors).toEqual(['Name is required']);
  });

  it('should test discovery patterns', async () => {
    vi.mocked(moduleTypeEditorService.testDiscoveryPatterns).mockResolvedValue({
      matches: ['src/test/component/v1.0.0'],
      total: 1,
      executionTime: 100,
      errors: []
    });

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateFormData({
        discovery: {
          basePattern: 'src/test',
          instancePattern: '*/v*',
          filePatterns: { required: [], optional: [], forbidden: [] }
        }
      });
    });

    await act(async () => {
      await result.current.testDiscoveryPatterns();
    });

    expect(result.current.discoveryPreview).toEqual(['src/test/component/v1.0.0']);
    expect(moduleTypeEditorService.testDiscoveryPatterns).toHaveBeenCalledWith('src/test', '*/v*');
  });

  it('should save module type successfully', async () => {
    const savedType = { ...mockModuleType, name: 'Saved Type' };
    vi.mocked(moduleTypeEditorService.saveModuleType).mockResolvedValue(savedType);

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.updateFormData({
        name: 'Valid Name',
        description: 'Valid Description',
        version: '1.0.0',
        discovery: {
          basePattern: 'src/test',
          instancePattern: '*/v*',
          filePatterns: { required: [], optional: [], forbidden: [] }
        }
      });
    });

    let success = false;
    await act(async () => {
      success = await result.current.saveModuleType();
    });

    expect(success).toBe(true);
    expect(result.current.mode).toBe('list');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.moduleTypes).toContainEqual(expect.objectContaining({ name: 'Saved Type' }));
  });

  it('should handle save failure', async () => {
    vi.mocked(moduleTypeEditorService.saveModuleType).mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success = true;
    await act(async () => {
      success = await result.current.saveModuleType();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Save failed');
  });

  it('should delete module type successfully', async () => {
    vi.mocked(moduleTypeEditorService.deleteModuleType).mockResolvedValue(true);

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.selectType(mockModuleType);
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteModuleType(mockModuleType.id);
    });

    expect(success).toBe(true);
    expect(result.current.moduleTypes).not.toContainEqual(mockModuleType);
    expect(result.current.selectedType).toBeNull();
  });

  it('should duplicate module type', async () => {
    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.duplicateModuleType(mockModuleType);
    });

    expect(result.current.mode).toBe('create');
    expect(result.current.formData.name).toBe('Test Module Type (Copy)');
    expect(result.current.formData.id).toMatch(/^test-module-type-copy-\d+$/);
    expect(result.current.isDirty).toBe(true);
  });

  it('should import module types', async () => {
    const importedTypes = [{ ...mockModuleType, id: 'imported-type' }];
    vi.mocked(moduleTypeEditorService.importModuleTypes).mockResolvedValue(importedTypes);

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let success = false;
    await act(async () => {
      success = await result.current.importModuleTypes(importedTypes);
    });

    expect(success).toBe(true);
    expect(result.current.moduleTypes).toContainEqual(expect.objectContaining({ id: 'imported-type' }));
  });

  it('should export module types', async () => {
    const exportedData = [mockModuleType];
    vi.mocked(moduleTypeEditorService.exportModuleTypes).mockResolvedValue(exportedData);

    // Mock DOM APIs globally before renderHook
    const originalDocument = global.document;
    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockCreateObjectURL = vi.fn().mockReturnValue('mock-url');
    const mockRevokeObjectURL = vi.fn();

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
      style: {},
      setAttribute: vi.fn(),
      getAttribute: vi.fn()
    };

    global.URL = {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL
    } as any;

    global.document = {
      ...originalDocument,
      createElement: vi.fn().mockReturnValue(mockAnchor),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild
      }
    } as any;

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.exportModuleTypes([mockModuleType.id]);
    });

    expect(moduleTypeEditorService.exportModuleTypes).toHaveBeenCalledWith([mockModuleType.id]);
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();

    // Restore original document
    global.document = originalDocument;
  });

  it('should reset form to original state', async () => {
    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.selectType(mockModuleType);
    });

    act(() => {
      result.current.updateFormData({ name: 'Changed Name' });
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.name).toBe(mockModuleType.name);
    expect(result.current.isDirty).toBe(false);
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(moduleTypeEditorService.getModuleTypes).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useModuleTypeEditor());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(result.current.moduleTypes).toEqual([]);
    });
  });
});