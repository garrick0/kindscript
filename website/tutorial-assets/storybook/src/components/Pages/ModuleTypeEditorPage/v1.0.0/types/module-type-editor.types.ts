/**
 * ModuleTypeEditorPage Types
 * 
 * Type definitions for the module type editor page and its functionality.
 */

import type { ModuleType, DiscoveryPattern, StructureDefinition, AssertionDefinition } from '../../MigrationsPage/v1.0.0/types/module.types';

import type { ModuleTypeEditorService } from '../data/module-type-editor.service';

export interface ModuleTypeEditorPageProps {
  className?: string;
  initialModuleTypeId?: string;
  service?: ModuleTypeEditorService;
}

export type EditorMode = 'list' | 'create' | 'edit' | 'view';
export type EditorTab = 'basic' | 'discovery' | 'structure' | 'assertions' | 'templates' | 'validation';

export interface ModuleTypeFormData {
  id: string;
  name: string;
  description: string;
  version: string;
  discovery: DiscoveryPattern;
  structure: StructureDefinition;
  assertions: AssertionDefinition[];
  metadata: {
    author: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    documentation: string;
  };
}

export interface ModuleTypeEditorState {
  mode: EditorMode;
  activeTab: EditorTab;
  selectedType: ModuleType | null;
  formData: ModuleTypeFormData;
  searchQuery: string;
  validationErrors: string[];
  discoveryPreview: string[];
  isValidating: boolean;
  isDirty: boolean;
}

export interface ModuleTypeEditorActions {
  setMode: (mode: EditorMode) => void;
  setActiveTab: (tab: EditorTab) => void;
  selectType: (type: ModuleType | null) => void;
  updateFormData: (data: Partial<ModuleTypeFormData>) => void;
  setSearchQuery: (query: string) => void;
  validateForm: () => string[];
  testDiscoveryPatterns: () => Promise<void>;
  resetForm: () => void;
  saveModuleType: () => Promise<boolean>;
  deleteModuleType: (id: string) => Promise<boolean>;
  duplicateModuleType: (type: ModuleType) => void;
  importModuleTypes: (types: ModuleType[]) => Promise<boolean>;
  exportModuleTypes: (ids: string[]) => Promise<void>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DiscoveryTestResult {
  matches: string[];
  total: number;
  executionTime: number;
  errors: string[];
}

export interface AssertionTestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  executionTime: number;
}

export const initialFormData: ModuleTypeFormData = {
  id: '',
  name: '',
  description: '',
  version: '1.0.0',
  discovery: {
    basePattern: '',
    instancePattern: '',
    filePatterns: {
      required: [],
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
    author: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    documentation: ''
  }
};