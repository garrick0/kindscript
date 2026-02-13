import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Pages/MigrationsPage/v1.0.0/MinimalTest',
  component: () => <div>Minimal Component</div>,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Minimal: Story = {
  render: () => <div style={{padding: '20px', background: 'lime'}}>If you see this green box, stories are working!</div>
};