/**
 * useModules Hook Tests
 * 
 * Unit tests for the useModules hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useModules } from './useModules';
import { ModuleService } from '../data/module.service';

// Mock the ModuleService
vi.mock('../data/module.service', () => ({
  ModuleService: {
    getInstance: vi.fn(() => ({
      getModuleTypes: vi.fn(),
      discoverModules: vi.fn(),
      getModule: vi.fn(),
      validateModule: vi.fn(),
      runAssertions: vi.fn(),
      generateModule: vi.fn()
    }))
  }
}));

const mockModuleService = {
  getModuleTypes: vi.fn(),
  discoverModules: vi.fn(),
  getModule: vi.fn(),
  validateModule: vi.fn(),
  runAssertions: vi.fn(),
  generateModule: vi.fn()
};

describe('useModules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ModuleService.getInstance as any).mockReturnValue(mockModuleService);
    
    // Default mock implementations
    mockModuleService.getModuleTypes.mockResolvedValue([
      {
        id: 'pages-v1',
        name: 'Pages (Versioned)',
        version: '1.0.0',
        assertions: []
      },
      {
        id: 'organisms-v1',
        name: 'Organisms (Versioned)',
        version: '1.0.0',
        assertions: []
      }
    ]);
    
    mockModuleService.discoverModules.mockResolvedValue({
      typeId: 'pages-v1',
      discovered: [
        {
          id: 'page-dashboard',
          typeId: 'pages-v1',
          name: 'DashboardPage',
          path: 'apps/storybook/src/components/Pages/DashboardPage/v1.0.0',
          validation: { status: 'valid', assertions: [], errors: [], warnings: [], lastChecked: '' },
          discovery: { files: [], folders: [], dependencies: [], discoveredAt: '' },
          metrics: { linesOfCode: 500, complexity: 10, testCoverage: 85, lastModified: '', contributors: [] }
        }
      ],
      errors: [],
      duration: 100
    });
  });

  it('initializes with default state', async () => {
    const { result } = renderHook(() => useModules());
    
    expect(result.current.moduleTypes).toEqual([]);
    expect(result.current.modules).toEqual([]);
    expect(result.current.selectedType).toBeNull();
    expect(result.current.selectedModule).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads module types on mount', async () => {
    const { result } = renderHook(() => useModules());
    
    await waitFor(() => {
      expect(mockModuleService.getModuleTypes).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(result.current.moduleTypes.length).toBeGreaterThan(0);
    });
    
    expect(result.current.moduleTypes).toEqual([
      {
        id: 'pages-v1',
        name: 'Pages (Versioned)',
        version: '1.0.0',
        assertions: []
      },
      {
        id: 'organisms-v1',
        name: 'Organisms (Versioned)',
        version: '1.0.0',
        assertions: []
      }
    ]);
  });

  it('auto-selects first module type and discovers modules', async () => {
    const { result } = renderHook(() => useModules());
    
    await waitFor(() => {
      expect(result.current.selectedType).toBe('pages-v1');
    });
    
    await waitFor(() => {
      expect(mockModuleService.discoverModules).toHaveBeenCalledWith({
        typeId: 'pages-v1',
        force: undefined
      });
    });
    
    await waitFor(() => {
      expect(result.current.modules.length).toBe(1);
    });
  });

  it('handles module type selection', async () => {
    const { result } = renderHook(() => useModules());
    
    await waitFor(() => {
      expect(result.current.moduleTypes.length).toBeGreaterThan(0);
    });
    
    act(() => {
      result.current.selectModuleType('organisms-v1');
    });
    
    expect(result.current.selectedType).toBe('organisms-v1');
    expect(result.current.selectedModule).toBeNull();
    
    await waitFor(() => {
      expect(mockModuleService.discoverModules).toHaveBeenCalledWith({
        typeId: 'organisms-v1',
        force: undefined
      });
    });
  });

  it('handles module selection', async () => {
    const { result } = renderHook(() => useModules());
    
    act(() => {
      result.current.selectModule('page-dashboard');
    });
    
    expect(result.current.selectedModule).toBe('page-dashboard');
  });

  it('discovers modules with force option', async () => {
    const { result } = renderHook(() => useModules());
    
    await waitFor(() => {
      expect(result.current.moduleTypes.length).toBeGreaterThan(0);
    });
    
    await act(async () => {
      await result.current.discoverModules('pages-v1', true);
    });
    
    expect(mockModuleService.discoverModules).toHaveBeenCalledWith({
      typeId: 'pages-v1',
      force: true
    });
  });

  it('handles discovery errors', async () => {
    mockModuleService.discoverModules.mockResolvedValue({
      typeId: 'pages-v1',
      discovered: [],
      errors: ['Permission denied'],
      duration: 50
    });
    
    const { result } = renderHook(() => useModules());
    
    await waitFor(() => {
      expect(result.current.error).toBe('Permission denied');
    });
  });

  it('validates a module', async () => {
    mockModuleService.validateModule.mockResolvedValue({
      moduleId: 'page-dashboard',
      status: 'valid',
      results: [
        {
          assertionId: 'eslint',
          assertionName: 'ESLint Check',
          status: 'passed',
          executedAt: '',
          duration: 100,
          details: {
            filesChecked: 5,
            filesPassed: 5,
            filesFailed: 0,
            failures: []
          }
        }
      ],
      fixed: 0,
      duration: 200
    });
    
    const { result } = renderHook(() => useModules());
    
    await act(async () => {
      await result.current.validateModule('page-dashboard');
    });
    
    expect(mockModuleService.validateModule).toHaveBeenCalledWith({
      moduleId: 'page-dashboard',
      assertions: undefined,
      autoFix: false
    });
    
    await waitFor(() => {
      expect(result.current.assertions.results).toHaveLength(1);
    });
  });

  it('runs all assertions for a module type', async () => {
    mockModuleService.runAssertions.mockResolvedValue(new Map([
      ['page-dashboard', [
        {
          assertionId: 'structure',
          assertionName: 'Structure Check',
          status: 'passed',
          executedAt: '',
          duration: 50,
          details: {
            filesChecked: 3,
            filesPassed: 3,
            filesFailed: 0,
            failures: []
          }
        }
      ]]
    ]));
    
    const { result } = renderHook(() => useModules());
    
    await act(async () => {
      await result.current.runAllAssertions('pages-v1');
    });
    
    expect(mockModuleService.runAssertions).toHaveBeenCalledWith('pages-v1');
  });

  it('generates a new module', async () => {
    mockModuleService.generateModule.mockResolvedValue({
      id: 'pages-v1-newpage',
      typeId: 'pages-v1',
      name: 'NewPage',
      path: 'generated/NewPage',
      validation: { status: 'unchecked', assertions: [], errors: [], warnings: [], lastChecked: '' },
      discovery: { files: [], folders: [], dependencies: [], discoveredAt: '' },
      metrics: { linesOfCode: 0, complexity: 0, lastModified: '', contributors: [] }
    });
    
    const { result } = renderHook(() => useModules());
    
    await act(async () => {
      await result.current.generateModule('pages-v1', 'NewPage', { test: true });
    });
    
    expect(mockModuleService.generateModule).toHaveBeenCalledWith('pages-v1', 'NewPage', { test: true });
  });

  it('filters modules by status', async () => {
    const { result } = renderHook(() => useModules());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.modules.length).toBe(1);
    });
    
    // Set filter to 'invalid' - should filter out our 'valid' module
    act(() => {
      result.current.setFilter('status', 'invalid');
    });
    
    expect(result.current.filteredModules).toHaveLength(0);
    
    // Set filter to 'valid' - should show our module
    act(() => {
      result.current.setFilter('status', 'valid');
    });
    
    expect(result.current.filteredModules).toHaveLength(1);
  });

  it('filters modules by search', async () => {
    const { result } = renderHook(() => useModules());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.modules.length).toBe(1);
    });
    
    // Search for 'Dashboard' - should find our module
    act(() => {
      result.current.setFilter('search', 'Dashboard');
    });
    
    expect(result.current.filteredModules).toHaveLength(1);
    
    // Search for 'NonExistent' - should not find any modules
    act(() => {
      result.current.setFilter('search', 'NonExistent');
    });
    
    expect(result.current.filteredModules).toHaveLength(0);
  });

  it('calculates module metrics correctly', async () => {
    // Mock multiple modules with different statuses
    mockModuleService.discoverModules.mockResolvedValue({
      typeId: 'pages-v1',
      discovered: [
        {
          id: 'page-1',
          typeId: 'pages-v1',
          name: 'Page1',
          path: 'path1',
          validation: { status: 'valid', assertions: [], errors: [], warnings: [], lastChecked: '' },
          discovery: { files: [], folders: [], dependencies: [], discoveredAt: '' },
          metrics: { linesOfCode: 100, complexity: 5, lastModified: '', contributors: [] }
        },
        {
          id: 'page-2',
          typeId: 'pages-v1',
          name: 'Page2',
          path: 'path2',
          validation: { status: 'invalid', assertions: [], errors: [], warnings: [], lastChecked: '' },
          discovery: { files: [], folders: [], dependencies: [], discoveredAt: '' },
          metrics: { linesOfCode: 200, complexity: 8, lastModified: '', contributors: [] }
        },
        {
          id: 'page-3',
          typeId: 'pages-v1',
          name: 'Page3',
          path: 'path3',
          validation: { status: 'warning', assertions: [], errors: [], warnings: [], lastChecked: '' },
          discovery: { files: [], folders: [], dependencies: [], discoveredAt: '' },
          metrics: { linesOfCode: 150, complexity: 6, lastModified: '', contributors: [] }
        }
      ],
      errors: [],
      duration: 100
    });
    
    const { result } = renderHook(() => useModules());
    
    await waitFor(() => {
      expect(result.current.moduleMetrics.total).toBe(3);
      expect(result.current.moduleMetrics.valid).toBe(1);
      expect(result.current.moduleMetrics.invalid).toBe(1);
      expect(result.current.moduleMetrics.warnings).toBe(1);
      expect(result.current.moduleMetrics.unchecked).toBe(0);
    });
  });

  it('handles service errors gracefully', async () => {
    mockModuleService.getModuleTypes.mockRejectedValue(new Error('Service unavailable'));
    
    const { result } = renderHook(() => useModules());
    
    await waitFor(() => {
      expect(result.current.error).toBe('Service unavailable');
    });
  });

  it('refreshes data correctly', async () => {
    const { result } = renderHook(() => useModules());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.moduleTypes.length).toBeGreaterThan(0);
    });
    
    // Clear mock calls
    vi.clearAllMocks();
    
    await act(async () => {
      await result.current.refreshData();
    });
    
    expect(mockModuleService.getModuleTypes).toHaveBeenCalled();
  });
});