import type { Meta, StoryObj } from '@storybook/react';
import { GlobalSearch } from './GlobalSearch';

// Simple mock function for stories
const fn = () => () => {};

const meta = {
  title: 'Design System/Molecules/GlobalSearch/v1.0.0',
  component: GlobalSearch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlobalSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock search function that returns sample results
const mockSearch = async (query: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockResults = [
    {
      id: '1',
      type: 'document' as const,
      title: 'Product Requirements Document',
      description: 'Main PRD for the AI App Builder platform',
      url: '/documents/1'
    },
    {
      id: '2',
      type: 'page' as const,
      name: 'Dashboard Page',
      description: 'Main dashboard with analytics and metrics',
      url: '/pages/dashboard'
    },
    {
      id: '3',
      type: 'release' as const,
      name: 'v1.2.0 Release',
      description: 'Q4 2024 feature release',
      url: '/releases/v1.2.0'
    },
    {
      id: '4',
      type: 'workflow' as const,
      title: 'Deploy to Production',
      description: 'Automated deployment workflow',
      url: '/workflows/deploy-prod'
    },
    {
      id: '5',
      type: 'document' as const,
      title: 'API Documentation',
      description: 'Complete API reference guide',
      url: '/documents/api-docs'
    }
  ];

  // Filter results based on query
  return mockResults.filter(result => {
    const searchableText = [
      result.title,
      result.name,
      result.description,
      result.type
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchableText.includes(query.toLowerCase());
  });
};

export const Default: Story = {
  args: {
    onSearch: mockSearch,
    onResultSelect: fn(),
  },
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement, args }) => { ... }
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Type to search...',
    onSearch: mockSearch,
    onResultSelect: (result) => console.log('Selected:', result),
  },
};

export const CustomShortcut: Story = {
  args: {
    shortcutKey: 'p',
    onSearch: mockSearch,
    onResultSelect: fn(),
  },
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement }) => { ... }
};

export const NoSearchHandler: Story = {
  args: {
    // No onSearch prop - will show empty state
    onResultSelect: (result) => console.log('Selected:', result),
  },
};

export const SlowSearch: Story = {
  args: {
    onSearch: async (query) => {
      // Simulate slow API
      await new Promise(resolve => setTimeout(resolve, 2000));
      return mockSearch(query);
    },
    onResultSelect: (result) => console.log('Selected:', result),
  },
};

export const EmptyResults: Story = {
  args: {
    onSearch: async () => {
      // Always return empty results
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];
    },
    onResultSelect: fn(),
  },
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement }) => { ... }
};

export const ErrorHandling: Story = {
  args: {
    onSearch: async () => {
      // Simulate an error
      await new Promise(resolve => setTimeout(resolve, 300));
      throw new Error('Search API failed');
    },
    onResultSelect: (result) => console.log('Selected:', result),
  },
};