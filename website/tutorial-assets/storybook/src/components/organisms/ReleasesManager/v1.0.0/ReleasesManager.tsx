'use client';

import { useState } from 'react';
import { ReleasesList } from '../../ReleasesList/v1.0.0/ReleasesList';
import { ReleaseFilters } from '../../ReleaseFilters/v1.0.0/ReleaseFilters';
import { useReleases } from './useReleases';
import type { FilterState } from './release.types';

interface ReleasesManagerProps {
  userId?: string;
  onNavigate?: (path: string) => void;
}

/**
 * ReleasesManager - Full releases management component with business logic
 * This is a container component that combines filters and list with data fetching
 */
export function ReleasesManager({ userId, onNavigate }: ReleasesManagerProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    search: ''
  });
  
  const { releases, loading, error, actions } = useReleases(filters);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change
      page: key !== 'page' ? 1 : (prev.page || 1)
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      search: ''
    });
  };

  const handleDelete = async (releaseId: string) => {
    setIsDeleting(releaseId);
    
    try {
      await actions.delete(releaseId);
      // Refresh data is handled by the hook
    } catch (error) {
      console.error('Error deleting release:', error);
      // In a real app, show toast notification
    } finally {
      setIsDeleting(null);
    }
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <ReleaseFilters
          currentStatus={filters.status}
          currentSearch={filters.search}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Releases List */}
      <div className="bg-white rounded-lg shadow">
        <ReleasesList
          searchParams={{
            ...filters,
            page: filters.page?.toString()
          }}
          onDelete={handleDelete}
          baseUrl="/releases"
        />
      </div>
    </div>
  );
}