'use client';

import { useCallback } from 'react';

export interface ReleaseFiltersProps {
  currentStatus?: string;
  currentSearch?: string;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function ReleaseFilters({ 
  currentStatus = '',
  currentSearch = '',
  onFilterChange, 
  onClearFilters 
}: ReleaseFiltersProps) {

  const updateFilter = useCallback((key: string, value: string) => {
    onFilterChange(key, value);
  }, [onFilterChange]);

  return (
    <div className="space-y-6">
      {/* Search Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          type="text"
          value={currentSearch}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search releases..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="review">In Review</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Quick Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Filters
        </label>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('status', 'draft')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              currentStatus === 'draft'
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Drafts
          </button>
          <button
            onClick={() => updateFilter('status', 'review')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              currentStatus === 'review'
                ? 'bg-yellow-100 text-yellow-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => updateFilter('status', 'approved')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
              currentStatus === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Clear Filters */}
      {(currentStatus || currentSearch) && (
        <div>
          <button
            onClick={onClearFilters}
            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}