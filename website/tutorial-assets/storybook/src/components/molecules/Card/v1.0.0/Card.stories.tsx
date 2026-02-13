import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  title: 'Design System/Molecules/Card/unversioned',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'elevated'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600">This is a card component with some content.</p>
      </>
    ),
  },
};

export const Bordered: Story = {
  args: {
    variant: 'bordered',
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Bordered Card</h3>
        <p className="text-gray-600">This card has a border variant.</p>
      </>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Elevated Card</h3>
        <p className="text-gray-600">This card has an elevated shadow effect.</p>
      </>
    ),
  },
};

export const WithCustomClass: Story = {
  args: {
    className: 'bg-blue-50',
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Custom Styled Card</h3>
        <p className="text-gray-600">This card has custom background styling.</p>
      </>
    ),
  },
};