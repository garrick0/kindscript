import type { Meta, StoryObj } from '@storybook/react';
// Mock actions for standalone stories
const action = (name: string) => () => console.log('Action:', name);
import { CreateReleaseForm } from './CreateReleaseForm';

const meta: Meta<typeof CreateReleaseForm> = {
  title: 'Design System/Organisms/Release Management/CreateReleaseForm',
  component: CreateReleaseForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive form for creating new releases with page selection, validation, and submission.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: {
      action: 'submitted',
      description: 'Called when the form is submitted with valid data'
    },
    onCancel: {
      action: 'cancelled',
      description: 'Called when the user cancels the form'
    },
    loadAvailablePages: {
      description: 'Function to load available pages for selection'
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the form is in a loading state'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock available pages data
const mockAvailablePages = [
  {
    id: 'login',
    title: 'Login Page',
    description: 'User authentication login form',
    priority: 'P0' as const,
    section: 'AUTH',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'signup',
    title: 'Sign Up Page',
    description: 'User registration form',
    priority: 'P0' as const,
    section: 'AUTH',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Main application dashboard',
    priority: 'P0' as const,
    section: 'HOME',
    latest_version: 'v2',
    available_versions: ['v1', 'v2']
  },
  {
    id: 'upload',
    title: 'File Upload',
    description: 'Document upload interface',
    priority: 'P1' as const,
    section: 'DATA',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'processing-status',
    title: 'Processing Status',
    description: 'Shows processing progress',
    priority: 'P1' as const,
    section: 'DATA',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'projects-list',
    title: 'Projects List',
    description: 'Display all user projects',
    priority: 'P1' as const,
    section: 'PROJECTS',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'code-preview',
    title: 'Code Preview',
    description: 'Preview generated code',
    priority: 'P2' as const,
    section: 'PROJECTS',
    latest_version: 'v1',
    available_versions: ['v1']
  },
  {
    id: 'error',
    title: 'Error Page',
    description: 'Error handling and display',
    priority: 'P2' as const,
    section: 'SYSTEM',
    latest_version: 'v1',
    available_versions: ['v1']
  }
];

const mockLoadAvailablePages = () => Promise.resolve(mockAvailablePages);

export const Default: Story = {
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: mockLoadAvailablePages,
    isLoading: false
  }
};

export const Loading: Story = {
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: mockLoadAvailablePages,
    isLoading: true
  }
};

export const WithLimitedPages: Story = {
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: () => Promise.resolve(mockAvailablePages.slice(0, 3)),
    isLoading: false
  }
};

export const EmptyPages: Story = {
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: () => Promise.resolve([]),
    isLoading: false
  }
};

export const LoadingError: Story = {
  args: {
    onSubmit: action('form-submitted'),
    onCancel: action('form-cancelled'),
    loadAvailablePages: () => Promise.reject(new Error('Failed to load pages')),
    isLoading: false
  }
};

export const SubmissionError: Story = {
  args: {
    onSubmit: () => Promise.reject(new Error('Submission failed')),
    onCancel: action('form-cancelled'),
    loadAvailablePages: mockLoadAvailablePages,
    isLoading: false
  }
};