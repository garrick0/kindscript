'use client';

import { useEffect, useState } from 'react';
import { ReleaseViewer } from './ReleaseViewer';

interface ReleaseViewerByIdProps {
  releaseId: string;
}

// Mock release data for now
const mockRelease = {
  id: 'release-1',
  name: 'MVP Release',
  description: 'Initial MVP release with core features',
  version: '1.0.0',
  status: 'approved' as const,
  manifest: {
    id: 'mvp-wireframe',
    name: 'MVP Wireframes',
    version: '1.0.0',
    description: 'Initial MVP wireframe release',
    pages: {},
    navigation: {
      sections: {}
    },
    statistics: {
      totalPages: 10,
      completedPages: 8,
      inProgressPages: 2,
      byPriority: {},
      bySection: {}
    }
  },
  created_by: 'system',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export function ReleaseViewerById({ releaseId }: ReleaseViewerByIdProps) {
  const [release, setRelease] = useState(mockRelease);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, fetch the release by ID
    // For now, just use mock data
    setRelease({ ...mockRelease, id: releaseId });
  }, [releaseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading release...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return <ReleaseViewer release={release} />;
}

// Export as default for backward compatibility
export { ReleaseViewerById as ReleaseViewer };