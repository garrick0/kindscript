import type { Meta, StoryObj } from '@storybook/react';
import { SignInPage } from './SignInPage';

const meta = {
  title: 'Pages/SignInPage',
  component: SignInPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    callbackUrl: '/dashboard',
  },
} satisfies Meta<typeof SignInPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    error: 'OAuthAccountNotLinked',
  },
};

export const WithCustomCallback: Story = {
  args: {
    callbackUrl: '/releases',
  },
};