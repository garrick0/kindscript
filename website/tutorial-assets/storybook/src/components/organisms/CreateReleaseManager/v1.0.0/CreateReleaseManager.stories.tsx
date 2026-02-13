import type { Meta, StoryObj } from '@storybook/react';
import { CreateReleaseManager } from './CreateReleaseManager';
import type { AvailablePage, CreateReleaseRequest } from '@induction/shared';

const meta: Meta<typeof CreateReleaseManager> = {
  title: 'Design System/Organisms/CreateReleaseManager',
  component: CreateReleaseManager,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Complete release creation interface with form handling and navigation',
      },
    },
  },
  argTypes: {
    apiEndpoint: {
      control: 'text',
      description: 'API endpoint for creating releases',
    },
    baseUrl: {
      control: 'text',
      description: 'Base URL to redirect to after creation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockAvailablePages: AvailablePage[] = [
  {
    id: 'login',
    title: 'Login',
    description: 'User authentication page',
    priority: 'P0',
    section: 'AUTH',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Main application dashboard',
    priority: 'P0', 
    section: 'HOME',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'projects-list',
    title: 'Projects List',
    description: 'List of user projects',
    priority: 'P1',
    section: 'PROJECTS',
    latest_version: 'v1',
    available_versions: ['v1']
  }
];

export const Default: Story = {
  args: {
    apiEndpoint: '/api/releases',
    baseUrl: '/releases',
  },
};

export const WithCustomPages: Story = {
  args: {
    apiEndpoint: '/api/releases',
    baseUrl: '/releases',
    loadAvailablePages: async () => mockAvailablePages,
  },
};

export const CustomEndpoints: Story = {
  args: {
    apiEndpoint: '/api/admin/releases',
    baseUrl: '/admin/releases',
    loadAvailablePages: async () => mockAvailablePages,
  },
};

export const WithCustomHandlers: Story = {
  args: {
    onSubmit: async (data: CreateReleaseRequest) => {
      console.log('Custom submit:', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => {
      console.log('Custom cancel');
    },
    loadAvailablePages: async () => mockAvailablePages,
  },
};