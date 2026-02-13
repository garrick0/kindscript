/**
 * ModuleTypeViewer Component
 * 
 * Provides a detailed interface for viewing and understanding module type definitions.
 * Shows the structure, patterns, assertions, and templates for each module type.
 */

import React, { useState } from 'react';
import {
  Package,
  FileText,
  Folder,
  AlertCircle,
  CheckCircle,
  Info,
  Settings,
  Code,
  Shield,
  Play,
  Clock,
  Tag,
  User,
  Calendar,
  Book,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  FileCode,
  Zap
} from 'lucide-react';
import { Button } from '../../../../atoms/Button/v1.0.0/Button';
import { Card } from '../../../../molecules/Card/v1.0.0/Card';
import { Badge } from '../../../../atoms/Badge/v1.0.0/Badge';
import { Input } from '../../../../atoms/Input/v1.0.0/Input';
import { cn } from '../../../../../utils/cn';
import type { ModuleType, ModuleAssertion } from '../types/module.types';
import { defaultModuleTypes } from '../data/default-module-types';

interface ModuleTypeViewerProps {
  className?: string;
  moduleTypes?: ModuleType[];
}

export function ModuleTypeViewer({ className = '', moduleTypes = defaultModuleTypes }: ModuleTypeViewerProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    discovery: true,
    structure: true,
    assertions: true
  });

  // Get all unique tags
  const allTags = Array.from(new Set(
    moduleTypes.flatMap(type => type.metadata.tags)
  ));

  // Filter module types
  const filteredTypes = moduleTypes.filter(type => {
    const matchesSearch = !searchTerm || 
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = filterTag === 'all' || type.metadata.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  const currentType = moduleTypes.find(t => t.id === selectedType);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAssertionIcon = (type: string) => {
    switch (type) {
      case 'eslint': return <Shield className="h-4 w-4" />;
      case 'test': return <Play className="h-4 w-4" />;
      case 'structure': return <Folder className="h-4 w-4" />;
      case 'dependency': return <Package className="h-4 w-4" />;
      case 'custom': return <Code className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("bg-white rounded-lg border shadow-sm", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Module Types</h3>
            <Badge variant="outline">{moduleTypes.length} types</Badge>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search module types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex h-96">
        {/* Type List */}
        <div className="w-1/3 border-r p-4 overflow-y-auto">
          <div className="space-y-2">
            {filteredTypes.map(type => (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50",
                  selectedType === type.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{type.name}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {type.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">v{type.version}</Badge>
                      <span className="text-xs text-gray-400">
                        {type.assertions.length} assertions
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {type.metadata.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                      {type.metadata.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{type.metadata.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type Details */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentType ? (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold">{currentType.name}</h2>
                  <Badge variant="outline">v{currentType.version}</Badge>
                </div>
                <p className="text-gray-600 mb-4">{currentType.description}</p>
                
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Author:</span>
                    <span>{currentType.metadata.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Updated:</span>
                    <span>{new Date(currentType.metadata.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentType.metadata.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Discovery Pattern */}
              <div>
                <button
                  onClick={() => toggleSection('discovery')}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  {expandedSections.discovery ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Search className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Discovery Pattern</span>
                </button>
                
                {expandedSections.discovery && (
                  <div className="ml-6 mt-2 space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium">Base Pattern:</span>
                          <code className="ml-2 px-2 py-1 bg-white rounded text-xs font-mono">
                            {currentType.discovery.basePattern}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Instance Pattern:</span>
                          <code className="ml-2 px-2 py-1 bg-white rounded text-xs font-mono">
                            {currentType.discovery.instancePattern}
                          </code>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="text-sm font-medium text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Required Files</span>
                        </span>
                        <ul className="mt-1 space-y-1 text-xs">
                          {currentType.discovery.filePatterns.required.map(pattern => (
                            <li key={pattern} className="font-mono bg-green-50 px-2 py-1 rounded">
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-blue-600 flex items-center space-x-1">
                          <Info className="h-4 w-4" />
                          <span>Optional Files</span>
                        </span>
                        <ul className="mt-1 space-y-1 text-xs">
                          {currentType.discovery.filePatterns.optional.map(pattern => (
                            <li key={pattern} className="font-mono bg-blue-50 px-2 py-1 rounded">
                              {pattern}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {currentType.discovery.filePatterns.forbidden.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-red-600 flex items-center space-x-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>Forbidden Files</span>
                          </span>
                          <ul className="mt-1 space-y-1 text-xs">
                            {currentType.discovery.filePatterns.forbidden.map(pattern => (
                              <li key={pattern} className="font-mono bg-red-50 px-2 py-1 rounded">
                                {pattern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Structure */}
              <div>
                <button
                  onClick={() => toggleSection('structure')}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  {expandedSections.structure ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Folder className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Structure Requirements</span>
                </button>
                
                {expandedSections.structure && (
                  <div className="ml-6 mt-2 space-y-3">
                    {currentType.structure.folders.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Folders:</span>
                        <div className="mt-1 space-y-2">
                          {currentType.structure.folders.map(folder => (
                            <div key={folder.path} className="flex items-center space-x-2 text-sm">
                              <Folder className="h-4 w-4 text-blue-500" />
                              <code className="font-mono">{folder.path}</code>
                              <Badge variant={folder.required ? "default" : "secondary"} className="text-xs">
                                {folder.required ? 'Required' : 'Optional'}
                              </Badge>
                              <span className="text-gray-500">- {folder.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {currentType.structure.files.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Files:</span>
                        <div className="mt-1 space-y-2">
                          {currentType.structure.files.map(file => (
                            <div key={file.path} className="flex items-center space-x-2 text-sm">
                              <FileCode className="h-4 w-4 text-green-500" />
                              <code className="font-mono">{file.path}</code>
                              <Badge variant={file.required ? "default" : "secondary"} className="text-xs">
                                {file.required ? 'Required' : 'Optional'}
                              </Badge>
                              {file.validation && (
                                <Badge variant="outline" className="text-xs">
                                  Validated
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Assertions */}
              <div>
                <button
                  onClick={() => toggleSection('assertions')}
                  className="flex items-center space-x-2 w-full text-left p-2 hover:bg-gray-50 rounded"
                >
                  {expandedSections.assertions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Assertions ({currentType.assertions.length})</span>
                </button>
                
                {expandedSections.assertions && (
                  <div className="ml-6 mt-2 space-y-3">
                    {currentType.assertions.map(assertion => (
                      <Card key={assertion.id} className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className={cn("p-1.5 rounded", getSeverityColor(assertion.severity))}>
                            {getAssertionIcon(assertion.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium text-sm">{assertion.name}</h5>
                              <Badge variant="outline" className="text-xs">
                                {assertion.type}
                              </Badge>
                              <Badge variant={assertion.severity === 'error' ? 'destructive' : assertion.severity === 'warning' ? 'secondary' : 'default'} className="text-xs">
                                {assertion.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{assertion.description}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{assertion.execution.timeout / 1000}s timeout</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Zap className="h-3 w-3" />
                                <span>Run on {assertion.execution.runOn}</span>
                              </div>
                              {assertion.autoFix && (
                                <Badge variant="outline" className="text-xs">Auto-fix</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentation Link */}
              {currentType.metadata.documentation && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Book className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Documentation:</span>
                    <a 
                      href={currentType.metadata.documentation}
                      className="text-blue-600 text-sm underline hover:text-blue-800"
                    >
                      {currentType.metadata.documentation}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a module type to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}