/**
 * Module System Types
 * 
 * Type definitions for the module management system that allows
 * reasoning about and validating contained pieces of functionality.
 */

export type ModuleStatus = 'valid' | 'invalid' | 'warning' | 'unchecked';
export type AssertionType = 'eslint' | 'test' | 'structure' | 'dependency' | 'custom';
export type AssertionSeverity = 'error' | 'warning' | 'info';
export type AssertionStatus = 'passed' | 'failed' | 'skipped' | 'error';
export type ExecutionTrigger = 'change' | 'save' | 'commit' | 'manual';

/**
 * Module Type Definition
 * Defines a template for discovering and validating modules
 */
export interface ModuleType {
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Pattern matching for discovery
  discovery: {
    basePattern: string;        // Base path pattern
    instancePattern: string;     // Instance identification pattern
    filePatterns: {
      required: string[];        // Files that must exist
      optional: string[];        // Files that may exist
      forbidden: string[];       // Files that should not exist
    };
  };
  
  // Module structure specification
  structure: {
    folders: ModuleFolderSpec[];
    files: ModuleFileSpec[];
    dependencies: ModuleDependencySpec[];
  };
  
  // Validation and assertions
  assertions: ModuleAssertion[];
  
  // Generation template
  template?: ModuleTemplate;
  
  // Metadata
  metadata: {
    author: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    documentation?: string;
  };
}

export interface ModuleFolderSpec {
  path: string;
  required: boolean;
  description: string;
  children?: ModuleFolderSpec[];
}

export interface ModuleFileSpec {
  path: string;
  required: boolean;
  template?: string;
  validation?: {
    schema?: string;
    eslintRules?: string[];
    customValidator?: string;
  };
}

export interface ModuleDependencySpec {
  type: 'internal' | 'external' | 'peer';
  pattern: string;
  required: boolean;
  version?: string;
}

/**
 * Module Instance
 * Represents a discovered module instance
 */
export interface ModuleInstance {
  id: string;
  typeId: string;
  path: string;
  name: string;
  version?: string;
  
  // Discovery results
  discovery: {
    discoveredAt: string;
    files: DiscoveredFile[];
    folders: string[];
    dependencies: DiscoveredDependency[];
  };
  
  // Validation status
  validation: {
    lastChecked: string;
    status: ModuleStatus;
    assertions: AssertionResult[];
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
  
  // Metrics
  metrics: {
    linesOfCode: number;
    complexity: number;
    testCoverage?: number;
    lastModified: string;
    contributors: string[];
  };
  
  // AI-relevant metadata
  aiContext?: {
    purpose: string;
    capabilities: string[];
    limitations: string[];
    examples: string[];
  };
}

export interface DiscoveredFile {
  path: string;
  relativePath: string;
  size: number;
  lastModified: string;
  hash?: string;
  type: 'required' | 'optional' | 'extra';
  validation?: {
    status: 'valid' | 'invalid' | 'warning';
    messages: string[];
  };
}

export interface DiscoveredDependency {
  module: string;
  type: 'internal' | 'external';
  version?: string;
  resolved: boolean;
}

/**
 * Module Assertions
 * Validation rules for modules
 */
export interface ModuleAssertion {
  id: string;
  name: string;
  description: string;
  type: AssertionType;
  
  // Assertion configuration
  config: {
    eslint?: {
      rules: Record<string, any>;
      extends?: string[];
      plugins?: string[];
    };
    test?: {
      runner: 'vitest' | 'jest' | 'custom';
      pattern: string;
      coverage?: {
        threshold: number;
        type: 'lines' | 'branches' | 'functions' | 'statements';
      };
    };
    structure?: {
      requiredFiles: string[];
      requiredFolders: string[];
      maxDepth?: number;
      namingConvention?: string;
    };
    dependency?: {
      allowed: string[];
      forbidden: string[];
      maxCount?: number;
    };
    custom?: {
      script: string;
      args: string[];
      expectedOutput?: string;
    };
  };
  
  // Execution settings
  execution: {
    runOn: ExecutionTrigger;
    timeout: number;
    cache: boolean;
    parallel: boolean;
  };
  
  // Severity and actions
  severity: AssertionSeverity;
  autoFix?: boolean;
  fixScript?: string;
}

export interface AssertionResult {
  assertionId: string;
  assertionName: string;
  status: AssertionStatus;
  executedAt: string;
  duration: number;
  details: {
    filesChecked: number;
    filesPassed: number;
    filesFailed: number;
    failures: AssertionFailure[];
  };
}

export interface AssertionFailure {
  file: string;
  line?: number;
  column?: number;
  rule: string;
  message: string;
  severity: AssertionSeverity;
  fixable: boolean;
  fix?: {
    range: [number, number];
    text: string;
  };
}

export interface ValidationError {
  file: string;
  message: string;
  code?: string;
  severity: 'error';
}

export interface ValidationWarning {
  file: string;
  message: string;
  code?: string;
  severity: 'warning';
}

/**
 * Module Template
 * Template for generating new modules
 */
export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  files: TemplateFile[];
  variables?: TemplateVariable[];
}

export interface TemplateFile {
  path: string;
  template: string;
  condition?: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'select';
  required: boolean;
  default?: any;
  options?: any[];
  description?: string;
}

/**
 * Module Explorer State
 */
export interface ModuleExplorerState {
  selectedType: string | null;
  selectedModule: string | null;
  moduleTypes: ModuleType[];
  modules: ModuleInstance[];
  loading: boolean;
  error: string | null;
  filters: {
    status: ModuleStatus | 'all';
    search: string;
    tags: string[];
  };
  assertions: {
    running: boolean;
    results: AssertionResult[];
    selectedAssertions: string[];
  };
}

/**
 * Module Discovery Request/Response
 */
export interface ModuleDiscoveryRequest {
  typeId: string;
  basePath?: string;
  force?: boolean;
}

export interface ModuleDiscoveryResponse {
  typeId: string;
  discovered: ModuleInstance[];
  errors: string[];
  duration: number;
}

/**
 * Module Validation Request/Response
 */
export interface ModuleValidationRequest {
  moduleId: string;
  assertions?: string[];
  autoFix?: boolean;
}

export interface ModuleValidationResponse {
  moduleId: string;
  status: ModuleStatus;
  results: AssertionResult[];
  fixed: number;
  duration: number;
}