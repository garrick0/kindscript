'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, SortAsc, SortDesc, Calendar } from 'lucide-react';
import { cn } from '../../../../utils/cn';

export interface DocumentFilters {
  query: string;
  type: string;
  level: string;
  status: string;
  authoritative: boolean | null;
  dateRange: {
    start: string;
    end: string;
  } | null;
  sortBy: 'title' | 'updated_at' | 'created_at';
  sortOrder: 'asc' | 'desc';
}

interface DocumentSearchProps {
  onFiltersChange: (filters: DocumentFilters) => void;
  initialFilters?: DocumentFilters;
  className?: string;
}

const DOCUMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'prd', label: 'Product Requirements' },
  { value: 'spec', label: 'Technical Spec' },
  { value: 'guide', label: 'Guide/Tutorial' },
  { value: 'note', label: 'Note/Research' },
  { value: 'wireframe', label: 'Wireframe/Design' },
  { value: 'strategy', label: 'Strategy Document' },
  { value: 'technical', label: 'Technical Documentation' },
];

const DOCUMENT_LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'product', label: 'Product' },
  { value: 'release', label: 'Release' },
  { value: 'page', label: 'Page' },
];

const DOCUMENT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Last Modified' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'title', label: 'Title' },
];

export function DocumentSearch({ 
  onFiltersChange, 
  initialFilters,
  className 
}: DocumentSearchProps) {
  const [filters, setFilters] = useState<DocumentFilters>({
    query: '',
    type: '',
    level: '',
    status: '',
    authoritative: null,
    dateRange: null,
    sortBy: 'updated_at',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({
    start: filters.dateRange?.start || '',
    end: filters.dateRange?.end || '',
  });

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilters = (newFilters: Partial<DocumentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    const clearedFilters: DocumentFilters = {
      query: '',
      type: '',
      level: '',
      status: '',
      authoritative: null,
      dateRange: null,
      sortBy: 'updated_at',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    setTempDateRange({ start: '', end: '' });
  };

  const applyDateRange = () => {
    if (tempDateRange.start || tempDateRange.end) {
      updateFilters({
        dateRange: {
          start: tempDateRange.start,
          end: tempDateRange.end,
        }
      });
    } else {
      updateFilters({ dateRange: null });
    }
  };

  const hasActiveFilters = filters.query || filters.type || filters.level || 
    filters.status || filters.authoritative !== null || filters.dateRange;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={filters.query}
            onChange={(e) => updateFilters({ query: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg transition-colors",
            showAdvancedFilters 
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : "hover:bg-gray-50"
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-2 h-2"></span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => updateFilters({ type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => updateFilters({ level: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DOCUMENT_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {DOCUMENT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Authoritative Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authority
              </label>
              <select
                value={filters.authoritative === null ? '' : String(filters.authoritative)}
                onChange={(e) => updateFilters({ 
                  authoritative: e.target.value === '' ? null : e.target.value === 'true' 
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Documents</option>
                <option value="true">Authoritative Only</option>
                <option value="false">Non-Authoritative</option>
              </select>
            </div>
          </div>

          {/* Date Range and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={tempDateRange.start}
                  onChange={(e) => setTempDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={tempDateRange.end}
                  onChange={(e) => setTempDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={applyDateRange}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex gap-1">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ 
                    sortBy: e.target.value as DocumentFilters['sortBy'] 
                  })}
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => updateFilters({
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                  })}
                  className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {filters.sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {filters.query && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1">
                    Search: "{filters.query}"
                    <button 
                      onClick={() => updateFilters({ query: '' })}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.type && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full flex items-center gap-1">
                    Type: {DOCUMENT_TYPES.find(t => t.value === filters.type)?.label}
                    <button 
                      onClick={() => updateFilters({ type: '' })}
                      className="hover:text-purple-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.level && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full flex items-center gap-1">
                    Level: {DOCUMENT_LEVELS.find(l => l.value === filters.level)?.label}
                    <button 
                      onClick={() => updateFilters({ level: '' })}
                      className="hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center gap-1">
                    Status: {DOCUMENT_STATUSES.find(s => s.value === filters.status)?.label}
                    <button 
                      onClick={() => updateFilters({ status: '' })}
                      className="hover:text-green-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.authoritative !== null && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full flex items-center gap-1">
                    {filters.authoritative ? 'Authoritative Only' : 'Non-Authoritative'}
                    <button 
                      onClick={() => updateFilters({ authoritative: null })}
                      className="hover:text-orange-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.dateRange && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full flex items-center gap-1">
                    Date: {filters.dateRange.start} to {filters.dateRange.end}
                    <button 
                      onClick={() => {
                        updateFilters({ dateRange: null });
                        setTempDateRange({ start: '', end: '' });
                      }}
                      className="hover:text-gray-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { DocumentSearchProps };