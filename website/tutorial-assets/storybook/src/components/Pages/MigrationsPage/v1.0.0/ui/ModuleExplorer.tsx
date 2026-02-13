/**
 * Module Explorer Component
 * 
 * Visual interface for exploring, validating, and managing code modules.
 */

import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Folder,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  Filter,
  Play,
  RefreshCw,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  ChevronRight,
  ChevronDown,
  FileText,
  Package,
  Zap,
  Shield,
  GitBranch,
  Clock,
  Users,
  BarChart3,
  Terminal,
  Eye,
  Code
} from 'lucide-react';
import { Button } from '../../../../atoms/Button/v1.0.0/Button';
import { Card } from '../../../../molecules/Card/v1.0.0/Card';
import { Badge } from '../../../../atoms/Badge/v1.0.0/Badge';
import { Progress } from '../../../../atoms/Progress/v1.0.0/Progress';
import { Input } from '../../../../atoms/Input/v1.0.0/Input';
import { Alert, AlertDescription } from '../../../../molecules/Alert/v1.0.0/Alert';
import { useModules } from '../domain/useModules';
import { cn } from '../../../../../utils/cn';
import { TestRunner } from './TestRunner';
import { ModuleTypeViewer } from './ModuleTypeViewer';
import type { ModuleInstance, ModuleType, AssertionResult } from '../types/module.types';

export interface ModuleExplorerProps {
  className?: string;
}

