import type { Meta, StoryObj } from '@storybook/react'
import { ReleasesPage } from './ReleasesPage'
import { ServiceProvider } from '../../../../providers/ServiceProvider'
import { releaseHandlers, delayHandlers, authHandlers } from '../../../../mocks/handlers/overrides'

const meta: Meta<typeof ReleasesPage> = {
  title: 'Design System/Pages/Releases/v1.0.0',
  component: ReleasesPage,
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
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    userId: 'user-123',
  },
}

export const WithFilters: Story = {
  args: {
    searchParams: { 
      status: 'published', 
      search: 'mvp' 
    },
    userId: 'user-123',
  },
}

export const DraftOnly: Story = {
  args: {
    searchParams: { 
      status: 'draft' 
    },
    userId: 'user-123',
  },
}

export const WithSearch: Story = {
  args: {
    searchParams: { 
      search: 'feature' 
    },
    userId: 'user-123',
  },
}

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: delayHandlers(2000),
    },
  },
  args: {
    userId: 'user-123',
  },
}

export const NotAuthenticated: Story = {
  parameters: {
    msw: {
      handlers: authHandlers.notAuthenticated,
    },
  },
  args: {},
}

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: releaseHandlers.empty,
    },
  },
  args: {
    userId: 'user-123',
  },
}

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: releaseHandlers.error,
    },
  },
  args: {
    userId: 'user-123',
  },
}