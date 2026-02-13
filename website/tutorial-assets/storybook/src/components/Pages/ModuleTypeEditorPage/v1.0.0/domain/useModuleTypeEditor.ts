/**
 * useModuleTypeEditor Hook
 * 
 * Business logic and state management for the module type editor page.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ModuleType } from '../../MigrationsPage/v1.0.0/types/module.types';
import type { 
  ModuleTypeEditorState, 
  ModuleTypeEditorActions,
  ModuleTypeFormData,
  EditorMode,
  EditorTab
} from '../types/module-type-editor.types';
import { initialFormData } from '../types/module-type-editor.types';
import { moduleTypeEditorService as defaultService, ModuleTypeEditorService } from '../data/module-type-editor.service';

export interface UseModuleTypeEditorReturn extends ModuleTypeEditorState, ModuleTypeEditorActions {
  moduleTypes: ModuleType[];
  filteredModuleTypes: ModuleType[];
  loading: boolean;
  error: string | null;
}

export interface UseModuleTypeEditorOptions {
  initialModuleTypeId?: string;
  service?: ModuleTypeEditorService;
}

export const useModuleTypeEditor = (
  options: UseModuleTypeEditorOptions | string = {}
): UseModuleTypeEditorReturn => {
  // Handle both old API (string) and new API (options object)
  const { initialModuleTypeId, service = defaultService } = 
    typeof options === 'string' 
      ? { initialModuleTypeId: options, service: defaultService }
      : options;
  
  const moduleTypeEditorService = service;
  // Core state
  const [moduleTypes, setModuleTypes] = useState<ModuleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [state, setState] = useState<ModuleTypeEditorState>({
    mode: 'list',
    activeTab: 'basic',
    selectedType: null,
    formData: { ...initialFormData },
    searchQuery: '',
    validationErrors: [],
    discoveryPreview: [],
    isValidating: false,
    isDirty: false
  });

  // Computed values
  const filteredModuleTypes = moduleTypeEditorService.searchModuleTypes(state.searchQuery, moduleTypes);

  // Load module types on mount
  useEffect(() => {
    loadModuleTypes();
  }, []);

  // Handle initial module type selection
  useEffect(() => {
    if (initialModuleTypeId && moduleTypes.length > 0) {
      const type = moduleTypes.find(t => t.id === initialModuleTypeId);
      if (type) {
        selectType(type);
        setMode('edit');
      }
    }
  }, [initialModuleTypeId, moduleTypes]);

  // Load module types from service
  const loadModuleTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const types = await moduleTypeEditorService.getModuleTypes();
      setModuleTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load module types');
    } finally {
      setLoading(false);
    }
  }, []);

  // Actions
  const setMode = useCallback((mode: EditorMode) => {
    setState(prev => ({ ...prev, mode, validationErrors: [] }));
    
    if (mode === 'create') {
      setState(prev => ({
        ...prev,
        selectedType: null,
        formData: {
          ...initialFormData,
          id: `module-type-${Date.now()}`,
          metadata: {
            ...initialFormData.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        isDirty: false
      }));
    }
  }, []);

  const setActiveTab = useCallback((tab: EditorTab) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const selectType = useCallback((type: ModuleType | null) => {
    setState(prev => ({
      ...prev,
      selectedType: type,
      formData: type ? {
        id: type.id,
        name: type.name,
        description: type.description,
        version: type.version,
        discovery: type.discovery,
        structure: type.structure,
        assertions: type.assertions,
        metadata: type.metadata
      } : { ...initialFormData },
      isDirty: false,
      validationErrors: []
    }));
  }, []);

  const updateFormData = useCallback((data: Partial<ModuleTypeFormData>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
      isDirty: true,
      validationErrors: []
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const validateForm = useCallback((): string[] => {
    const result = moduleTypeEditorService.validateModuleType(state.formData);
    setState(prev => ({ ...prev, validationErrors: result.errors }));
    return result.errors;
  }, [state.formData]);

  const testDiscoveryPatterns = useCallback(async () => {
    if (!state.formData.discovery.basePattern || !state.formData.discovery.instancePattern) {
      return;
    }

    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await moduleTypeEditorService.testDiscoveryPatterns(
        state.formData.discovery.basePattern,
        state.formData.discovery.instancePattern
      );
      
      setState(prev => ({ 
        ...prev, 
        discoveryPreview: result.matches,
        isValidating: false
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        discoveryPreview: [],
        isValidating: false
      }));
      setError(err instanceof Error ? err.message : 'Discovery test failed');
    }
  }, [state.formData.discovery]);

  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: state.selectedType ? {
        id: state.selectedType.id,
        name: state.selectedType.name,
        description: state.selectedType.description,
        version: state.selectedType.version,
        discovery: state.selectedType.discovery,
        structure: state.selectedType.structure,
        assertions: state.selectedType.assertions,
        metadata: state.selectedType.metadata
      } : { ...initialFormData },
      isDirty: false,
      validationErrors: [],
      discoveryPreview: []
    }));
  }, [state.selectedType]);

  const saveModuleType = useCallback(async (): Promise<boolean> => {
    const errors = validateForm();
    if (errors.length > 0) {
      return false;
    }

    try {
      setLoading(true);
      const saved = await moduleTypeEditorService.saveModuleType(state.formData);
      
      // Update local state
      setModuleTypes(prev => {
        const existing = prev.findIndex(type => type.id === saved.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = saved;
          return updated;
        } else {
          return [...prev, saved];
        }
      });

      setState(prev => ({
        ...prev,
        selectedType: saved,
        formData: {
          id: saved.id,
          name: saved.name,
          description: saved.description,
          version: saved.version,
          discovery: saved.discovery,
          structure: saved.structure,
          assertions: saved.assertions,
          metadata: saved.metadata
        },
        isDirty: false,
        mode: 'list'
      }));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save module type');
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.formData, validateForm]);

  const deleteModuleType = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const success = await moduleTypeEditorService.deleteModuleType(id);
      
      if (success) {
        setModuleTypes(prev => prev.filter(type => type.id !== id));
        
        if (state.selectedType?.id === id) {
          setState(prev => ({
            ...prev,
            selectedType: null,
            formData: { ...initialFormData },
            isDirty: false,
            mode: 'list'
          }));
        }
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete module type');
      return false;
    } finally {
      setLoading(false);
    }
  }, [state.selectedType]);

  const duplicateModuleType = useCallback((type: ModuleType) => {
    const duplicated = {
      ...type,
      id: `${type.id}-copy-${Date.now()}`,
      name: `${type.name} (Copy)`,
      metadata: {
        ...type.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    setState(prev => ({
      ...prev,
      selectedType: null,
      formData: duplicated,
      mode: 'create',
      isDirty: true,
      validationErrors: []
    }));
  }, []);

  const importModuleTypes = useCallback(async (types: ModuleType[]): Promise<boolean> => {
    try {
      setLoading(true);
      const imported = await moduleTypeEditorService.importModuleTypes(types);
      setModuleTypes(prev => [...prev, ...imported]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import module types');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportModuleTypes = useCallback(async (ids: string[]): Promise<void> => {
    try {
      const exported = await moduleTypeEditorService.exportModuleTypes(ids);
      
      // Create download
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `module-types-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export module types');
    }
  }, []);

  return {
    // State
    ...state,
    moduleTypes,
    filteredModuleTypes,
    loading,
    error,

    // Actions
    setMode,
    setActiveTab,
    selectType,
    updateFormData,
    setSearchQuery,
    validateForm,
    testDiscoveryPatterns,
    resetForm,
    saveModuleType,
    deleteModuleType,
    duplicateModuleType,
    importModuleTypes,
    exportModuleTypes
  };
};