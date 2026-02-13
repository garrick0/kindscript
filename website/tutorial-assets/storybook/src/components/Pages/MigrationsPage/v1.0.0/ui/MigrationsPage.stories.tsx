import type { Meta, StoryObj } from '@storybook/react';
import { MigrationsPage } from './MigrationsPage';

const meta = {
  title: 'Pages/MigrationsPage',
  component: MigrationsPage,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof MigrationsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    return <MigrationsPage />;
  }
};

export const Loading: Story = {
  render: () => {
    return <MigrationsPage />;
  },
  parameters: {
    msw: {
      handlers: [
        // Add loading handlers if needed
      ]
    }
  }
};

export const Empty: Story = {
  render: () => {
    return <MigrationsPage />;
  },
  parameters: {
    msw: {
      handlers: [
        // Add empty state handlers if needed
      ]
    }
  }
};

export const MultipleMigrations: Story = {
  render: () => {
    return <MigrationsPage />;
  },
  parameters: {
    msw: {
      handlers: [
        // Add handlers for multiple migrations if needed
      ]
    }
  }
};