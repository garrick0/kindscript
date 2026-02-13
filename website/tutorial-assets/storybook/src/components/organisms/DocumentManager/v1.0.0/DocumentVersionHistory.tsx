'use client';

import { useState } from 'react';
import { Clock, GitBranch, Eye, RotateCcw } from 'lucide-react';
import { cn } from '../../../../utils/cn';

// Component's version interface
interface Version {
  id: string;
  version: string;
  timestamp: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  changes: string[];
  content?: string;
}

// Supabase database version interface (for compatibility)
interface DatabaseVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string | null;
  metadata: any;
  author_id: string | null;
  created_at: string;
}

interface DocumentVersionHistoryProps {
  documentId?: string; // Platform passes documentId
  versions?: (Version | DatabaseVersion)[]; // Accept both formats
  currentVersion?: string;
  currentContent?: string; // Platform passes currentContent
  onRestore?: (version: any) => void; // Platform expects full version object
  onPreview?: (versionId: string) => void;
  onClose?: () => void; // Platform passes onClose
  className?: string;
}

export function DocumentVersionHistory({
  versions = [],
  currentVersion,
  onRestore,
  onPreview,
  className
}: DocumentVersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  // Helper to normalize version data from different sources
  const normalizeVersion = (v: Version | DatabaseVersion): Version => {
    if ('version_number' in v) {
      // This is a DatabaseVersion from Supabase
      return {
        id: v.id,
        version: `v${v.version_number}`,
        timestamp: v.created_at,
        author: {
          name: 'Unknown User', // TODO: Join with users table
          email: v.author_id || 'unknown@example.com'
        },
        changes: ['Document updated'], // TODO: Calculate changes
        content: v.content || undefined
      };
    }
    // This is already a Version object
    return v as Version;
  };

  const normalizedVersions = versions.map(normalizeVersion);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (normalizedVersions.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No version history available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
          {versions.length} versions
        </span>
      </div>

      <div className="space-y-3">
        {normalizedVersions.map((version) => {
          const { date, time } = formatDate(version.timestamp);
          const isExpanded = expandedVersion === version.id;
          const isCurrent = version.id === currentVersion;

          return (
            <div
              key={version.id}
              className={cn(
                "border rounded-lg transition-all",
                isCurrent 
                  ? "border-blue-300 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {version.author.avatar ? (
                      <img
                        src={version.author.avatar}
                        alt={version.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {getInitials(version.author.name)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {version.version}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{version.author.name}</span>
                      {' • '}
                      <span>{date} at {time}</span>
                    </div>

                    <div className="text-sm text-gray-700">
                      {version.changes.slice(0, 2).map((change, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {change}
                        </div>
                      ))}
                      {version.changes.length > 2 && !isExpanded && (
                        <div className="text-blue-600 text-xs mt-1">
                          +{version.changes.length - 2} more changes
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onPreview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(version.id);
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Preview this version"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {onRestore && !isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Restore this version? This will create a new version based on this content.')) {
                            onRestore(version);
                          }
                        }}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Restore this version"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">All Changes</h4>
                      <div className="space-y-1">
                        {version.changes.map((change, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            {change}
                          </div>
                        ))}
                      </div>
                    </div>

                    {version.content && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Content Preview</h4>
                        <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {version.content.slice(0, 300)}
                            {version.content.length > 300 && '...'}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {onPreview && (
                        <button
                          onClick={() => onPreview(version.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          <Eye className="h-3 w-3" />
                          Full Preview
                        </button>
                      )}
                      {onRestore && !isCurrent && (
                        <button
                          onClick={() => {
                            if (confirm('Restore this version? This will create a new version based on this content.')) {
                              onRestore(version);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { DocumentVersionHistoryProps, Version };