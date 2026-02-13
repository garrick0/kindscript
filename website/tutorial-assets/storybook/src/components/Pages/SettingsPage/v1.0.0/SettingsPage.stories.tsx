import type { Meta, StoryObj } from '@storybook/react';
import { SettingsPage } from './SettingsPage';
import { ServiceProvider } from '../../../../providers/ServiceProvider';
import { settingsHandlers, delayHandlers } from '../../../../mocks/handlers/overrides';

const meta: Meta<typeof SettingsPage> = {
  title: 'Design System/Pages/Settings/v1.0.0',
  component: SettingsPage,
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

export const With2FAEnabled: Story = {
  parameters: {
    msw: {
      handlers: [
        // Custom handler for 2FA enabled state would go here
        // For now using default handlers
      ],
    },
  },
  args: {
    userId: 'user-123',
  },
};

export const DarkMode: Story = {
  parameters: {
    msw: {
      handlers: settingsHandlers.darkMode,
    },
  },
  args: {
    userId: 'user-123',
  },
};

export const AllIntegrationsConnected: Story = {
  parameters: {
    msw: {
      handlers: [
        // Custom handler for integrations would go here
        // For now using default handlers
      ],
    },
  },
  args: {
    userId: 'user-123',
  },
};