'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Define types locally to avoid circular dependencies
interface ReleaseListItem {
  id: string;
  name: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  page_count: number;
  created_at: string;
  created_by: string;
}

export interface ReleasesListProps {
  searchParams: {
    page?: string;
    status?: string;
    search?: string;
  };
  onDelete?: (releaseId: string) => void;
  baseUrl?: string; // For customizing link URLs
}

export function ReleasesList({ searchParams, onDelete, baseUrl = '/releases' }: ReleasesListProps) {
  const [releases, setReleases] = useState<ReleaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchReleases();
  }, [searchParams]);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchParams.page) params.set('page', searchParams.page);
      if (searchParams.status) params.set('status', searchParams.status);
      if (searchParams.search) params.set('search', searchParams.search);
      
      const response = await fetch(`/api/releases?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch releases');
      }
      
      const data = await response.json();
      setReleases(data.releases);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (releaseId: string) => {
    if (!confirm('Are you sure you want to delete this release?')) {
      return;
    }

    try {
      const response = await fetch(`/api/releases/${releaseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete release');
      }

      // Call custom onDelete handler if provided, otherwise refresh the list
      if (onDelete) {
        onDelete(releaseId);
      } else {
        fetchReleases();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete release');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      archived: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[status as keyof typeof colors] || colors.draft
      }`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading releases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="text-red-600 mb-2">Error loading releases</div>
          <p className="text-sm text-gray-600">{error}</p>
          <button 
            onClick={fetchReleases}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (releases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No releases found
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Get started by creating your first release
          </p>
          <Link
            href={`${baseUrl}/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Release
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {total} {total === 1 ? 'Release' : 'Releases'}
          </h2>
          <div className="text-sm text-gray-500">
            Page {searchParams.page || '1'}
          </div>
        </div>
      </div>

      {/* Releases List */}
      <div className="divide-y divide-gray-200">
        {releases.map((release) => (
          <div key={release.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Link
                    href={`${baseUrl}/${release.id}`}
                    className="text-lg font-medium text-gray-900 hover:text-blue-600"
                  >
                    {release.name}
                  </Link>
                  {getStatusBadge(release.status)}
                  <span className="text-sm text-gray-500">
                    v{release.version}
                  </span>
                </div>

                <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {release.page_count} {release.page_count === 1 ? 'page' : 'pages'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created {formatDistanceToNow(new Date(release.created_at), { addSuffix: true })}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {release.created_by}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <Link
                  href={`${baseUrl}/${release.id}`}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Link>
                <Link
                  href={`${baseUrl}/${release.id}/edit`}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(release.id)}
                  className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {Math.min(((parseInt(searchParams.page || '1') - 1) * 10) + 1, total)} to{' '}
              {Math.min(parseInt(searchParams.page || '1') * 10, total)} of {total} results
            </div>
            <div className="flex space-x-2">
              {parseInt(searchParams.page || '1') > 1 && (
                <Link
                  href={`?page=${parseInt(searchParams.page || '1') - 1}`}
                  className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {parseInt(searchParams.page || '1') * 10 < total && (
                <Link
                  href={`?page=${parseInt(searchParams.page || '1') + 1}`}
                  className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}