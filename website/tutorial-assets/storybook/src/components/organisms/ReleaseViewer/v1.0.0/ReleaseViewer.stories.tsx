import type { Meta, StoryObj } from '@storybook/react';
// Mock actions for standalone stories
const action = (name: string) => () => console.log('Action:', name);
import { ReleaseViewer } from './ReleaseViewer';

const meta: Meta<typeof ReleaseViewer> = {
  title: 'Design System/Organisms/Release Management/ReleaseViewer',
  component: ReleaseViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive viewer for releases that displays pages in an iframe with navigation sidebar.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    release: {
      control: 'object',
      description: 'Release data to display'
    },
    studioBaseUrl: {
      control: 'text',
      description: 'Base URL for the studio iframe'
    },
    onPageSelect: {
      action: 'pageSelected',
      description: 'Called when a page is selected from the sidebar'
    },
    showSidebarByDefault: {
      control: 'boolean',
      description: 'Whether to show the sidebar by default'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock release data
const mockRelease = {
  id: 'release-1',
  name: 'MVP Wireframe Release',
  description: 'Complete wireframe set for the MVP launch',
  version: '1.0.0',
  status: 'approved' as const,
  manifest: {
    id: 'mvp-wireframe',
    name: 'MVP Wireframe Release',
    version: '1.0.0',
    description: 'Complete wireframe set for the MVP launch',
    pages: [
      {
        id: 'login',
        title: 'Login Page',
        description: 'User authentication login form',
        priority: 'P0' as const,
        route: '/login',
        version: 'v1',
        section: 'AUTH'
      },
      {
        id: 'signup',
        title: 'Sign Up Page',
        description: 'User registration form',
        priority: 'P0' as const,
        route: '/signup',
        version: 'v1',
        section: 'AUTH'
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Main application dashboard',
        priority: 'P0' as const,
        route: '/dashboard',
        version: 'v2',
        section: 'HOME'
      },
      {
        id: 'upload',
        title: 'File Upload',
        description: 'Document upload interface',
        priority: 'P1' as const,
        route: '/upload',
        version: 'v1',
        section: 'DATA'
      },
      {
        id: 'processing-status',
        title: 'Processing Status',
        description: 'Shows processing progress',
        priority: 'P1' as const,
        route: '/processing',
        version: 'v1',
        section: 'DATA'
      },
      {
        id: 'projects-list',
        title: 'Projects List',
        description: 'Display all user projects',
        priority: 'P1' as const,
        route: '/projects',
        version: 'v1',
        section: 'PROJECTS'
      }
    ],
    navigation: {
      sections: {
        'AUTH': ['login', 'signup'],
        'HOME': ['dashboard'],
        'DATA': ['upload', 'processing-status'],
        'PROJECTS': ['projects-list']
      }
    },
    statistics: {
      totalPages: 6,
      byPriority: { 'P0': 3, 'P1': 3, 'P2': 0 },
      bySection: { 'AUTH': 2, 'HOME': 1, 'DATA': 2, 'PROJECTS': 1 }
    },
    features: [
      'User authentication flow',
      'Dashboard overview',
      'File upload and processing',
      'Project management'
    ],
    knownLimitations: [
      'Mobile responsive design not included',
      'Advanced search functionality pending'
    ],
    created: '2024-01-15T10:00:00Z',
    updated: '2024-01-20T14:30:00Z'
  },
  created_by: 'user-123',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T14:30:00Z'
};

const minimalRelease = {
  ...mockRelease,
  manifest: {
    ...mockRelease.manifest,
    pages: [
      {
        id: 'login',
        title: 'Login Page',
        description: 'Simple login form',
        priority: 'P0' as const,
        route: '/login',
        version: 'v1'
      }
    ],
    navigation: {
      sections: {
        'AUTH': ['login']
      }
    },
    statistics: {
      totalPages: 1,
      byPriority: { 'P0': 1, 'P1': 0, 'P2': 0 },
      bySection: { 'AUTH': 1 }
    }
  }
};

export const Default: Story = {
  args: {
    release: mockRelease,
    studioBaseUrl: 'http://localhost:6007',
    onPageSelect: action('page-selected'),
    showSidebarByDefault: true
  }
};

export const WithSidebarHidden: Story = {
  args: {
    release: mockRelease,
    studioBaseUrl: 'http://localhost:6007',
    onPageSelect: action('page-selected'),
    showSidebarByDefault: false
  }
};

export const MinimalRelease: Story = {
  args: {
    release: minimalRelease,
    studioBaseUrl: 'http://localhost:6007',
    onPageSelect: action('page-selected'),
    showSidebarByDefault: true
  }
};

export const DraftRelease: Story = {
  args: {
    release: {
      ...mockRelease,
      status: 'draft' as const,
      name: 'Draft Release - Work in Progress'
    },
    studioBaseUrl: 'http://localhost:6007',
    onPageSelect: action('page-selected'),
    showSidebarByDefault: true
  }
};

export const ReviewRelease: Story = {
  args: {
    release: {
      ...mockRelease,
      status: 'review' as const,
      name: 'Release Under Review'
    },
    studioBaseUrl: 'http://localhost:6007',
    onPageSelect: action('page-selected'),
    showSidebarByDefault: true
  }
};

export const CustomStudioUrl: Story = {
  args: {
    release: mockRelease,
    studioBaseUrl: 'https://studio.example.com',
    onPageSelect: action('page-selected'),
    showSidebarByDefault: true
  }
};