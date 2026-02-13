import type { Meta, StoryObj } from '@storybook/react';
import { MigrationsPage } from './MigrationsPage';

const meta = {
  title: 'Pages/MigrationsPage/v1.0.0/Test',
  component: MigrationsPage,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof MigrationsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simplest possible story
export const SimpleTest: Story = {
  render: () => {
    return (
      <div style={{ padding: '20px', background: 'red' }}>
        <h1>Test Story Rendering</h1>
        <p>If you see this, the story is loading</p>
        <hr />
        <MigrationsPage />
      </div>
    );
  }
};