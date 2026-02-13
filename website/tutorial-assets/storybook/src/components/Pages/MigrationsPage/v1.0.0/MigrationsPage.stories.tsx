import type { Meta, StoryObj } from '@storybook/react';
import { MigrationsPage } from './ui/MigrationsPage';

const meta = {
  title: 'Pages/MigrationsPage/v1.0.0',
  component: MigrationsPage,
  parameters: {
    layout: 'fullscreen',
  },
  // No decorators needed - preview.tsx already provides QueryClientProvider
} as Meta<typeof MigrationsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        // Override to add delay for loading state
        async () => {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return Response.json([]);
        },
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        // Override to return empty array
        () => Response.json([]),
      ],
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        // Override to simulate error
        () => new Response(null, { status: 500, statusText: 'Internal Server Error' }),
      ],
    },
  },
};