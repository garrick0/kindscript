import type { Meta, StoryObj } from '@storybook/react';
import { WorkflowsPage } from './WorkflowsPage';

const meta = {
  title: 'Design System/Pages/Workflows/v1.0.0',
  component: WorkflowsPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof WorkflowsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: 'test-user-123',
  },
};

export const EmptyState: Story = {
  args: {
    userId: 'test-user-456',
  },
};