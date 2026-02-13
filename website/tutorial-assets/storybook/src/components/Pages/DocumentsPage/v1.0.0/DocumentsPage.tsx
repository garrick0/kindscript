'use client'

import React, { useState, useEffect } from 'react';
import { useDocuments } from '../../../organisms/DocumentManager/v1.0.0/useDocuments';
import { useAuth } from '../../../../core/auth/useAuth';
import { useRouter } from 'next/navigation';
import { DocumentFilters } from '../../../organisms/DocumentManager/v1.0.0/document.types';
import { ErrorBoundary } from '../../../molecules/ErrorBoundary';
import { Skeleton, SkeletonCard, SkeletonList } from '../../../atoms/Skeleton';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Archive, 
  Edit, 
  Trash2,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

export interface DocumentsPageProps {
  userId?: string;
  initialFilters?: DocumentFilters;
}

export function DocumentsPage({ userId, initialFilters }: DocumentsPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    documents, 
    loading, 
    error, 
    filters,
    selectedDocument,
    actions 
  } = useDocuments(initialFilters);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAuthoritativeOnly, setShowAuthoritativeOnly] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user && !userId) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, userId, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    actions.setFilters({ ...filters, search: searchTerm });
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      const { status: _, ...rest } = filters;
      actions.setFilters(rest);
    } else {
      actions.setFilters({ ...filters, status });
    }
  };

  const handleAuthoritativeFilter = (authoritative: boolean) => {
    setShowAuthoritativeOnly(authoritative);
    if (!authoritative) {
      const { authoritative: _, ...rest } = filters;
      actions.setFilters(rest);
    } else {
      actions.setFilters({ ...filters, authoritative: true });
    }
  };

  const handleCreateDocument = async () => {
    try {
      const newDoc = await actions.createDocument({
        title: 'New Document',
        content: '# New Document\n\nStart writing here...',
        status: 'draft'
      });
      actions.selectDocument(newDoc.id);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await actions.deleteDocument(id);
      } catch (err) {
        console.error('Failed to delete document:', err);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'review': return <Clock className="h-4 w-4" />;
      case 'published': return <CheckCircle className="h-4 w-4" />;
      case 'archived': return <Archive className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-500';
      case 'review': return 'text-yellow-500';
      case 'published': return 'text-green-500';
      case 'archived': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  if (authLoading || loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Skeleton */}
            <div className="mb-8">
              <Skeleton variant="text" width="200px" height={36} className="mb-2" />
              <Skeleton variant="text" width="400px" height={24} />
            </div>

            {/* Actions Bar Skeleton */}
            <div className="bg-white shadow rounded-lg mb-6 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton variant="rounded" height={40} className="flex-1" />
                <Skeleton variant="rounded" width={100} height={40} />
                <Skeleton variant="rounded" width={140} height={40} />
              </div>
            </div>

            {/* Documents Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading documents: {error.message}</p>
          <button 
            onClick={() => actions.refetch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">Manage your authoritative documents and content</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white shadow rounded-lg mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedStatus !== 'all' || showAuthoritativeOnly) && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {selectedStatus !== 'all' ? 1 : 0} + {showAuthoritativeOnly ? 1 : 0}
                </span>
              )}
            </button>

            {/* Create Button */}
            <button
              onClick={handleCreateDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Document
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex gap-2">
                    {['all', 'draft', 'review', 'published', 'archived'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusFilter(status)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedStatus === status
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAuthoritativeFilter(false)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        !showAuthoritativeOnly
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All Documents
                    </button>
                    <button
                      onClick={() => handleAuthoritativeFilter(true)}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        showAuthoritativeOnly
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Star className="h-3 w-3" />
                      Authoritative Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first document</p>
            <button
              onClick={handleCreateDocument}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => actions.selectDocument(doc.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <span className={`text-sm ${getStatusColor(doc.status)}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </div>
                    {doc.authoritative && (
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {doc.content.substring(0, 150)}...
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doc.metadata?.author || 'Unknown'}</span>
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {doc.metadata?.tags && doc.metadata.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {doc.metadata.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {doc.collaborators && doc.collaborators.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="h-4 w-4" />
                        <span className="text-xs">{doc.collaborators.length}</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {doc.metadata?.version || 'v1.0.0'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.selectDocument(doc.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}