/**
 * ModuleTypeEditorPage Component
 * 
 * Main page component for creating, editing, and managing module type definitions.
 */

import React from 'react';
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
  Info,
  AlertTriangle,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Button } from '../../../../atoms/Button';
import { Card } from '../../../../molecules/Card';
import { Badge } from '../../../../atoms/Badge';
import { Input } from '../../../../atoms/Input';
import { Alert } from '../../../../molecules/Alert';
// Need to import AlertDescription directly as it's not exported from index
const AlertDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>{children}</div>
);
import { cn } from '../../../../../utils/cn';
import { useModuleTypeEditor } from '../domain/useModuleTypeEditor';
import { moduleTypeEditorService as defaultService } from '../data/module-type-editor.service';
import type { ModuleTypeEditorPageProps } from '../types/module-type-editor.types';

export const ModuleTypeEditorPage: React.FC<ModuleTypeEditorPageProps> = ({
  className,
  initialModuleTypeId,
  service = defaultService
}) => {
  const {
    // State
    mode,
    activeTab,
    selectedType,
    formData,
    searchQuery,
    validationErrors,
    discoveryPreview,
    isValidating,
    isDirty,
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
  } = useModuleTypeEditor({ initialModuleTypeId, service });

  // Local state for delete confirmation and success messages
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Handle form submission
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveModuleType();
      if (success) {
        setSuccessMessage(mode === 'create' ? 'Module type created successfully!' : 'Module type updated successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      // Error handling is done by the hook, but we still need to handle UI state
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (selectedType) {
      const success = await deleteModuleType(selectedType.id);
      if (success) {
        setSuccessMessage('Module type deleted successfully!');
        setShowDeleteConfirmation(false);
        setMode('list');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  // Handle file import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          await importModuleTypes(Array.isArray(data) ? data : [data]);
        } catch (error) {
          console.error('Failed to import:', error);
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = '';
  };

  // Render validation errors
  const renderValidationErrors = () => {
    if (validationErrors.length === 0) return null;

    return (
      <Alert className="mb-4" role="alert" aria-live="polite">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-2">Please fix the following errors:</div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-gray-600">
            💡 Fix these issues to save your module type configuration
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Calculate form completion
  const getFormCompletion = () => {
    let completed = 0;
    let total = 6; // Total number of completion checks
    
    // Basic info completion
    if (formData.name) completed++;
    if (formData.description) completed++;
    
    // Discovery completion
    if (formData.discovery.basePattern && formData.discovery.instancePattern) completed++;
    
    // Structure completion
    if (formData.structure.folders.length > 0 || formData.structure.files.length > 0) completed++;
    
    // Assertions completion  
    if (formData.assertions.length > 0) completed++;
    
    // Templates completion
    if (formData.templates?.files && formData.templates.files.length > 0) completed++;
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  // Render success message
  const renderSuccessMessage = () => {
    if (!successMessage) return null;

    return (
      <Alert className="mb-4 border-green-200 bg-green-50 text-green-800" role="status" aria-live="polite">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>{successMessage}</span>
            <Button
              onClick={() => setSuccessMessage(null)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
              aria-label="Close success message"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
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
            onChange={(e) => updateFormData({ name: e.target.value })}
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
            onChange={(e) => updateFormData({ version: e.target.value })}
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
          onChange={(e) => updateFormData({ description: e.target.value })}
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
            onChange={(e) => updateFormData({ 
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
            onChange={(e) => updateFormData({ 
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
          onChange={(e) => updateFormData({ 
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
                updateFormData({
                  discovery: { ...formData.discovery, basePattern: e.target.value }
                });
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
                updateFormData({
                  discovery: { ...formData.discovery, instancePattern: e.target.value }
                });
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
              {isValidating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
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

  // Render structure tab
  const renderStructureTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Structure Requirements</h3>
          <p className="text-sm text-gray-500 mt-1">Define the folder and file structure requirements for this module type</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const presets = formData.structure.presets?.pages || {
                folders: [
                  { path: 'ui', required: true, description: 'UI components' },
                  { path: 'domain', required: true, description: 'Business logic' },
                  { path: 'data', required: true, description: 'Data services' },
                  { path: 'validation', required: false, description: 'Validation schemas' }
                ],
                files: [
                  { path: 'ui/Component.tsx', required: true, validation: { schema: 'react-component' } },
                  { path: 'domain/useComponent.ts', required: true, validation: { schema: 'react-hook' } },
                  { path: 'data/component.service.ts', required: true, validation: { schema: 'service' } },
                  { path: 'validation/component.validation.ts', required: false, validation: { schema: 'zod' } }
                ]
              };
              updateFormData({
                structure: {
                  ...formData.structure,
                  folders: presets.folders,
                  files: presets.files
                }
              });
            }}
            variant="outline"
            size="sm"
          >
            Use Pages Structure
          </Button>
          <Button
            onClick={() => {
              updateFormData({
                structure: {
                  ...formData.structure,
                  folders: [
                    { path: 'Component.tsx', required: true, description: 'React component' },
                    { path: 'Component.stories.tsx', required: false, description: 'Storybook stories' },
                    { path: 'Component.test.tsx', required: false, description: 'Component tests' }
                  ],
                  files: []
                }
              });
            }}
            variant="outline"
            size="sm"
          >
            Use Component Structure
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Folders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">Folders</h4>
            <Button
              onClick={() => {
                updateFormData({
                  structure: {
                    ...formData.structure,
                    folders: [
                      ...formData.structure.folders,
                      { path: '', required: false, description: '' }
                    ]
                  }
                });
              }}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Folder
            </Button>
          </div>

          <div className="space-y-3">
            {formData.structure.folders.map((folder, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={folder.path}
                    onChange={(e) => {
                      const newFolders = [...formData.structure.folders];
                      newFolders[index] = { ...folder, path: e.target.value };
                      updateFormData({
                        structure: { ...formData.structure, folders: newFolders }
                      });
                    }}
                    placeholder="e.g. ui, domain, data"
                    className="text-sm"
                  />
                  <Input
                    value={folder.description}
                    onChange={(e) => {
                      const newFolders = [...formData.structure.folders];
                      newFolders[index] = { ...folder, description: e.target.value };
                      updateFormData({
                        structure: { ...formData.structure, folders: newFolders }
                      });
                    }}
                    placeholder="Description (optional)"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={folder.required}
                      onChange={(e) => {
                        const newFolders = [...formData.structure.folders];
                        newFolders[index] = { ...folder, required: e.target.checked };
                        updateFormData({
                          structure: { ...formData.structure, folders: newFolders }
                        });
                      }}
                      className="rounded"
                    />
                    Required
                  </label>
                  <Button
                    onClick={() => {
                      const newFolders = formData.structure.folders.filter((_, i) => i !== index);
                      updateFormData({
                        structure: { ...formData.structure, folders: newFolders }
                      });
                    }}
                    variant="outline"
                    size="sm"
                    aria-label="Remove folder requirement"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {formData.structure.folders.length === 0 && (
              <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <Folder className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No folders defined</p>
                <p className="text-xs text-gray-400">Click "Add Folder" to define folder requirements</p>
              </div>
            )}
          </div>
        </div>

        {/* Files */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">Files</h4>
            <Button
              onClick={() => {
                updateFormData({
                  structure: {
                    ...formData.structure,
                    files: [
                      ...formData.structure.files,
                      { path: '', required: false, validation: { schema: '' } }
                    ]
                  }
                });
              }}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add File
            </Button>
          </div>

          <div className="space-y-3">
            {formData.structure.files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={file.path}
                    onChange={(e) => {
                      const newFiles = [...formData.structure.files];
                      newFiles[index] = { ...file, path: e.target.value };
                      updateFormData({
                        structure: { ...formData.structure, files: newFiles }
                      });
                    }}
                    placeholder="e.g. Component.tsx, index.ts"
                    className="text-sm"
                  />
                  <select
                    value={file.validation?.schema || ''}
                    onChange={(e) => {
                      const newFiles = [...formData.structure.files];
                      newFiles[index] = { 
                        ...file, 
                        validation: { schema: e.target.value }
                      };
                      updateFormData({
                        structure: { ...formData.structure, files: newFiles }
                      });
                    }}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No validation</option>
                    <option value="react-component">React Component</option>
                    <option value="react-hook">React Hook</option>
                    <option value="service">Service Class</option>
                    <option value="zod">Zod Schema</option>
                    <option value="typescript">TypeScript</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={file.required}
                      onChange={(e) => {
                        const newFiles = [...formData.structure.files];
                        newFiles[index] = { ...file, required: e.target.checked };
                        updateFormData({
                          structure: { ...formData.structure, files: newFiles }
                        });
                      }}
                      className="rounded"
                    />
                    Required
                  </label>
                  <Button
                    onClick={() => {
                      const newFiles = formData.structure.files.filter((_, i) => i !== index);
                      updateFormData({
                        structure: { ...formData.structure, files: newFiles }
                      });
                    }}
                    variant="outline"
                    size="sm"
                    aria-label="Remove file requirement"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {formData.structure.files.length === 0 && (
              <div className="text-center p-6 border-2 border-dashed rounded-lg">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No files defined</p>
                <p className="text-xs text-gray-400">Click "Add File" to define file requirements</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dependencies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Dependencies</h4>
            <p className="text-sm text-gray-500">Define module dependencies and relationships</p>
          </div>
          <Button
            onClick={() => {
              updateFormData({
                structure: {
                  ...formData.structure,
                  dependencies: [
                    ...formData.structure.dependencies,
                    { type: 'peer', name: '', version: '', optional: false }
                  ]
                }
              });
            }}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Dependency
          </Button>
        </div>

        <div className="space-y-3">
          {formData.structure.dependencies.map((dep, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <Code className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={dep.type}
                  onChange={(e) => {
                    const newDeps = [...formData.structure.dependencies];
                    newDeps[index] = { ...dep, type: e.target.value as any };
                    updateFormData({
                      structure: { ...formData.structure, dependencies: newDeps }
                    });
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="peer">Peer</option>
                  <option value="dev">Dev</option>
                  <option value="runtime">Runtime</option>
                </select>
                <Input
                  value={dep.name}
                  onChange={(e) => {
                    const newDeps = [...formData.structure.dependencies];
                    newDeps[index] = { ...dep, name: e.target.value };
                    updateFormData({
                      structure: { ...formData.structure, dependencies: newDeps }
                    });
                  }}
                  placeholder="Package name"
                  className="text-sm"
                />
                <Input
                  value={dep.version}
                  onChange={(e) => {
                    const newDeps = [...formData.structure.dependencies];
                    newDeps[index] = { ...dep, version: e.target.value };
                    updateFormData({
                      structure: { ...formData.structure, dependencies: newDeps }
                    });
                  }}
                  placeholder="Version (e.g. ^1.0.0)"
                  className="text-sm"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={dep.optional}
                      onChange={(e) => {
                        const newDeps = [...formData.structure.dependencies];
                        newDeps[index] = { ...dep, optional: e.target.checked };
                        updateFormData({
                          structure: { ...formData.structure, dependencies: newDeps }
                        });
                      }}
                      className="rounded"
                    />
                    Optional
                  </label>
                  <Button
                    onClick={() => {
                      const newDeps = formData.structure.dependencies.filter((_, i) => i !== index);
                      updateFormData({
                        structure: { ...formData.structure, dependencies: newDeps }
                      });
                    }}
                    variant="outline"
                    size="sm"
                    aria-label="Remove dependency"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {formData.structure.dependencies.length === 0 && (
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
              <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No dependencies defined</p>
              <p className="text-xs text-gray-400">Click "Add Dependency" to define package dependencies</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render assertions tab
  const renderAssertionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Validation Assertions</h3>
          <p className="text-sm text-gray-500 mt-1">Define validation rules and checks for module compliance</p>
        </div>
        <Button
          onClick={() => {
            updateFormData({
              assertions: [
                ...formData.assertions,
                {
                  type: 'file-exists',
                  path: '',
                  message: '',
                  severity: 'error',
                  enabled: true
                }
              ]
            });
          }}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Assertion
        </Button>
      </div>

      <div className="space-y-4">
        {formData.assertions.map((assertion, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  assertion.severity === 'error' ? 'bg-red-100' :
                  assertion.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  {assertion.severity === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : assertion.severity === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assertion Type
                    </label>
                    <select
                      value={assertion.type}
                      onChange={(e) => {
                        const newAssertions = [...formData.assertions];
                        newAssertions[index] = { ...assertion, type: e.target.value as any };
                        updateFormData({ assertions: newAssertions });
                      }}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="file-exists">File Exists</option>
                      <option value="folder-exists">Folder Exists</option>
                      <option value="file-content">File Content</option>
                      <option value="naming-convention">Naming Convention</option>
                      <option value="dependency-version">Dependency Version</option>
                      <option value="export-exists">Export Exists</option>
                      <option value="import-exists">Import Exists</option>
                      <option value="custom-script">Custom Script</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Severity
                    </label>
                    <select
                      value={assertion.severity}
                      onChange={(e) => {
                        const newAssertions = [...formData.assertions];
                        newAssertions[index] = { ...assertion, severity: e.target.value as any };
                        updateFormData({ assertions: newAssertions });
                      }}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="error">Error</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Path/Pattern
                  </label>
                  <Input
                    value={assertion.path}
                    onChange={(e) => {
                      const newAssertions = [...formData.assertions];
                      newAssertions[index] = { ...assertion, path: e.target.value };
                      updateFormData({ assertions: newAssertions });
                    }}
                    placeholder={
                      assertion.type === 'file-exists' ? 'e.g. Component.tsx' :
                      assertion.type === 'folder-exists' ? 'e.g. ui/' :
                      assertion.type === 'file-content' ? 'e.g. Component.tsx:export default' :
                      assertion.type === 'naming-convention' ? 'e.g. *.tsx' :
                      assertion.type === 'dependency-version' ? 'e.g. react@^18.0.0' :
                      assertion.type === 'export-exists' ? 'e.g. index.ts:ComponentName' :
                      assertion.type === 'import-exists' ? 'e.g. Component.tsx:React' :
                      'e.g. npm run validate'
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error Message
                  </label>
                  <Input
                    value={assertion.message}
                    onChange={(e) => {
                      const newAssertions = [...formData.assertions];
                      newAssertions[index] = { ...assertion, message: e.target.value };
                      updateFormData({ assertions: newAssertions });
                    }}
                    placeholder="Custom error message (optional)"
                    className="text-sm"
                  />
                </div>

                {assertion.type === 'file-content' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content Pattern
                    </label>
                    <textarea
                      value={assertion.pattern || ''}
                      onChange={(e) => {
                        const newAssertions = [...formData.assertions];
                        newAssertions[index] = { ...assertion, pattern: e.target.value };
                        updateFormData({ assertions: newAssertions });
                      }}
                      placeholder="Regular expression or text pattern to match"
                      rows={3}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}

                {assertion.type === 'custom-script' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Script Command
                    </label>
                    <Input
                      value={assertion.script || ''}
                      onChange={(e) => {
                        const newAssertions = [...formData.assertions];
                        newAssertions[index] = { ...assertion, script: e.target.value };
                        updateFormData({ assertions: newAssertions });
                      }}
                      placeholder="e.g. npm test, yarn lint, custom-validate.sh"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={assertion.enabled}
                    onChange={(e) => {
                      const newAssertions = [...formData.assertions];
                      newAssertions[index] = { ...assertion, enabled: e.target.checked };
                      updateFormData({ assertions: newAssertions });
                    }}
                    className="rounded"
                  />
                  Enabled
                </label>
                <Button
                  onClick={() => {
                    const newAssertions = formData.assertions.filter((_, i) => i !== index);
                    updateFormData({ assertions: newAssertions });
                  }}
                  variant="outline"
                  size="sm"
                  aria-label="Remove assertion"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {formData.assertions.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Assertions Defined</h4>
            <p className="text-sm text-gray-500 mb-4">
              Assertions help validate that modules follow the defined structure and conventions
            </p>
            <Button
              onClick={() => {
                updateFormData({
                  assertions: [
                    {
                      type: 'file-exists',
                      path: 'Component.tsx',
                      message: 'Main component file is required',
                      severity: 'error',
                      enabled: true
                    },
                    {
                      type: 'file-exists',
                      path: 'index.ts',
                      message: 'Index file should export the component',
                      severity: 'warning',
                      enabled: true
                    },
                    {
                      type: 'naming-convention',
                      path: '*.tsx',
                      message: 'Component files should use PascalCase',
                      severity: 'warning',
                      enabled: true
                    }
                  ]
                });
              }}
              variant="outline"
              size="sm"
            >
              Add Sample Assertions
            </Button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Assertion Types
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <p><strong>File Exists:</strong> Validates that a specific file exists</p>
              <p><strong>Folder Exists:</strong> Validates that a specific folder exists</p>
              <p><strong>File Content:</strong> Validates file contents match a pattern</p>
              <p><strong>Naming Convention:</strong> Validates file/folder naming patterns</p>
              <p><strong>Dependency Version:</strong> Validates package.json dependencies</p>
              <p><strong>Export Exists:</strong> Validates that a file exports specific items</p>
              <p><strong>Import Exists:</strong> Validates that a file imports specific items</p>
              <p><strong>Custom Script:</strong> Runs a custom validation script</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Template System Overview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Copy className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Template System
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Define code templates that can be generated when creating new instances of this module type.
            </p>
          </div>
        </div>
      </div>

      {/* Template Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">Code Templates</h4>
          <Button
            onClick={() => {
              updateFormData({
                templates: {
                  ...formData.templates,
                  files: [
                    ...(formData.templates?.files || []),
                    {
                      id: `template-${Date.now()}`,
                      path: '',
                      name: '',
                      description: '',
                      content: '',
                      language: 'typescript',
                      variables: [],
                      conditions: []
                    }
                  ]
                }
              });
            }}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>

        <div className="space-y-4">
          {(formData.templates?.files || []).map((template, index) => (
            <div key={template.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Template {index + 1}</span>
                </div>
                <Button
                  onClick={() => {
                    const newFiles = (formData.templates?.files || []).filter((_, i) => i !== index);
                    updateFormData({
                      templates: { ...formData.templates, files: newFiles }
                    });
                  }}
                  variant="outline"
                  size="sm"
                  aria-label="Remove template"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name
                  </label>
                  <Input
                    value={template.name}
                    onChange={(e) => {
                      const newFiles = [...(formData.templates?.files || [])];
                      newFiles[index] = { ...template, name: e.target.value };
                      updateFormData({
                        templates: { ...formData.templates, files: newFiles }
                      });
                    }}
                    placeholder="e.g. Component Template, Service Template"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File Path Pattern
                  </label>
                  <Input
                    value={template.path}
                    onChange={(e) => {
                      const newFiles = [...(formData.templates?.files || [])];
                      newFiles[index] = { ...template, path: e.target.value };
                      updateFormData({
                        templates: { ...formData.templates, files: newFiles }
                      });
                    }}
                    placeholder="e.g. ui/{{name}}.tsx, services/{{name}}.service.ts"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  value={template.description}
                  onChange={(e) => {
                    const newFiles = [...(formData.templates?.files || [])];
                    newFiles[index] = { ...template, description: e.target.value };
                    updateFormData({
                      templates: { ...formData.templates, files: newFiles }
                    });
                  }}
                  placeholder="Describe what this template generates"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language
                </label>
                <select
                  value={template.language}
                  onChange={(e) => {
                    const newFiles = [...(formData.templates?.files || [])];
                    newFiles[index] = { ...template, language: e.target.value };
                    updateFormData({
                      templates: { ...formData.templates, files: newFiles }
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="tsx">TSX (React)</option>
                  <option value="jsx">JSX (React)</option>
                  <option value="css">CSS</option>
                  <option value="scss">SCSS</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                  <option value="yaml">YAML</option>
                  <option value="text">Plain Text</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Content
                </label>
                <textarea
                  value={template.content}
                  onChange={(e) => {
                    const newFiles = [...(formData.templates?.files || [])];
                    newFiles[index] = { ...template, content: e.target.value };
                    updateFormData({
                      templates: { ...formData.templates, files: newFiles }
                    });
                  }}
                  placeholder="Enter template content with variables like {{name}}, {{description}}, etc."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use double curly braces for variables: <code>{'{{name}}'}</code>, <code>{'{{description}}'}</code>, <code>{'{{version}}'}</code>
                </p>
              </div>

              {/* Template Variables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Template Variables
                  </label>
                  <Button
                    onClick={() => {
                      const newFiles = [...(formData.templates?.files || [])];
                      newFiles[index] = {
                        ...template,
                        variables: [
                          ...(template.variables || []),
                          {
                            name: '',
                            type: 'string',
                            required: true,
                            description: '',
                            defaultValue: ''
                          }
                        ]
                      };
                      updateFormData({
                        templates: { ...formData.templates, files: newFiles }
                      });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Variable
                  </Button>
                </div>

                <div className="space-y-2">
                  {(template.variables || []).map((variable, varIndex) => (
                    <div key={varIndex} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <Input
                        value={variable.name}
                        onChange={(e) => {
                          const newFiles = [...(formData.templates?.files || [])];
                          const newVariables = [...(template.variables || [])];
                          newVariables[varIndex] = { ...variable, name: e.target.value };
                          newFiles[index] = { ...template, variables: newVariables };
                          updateFormData({
                            templates: { ...formData.templates, files: newFiles }
                          });
                        }}
                        placeholder="Variable name"
                        className="text-xs"
                      />
                      <select
                        value={variable.type}
                        onChange={(e) => {
                          const newFiles = [...(formData.templates?.files || [])];
                          const newVariables = [...(template.variables || [])];
                          newVariables[varIndex] = { ...variable, type: e.target.value };
                          newFiles[index] = { ...template, variables: newVariables };
                          updateFormData({
                            templates: { ...formData.templates, files: newFiles }
                          });
                        }}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                      </select>
                      <Input
                        value={variable.defaultValue}
                        onChange={(e) => {
                          const newFiles = [...(formData.templates?.files || [])];
                          const newVariables = [...(template.variables || [])];
                          newVariables[varIndex] = { ...variable, defaultValue: e.target.value };
                          newFiles[index] = { ...template, variables: newVariables };
                          updateFormData({
                            templates: { ...formData.templates, files: newFiles }
                          });
                        }}
                        placeholder="Default value"
                        className="text-xs"
                      />
                      <Button
                        onClick={() => {
                          const newFiles = [...(formData.templates?.files || [])];
                          const newVariables = (template.variables || []).filter((_, i) => i !== varIndex);
                          newFiles[index] = { ...template, variables: newVariables };
                          updateFormData({
                            templates: { ...formData.templates, files: newFiles }
                          });
                        }}
                        variant="outline"
                        size="sm"
                        aria-label="Remove template variable"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {(formData.templates?.files || []).length === 0 && (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <Copy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No templates defined</p>
              <p className="text-xs text-gray-400">Click "Add Template" to create code templates for this module type</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Presets */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Template Presets</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => {
              updateFormData({
                templates: {
                  ...formData.templates,
                  files: [
                    ...(formData.templates?.files || []),
                    {
                      id: `react-component-${Date.now()}`,
                      path: 'ui/{{name}}.tsx',
                      name: 'React Component',
                      description: 'A basic React functional component',
                      language: 'tsx',
                      content: `import React from 'react';

interface {{name}}Props {
  className?: string;
}

export const {{name}}: React.FC<{{name}}Props> = ({
  className,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {/* {{description}} */}
    </div>
  );
};`,
                      variables: [
                        { name: 'name', type: 'string', required: true, description: 'Component name', defaultValue: '' }
                      ],
                      conditions: []
                    }
                  ]
                }
              });
            }}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Copy className="h-4 w-4 text-blue-500" />
              <span className="font-medium">React Component</span>
            </div>
            <p className="text-xs text-gray-500">Basic functional component with props</p>
          </Button>

          <Button
            onClick={() => {
              updateFormData({
                templates: {
                  ...formData.templates,
                  files: [
                    ...(formData.templates?.files || []),
                    {
                      id: `service-${Date.now()}`,
                      path: 'data/{{name}}.service.ts',
                      name: 'API Service',
                      description: 'API service class with CRUD operations',
                      language: 'typescript',
                      content: `export class {{name}}Service {
  private baseUrl = '/api/{{name.toLowerCase()}}';

  async getAll(): Promise<{{name}}[]> {
    const response = await fetch(this.baseUrl);
    return response.json();
  }

  async getById(id: string): Promise<{{name}} | null> {
    const response = await fetch(\`\${this.baseUrl}/\${id}\`);
    return response.json();
  }

  async create(data: Create{{name}}Input): Promise<{{name}}> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async update(id: string, data: Update{{name}}Input): Promise<{{name}}> {
    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async delete(id: string): Promise<boolean> {
    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'DELETE'
    });
    return response.ok;
  }
}

export const {{name.camelCase}}Service = new {{name}}Service();`,
                      variables: [
                        { name: 'name', type: 'string', required: true, description: 'Service name', defaultValue: '' }
                      ],
                      conditions: []
                    }
                  ]
                }
              });
            }}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Copy className="h-4 w-4 text-green-500" />
              <span className="font-medium">API Service</span>
            </div>
            <p className="text-xs text-gray-500">Service class with CRUD methods</p>
          </Button>

          <Button
            onClick={() => {
              updateFormData({
                templates: {
                  ...formData.templates,
                  files: [
                    ...(formData.templates?.files || []),
                    {
                      id: `hook-${Date.now()}`,
                      path: 'domain/use{{name}}.ts',
                      name: 'Custom Hook',
                      description: 'React custom hook with state management',
                      language: 'typescript',
                      content: `import { useState, useEffect } from 'react';

interface Use{{name}}Return {
  data: {{name}}[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const use{{name}} = (): Use{{name}}Return => {
  const [data, setData] = useState<{{name}}[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Add your data fetching logic here
      const response = await fetch('/api/{{name.toLowerCase()}}');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};`,
                      variables: [
                        { name: 'name', type: 'string', required: true, description: 'Hook name', defaultValue: '' }
                      ],
                      conditions: []
                    }
                  ]
                }
              });
            }}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <Copy className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Custom Hook</span>
            </div>
            <p className="text-xs text-gray-500">React hook with data fetching</p>
          </Button>
        </div>
      </div>

      {/* Template Preview */}
      {(formData.templates?.files || []).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Template Preview
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>✓ {(formData.templates?.files || []).length} template{(formData.templates?.files || []).length !== 1 ? 's' : ''} defined</p>
            <p>✓ Templates will be available when creating new instances</p>
            <p>✓ Variables can be customized during generation</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderValidationTab = () => (
    <div className="space-y-6">
      {/* Validation Overview */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
              Validation Testing
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Configure automated tests to validate that module instances conform to this module type's requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Test Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-white">Test Suites</h4>
          <Button
            onClick={() => {
              updateFormData({
                validation: {
                  ...formData.validation,
                  testSuites: [
                    ...(formData.validation?.testSuites || []),
                    {
                      id: `test-suite-${Date.now()}`,
                      name: '',
                      description: '',
                      type: 'structure',
                      enabled: true,
                      tests: []
                    }
                  ]
                }
              });
            }}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Test Suite
          </Button>
        </div>

        <div className="space-y-4">
          {(formData.validation?.testSuites || []).map((suite, index) => (
            <div key={suite.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Test Suite {index + 1}</span>
                  <label className="flex items-center gap-2 ml-4">
                    <input
                      type="checkbox"
                      checked={suite.enabled}
                      onChange={(e) => {
                        const newSuites = [...(formData.validation?.testSuites || [])];
                        newSuites[index] = { ...suite, enabled: e.target.checked };
                        updateFormData({
                          validation: { ...formData.validation, testSuites: newSuites }
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Enabled</span>
                  </label>
                </div>
                <Button
                  onClick={() => {
                    const newSuites = (formData.validation?.testSuites || []).filter((_, i) => i !== index);
                    updateFormData({
                      validation: { ...formData.validation, testSuites: newSuites }
                    });
                  }}
                  variant="outline"
                  size="sm"
                  aria-label="Remove test suite"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Suite Name
                  </label>
                  <Input
                    value={suite.name}
                    onChange={(e) => {
                      const newSuites = [...(formData.validation?.testSuites || [])];
                      newSuites[index] = { ...suite, name: e.target.value };
                      updateFormData({
                        validation: { ...formData.validation, testSuites: newSuites }
                      });
                    }}
                    placeholder="e.g. Structure Validation, Content Tests"
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Test Type
                  </label>
                  <select
                    value={suite.type}
                    onChange={(e) => {
                      const newSuites = [...(formData.validation?.testSuites || [])];
                      newSuites[index] = { ...suite, type: e.target.value };
                      updateFormData({
                        validation: { ...formData.validation, testSuites: newSuites }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="structure">Structure Validation</option>
                    <option value="content">Content Validation</option>
                    <option value="imports">Import/Export Tests</option>
                    <option value="integration">Integration Tests</option>
                    <option value="custom">Custom Tests</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  value={suite.description}
                  onChange={(e) => {
                    const newSuites = [...(formData.validation?.testSuites || [])];
                    newSuites[index] = { ...suite, description: e.target.value };
                    updateFormData({
                      validation: { ...formData.validation, testSuites: newSuites }
                    });
                  }}
                  placeholder="Describe what this test suite validates"
                  className="text-sm"
                />
              </div>

              {/* Individual Tests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Test Cases
                  </label>
                  <Button
                    onClick={() => {
                      const newSuites = [...(formData.validation?.testSuites || [])];
                      newSuites[index] = {
                        ...suite,
                        tests: [
                          ...(suite.tests || []),
                          {
                            id: `test-${Date.now()}`,
                            name: '',
                            description: '',
                            command: '',
                            expectedOutput: '',
                            timeout: 30000
                          }
                        ]
                      };
                      updateFormData({
                        validation: { ...formData.validation, testSuites: newSuites }
                      });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Test
                  </Button>
                </div>

                <div className="space-y-2">
                  {(suite.tests || []).map((test, testIndex) => (
                    <div key={test.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Test {testIndex + 1}</span>
                        <Button
                          onClick={() => {
                            const newSuites = [...(formData.validation?.testSuites || [])];
                            const newTests = (suite.tests || []).filter((_, i) => i !== testIndex);
                            newSuites[index] = { ...suite, tests: newTests };
                            updateFormData({
                              validation: { ...formData.validation, testSuites: newSuites }
                            });
                          }}
                          variant="outline"
                          size="sm"
                          aria-label="Remove test case"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <Input
                          value={test.name}
                          onChange={(e) => {
                            const newSuites = [...(formData.validation?.testSuites || [])];
                            const newTests = [...(suite.tests || [])];
                            newTests[testIndex] = { ...test, name: e.target.value };
                            newSuites[index] = { ...suite, tests: newTests };
                            updateFormData({
                              validation: { ...formData.validation, testSuites: newSuites }
                            });
                          }}
                          placeholder="Test name"
                          className="text-xs"
                        />
                        <Input
                          value={test.timeout?.toString() || '30000'}
                          onChange={(e) => {
                            const newSuites = [...(formData.validation?.testSuites || [])];
                            const newTests = [...(suite.tests || [])];
                            newTests[testIndex] = { ...test, timeout: parseInt(e.target.value) || 30000 };
                            newSuites[index] = { ...suite, tests: newTests };
                            updateFormData({
                              validation: { ...formData.validation, testSuites: newSuites }
                            });
                          }}
                          placeholder="Timeout (ms)"
                          className="text-xs"
                        />
                      </div>

                      <div className="mb-2">
                        <Input
                          value={test.command}
                          onChange={(e) => {
                            const newSuites = [...(formData.validation?.testSuites || [])];
                            const newTests = [...(suite.tests || [])];
                            newTests[testIndex] = { ...test, command: e.target.value };
                            newSuites[index] = { ...suite, tests: newTests };
                            updateFormData({
                              validation: { ...formData.validation, testSuites: newSuites }
                            });
                          }}
                          placeholder="Test command (e.g., npm test, vitest run)"
                          className="text-xs font-mono"
                        />
                      </div>

                      <Input
                        value={test.description}
                        onChange={(e) => {
                          const newSuites = [...(formData.validation?.testSuites || [])];
                          const newTests = [...(suite.tests || [])];
                          newTests[testIndex] = { ...test, description: e.target.value };
                          newSuites[index] = { ...suite, tests: newTests };
                          updateFormData({
                            validation: { ...formData.validation, testSuites: newSuites }
                          });
                        }}
                        placeholder="Test description"
                        className="text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {(formData.validation?.testSuites || []).length === 0 && (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No test suites defined</p>
              <p className="text-xs text-gray-400">Click "Add Test Suite" to create validation tests</p>
            </div>
          )}
        </div>
      </div>

      {/* Test Presets */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Test Presets</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => {
              updateFormData({
                validation: {
                  ...formData.validation,
                  testSuites: [
                    ...(formData.validation?.testSuites || []),
                    {
                      id: `structure-validation-${Date.now()}`,
                      name: 'Structure Validation',
                      description: 'Validates file and folder structure requirements',
                      type: 'structure',
                      enabled: true,
                      tests: [
                        {
                          id: `test-${Date.now()}-1`,
                          name: 'Check Required Files',
                          description: 'Verify all required files exist',
                          command: 'test -f ui/Component.tsx && test -f domain/useComponent.ts',
                          expectedOutput: '',
                          timeout: 10000
                        },
                        {
                          id: `test-${Date.now()}-2`,
                          name: 'Check Required Folders',
                          description: 'Verify all required folders exist',
                          command: 'test -d ui && test -d domain && test -d data',
                          expectedOutput: '',
                          timeout: 10000
                        }
                      ]
                    }
                  ]
                }
              });
            }}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Structure Validation</span>
            </div>
            <p className="text-xs text-gray-500">Tests for file/folder requirements</p>
          </Button>

          <Button
            onClick={() => {
              updateFormData({
                validation: {
                  ...formData.validation,
                  testSuites: [
                    ...(formData.validation?.testSuites || []),
                    {
                      id: `content-validation-${Date.now()}`,
                      name: 'Content Validation',
                      description: 'Validates file contents and code quality',
                      type: 'content',
                      enabled: true,
                      tests: [
                        {
                          id: `test-${Date.now()}-1`,
                          name: 'TypeScript Check',
                          description: 'Verify TypeScript compilation',
                          command: 'npx tsc --noEmit',
                          expectedOutput: '',
                          timeout: 30000
                        },
                        {
                          id: `test-${Date.now()}-2`,
                          name: 'ESLint Check',
                          description: 'Verify code quality standards',
                          command: 'npx eslint . --ext .ts,.tsx',
                          expectedOutput: '',
                          timeout: 20000
                        }
                      ]
                    }
                  ]
                }
              });
            }}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Content Validation</span>
            </div>
            <p className="text-xs text-gray-500">Tests for code quality and standards</p>
          </Button>

          <Button
            onClick={() => {
              updateFormData({
                validation: {
                  ...formData.validation,
                  testSuites: [
                    ...(formData.validation?.testSuites || []),
                    {
                      id: `unit-tests-${Date.now()}`,
                      name: 'Unit Tests',
                      description: 'Runs component and logic unit tests',
                      type: 'integration',
                      enabled: true,
                      tests: [
                        {
                          id: `test-${Date.now()}-1`,
                          name: 'Component Tests',
                          description: 'Run component unit tests',
                          command: 'npm test -- --testPathPattern=Component.test.tsx',
                          expectedOutput: '',
                          timeout: 60000
                        },
                        {
                          id: `test-${Date.now()}-2`,
                          name: 'Hook Tests',
                          description: 'Run custom hook tests',
                          command: 'npm test -- --testPathPattern=useComponent.test.ts',
                          expectedOutput: '',
                          timeout: 30000
                        }
                      ]
                    }
                  ]
                }
              });
            }}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Unit Tests</span>
            </div>
            <p className="text-xs text-gray-500">Automated unit test execution</p>
          </Button>

          <Button
            onClick={() => {
              updateFormData({
                validation: {
                  ...formData.validation,
                  testSuites: [
                    ...(formData.validation?.testSuites || []),
                    {
                      id: `import-validation-${Date.now()}`,
                      name: 'Import/Export Validation',
                      description: 'Validates module exports and dependencies',
                      type: 'imports',
                      enabled: true,
                      tests: [
                        {
                          id: `test-${Date.now()}-1`,
                          name: 'Check Exports',
                          description: 'Verify module exports required items',
                          command: 'node -e "const mod = require(\'./index.ts\'); console.log(Object.keys(mod));"',
                          expectedOutput: '',
                          timeout: 15000
                        },
                        {
                          id: `test-${Date.now()}-2`,
                          name: 'Check Dependencies',
                          description: 'Verify all dependencies are installed',
                          command: 'npm ls --depth=0',
                          expectedOutput: '',
                          timeout: 20000
                        }
                      ]
                    }
                  ]
                }
              });
            }}
            variant="outline"
            className="h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Import/Export Tests</span>
            </div>
            <p className="text-xs text-gray-500">Validates module interfaces</p>
          </Button>
        </div>
      </div>

      {/* Test Summary */}
      {(formData.validation?.testSuites || []).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Validation Summary
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>✓ {(formData.validation?.testSuites || []).length} test suite{(formData.validation?.testSuites || []).length !== 1 ? 's' : ''} configured</p>
            <p>✓ {(formData.validation?.testSuites || []).reduce((total, suite) => total + (suite.tests?.length || 0), 0)} individual tests</p>
            <p>✓ {(formData.validation?.testSuites || []).filter(suite => suite.enabled).length} enabled suites will run during validation</p>
            <div className="mt-2 text-blue-600 dark:text-blue-400">
              <p>💡 Tests will automatically run when new instances are created</p>
              <p>💡 Failed validation will prevent instance creation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render tab content
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
        return renderTemplatesTab();
      case 'validation':
        return renderValidationTab();
      default:
        return renderBasicTab();
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center min-h-96', className)}>
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4', className)}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // List view
  if (mode === 'list') {
    return (
      <main className={cn('space-y-4', className)} role="main">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              Module Type Editor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage module type definitions</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-input"
            />
            <Button
              onClick={() => document.getElementById('import-input')?.click()}
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
            aria-label="Search module types"
            role="searchbox"
          />
        </div>

        {renderSuccessMessage()}

        {/* Module Types List */}
        <div className="space-y-2">
          {filteredModuleTypes.length === 0 ? (
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
            filteredModuleTypes.map((type) => (
              <Card key={type.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{type.name}</h3>
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
                        selectType(type);
                        setMode('view');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        selectType(type);
                        setMode('edit');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => duplicateModuleType(type)}
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
      </main>
    );
  }

  // Create/Edit/View mode
  return (
    <main className={cn('space-y-4', className)} role="main">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setMode('list')}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create Module Type' : 
               mode === 'edit' ? 'Edit Module Type' : 'View Module Type'}
            </h1>
            {formData.name && (
              <p className="text-sm text-gray-500">{formData.name} v{formData.version}</p>
            )}
            {mode !== 'view' && (() => {
              const completion = getFormCompletion();
              return (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${completion.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {completion.completed}/{completion.total} sections complete
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
        {mode !== 'view' && (
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <Button
                onClick={() => setShowDeleteConfirmation(true)}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <Button
              onClick={() => setMode('list')}
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
              disabled={isSaving || validationErrors.length > 0}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {renderValidationErrors()}
      {renderSuccessMessage()}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" role="tablist" aria-label="Module type configuration tabs">
          {[
            { id: 'basic', label: 'Basic Info', icon: FileText },
            { id: 'discovery', label: 'Discovery', icon: Search },
            { id: 'structure', label: 'Structure', icon: Folder },
            { id: 'assertions', label: 'Assertions', icon: TestTube },
            { id: 'templates', label: 'Templates', icon: Copy },
            { id: 'validation', label: 'Validation', icon: CheckCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                type="button"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <Card 
        className="p-6"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {renderTabContent()}
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Module Type
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete "{formData.name}"? This will permanently remove 
              the module type definition and cannot be recovered.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteConfirmation(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};