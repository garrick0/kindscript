import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Debug/Simple Test',
};

export default meta;

export const BasicHTML: StoryObj = {
  render: () => <div>Hello World - This is a simple test</div>,
};

export const WithError: StoryObj = {
  render: () => {
    throw new Error('Test error');
    return <div>Should not render</div>;
  },
};