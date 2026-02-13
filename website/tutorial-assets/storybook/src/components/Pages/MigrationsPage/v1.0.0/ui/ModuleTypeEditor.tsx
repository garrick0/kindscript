/**
 * ModuleTypeEditor Component
 * 
 * Interface for creating, editing, and managing module type definitions.
 * Supports all CRUD operations with validation and preview functionality.
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Save,
  X,
  Trash2,
  Copy,
  AlertCircle,
  CheckCircle,
  Settings,
  Code,
  FileText,
  Folder,
  Search,
  TestTube,
  Download,
  Upload,
  Eye,
  Play,
  ChevronRight,
  ChevronDown,
  Info,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../../../atoms/Button/v1.0.0/Button';
import { Card } from '../../../../molecules/Card/v1.0.0/Card';
import { Badge } from '../../../../atoms/Badge/v1.0.0/Badge';
import { Input } from '../../../../atoms/Input/v1.0.0/Input';
import { Alert, AlertDescription } from '../../../../molecules/Alert/v1.0.0/Alert';
import { cn } from '../../../../../utils/cn';
import type { ModuleType, DiscoveryPattern, StructureDefinition, AssertionDefinition } from '../types/module.types';

export interface ModuleTypeEditorProps {
  className?: string;
  moduleTypes?: ModuleType[];
  onSave?: (moduleType: ModuleType) => void;
  onDelete?: (moduleTypeId: string) => void;
  onDuplicate?: (moduleType: ModuleType) => void;
  onImport?: (moduleTypes: ModuleType[]) => void;
  onExport?: (moduleTypeIds: string[]) => void;
}

type EditorMode = 'list' | 'create' | 'edit' | 'view';
type EditorTab = 'basic' | 'discovery' | 'structure' | 'assertions' | 'templates' | 'validation';

interface ModuleTypeFormData {
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

const initialFormData: ModuleTypeFormData = {
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

export const ModuleTypeEditor: React.FC<ModuleTypeEditorProps> = ({
  className,
  moduleTypes = [],
  onSave,
  onDelete,
  onDuplicate,
  onImport,
  onExport
}) => {
  const [mode, setMode] = useState<EditorMode>('list');
  const [activeTab, setActiveTab] = useState<EditorTab>('basic');
  const [selectedType, setSelectedType] = useState<ModuleType | null>(null);
  const [formData, setFormData] = useState<ModuleTypeFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [discoveryPreview, setDiscoveryPreview] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Filter module types based on search
  const filteredTypes = moduleTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Initialize form when editing
  useEffect(() => {
    if (mode === 'edit' && selectedType) {
      setFormData({
        id: selectedType.id,
        name: selectedType.name,
        description: selectedType.description,
        version: selectedType.version,
        discovery: selectedType.discovery,
        structure: selectedType.structure,
        assertions: selectedType.assertions,
        metadata: selectedType.metadata
      });
    } else if (mode === 'create') {
      setFormData({
        ...initialFormData,
        id: `module-type-${Date.now()}`,
        metadata: {
          ...initialFormData.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }
  }, [mode, selectedType]);

  // Validate form data
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.version.trim()) errors.push('Version is required');
    if (!formData.discovery.basePattern.trim()) errors.push('Base pattern is required');
    if (!formData.discovery.instancePattern.trim()) errors.push('Instance pattern is required');
    
    // Validate version format
    if (formData.version && !/^\d+\.\d+\.\d+$/.test(formData.version)) {
      errors.push('Version must be in format x.y.z');
    }
    
    // Validate discovery patterns
    try {
      if (formData.discovery.basePattern) {
        new RegExp(formData.discovery.basePattern);
      }
    } catch (e) {
      errors.push('Invalid base pattern regex');
    }
    
    return errors;
  };

  // Handle form submission
  const handleSave = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const moduleType: ModuleType = {
      ...formData,
      metadata: {
        ...formData.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    onSave?.(moduleType);
    setMode('list');
    setSelectedType(null);
    setValidationErrors([]);
  };

  // Handle delete with confirmation
  const handleDelete = (typeId: string) => {
    if (window.confirm('Are you sure you want to delete this module type? This action cannot be undone.')) {
      onDelete?.(typeId);
    }
  };

  // Handle duplicate
  const handleDuplicate = (type: ModuleType) => {
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
    onDuplicate?.(duplicated);
  };

  // Render validation errors
  const renderValidationErrors = () => {
    if (validationErrors.length === 0) return null;

    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-2">Please fix the following errors:</div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  // Render basic info tab
  const renderBasicTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Page Component"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Version *
          </label>
          <Input
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="e.g. 1.0.0"
            className="w-full"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the purpose and requirements of this module type..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Author
          </label>
          <Input
            value={formData.metadata.author}
            onChange={(e) => setFormData({ 
              ...formData, 
              metadata: { ...formData.metadata, author: e.target.value }
            })}
            placeholder="Your name"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Documentation URL
          </label>
          <Input
            value={formData.metadata.documentation}
            onChange={(e) => setFormData({ 
              ...formData, 
              metadata: { ...formData.metadata, documentation: e.target.value }
            })}
            placeholder="https://docs.example.com"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <Input
          value={formData.metadata.tags.join(', ')}
          onChange={(e) => setFormData({ 
            ...formData, 
            metadata: { 
              ...formData.metadata, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
            }
          })}
          placeholder="component, frontend, react"
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
      </div>
    </div>
  );

  // Handle discovery pattern testing
  const testDiscoveryPatterns = async () => {
    setIsValidating(true);
    try {
      // Simulate discovery pattern testing
      const mockMatches = [
        'src/components/Pages/HomePage/v1.0.0',
        'src/components/Pages/DashboardPage/v1.0.0',
        'src/components/Pages/SettingsPage/v1.0.0',
        'src/components/Pages/AuthErrorPage/v1.0.0',
        'src/components/Pages/DocumentsPage/v1.0.0'
      ].filter(path => {
        const baseMatch = path.includes(formData.discovery.basePattern);
        const instanceMatch = formData.discovery.instancePattern === '*/v*' 
          ? path.match(/[^/]+\/v\d+\.\d+\.\d+$/)
          : true;
        return baseMatch && instanceMatch;
      });
      
      setDiscoveryPreview(mockMatches);
    } catch (error) {
      setDiscoveryPreview([]);
    } finally {
      setIsValidating(false);
    }
  };

  // Render discovery patterns tab
  const renderDiscoveryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base Pattern *
            </label>
            <Input
              value={formData.discovery.basePattern}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  discovery: { ...formData.discovery, basePattern: e.target.value }
                });
                setDiscoveryPreview([]); // Clear preview when pattern changes
              }}
              placeholder="src/components/Pages"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Base directory pattern where modules are located</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instance Pattern *
            </label>
            <Input
              value={formData.discovery.instancePattern}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  discovery: { ...formData.discovery, instancePattern: e.target.value }
                });
                setDiscoveryPreview([]); // Clear preview when pattern changes
              }}
              placeholder="*/v*"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Pattern to identify module instances within the base</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={testDiscoveryPatterns}
              disabled={!formData.discovery.basePattern || !formData.discovery.instancePattern || isValidating}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isValidating ? 'Testing...' : 'Test Patterns'}
            </Button>
            {discoveryPreview.length > 0 && (
              <Badge variant="secondary">
                {discoveryPreview.length} matches found
              </Badge>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Discovery Preview
          </label>
          <div className="border border-gray-200 rounded-lg p-3 min-h-32 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
            {isValidating ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Testing discovery patterns...
              </div>
            ) : discoveryPreview.length > 0 ? (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Matching paths:
                </div>
                {discoveryPreview.map((path, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 px-2 py-1 rounded">
                    {path}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">
                Click "Test Patterns" to preview matching modules
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Required Files
          </label>
          <textarea
            value={formData.discovery.filePatterns.required.join('\n')}
            onChange={(e) => setFormData({
              ...formData,
              discovery: {
                ...formData.discovery,
                filePatterns: {
                  ...formData.discovery.filePatterns,
                  required: e.target.value.split('\n').filter(Boolean)
                }
              }
            })}
            placeholder="ui/PageName.tsx&#10;ui/PageName.stories.tsx&#10;domain/usePageName.ts"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Optional Files
          </label>
          <textarea
            value={formData.discovery.filePatterns.optional.join('\n')}
            onChange={(e) => setFormData({
              ...formData,
              discovery: {
                ...formData.discovery,
                filePatterns: {
                  ...formData.discovery.filePatterns,
                  optional: e.target.value.split('\n').filter(Boolean)
                }
              }
            })}
            placeholder="types/pagename.types.ts&#10;validation/pagename.validation.ts&#10;README.md"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Forbidden Files
          </label>
          <textarea
            value={formData.discovery.filePatterns.forbidden.join('\n')}
            onChange={(e) => setFormData({
              ...formData,
              discovery: {
                ...formData.discovery,
                filePatterns: {
                  ...formData.discovery.filePatterns,
                  forbidden: e.target.value.split('\n').filter(Boolean)
                }
              }
            })}
            placeholder="*.backup&#10;*.tmp&#10;*.old"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pattern Examples</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <code>src/components/Pages</code> + <code>*/v*</code> matches <code>src/components/Pages/HomePage/v1.0.0</code></li>
              <li>• Use <code>*</code> for wildcards and <code>**</code> for recursive matching</li>
              <li>• File patterns support glob syntax like <code>*.tsx</code> or <code>ui/*.stories.tsx</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Render structure requirements tab
  const renderStructureTab = () => (
    <div className="space-y-6">
      {/* Folder Requirements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Folder Requirements</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Define required and optional folder structure</p>
          </div>
          <Button
            onClick={() => {
              const newFolder = {
                path: '',
                required: true,
                description: ''
              };
              setFormData({
                ...formData,
                structure: {
                  ...formData.structure,
                  folders: [...formData.structure.folders, newFolder]
                }
              });
            }}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Folder
          </Button>
        </div>

        <div className="space-y-2">
          {formData.structure.folders.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <Folder className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No folder requirements defined</p>
            </div>
          ) : (
            formData.structure.folders.map((folder, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <Folder className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={folder.path}
                    onChange={(e) => {
                      const updated = [...formData.structure.folders];
                      updated[index] = { ...updated[index], path: e.target.value };
                      setFormData({
                        ...formData,
                        structure: { ...formData.structure, folders: updated }
                      });
                    }}
                    placeholder="ui"
                    className="text-sm"
                  />
                  <Input
                    value={folder.description}
                    onChange={(e) => {
                      const updated = [...formData.structure.folders];
                      updated[index] = { ...updated[index], description: e.target.value };
                      setFormData({
                        ...formData,
                        structure: { ...formData.structure, folders: updated }
                      });
                    }}
                    placeholder="User interface components"
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={folder.required}
                        onChange={(e) => {
                          const updated = [...formData.structure.folders];
                          updated[index] = { ...updated[index], required: e.target.checked };
                          setFormData({
                            ...formData,
                            structure: { ...formData.structure, folders: updated }
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                    <Button
                      onClick={() => {
                        const updated = formData.structure.folders.filter((_, i) => i !== index);
                        setFormData({
                          ...formData,
                          structure: { ...formData.structure, folders: updated }
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* File Requirements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">File Requirements</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Specify required files and their validation rules</p>
          </div>
          <Button
            onClick={() => {
              const newFile = {
                path: '',
                required: true,
                validation: {
                  schema: 'none'
                }
              };
              setFormData({
                ...formData,
                structure: {
                  ...formData.structure,
                  files: [...formData.structure.files, newFile]
                }
              });
            }}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add File
          </Button>
        </div>

        <div className="space-y-2">
          {formData.structure.files.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No file requirements defined</p>
            </div>
          ) : (
            formData.structure.files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    value={file.path}
                    onChange={(e) => {
                      const updated = [...formData.structure.files];
                      updated[index] = { ...updated[index], path: e.target.value };
                      setFormData({
                        ...formData,
                        structure: { ...formData.structure, files: updated }
                      });
                    }}
                    placeholder="ui/ComponentName.tsx"
                    className="text-sm"
                  />
                  <select
                    value={file.validation?.schema || 'none'}
                    onChange={(e) => {
                      const updated = [...formData.structure.files];
                      updated[index] = { 
                        ...updated[index], 
                        validation: { schema: e.target.value }
                      };
                      setFormData({
                        ...formData,
                        structure: { ...formData.structure, files: updated }
                      });
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded text-sm"
                  >
                    <option value="none">No validation</option>
                    <option value="react-component">React Component</option>
                    <option value="storybook-stories">Storybook Stories</option>
                    <option value="typescript">TypeScript</option>
                    <option value="test-file">Test File</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={file.required}
                        onChange={(e) => {
                          const updated = [...formData.structure.files];
                          updated[index] = { ...updated[index], required: e.target.checked };
                          setFormData({
                            ...formData,
                            structure: { ...formData.structure, files: updated }
                          });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                  </div>
                  <Button
                    onClick={() => {
                      const updated = formData.structure.files.filter((_, i) => i !== index);
                      setFormData({
                        ...formData,
                        structure: { ...formData.structure, files: updated }
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pages Structure Preset */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pages Structure Preset</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Apply the standard Pages structure based on your codebase analysis:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-4">
              <li>• Three required folders: ui/, domain/, data/</li>
              <li>• Required files: PageName.tsx, PageName.stories.tsx, usePageName.ts, pagename.queries.ts</li>
              <li>• Optional folders: types/, validation/, tests/</li>
              <li>• Metadata and dependencies configuration</li>
            </ul>
            <Button
              onClick={() => {
                setFormData({
                  ...formData,
                  structure: {
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
                    ],
                    dependencies: []
                  }
                });
              }}
              size="sm"
              variant="outline"
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              Apply Pages Structure
            </Button>
          </div>
        </div>
      </div>

      {/* Structure Preview */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Structure Preview</h4>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 font-mono text-sm">
          <div className="text-gray-700 dark:text-gray-300">
            ModuleName/v1.0.0/
            {formData.structure.folders.map((folder, index) => (
              <div key={index} className="ml-4 flex items-center gap-2">
                <span className="text-blue-600">├── {folder.path}/</span>
                {folder.required ? (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                )}
              </div>
            ))}
            {formData.structure.files.map((file, index) => (
              <div key={index} className="ml-4 flex items-center gap-2">
                <span className="text-green-600">├── {file.path}</span>
                {file.required ? (
                  <Badge variant="destructive" className="text-xs">Required</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                )}
                {file.validation?.schema && file.validation.schema !== 'none' && (
                  <Badge variant="outline" className="text-xs">{file.validation.schema}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render assertions configuration tab
  const renderAssertionsTab = () => (
    <div className="space-y-6">
      {/* Assertions List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Module Assertions</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configure validation rules and quality checks</p>
          </div>
          <Button
            onClick={() => {
              const newAssertion: AssertionDefinition = {
                id: `assertion-${Date.now()}`,
                name: '',
                description: '',
                type: 'eslint',
                config: {
                  eslint: {
                    rules: {}
                  }
                },
                execution: {
                  runOn: 'save',
                  timeout: 30000,
                  cache: true,
                  parallel: true
                },
                severity: 'warning'
              };
              setFormData({
                ...formData,
                assertions: [...formData.assertions, newAssertion]
              });
            }}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Assertion
          </Button>
        </div>

        <div className="space-y-4">
          {formData.assertions.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-4">No assertions configured</p>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => {
                    const eslintAssertion: AssertionDefinition = {
                      id: 'eslint-basic',
                      name: 'ESLint Basic Rules',
                      description: 'Basic code quality and style checks',
                      type: 'eslint',
                      config: {
                        eslint: {
                          rules: {
                            'react/jsx-uses-react': 'error',
                            'react/jsx-uses-vars': 'error',
                            '@typescript-eslint/no-unused-vars': 'warn',
                            'prefer-const': 'warn'
                          }
                        }
                      },
                      execution: {
                        runOn: 'save',
                        timeout: 30000,
                        cache: true,
                        parallel: true
                      },
                      severity: 'warning'
                    };
                    setFormData({
                      ...formData,
                      assertions: [eslintAssertion]
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add ESLint Rules
                </Button>
                <Button
                  onClick={() => {
                    const testAssertion: AssertionDefinition = {
                      id: 'test-coverage',
                      name: 'Test Coverage',
                      description: 'Minimum test coverage requirements',
                      type: 'test',
                      config: {
                        test: {
                          coverage: {
                            threshold: 80,
                            type: 'lines'
                          },
                          runner: 'vitest'
                        }
                      },
                      execution: {
                        runOn: 'manual',
                        timeout: 60000,
                        cache: false,
                        parallel: false
                      },
                      severity: 'error'
                    };
                    setFormData({
                      ...formData,
                      assertions: [testAssertion]
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Add Test Coverage
                </Button>
              </div>
            </div>
          ) : (
            formData.assertions.map((assertion, index) => (
              <Card key={assertion.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        {assertion.type === 'eslint' ? (
                          <Code className="h-5 w-5 text-blue-600" />
                        ) : assertion.type === 'test' ? (
                          <TestTube className="h-5 w-5 text-green-600" />
                        ) : assertion.type === 'structure' ? (
                          <Folder className="h-5 w-5 text-purple-600" />
                        ) : (
                          <Settings className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {assertion.type}
                          </Badge>
                          <Badge 
                            variant={
                              assertion.severity === 'error' ? 'destructive' :
                              assertion.severity === 'warning' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {assertion.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const updated = formData.assertions.filter((_, i) => i !== index);
                        setFormData({
                          ...formData,
                          assertions: updated
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name *
                      </label>
                      <Input
                        value={assertion.name}
                        onChange={(e) => {
                          const updated = [...formData.assertions];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setFormData({
                            ...formData,
                            assertions: updated
                          });
                        }}
                        placeholder="ESLint React Rules"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Severity
                      </label>
                      <select
                        value={assertion.severity}
                        onChange={(e) => {
                          const updated = [...formData.assertions];
                          updated[index] = { 
                            ...updated[index], 
                            severity: e.target.value as 'error' | 'warning' | 'info'
                          };
                          setFormData({
                            ...formData,
                            assertions: updated
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                      >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <Input
                      value={assertion.description}
                      onChange={(e) => {
                        const updated = [...formData.assertions];
                        updated[index] = { ...updated[index], description: e.target.value };
                        setFormData({
                          ...formData,
                          assertions: updated
                        });
                      }}
                      placeholder="Describe what this assertion validates..."
                      className="text-sm"
                    />
                  </div>

                  {assertion.type === 'eslint' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ESLint Rules (JSON)
                      </label>
                      <textarea
                        value={JSON.stringify(assertion.config.eslint?.rules || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const rules = JSON.parse(e.target.value);
                            const updated = [...formData.assertions];
                            updated[index] = {
                              ...updated[index],
                              config: {
                                ...updated[index].config,
                                eslint: { rules }
                              }
                            };
                            setFormData({
                              ...formData,
                              assertions: updated
                            });
                          } catch (error) {
                            // Invalid JSON, ignore for now
                          }
                        }}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm resize-none"
                        placeholder='{\n  "react/jsx-uses-react": "error",\n  "@typescript-eslint/no-unused-vars": "warn"\n}'
                      />
                    </div>
                  )}

                  {assertion.type === 'test' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Coverage Threshold (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={assertion.config.test?.coverage?.threshold || 80}
                          onChange={(e) => {
                            const updated = [...formData.assertions];
                            updated[index] = {
                              ...updated[index],
                              config: {
                                ...updated[index].config,
                                test: {
                                  ...updated[index].config.test,
                                  coverage: {
                                    ...updated[index].config.test?.coverage,
                                    threshold: parseInt(e.target.value) || 80
                                  }
                                }
                              }
                            };
                            setFormData({
                              ...formData,
                              assertions: updated
                            });
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Test Runner
                        </label>
                        <select
                          value={assertion.config.test?.runner || 'vitest'}
                          onChange={(e) => {
                            const updated = [...formData.assertions];
                            updated[index] = {
                              ...updated[index],
                              config: {
                                ...updated[index].config,
                                test: {
                                  ...updated[index].config.test,
                                  runner: e.target.value
                                }
                              }
                            };
                            setFormData({
                              ...formData,
                              assertions: updated
                            });
                          }}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm"
                        >
                          <option value="vitest">Vitest</option>
                          <option value="jest">Jest</option>
                          <option value="mocha">Mocha</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Run On
                      </label>
                      <select
                        value={assertion.execution.runOn}
                        onChange={(e) => {
                          const updated = [...formData.assertions];
                          updated[index] = {
                            ...updated[index],
                            execution: {
                              ...updated[index].execution,
                              runOn: e.target.value as 'save' | 'commit' | 'manual'
                            }
                          };
                          setFormData({
                            ...formData,
                            assertions: updated
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                      >
                        <option value="save">On Save</option>
                        <option value="commit">On Commit</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Timeout (ms)
                      </label>
                      <Input
                        type="number"
                        min="1000"
                        max="300000"
                        value={assertion.execution.timeout}
                        onChange={(e) => {
                          const updated = [...formData.assertions];
                          updated[index] = {
                            ...updated[index],
                            execution: {
                              ...updated[index].execution,
                              timeout: parseInt(e.target.value) || 30000
                            }
                          };
                          setFormData({
                            ...formData,
                            assertions: updated
                          });
                        }}
                        className="text-xs"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assertion.execution.cache}
                          onChange={(e) => {
                            const updated = [...formData.assertions];
                            updated[index] = {
                              ...updated[index],
                              execution: {
                                ...updated[index].execution,
                                cache: e.target.checked
                              }
                            };
                            setFormData({
                              ...formData,
                              assertions: updated
                            });
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs">Cache</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assertion.execution.parallel}
                          onChange={(e) => {
                            const updated = [...formData.assertions];
                            updated[index] = {
                              ...updated[index],
                              execution: {
                                ...updated[index].execution,
                                parallel: e.target.checked
                              }
                            };
                            setFormData({
                              ...formData,
                              assertions: updated
                            });
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs">Parallel</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Assertion Presets */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Common Assertion Presets</h4>
            <p className="text-sm text-green-800 dark:text-green-200 mb-4">
              Apply commonly used assertion configurations:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  const reactPreset: AssertionDefinition = {
                    id: 'react-preset',
                    name: 'React Component Standards',
                    description: 'Standard React component validation rules',
                    type: 'eslint',
                    config: {
                      eslint: {
                        rules: {
                          'react/jsx-uses-react': 'error',
                          'react/jsx-uses-vars': 'error',
                          'react/prop-types': 'warn',
                          'react/jsx-key': 'error',
                          'react-hooks/rules-of-hooks': 'error',
                          'react-hooks/exhaustive-deps': 'warn'
                        }
                      }
                    },
                    execution: {
                      runOn: 'save',
                      timeout: 30000,
                      cache: true,
                      parallel: true
                    },
                    severity: 'warning'
                  };
                  setFormData({
                    ...formData,
                    assertions: [...formData.assertions, reactPreset]
                  });
                }}
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                React Rules
              </Button>
              <Button
                onClick={() => {
                  const typescriptPreset: AssertionDefinition = {
                    id: 'typescript-preset',
                    name: 'TypeScript Quality',
                    description: 'TypeScript code quality and type safety',
                    type: 'eslint',
                    config: {
                      eslint: {
                        rules: {
                          '@typescript-eslint/no-unused-vars': 'warn',
                          '@typescript-eslint/explicit-function-return-type': 'off',
                          '@typescript-eslint/no-explicit-any': 'warn',
                          '@typescript-eslint/prefer-const': 'warn',
                          '@typescript-eslint/no-inferrable-types': 'warn'
                        }
                      }
                    },
                    execution: {
                      runOn: 'save',
                      timeout: 30000,
                      cache: true,
                      parallel: true
                    },
                    severity: 'warning'
                  };
                  setFormData({
                    ...formData,
                    assertions: [...formData.assertions, typescriptPreset]
                  });
                }}
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                TypeScript Rules
              </Button>
              <Button
                onClick={() => {
                  const coveragePreset: AssertionDefinition = {
                    id: 'coverage-preset',
                    name: '80% Test Coverage',
                    description: 'Minimum 80% line coverage requirement',
                    type: 'test',
                    config: {
                      test: {
                        coverage: {
                          threshold: 80,
                          type: 'lines'
                        },
                        runner: 'vitest'
                      }
                    },
                    execution: {
                      runOn: 'manual',
                      timeout: 60000,
                      cache: false,
                      parallel: false
                    },
                    severity: 'error'
                  };
                  setFormData({
                    ...formData,
                    assertions: [...formData.assertions, coveragePreset]
                  });
                }}
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Test Coverage
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render validation and testing tab
  const renderValidationTab = () => (
    <div className="space-y-6">
      {/* Module Type Validation */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Module Type Validation</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">Definition Validation</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check module type configuration</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm">Basic Information</span>
                <div className="flex items-center gap-2">
                  {formData.name && formData.description && formData.version ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-xs text-gray-500">
                    {formData.name && formData.description && formData.version ? 'Valid' : 'Missing required fields'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm">Discovery Patterns</span>
                <div className="flex items-center gap-2">
                  {formData.discovery.basePattern && formData.discovery.instancePattern ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-xs text-gray-500">
                    {formData.discovery.basePattern && formData.discovery.instancePattern ? 'Configured' : 'Missing patterns'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm">Structure Requirements</span>
                <div className="flex items-center gap-2">
                  {formData.structure.folders.length > 0 || formData.structure.files.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-xs text-gray-500">
                    {formData.structure.folders.length + formData.structure.files.length} requirements
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Assertions</span>
                <div className="flex items-center gap-2">
                  {formData.assertions.length > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-xs text-gray-500">
                    {formData.assertions.length} configured
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">Test Discovery</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preview module discovery results</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <Button
                onClick={testDiscoveryPatterns}
                disabled={!formData.discovery.basePattern || !formData.discovery.instancePattern || isValidating}
                className="w-full flex items-center gap-2"
                size="sm"
              >
                {isValidating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isValidating ? 'Running Discovery...' : 'Run Discovery Test'}
              </Button>
              
              {discoveryPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Found {discoveryPreview.length} matching modules:
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {discoveryPreview.map((path, index) => (
                      <div key={index} className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                        {path}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Assertion Testing */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Assertion Testing</h4>
        
        {formData.assertions.length === 0 ? (
          <Card className="p-6 text-center">
            <TestTube className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-4">No assertions configured to test</p>
            <Button
              onClick={() => setActiveTab('assertions')}
              variant="outline"
              size="sm"
            >
              Configure Assertions
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {formData.assertions.map((assertion, index) => (
              <Card key={assertion.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {assertion.type === 'eslint' ? (
                        <Code className="h-4 w-4 text-blue-600" />
                      ) : assertion.type === 'test' ? (
                        <TestTube className="h-4 w-4 text-green-600" />
                      ) : (
                        <Settings className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h6 className="font-medium text-sm text-gray-900 dark:text-white">
                          {assertion.name || 'Unnamed Assertion'}
                        </h6>
                        <Badge variant="outline" className="text-xs">
                          {assertion.type}
                        </Badge>
                        <Badge 
                          variant={
                            assertion.severity === 'error' ? 'destructive' :
                            assertion.severity === 'warning' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {assertion.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {assertion.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        console.log(`Testing assertion: ${assertion.name}`);
                        // TODO: Implement actual assertion testing
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Test
                    </Button>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Not tested</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => {
                  console.log('Running all assertions...');
                  // TODO: Implement batch assertion testing
                }}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Run All Assertions
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Validation Summary</h4>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <div className="flex items-center justify-between">
                <span>Overall Status:</span>
                <Badge variant={validationErrors.length === 0 ? 'default' : 'secondary'}>
                  {validationErrors.length === 0 ? 'Valid' : `${validationErrors.length} issues`}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Discovery Preview:</span>
                <Badge variant="outline">
                  {discoveryPreview.length} modules found
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Assertions Configured:</span>
                <Badge variant="outline">
                  {formData.assertions.length} assertions
                </Badge>
              </div>
            </div>
            {validationErrors.length > 0 && (
              <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-800 rounded text-xs">
                <div className="font-medium mb-1">Issues to resolve:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.slice(0, 3).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {validationErrors.length > 3 && (
                    <li>...and {validationErrors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicTab();
      case 'discovery':
        return renderDiscoveryTab();
      case 'structure':
        return renderStructureTab();
      case 'assertions':
        return renderAssertionsTab();
      case 'templates':
        return <div className="p-8 text-center text-gray-500">Template system coming soon...</div>;
      case 'validation':
        return renderValidationTab();
      default:
        return renderBasicTab();
    }
  };

  // List view
  if (mode === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Module Type Editor
            </h3>
            <p className="text-sm text-gray-500 mt-1">Create and manage module type definitions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onImport?.()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              onClick={() => setMode('create')}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Module Type
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search module types..."
            className="pl-10"
          />
        </div>

        {/* Module Types List */}
        <div className="space-y-2">
          {filteredTypes.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                {searchQuery ? 'No module types match your search.' : 'No module types defined yet.'}
              </div>
              {!searchQuery && (
                <Button
                  onClick={() => setMode('create')}
                  className="mt-4 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create First Module Type
                </Button>
              )}
            </Card>
          ) : (
            filteredTypes.map((type) => (
              <Card key={type.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{type.name}</h4>
                      <Badge variant="outline">v{type.version}</Badge>
                      {type.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {type.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Author: {type.metadata.author || 'Unknown'}</span>
                      <span>Updated: {new Date(type.metadata.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setSelectedType(type);
                        setMode('view');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedType(type);
                        setMode('edit');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDuplicate(type)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(type.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Create/Edit/View mode
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setMode('list');
              setSelectedType(null);
              setValidationErrors([]);
            }}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create Module Type' : 
               mode === 'edit' ? 'Edit Module Type' : 'View Module Type'}
            </h3>
            {formData.name && (
              <p className="text-sm text-gray-500">{formData.name} v{formData.version}</p>
            )}
          </div>
        </div>
        {mode !== 'view' && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setMode('list');
                setSelectedType(null);
                setValidationErrors([]);
              }}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </div>

      {renderValidationErrors()}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Info', icon: FileText },
            { id: 'discovery', label: 'Discovery', icon: Search },
            { id: 'structure', label: 'Structure', icon: Folder },
            { id: 'assertions', label: 'Assertions', icon: TestTube },
            { id: 'templates', label: 'Templates', icon: Copy },
            { id: 'validation', label: 'Validation', icon: CheckCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as EditorTab)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Card className="p-6">
        {renderTabContent()}
      </Card>
    </div>
  );
};