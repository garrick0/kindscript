import type { Meta, StoryObj } from '@storybook/react';
import { DocumentsPage } from './DocumentsPage';
import { ServiceProvider } from '../../../../providers/ServiceProvider';
import { documentHandlers, delayHandlers } from '../../../../mocks/handlers/overrides';

const meta: Meta<typeof DocumentsPage> = {
  title: 'Design System/Pages/Documents/v1.0.0',
  component: DocumentsPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ServiceProvider useMocks={true}>
        <Story />
      </ServiceProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: 'user-123',
  },
};

export const WithFilters: Story = {
  args: {
    userId: 'user-123',
    initialFilters: {
      status: 'published',
      authoritative: true,
    },
  },
};

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: delayHandlers(3000),
    },
  },
  args: {
    userId: 'user-123',
  },
};

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: documentHandlers.empty,
    },
  },
  args: {
    userId: 'user-123',
  },
};

export const AuthoritativeOnly: Story = {
  args: {
    userId: 'user-123',
    initialFilters: {
      authoritative: true,
    },
  },
};

export const DraftDocuments: Story = {
  args: {
    userId: 'user-123',
    initialFilters: {
      status: 'draft',
    },
  },
};

export const WithSearch: Story = {
  args: {
    userId: 'user-123',
    initialFilters: {
      search: 'architecture',
    },
  },
};