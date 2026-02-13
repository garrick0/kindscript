'use client';

import { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';

// Local types to avoid circular dependencies
interface AvailablePage {
  id: string;
  title: string;
  description?: string;
  priority: 'P0' | 'P1' | 'P2';
  section?: string;
  latest_version: string;
  available_versions: string[];
}

interface CreateReleaseRequest {
  name: string;
  description?: string;
  version: string;
  pages: string[];
  sections?: Record<string, string[]>;
}

interface FormData {
  name: string;
  description: string;
  version: string;
  selectedPages: string[];
}

export interface CreateReleaseFormProps {
  onSubmit: (data: CreateReleaseRequest) => Promise<void>;
  onCancel: () => void;
  loadAvailablePages?: () => Promise<AvailablePage[]>;
  isLoading?: boolean;
}

export function CreateReleaseForm({ 
  onSubmit, 
  onCancel, 
  loadAvailablePages,
  isLoading = false 
}: CreateReleaseFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    version: '1.0.0',
    selectedPages: []
  });
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoadingPages(true);
      
      if (loadAvailablePages) {
        const pages = await loadAvailablePages();
        setAvailablePages(pages);
      } else {
        // Fallback to mock data for Storybook
        const mockPages = await loadPagesFromMock();
        setAvailablePages(mockPages);
      }
    } catch (err) {
      setError('Failed to load available pages');
    } finally {
      setLoadingPages(false);
    }
  };

  const loadPagesFromMock = async (): Promise<AvailablePage[]> => {
    // Mock data for Storybook and testing
    const knownPages = [
      'login', 'signup', 'password-reset', 'dashboard', 'upload', 'processing-status',
      'projects-list', 'code-preview', 'prd-preview', 'conflict-resolution',
      'consolidation-review', 'wireframe-explorer', 'error', 'deployment-config',
      'deployment-success'
    ];

    return knownPages.map(pageId => ({
      id: pageId,
      title: pageId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: `${pageId} wireframe component`,
      priority: pageId.includes('login') || pageId.includes('dashboard') ? 'P0' as const : 'P1' as const,
      section: determineSectionFromId(pageId),
      latest_version: 'v1',
      available_versions: ['v1']
    }));
  };

  const determineSectionFromId = (pageId: string): string => {
    if (pageId.includes('login') || pageId.includes('signup') || pageId.includes('password')) {
      return 'AUTH';
    }
    if (pageId.includes('dashboard')) {
      return 'HOME';
    }
    if (pageId.includes('upload') || pageId.includes('processing')) {
      return 'DATA';
    }
    if (pageId.includes('project') || pageId.includes('code') || pageId.includes('prd')) {
      return 'PROJECTS';
    }
    if (pageId.includes('error') || pageId.includes('deploy')) {
      return 'SYSTEM';
    }
    return 'OTHER';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const requestData: CreateReleaseRequest = {
        name: formData.name,
        description: formData.description || undefined,
        version: formData.version,
        pages: formData.selectedPages
      };

      await onSubmit(requestData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const togglePageSelection = (pageId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPages: prev.selectedPages.includes(pageId)
        ? prev.selectedPages.filter(id => id !== pageId)
        : [...prev.selectedPages, pageId]
    }));
  };

  const filteredPages = availablePages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.section?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pagesBySection = filteredPages.reduce((acc, page) => {
    const section = page.section || 'OTHER';
    if (!acc[section]) acc[section] = [];
    acc[section].push(page);
    return acc;
  }, {} as Record<string, AvailablePage[]>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-100 text-red-800';
      case 'P1': return 'bg-yellow-100 text-yellow-800';
      case 'P2': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-gray-900">Release Information</h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Release Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., MVP Wireframes"
            />
          </div>

          <div>
            <label htmlFor="version" className="block text-sm font-medium text-gray-700">
              Version *
            </label>
            <input
              type="text"
              id="version"
              required
              pattern="^\d+\.\d+\.\d+$"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1.0.0"
            />
            <p className="mt-1 text-xs text-gray-500">Use semantic versioning (e.g., 1.0.0)</p>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the purpose of this release..."
          />
        </div>
      </div>

      {/* Page Selection */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Select Pages</h2>
          <div className="text-sm text-gray-500">
            {formData.selectedPages.length} selected
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {loadingPages ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading available pages...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(pagesBySection).map(([section, pages]) => (
              <div key={section} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-900 mb-3">{section}</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        formData.selectedPages.includes(page.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => togglePageSelection(page.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.selectedPages.includes(page.id)}
                              onChange={() => togglePageSelection(page.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <h4 className="text-sm font-medium text-gray-900">
                              {page.title}
                            </h4>
                          </div>
                          {page.description && (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {page.description}
                            </p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          getPriorityColor(page.priority)
                        }`}>
                          {page.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {formData.selectedPages.length === 0 && !loadingPages && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No pages selected. Choose pages to include in your release.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || formData.selectedPages.length === 0 || !formData.name.trim()}
          className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Release'}
        </button>
      </div>
    </form>
  );
}