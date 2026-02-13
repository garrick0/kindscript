'use client';

import { useState } from 'react';
import { 
  FileText, 
  Grid, 
  List, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Share2, 
  Copy,
  Star
} from 'lucide-react';
import { cn } from '../../../../utils/cn';

// Base document type for the component (platform will provide the full type)
interface BaseDocument {
  id: string;
  title: string;
  status: string;
  type?: string | null;
  level?: string | null;
  updated_at: string;
  metadata?: {
    authoritative?: boolean;
    [key: string]: any;
  } | null; // Supabase can return null for Json fields
}

interface DocumentListProps {
  documents: BaseDocument[];
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  onEdit?: (document: BaseDocument) => void;
  onDelete?: (documentId: string) => void;
  onShare?: (document: BaseDocument) => void;
  onCopyLink?: (document: BaseDocument) => void;
  onToggleFavorite?: (document: BaseDocument) => void;
  isDeleting?: boolean;
  className?: string;
}

export function DocumentList({ 
  documents, 
  view, 
  onViewChange,
  onEdit,
  onDelete,
  onShare,
  onCopyLink,
  onToggleFavorite,
  isDeleting = false,
  className
}: DocumentListProps) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const handleSelectDocument = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedDocs);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedDocs(newSelected);
  };

  // handleSelectAll removed as unused

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string | null | undefined) => {
    switch (type) {
      case 'prd': return '📋';
      case 'spec': return '🔧';
      case 'guide': return '📖';
      case 'note': return '📝';
      case 'wireframe': return '🎨';
      case 'strategy': return '🎯';
      case 'technical': return '⚙️';
      default: return '📄';
    }
  };

  const DocumentMenu = ({ document }: { document: BaseDocument }) => (
    <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
      <div className="py-1">
        <button
          onClick={() => {
            onEdit?.(document);
            setShowMenu(null);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Edit className="h-4 w-4" />
          Open & Edit
        </button>
        <button
          onClick={() => {
            onCopyLink?.(document);
            setShowMenu(null);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Copy className="h-4 w-4" />
          Copy Link
        </button>
        <button 
          onClick={() => {
            onShare?.(document);
            setShowMenu(null);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button 
          onClick={() => {
            onToggleFavorite?.(document);
            setShowMenu(null);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <Star className="h-4 w-4" />
          Add to Favorites
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={() => {
            onDelete?.(document.id);
            setShowMenu(null);
          }}
          disabled={isDeleting}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );

  if (documents.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-64 text-gray-500", className)}>
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No documents found</h3>
        <p className="text-sm text-center">
          Create your first document or adjust your search filters
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
            {selectedDocs.size > 0 && (
              <span className="ml-2">
                ({selectedDocs.size} selected)
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewChange('list')}
            className={cn(
              'p-1.5 rounded',
              view === 'list' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange('grid')}
            className={cn(
              'p-1.5 rounded',
              view === 'grid' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocs.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedDocs.size} selected
          </span>
          <div className="flex gap-1 ml-4">
            <button 
              onClick={() => {
                const selectedDocuments = documents.filter(doc => selectedDocs.has(doc.id));
                selectedDocuments.forEach(doc => onShare?.(doc));
              }}
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Share
            </button>
            <button className="px-2 py-1 text-sm border border-blue-300 text-blue-700 rounded hover:bg-blue-100">
              Export
            </button>
            <button 
              onClick={() => {
                selectedDocs.forEach(id => onDelete?.(id));
              }}
              className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedDocs(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-1">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
            >
              <input
                type="checkbox"
                checked={selectedDocs.has(document.id)}
                onChange={(e) => handleSelectDocument(document.id, e.target.checked)}
                className="rounded"
              />
              
              <div className="text-xl">{getTypeIcon(document.type)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit?.(document)}
                    className="font-medium text-gray-900 hover:text-blue-600 truncate text-left"
                  >
                    {document.title}
                  </button>
                  {document.metadata?.authoritative && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                      Authoritative
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    getStatusColor(document.status)
                  )}>
                    {document.status}
                  </span>
                  {document.type && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                      {document.type}
                    </span>
                  )}
                  {document.level && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded">
                      {document.level}
                    </span>
                  )}
                  <span>Modified {formatDate(document.updated_at)}</span>
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === document.id ? null : document.id)}
                  className="p-1.5 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu === document.id && (
                  <DocumentMenu document={document} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((document) => (
            <div
              key={document.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <input
                  type="checkbox"
                  checked={selectedDocs.has(document.id)}
                  onChange={(e) => handleSelectDocument(document.id, e.target.checked)}
                  className="rounded"
                />
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(showMenu === document.id ? null : document.id)}
                    className="p-1.5 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {showMenu === document.id && (
                    <DocumentMenu document={document} />
                  )}
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{getTypeIcon(document.type)}</div>
                <button
                  onClick={() => onEdit?.(document)}
                  className="font-medium text-gray-900 hover:text-blue-600 block truncate"
                >
                  {document.title}
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    getStatusColor(document.status)
                  )}>
                    {document.status}
                  </span>
                  {document.type && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                      {document.type}
                    </span>
                  )}
                  {document.metadata?.authoritative && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                      Auth
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Modified {formatDate(document.updated_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
}

export type { DocumentListProps, BaseDocument };