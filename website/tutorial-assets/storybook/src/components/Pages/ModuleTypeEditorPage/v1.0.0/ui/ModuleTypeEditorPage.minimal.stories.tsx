/**
 * Minimal story for debugging
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ModuleTypeEditorPage } from './ModuleTypeEditorPage';

const meta = {
  title: 'Pages/ModuleTypeEditorPage/Minimal',
  component: ModuleTypeEditorPage,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof ModuleTypeEditorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Test: Story = {
  render: () => <div>Test Story Renders</div>
};

export const ComponentTest: Story = {
  render: () => {
    try {
      return <ModuleTypeEditorPage />;
    } catch (error) {
      return <div>Error: {String(error)}</div>;
    }
  }
};