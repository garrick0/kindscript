import type { Meta, StoryObj } from '@storybook/react';
// Mock actions for standalone stories
const action = (name: string) => () => console.log('Action:', name);
import { ReleaseFilters } from './ReleaseFilters';

const meta: Meta<typeof ReleaseFilters> = {
  title: 'Design System/Organisms/ReleaseFilters',
  component: ReleaseFilters,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Filter controls for the releases list, allowing users to filter by status and other criteria.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    currentStatus: {
      control: 'select',
      options: ['', 'draft', 'review', 'approved', 'archived'],
      description: 'Currently selected status filter'
    },
    currentSearch: {
      control: 'text',
      description: 'Currently selected search term'
    },
    onFilterChange: {
      action: 'filterChanged',
      description: 'Called when a filter is changed'
    },
    onClearFilters: {
      action: 'filtersCleared',
      description: 'Called when filters are cleared'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentStatus: '',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
};

export const WithDraftSelected: Story = {
  args: {
    currentStatus: 'draft',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
};

export const WithReviewSelected: Story = {
  args: {
    currentStatus: 'review',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
};

export const WithApprovedSelected: Story = {
  args: {
    currentStatus: 'approved',
    currentSearch: '',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
};

export const WithSearchTerm: Story = {
  args: {
    currentStatus: '',
    currentSearch: 'wireframe',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
};

export const WithStatusAndSearch: Story = {
  args: {
    currentStatus: 'review',
    currentSearch: 'auth',
    onFilterChange: action('filter-changed'),
    onClearFilters: action('filters-cleared')
  }
};