import type { Meta, StoryObj } from '@storybook/react';
import { ReleasesManager } from './ReleasesManager';

const meta: Meta<typeof ReleasesManager> = {
  title: 'Design System/Organisms/ReleasesManager',
  component: ReleasesManager,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete release management interface with filtering and CRUD operations',
      },
    },
  },
  argTypes: {
    baseUrl: {
      control: 'text',
      description: 'Base URL for release routes',
    },
    apiEndpoint: {
      control: 'text', 
      description: 'API endpoint for release operations',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    baseUrl: '/releases',
    apiEndpoint: '/api/releases',
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/releases',
        query: {},
      },
    },
  },
};

export const WithFiltersApplied: Story = {
  args: {
    baseUrl: '/releases',
    apiEndpoint: '/api/releases',
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/releases',
        query: {
          status: 'approved',
          search: 'mobile',
        },
      },
    },
  },
};

export const CustomEndpoints: Story = {
  args: {
    baseUrl: '/admin/releases',
    apiEndpoint: '/api/admin/releases',
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/admin/releases',
        query: {},
      },
    },
  },
};