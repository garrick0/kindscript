import type { Meta, StoryObj } from '@storybook/react';
import { ReleasesList } from './ReleasesList';

const meta: Meta<typeof ReleasesList> = {
  title: 'Design System/Organisms/ReleasesList',
  component: ReleasesList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A component for displaying and managing a list of releases with filtering, pagination, and actions.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    searchParams: {
      control: 'object',
      description: 'Search and filter parameters'
    },
    baseUrl: {
      control: 'text',
      description: 'Base URL for release links'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock API response
const mockApiResponse = {
  releases: [
    {
      id: '1',
      name: 'MVP Wireframes',
      version: '1.0.0',
      status: 'approved' as const,
      page_count: 24,
      created_at: '2024-01-15T10:00:00Z',
      created_by: 'john.doe'
    },
    {
      id: '2',
      name: 'Authentication Flow',
      version: '1.2.0',
      status: 'review' as const,
      page_count: 8,
      created_at: '2024-01-20T14:30:00Z',
      created_by: 'jane.smith'
    },
    {
      id: '3',
      name: 'Dashboard Updates',
      version: '2.0.0',
      status: 'draft' as const,
      page_count: 12,
      created_at: '2024-01-25T09:15:00Z',
      created_by: 'mike.johnson'
    }
  ],
  total: 3,
  page: 1,
  limit: 10
};

// Mock fetch globally for stories
if (typeof global !== 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    })
  ) as jest.Mock;
}

export const Default: Story = {
  args: {
    searchParams: {},
    baseUrl: '/releases'
  }
};

export const WithFilters: Story = {
  args: {
    searchParams: {
      status: 'approved',
      page: '1'
    },
    baseUrl: '/releases'
  }
};

export const Loading: Story = {
  args: {
    searchParams: {}
  },
  parameters: {
    mockData: [
      {
        url: '/api/releases',
        method: 'GET',
        status: 200,
        delay: 2000,
        response: mockApiResponse
      }
    ]
  }
};

export const Empty: Story = {
  args: {
    searchParams: {}
  },
  parameters: {
    mockData: [
      {
        url: '/api/releases',
        method: 'GET',
        status: 200,
        response: {
          releases: [],
          total: 0,
          page: 1,
          limit: 10
        }
      }
    ]
  }
};

export const Error: Story = {
  args: {
    searchParams: {}
  },
  parameters: {
    mockData: [
      {
        url: '/api/releases',
        method: 'GET',
        status: 500,
        response: {
          error: 'Internal server error'
        }
      }
    ]
  }
};