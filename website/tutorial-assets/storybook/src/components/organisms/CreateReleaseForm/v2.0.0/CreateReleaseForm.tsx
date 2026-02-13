'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReleaseSchema, CreateReleaseInput } from '../../ReleasesManager/v1.0.0/release.validation';
import { FormField, TextAreaField, SelectField } from '../../../molecules/FormField/v1.0.0/FormField';
import { Button } from '../../../atoms/Button/v1.0.0/Button';
import { useToast } from '../../../molecules/Toast/v1.0.0/Toast';
import { FileText, Search, Plus, X, Calendar, Tag } from 'lucide-react';

interface AvailablePage {
  id: string;
  title: string;
  description?: string;
  priority: 'P0' | 'P1' | 'P2';
  section?: string;
  latest_version: string;
  available_versions: string[];
}

export interface CreateReleaseFormProps {
  onSubmit: (data: CreateReleaseInput) => Promise<void>;
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
  const [availablePages, setAvailablePages] = useState<AvailablePage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [pageSearch, setPageSearch] = useState('');
  const [loadingPages, setLoadingPages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateReleaseInput>({
    resolver: zodResolver(createReleaseSchema as any),
    defaultValues: {
      name: '',
      description: '',
      version: 'v1.0.0',
      releaseDate: new Date().toISOString().split('T')[0],
      pages: [],
      metadata: {},
    },
  });

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    setValue('pages', selectedPages);
  }, [selectedPages, setValue]);

  const loadPages = async () => {
    if (!loadAvailablePages) return;
    
    setLoadingPages(true);
    try {
      const pages = await loadAvailablePages();
      setAvailablePages(pages);
    } catch (error) {
      toast.addToast({ title: 'Failed to load available pages', variant: 'destructive' });
      console.error('Error loading pages:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleFormSubmit = async (data: CreateReleaseInput) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      toast.addToast({ title: 'Release created successfully!', variant: 'success' });
    } catch (error) {
      toast.addToast({ title: 'Failed to create release', variant: 'destructive' });
      console.error('Error creating release:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const togglePage = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const filteredPages = availablePages.filter(page =>
    page.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
    page.description?.toLowerCase().includes(pageSearch.toLowerCase())
  );

  const priorityColors = {
    P0: 'bg-red-100 text-red-800 border-red-200',
    P1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    P2: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Release</h2>
          <p className="mt-1 text-sm text-gray-600">
            Define your release details and select the pages to include
          </p>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <FormField
              name="name"
              label="Release Name"
              placeholder="e.g., Q1 2024 Product Update"
              register={register}
              error={errors.name}
              required
              autoFocus
            />

            <TextAreaField
              name="description"
              label="Description"
              placeholder="Describe the purpose and content of this release..."
              register={register}
              error={errors.description}
              required
              rows={4}
              maxLength={500}
              showCount
              helpText="Provide a clear description of what this release contains"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="version"
                label="Version"
                placeholder="v1.0.0"
                register={register}
                error={errors.version}
                required
                helpText="Use semantic versioning (v1.0.0)"
              />

              <FormField
                name="releaseDate"
                label="Release Date"
                type="date"
                register={register}
                error={errors.releaseDate}
              />
            </div>
          </div>

          {/* Page Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Select Pages</h3>
              <span className="text-sm text-gray-500">
                {selectedPages.length} pages selected
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Pages List */}
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
              {loadingPages ? (
                <div className="p-8 text-center text-gray-500">Loading pages...</div>
              ) : filteredPages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {pageSearch ? 'No pages found matching your search' : 'No pages available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredPages.map((page) => (
                    <div
                      key={page.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedPages.includes(page.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => togglePage(page.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <h4 className="font-medium text-gray-900">{page.title}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${priorityColors[page.priority]}`}>
                              {page.priority}
                            </span>
                          </div>
                          {page.description && (
                            <p className="mt-1 text-sm text-gray-600">{page.description}</p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            {page.section && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {page.section}
                              </span>
                            )}
                            <span>Version: {page.latest_version}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errors.pages && (
              <p className="text-sm text-red-600">{errors.pages.message}</p>
            )}
          </div>

          {/* Selected Pages Summary */}
          {selectedPages.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Selected Pages</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPages.map((pageId) => {
                  const page = availablePages.find(p => p.id === pageId);
                  if (!page) return null;
                  return (
                    <span
                      key={pageId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {page.title}
                      <button
                        type="button"
                        onClick={() => togglePage(pageId)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || isLoading}
          >
            {submitting ? 'Creating...' : 'Create Release'}
          </Button>
        </div>
      </div>
    </form>
  );
}