export const ModuleExplorer: React.FC<ModuleExplorerProps> = ({ className }) => {
  const {
    moduleTypes,
    modules,
    selectedType,
    selectedModule,
    loading,
    error,
    filters,
    assertions,
    selectModuleType,
    selectModule,
    validateModule,
    runAllAssertions,
    setFilter,
    refreshData,
    filteredModules,
    moduleMetrics
  } = useModules();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [activeTab, setActiveTab] = useState<'explorer' | 'types' | 'tests' | 'editor'>('explorer');

  // Get selected module instance
  const currentModule = filteredModules.find(m => m.id === selectedModule);
  const currentModuleType = moduleTypes.find(t => t.id === selectedType);

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string): 'success' | 'destructive' | 'warning' | 'default' => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'invalid':
        return 'destructive';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Module Explorer
          </h3>
          
          {/* Tab Navigation */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('explorer')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
                activeTab === 'explorer'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Eye className="h-4 w-4" />
              Explorer
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
                activeTab === 'types'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Code className="h-4 w-4" />
              Types
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
                activeTab === 'tests'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Terminal className="h-4 w-4" />
              Tests
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2',
                activeTab === 'editor'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Settings className="h-4 w-4" />
              Editor
            </button>
          </div>
          
          {/* Module Type Selector */}
          <select
            value={selectedType || ''}
            onChange={(e) => selectModuleType(e.target.value || null)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select module type...</option>
            {moduleTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name} (v{type.version})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                'px-3 py-1.5 text-sm',
                viewMode === 'tree' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 text-sm',
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              Grid
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedType && runAllAssertions(selectedType)}
            disabled={!selectedType || assertions.running}
          >
            <Play className="h-4 w-4" />
            Run All
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-5 gap-2">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {moduleMetrics.total}
          </div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
          <div className="text-2xl font-bold text-green-600">
            {moduleMetrics.valid}
          </div>
          <div className="text-xs text-gray-500">Valid</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
          <div className="text-2xl font-bold text-red-600">
            {moduleMetrics.invalid}
          </div>
          <div className="text-xs text-gray-500">Invalid</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {moduleMetrics.warnings}
          </div>
          <div className="text-xs text-gray-500">Warnings</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {moduleMetrics.unchecked}
          </div>
          <div className="text-xs text-gray-500">Unchecked</div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {activeTab === 'explorer' ? (
        <div className="grid grid-cols-12 gap-4">
        {/* Module List */}
        <div className="col-span-4">
          <Card className="p-4">
            {/* Search and Filters */}
            <div className="space-y-3 mb-4">
              <Input
                type="search"
                placeholder="Search modules..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
              
              <select
                value={filters.status}
                onChange={(e) => setFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="valid">Valid</option>
                <option value="invalid">Invalid</option>
                <option value="warning">Warning</option>
                <option value="unchecked">Unchecked</option>
              </select>
            </div>

            {/* Module Tree/Grid */}
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Loading modules...</p>
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {selectedType ? 'No modules found' : 'Select a module type'}
                  </p>
                </div>
              ) : viewMode === 'tree' ? (
                filteredModules.map(module => (
                  <div
                    key={module.id}
                    onClick={() => selectModule(module.id)}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                      selectedModule === module.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(module.validation.status)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {module.name}
                      </span>
                      {module.version && (
                        <Badge variant="outline" className="text-xs">
                          v{module.version}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {module.metrics.testCoverage !== undefined && (
                        <span className="text-xs text-gray-500">
                          {module.metrics.testCoverage}%
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredModules.map(module => (
                    <Card
                      key={module.id}
                      onClick={() => selectModule(module.id)}
                      className={cn(
                        'p-3 cursor-pointer transition-colors',
                        selectedModule === module.id
                          ? 'ring-2 ring-blue-500'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        {getStatusIcon(module.validation.status)}
                        <Badge variant={getStatusVariant(module.validation.status)} className="text-xs">
                          {module.validation.status}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {module.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {module.discovery.files.length} files
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Module Details */}
        <div className="col-span-8">
          {currentModule ? (
            <Card className="p-4">
              {/* Module Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {getStatusIcon(currentModule.validation.status)}
                    {currentModule.name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">{currentModule.path}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => validateModule(currentModule.id)}
                    disabled={assertions.running}
                  >
                    <Shield className="h-4 w-4" />
                    Validate
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                    View Code
                  </Button>
                </div>
              </div>

              {/* File Structure */}
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  File Structure
                </h5>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                  {currentModule.discovery.folders.map(folder => (
                    <div key={folder} className="flex items-center gap-2 text-sm">
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">{folder}/</span>
                    </div>
                  ))}
                  {currentModule.discovery.files.map(file => (
                    <div key={file.path} className="flex items-center justify-between text-sm ml-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {file.relativePath}
                        </span>
                        {file.validation && (
                          <Badge 
                            variant={
                              file.validation.status === 'valid' ? 'success' :
                              file.validation.status === 'warning' ? 'warning' : 'destructive'
                            } 
                            className="text-xs"
                          >
                            {file.validation.status}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)}kb
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assertions */}
              {currentModuleType && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Assertions ({currentModuleType.assertions.length})
                  </h5>
                  <div className="space-y-2">
                    {currentModuleType.assertions.map(assertion => {
                      const result = assertions.results.find(
                        r => r.assertionId === assertion.id
                      );
                      
                      return (
                        <div key={assertion.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            {result ? (
                              result.status === 'passed' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : result.status === 'failed' ? (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )
                            ) : (
                              <Info className="h-4 w-4 text-gray-400" />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {assertion.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {assertion.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              assertion.severity === 'error' ? 'destructive' :
                              assertion.severity === 'warning' ? 'warning' : 'default'
                            } className="text-xs">
                              {assertion.severity}
                            </Badge>
                            {assertion.autoFix && (
                              <Badge variant="outline" className="text-xs">
                                Auto-fix
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Metrics
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Lines of Code</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentModule.metrics.linesOfCode}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Complexity</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentModule.metrics.complexity}
                    </div>
                  </div>
                  {currentModule.metrics.testCoverage !== undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Test Coverage</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentModule.metrics.testCoverage}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8">
              <div className="text-center">
                <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Module
                </h4>
                <p className="text-sm text-gray-500">
                  Choose a module from the list to view its details and run validations
                </p>
              </div>
            </Card>
          )}
        </div>
        </div>
      ) : activeTab === 'types' ? (
        /* Types Tab */
        <ModuleTypeViewer 
          moduleTypes={moduleTypes}
          className="w-full"
        />
      ) : activeTab === 'tests' ? (
        /* Tests Tab */
        <TestRunner 
          testFiles={[
            'src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.vitest.stories.test.tsx',
            'src/components/Pages/MigrationsPage/v1.0.0/ui/ModuleExplorer.addon.test.ts'
          ]}
          className="w-full"
        />
      ) : (
        /* Editor Tab - Link to Independent Page */
        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <Settings className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Module Type Editor
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create and manage module type definitions with comprehensive configuration options including discovery patterns, structure requirements, and validation rules.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  // In a real app, this would use router navigation
                  console.log('Navigate to /module-types');
                  window.open('/module-types', '_blank');
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Open Module Type Editor
              </Button>
              <p className="text-xs text-gray-500">
                Opens the dedicated Module Type Editor page
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};