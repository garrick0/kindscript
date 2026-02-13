'use client';

import { useRouter } from 'next/navigation';
import { CreateReleaseForm } from '../../CreateReleaseForm/v1.0.0/CreateReleaseForm';
// Local types to avoid circular dependencies
interface AvailablePage {
  id: string;
  title: string;
  description?: string;
  priority: 'P0' | 'P1' | 'P2';
  section?: string;
  latest_version: string;
  available_versions: string[];
}

interface CreateReleaseRequest {
  name: string;
  description?: string;
  version: string;
  pages: string[];
  sections?: Record<string, string[]>;
}

export interface CreateReleaseManagerProps {
  /** API endpoint for creating releases */
  apiEndpoint?: string;
  /** Base URL to redirect to after creation */
  baseUrl?: string;
  /** Custom function to load available pages */
  loadAvailablePages?: () => Promise<AvailablePage[]>;
  /** Custom submit handler */
  onSubmit?: (data: CreateReleaseRequest) => Promise<void>;
  /** Custom cancel handler */
  onCancel?: () => void;
}

export function CreateReleaseManager({
  apiEndpoint = '/api/releases',
  baseUrl = '/releases',
  loadAvailablePages: customLoadAvailablePages,
  onSubmit: customSubmit,
  onCancel: customCancel,
}: CreateReleaseManagerProps) {
  const router = useRouter();

  const handleSubmit = customSubmit || (async (data: CreateReleaseRequest) => {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create release');
    }

    const release = await response.json();
    router.push(`${baseUrl}/${release.id}`);
  });

  const handleCancel = customCancel || (() => {
    router.back();
  });

  const loadAvailablePages = customLoadAvailablePages || (async (): Promise<AvailablePage[]> => {
    // Default implementation - could be replaced with API call
    const knownPages = [
      'login', 'signup', 'password-reset', 'dashboard', 'upload', 'processing-status',
      'projects-list', 'code-preview', 'prd-preview', 'conflict-resolution',
      'consolidation-review', 'wireframe-explorer', 'error', 'deployment-config',
      'deployment-success'
    ];

    return knownPages.map(pageId => ({
      id: pageId,
      title: pageId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: `${pageId} wireframe component`,
      priority: pageId.includes('login') || pageId.includes('dashboard') ? 'P0' as const : 'P1' as const,
      section: determineSectionFromId(pageId),
      latest_version: 'v1',
      available_versions: ['v1']
    }));
  });

  const determineSectionFromId = (pageId: string): string => {
    if (pageId.includes('login') || pageId.includes('signup') || pageId.includes('password')) {
      return 'AUTH';
    }
    if (pageId.includes('dashboard')) {
      return 'HOME';
    }
    if (pageId.includes('upload') || pageId.includes('processing')) {
      return 'DATA';
    }
    if (pageId.includes('project') || pageId.includes('code') || pageId.includes('prd')) {
      return 'PROJECTS';
    }
    if (pageId.includes('error') || pageId.includes('deploy')) {
      return 'SYSTEM';
    }
    return 'OTHER';
  };

  return (
    <CreateReleaseForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loadAvailablePages={loadAvailablePages}
    />
  );
}