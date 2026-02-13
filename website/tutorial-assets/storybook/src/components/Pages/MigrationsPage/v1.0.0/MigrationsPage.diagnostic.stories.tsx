import type { Meta, StoryObj } from '@storybook/react';
import { MigrationsPage } from './ui/MigrationsPage';

// Minimal story to diagnose rendering issue
const meta = {
  title: 'Pages/MigrationsPage/v1.0.0/Diagnostic',
  component: MigrationsPage,
  parameters: {
    layout: 'fullscreen',
  },
  // NO decorators - rely on preview.tsx QueryClientProvider
} as Meta<typeof MigrationsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Just render the component with no overrides
export const Minimal: Story = {
  args: {},
};

// Test with explicit MSW handlers
export const WithExplicitHandlers: Story = {
  parameters: {
    msw: {
      handlers: [
        // Use explicit handlers to override
      ],
    },
  },
};