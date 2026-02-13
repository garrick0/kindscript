/**
 * useModules Hook
 * 
 * React hook for managing module discovery, validation, and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { ModuleService } from '../data/module.service';
import type {
  ModuleType,
  ModuleInstance,
  ModuleStatus,
  AssertionResult,
  ModuleExplorerState
} from '../types/module.types';

export interface UseModulesReturn {
  // State
  moduleTypes: ModuleType[];
  modules: ModuleInstance[];
  selectedType: string | null;
  selectedModule: string | null;
  loading: boolean;
  error: string | null;
  
  // Filters
  filters: {
    status: ModuleStatus | 'all';
    search: string;
    tags: string[];
  };
  
  // Assertions
  assertions: {
    running: boolean;
    results: AssertionResult[];
    selectedAssertions: string[];
  };
  
  // Actions
  selectModuleType: (typeId: string | null) => void;
  selectModule: (moduleId: string | null) => void;
  discoverModules: (typeId: string, force?: boolean) => Promise<void>;
  validateModule: (moduleId: string, assertions?: string[]) => Promise<void>;
  runAllAssertions: (typeId: string) => Promise<void>;
  generateModule: (typeId: string, name: string, variables?: Record<string, any>) => Promise<void>;
  setFilter: (key: keyof ModuleExplorerState['filters'], value: any) => void;
  refreshData: () => Promise<void>;
  
  // Computed
  filteredModules: ModuleInstance[];
  moduleMetrics: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
    unchecked: number;
  };
}

export function useModules(): UseModulesReturn {
  const [state, setState] = useState<ModuleExplorerState>({
    selectedType: null,
    selectedModule: null,
    moduleTypes: [],
    modules: [],
    loading: false,
    error: null,
    filters: {
      status: 'all',
      search: '',
      tags: []
    },
    assertions: {
      running: false,
      results: [],
      selectedAssertions: []
    }
  });

  const moduleService = ModuleService.getInstance();

  /**
   * Load module types on mount
   */
  useEffect(() => {
    loadModuleTypes();
  }, []);

  /**
   * Load module types
   */
  const loadModuleTypes = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const types = await moduleService.getModuleTypes();
      setState(prev => ({ 
        ...prev, 
        moduleTypes: types,
        loading: false,
        // Auto-select first type if none selected
        selectedType: prev.selectedType || (types[0]?.id || null)
      }));
      
      // If a type is selected, discover its modules
      if (types[0]?.id) {
        await discoverModules(types[0].id);
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load module types',
        loading: false 
      }));
    }
  }, []);

  /**
   * Select a module type
   */
  const selectModuleType = useCallback(async (typeId: string | null) => {
    setState(prev => ({ ...prev, selectedType: typeId, selectedModule: null }));
    
    if (typeId) {
      await discoverModules(typeId);
    }
  }, []);

  /**
   * Select a module
   */
  const selectModule = useCallback((moduleId: string | null) => {
    setState(prev => ({ ...prev, selectedModule: moduleId }));
  }, []);

  /**
   * Discover modules of a specific type
   */
  const discoverModules = useCallback(async (typeId: string, force: boolean = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await moduleService.discoverModules({
        typeId,
        force
      });
      
      if (response.errors.length > 0) {
        setState(prev => ({ 
          ...prev, 
          error: response.errors.join(', '),
          loading: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          modules: response.discovered,
          loading: false 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to discover modules',
        loading: false 
      }));
    }
  }, []);

  /**
   * Validate a module
   */
  const validateModule = useCallback(async (moduleId: string, assertions?: string[]) => {
    setState(prev => ({ 
      ...prev, 
      assertions: { ...prev.assertions, running: true }
    }));
    
    try {
      const response = await moduleService.validateModule({
        moduleId,
        assertions,
        autoFix: false
      });
      
      setState(prev => ({ 
        ...prev, 
        assertions: {
          ...prev.assertions,
          running: false,
          results: response.results
        }
      }));
      
      // Refresh module to get updated validation status
      const updatedModule = await moduleService.getModule(moduleId);
      if (updatedModule) {
        setState(prev => ({
          ...prev,
          modules: prev.modules.map(m => 
            m.id === moduleId ? updatedModule : m
          )
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to validate module',
        assertions: { ...prev.assertions, running: false }
      }));
    }
  }, []);

  /**
   * Run all assertions for a module type
   */
  const runAllAssertions = useCallback(async (typeId: string) => {
    setState(prev => ({ 
      ...prev, 
      assertions: { ...prev.assertions, running: true }
    }));
    
    try {
      const results = await moduleService.runAssertions(typeId);
      
      // Flatten results
      const allResults: AssertionResult[] = [];
      results.forEach(moduleResults => {
        allResults.push(...moduleResults);
      });
      
      setState(prev => ({ 
        ...prev, 
        assertions: {
          ...prev.assertions,
          running: false,
          results: allResults
        }
      }));
      
      // Refresh modules to get updated validation status
      await discoverModules(typeId, true);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to run assertions',
        assertions: { ...prev.assertions, running: false }
      }));
    }
  }, [discoverModules]);

  /**
   * Generate a new module from template
   */
  const generateModule = useCallback(async (
    typeId: string, 
    name: string, 
    variables?: Record<string, any>
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await moduleService.generateModule(typeId, name, variables);
      
      // Refresh modules
      await discoverModules(typeId, true);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to generate module',
        loading: false 
      }));
    }
  }, [discoverModules]);

  /**
   * Set filter
   */
  const setFilter = useCallback((
    key: keyof ModuleExplorerState['filters'], 
    value: any
  ) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value
      }
    }));
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await loadModuleTypes();
    if (state.selectedType) {
      await discoverModules(state.selectedType, true);
    }
  }, [loadModuleTypes, discoverModules, state.selectedType]);

  /**
   * Filter modules based on current filters
   */
  const filteredModules = state.modules.filter(module => {
    // Status filter
    if (state.filters.status !== 'all' && module.validation.status !== state.filters.status) {
      return false;
    }
    
    // Search filter
    if (state.filters.search) {
      const searchLower = state.filters.search.toLowerCase();
      if (!module.name.toLowerCase().includes(searchLower) &&
          !module.path.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Tag filter (if module type has tags)
    if (state.filters.tags.length > 0) {
      const moduleType = state.moduleTypes.find(t => t.id === module.typeId);
      if (moduleType) {
        const hasMatchingTag = state.filters.tags.some(tag => 
          moduleType.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
    }
    
    return true;
  });

  /**
   * Calculate module metrics
   */
  const moduleMetrics = {
    total: state.modules.length,
    valid: state.modules.filter(m => m.validation.status === 'valid').length,
    invalid: state.modules.filter(m => m.validation.status === 'invalid').length,
    warnings: state.modules.filter(m => m.validation.status === 'warning').length,
    unchecked: state.modules.filter(m => m.validation.status === 'unchecked').length
  };

  return {
    // State
    moduleTypes: state.moduleTypes,
    modules: state.modules,
    selectedType: state.selectedType,
    selectedModule: state.selectedModule,
    loading: state.loading,
    error: state.error,
    
    // Filters
    filters: state.filters,
    
    // Assertions
    assertions: state.assertions,
    
    // Actions
    selectModuleType,
    selectModule,
    discoverModules,
    validateModule,
    runAllAssertions,
    generateModule,
    setFilter,
    refreshData,
    
    // Computed
    filteredModules,
    moduleMetrics
  };
}