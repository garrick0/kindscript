import type { Meta, StoryObj } from '@storybook/react';
import { SignOutPage } from './SignOutPage';

const meta = {
  title: 'Pages/SignOutPage',
  component: SignOutPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SignOutPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};