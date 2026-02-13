/**
 * ModuleExplorer Simple Tests
 * 
 * Focused unit tests for the Module Explorer component that avoid complex selector issues.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { ModuleExplorer } from './ModuleExplorer';
import * as useModulesModule from '../domain/useModules';
import * as stories from './ModuleExplorer.stories';

// Mock the useModules hook
vi.mock('../domain/useModules', () => ({
  useModules: vi.fn()
}));

// Compose all stories for testing
const composedStories = composeStories(stories);
const { Default, Loading, Empty, WithError } = composedStories;

const defaultMockUseModules = {
  moduleTypes: [
    { id: 'pages-v1', name: 'Pages (Versioned)', version: '1.0.0', assertions: [] },
    { id: 'organisms-v1', name: 'Organisms (Versioned)', version: '1.0.0', assertions: [] }
  ],
  modules: [],
  selectedType: 'pages-v1',
  selectedModule: null,
  loading: false,
  error: null,
  filters: {
    status: 'all' as const,
    search: '',
    tags: []
  },
  assertions: {
    running: false,
    results: [],
    selectedAssertions: []
  },
  selectModuleType: vi.fn(),
  selectModule: vi.fn(),
  validateModule: vi.fn(),
  runAllAssertions: vi.fn(),
  setFilter: vi.fn(),
  refreshData: vi.fn(),
  filteredModules: [],
  moduleMetrics: {
    total: 0,
    valid: 0,
    invalid: 0,
    warnings: 0,
    unchecked: 0
  },
  discoverModules: vi.fn(),
  generateModule: vi.fn()
};

describe('ModuleExplorer - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useModulesModule.useModules as any).mockReturnValue(defaultMockUseModules);
  });

  describe('Basic Rendering', () => {
    it('renders the module explorer header', () => {
      render(<ModuleExplorer />);
      expect(screen.getByText('Module Explorer')).toBeInTheDocument();
    });

    it('renders module type selector', () => {
      render(<ModuleExplorer />);
      expect(screen.getByText('Select module type...')).toBeInTheDocument();
      // Check for the text using partial match since it's split across elements
      expect(screen.getByText(/Pages.*Versioned/)).toBeInTheDocument();
    });

    it('renders view toggle buttons', () => {
      render(<ModuleExplorer />);
      expect(screen.getByText('Tree')).toBeInTheDocument();
      expect(screen.getByText('Grid')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<ModuleExplorer />);
      expect(screen.getByText('Run All')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(<ModuleExplorer />);
      expect(screen.getByPlaceholderText('Search modules...')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('displays loading state', () => {
      const mockLoading = {
        ...defaultMockUseModules,
        loading: true
      };
      (useModulesModule.useModules as any).mockReturnValue(mockLoading);
      
      render(<ModuleExplorer />);
      expect(screen.getByText('Loading modules...')).toBeInTheDocument();
    });

    it('displays error state', () => {
      const mockWithError = {
        ...defaultMockUseModules,
        error: 'Test error message'
      };
      (useModulesModule.useModules as any).mockReturnValue(mockWithError);
      
      render(<ModuleExplorer />);
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('displays empty state message', () => {
      const mockEmpty = {
        ...defaultMockUseModules,
        selectedType: null,
        filteredModules: []
      };
      (useModulesModule.useModules as any).mockReturnValue(mockEmpty);
      
      render(<ModuleExplorer />);
      expect(screen.getByText('Select a module type')).toBeInTheDocument();
    });
  });

  describe('Module Display', () => {
    it('displays modules when available', () => {
      const mockWithModules = {
        ...defaultMockUseModules,
        filteredModules: [
          {
            id: 'page-test',
            typeId: 'pages-v1',
            name: 'TestPage',
            path: 'test/path',
            validation: { status: 'valid' as const, assertions: [], errors: [], warnings: [], lastChecked: '' },
            discovery: { files: [], folders: [], dependencies: [], discoveredAt: '' },
            metrics: { linesOfCode: 100, complexity: 5, testCoverage: 90, lastModified: '', contributors: [] }
          }
        ]
      };
      (useModulesModule.useModules as any).mockReturnValue(mockWithModules);
      
      render(<ModuleExplorer />);
      expect(screen.getByText('TestPage')).toBeInTheDocument();
    });

    it('displays module details when selected', () => {
      const mockWithSelected = {
        ...defaultMockUseModules,
        selectedModule: 'page-test',
        filteredModules: [
          {
            id: 'page-test',
            typeId: 'pages-v1',
            name: 'TestPage',
            path: 'test/path',
            validation: { status: 'valid' as const, assertions: [], errors: [], warnings: [], lastChecked: '' },
            discovery: {
              files: [
                {
                  path: 'TestPage.tsx',
                  relativePath: 'TestPage.tsx',
                  size: 1000,
                  lastModified: '',
                  type: 'required' as const
                }
              ],
              folders: ['ui'],
              dependencies: [],
              discoveredAt: ''
            },
            metrics: { linesOfCode: 100, complexity: 5, testCoverage: 90, lastModified: '', contributors: [] }
          }
        ]
      };
      (useModulesModule.useModules as any).mockReturnValue(mockWithSelected);
      
      render(<ModuleExplorer />);
      expect(screen.getByText('File Structure')).toBeInTheDocument();
      expect(screen.getByText('TestPage.tsx')).toBeInTheDocument();
    });
  });

  describe('Story Tests - Portable Stories', () => {
    it('Default story renders without errors', () => {
      render(<Default />);
      expect(screen.getByText('Module Explorer')).toBeInTheDocument();
    });

    it('Loading story renders without errors', () => {
      render(<Loading />);
      expect(screen.getByText('Module Explorer')).toBeInTheDocument();
    });

    it('Empty story renders without errors', () => {
      render(<Empty />);
      expect(screen.getByText('Module Explorer')).toBeInTheDocument();
    });

    it('WithError story renders without errors', () => {
      render(<WithError />);
      expect(screen.getByText('Module Explorer')).toBeInTheDocument();
    });

    it('all stories render without errors', () => {
      Object.entries(composedStories).forEach(([name, Story]) => {
        const { unmount } = render(<Story />);
        expect(screen.getByText('Module Explorer')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Metrics Display', () => {
    it('renders metrics labels', () => {
      render(<ModuleExplorer />);
      // These labels should be unique in the metrics section
      expect(screen.getByText('Total')).toBeInTheDocument();
      // "Unchecked" appears in both metrics and dropdown, so use getAllByText
      const uncheckedElements = screen.getAllByText('Unchecked');
      expect(uncheckedElements.length).toBeGreaterThan(0);
    });
  });
});