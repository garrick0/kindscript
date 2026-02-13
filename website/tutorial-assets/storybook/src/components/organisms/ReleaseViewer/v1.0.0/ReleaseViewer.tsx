'use client';

import { useState, useEffect } from 'react';
import { FileText, ExternalLink, MessageSquare, Settings } from 'lucide-react';

// Local types to avoid circular dependencies
interface Release {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  manifest: ReleaseManifest;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

interface ReleaseManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  pages: Record<string, any> | any[];
  navigation?: {
    sections: Record<string, string[]>;
  };
  statistics?: {
    totalPages: number;
    byPriority: Record<string, number>;
    bySection: Record<string, number>;
  };
}

interface ReleaseViewerProps {
  release: Release;
  studioBaseUrl?: string;
  onPageSelect?: (pageId: string) => void;
  showSidebarByDefault?: boolean;
}

export function ReleaseViewer({ 
  release, 
  studioBaseUrl = 'http://localhost:6008',
  onPageSelect,
  showSidebarByDefault = true 
}: ReleaseViewerProps) {
  const [studioUrl, setStudioUrl] = useState<string>('');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(showSidebarByDefault);

  useEffect(() => {
    // Construct Studio URL with release parameter
    const releaseExplorerUrl = `${studioBaseUrl}/?path=/story/tools-release-explorer--default&release=${release.id}`;
    setStudioUrl(releaseExplorerUrl);
  }, [release.id, studioBaseUrl]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const handlePageClick = (pageId: string) => {
    if (onPageSelect) {
      onPageSelect(pageId);
    }
  };

  const stats = release.manifest.statistics || {
    totalPages: 0,
    byPriority: { P0: 0, P1: 0, P2: 0 },
    bySection: {}
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Release Overview
            </h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalPages}</div>
                <div className="text-xs text-gray-500">Total Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.byPriority.P0 || 0}</div>
                <div className="text-xs text-gray-500">Critical (P0)</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <MessageSquare className="h-3 w-3 mr-1" />
                Comments
              </button>
              <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </button>
            </div>
          </div>

          {/* Pages List */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Pages in Release</h3>
            
            {release.manifest.navigation?.sections ? (
              Object.entries(release.manifest.navigation.sections).map(([section, pageIds]) => (
                <div key={section} className="mb-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {section}
                  </h4>
                  <div className="space-y-1">
                    {pageIds.map((pageId) => {
                      const pageData = Array.isArray(release.manifest.pages) 
                        ? release.manifest.pages.find(p => p.id === pageId)
                        : release.manifest.pages[pageId];
                      
                      return (
                        <div
                          key={pageId}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                          onClick={() => handlePageClick(pageId)}
                        >
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 flex-1">
                            {pageData?.title || pageId}
                          </span>
                          {pageData?.priority && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              pageData.priority === 'P0' ? 'bg-red-100 text-red-800' :
                              pageData.priority === 'P1' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {pageData.priority}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                No pages configured for this release
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-gray-200">
            <a
              href={studioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in New Tab
            </a>
          </div>
        </div>
      )}

      {/* Main Content - Studio Iframe */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Iframe Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1 rounded-md hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-sm text-gray-600">
              Studio Viewer - {release.name}
            </div>
          </div>
          
          {!iframeLoaded && (
            <div className="text-sm text-gray-500">Loading Studio...</div>
          )}
        </div>

        {/* Studio Iframe */}
        <div className="flex-1 relative">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading Studio...</p>
              </div>
            </div>
          )}
          
          <iframe
            src={studioUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            title={`Studio Viewer - ${release.name}`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
            style={{ 
              opacity: iframeLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out'
            }}
          />
        </div>
      </div>
    </div>
  );
}