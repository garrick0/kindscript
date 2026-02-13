import type { Meta, StoryObj } from '@storybook/react';
import { UserMenu } from './UserMenu';

const meta = {
  title: 'Molecules/UserMenu',
  component: UserMenu,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Authenticated: Story = {
  args: {},
  parameters: {
    // Mock session is already provided by the MockSessionProvider in preview
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    // To simulate loading state, we'd need to override the session provider
    // For now, this will show the authenticated state
  },
};