import type { Meta, StoryObj } from '@storybook/react';
import { LoginButton, QuickLoginButton } from './LoginButton';

// Simple mock function for stories
const fn = () => () => {};

const meta = {
  title: 'Design System/Molecules/LoginButton/v1.0.0',
  component: LoginButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['button', 'menu'],
    },
  },
} satisfies Meta<typeof LoginButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  picture: 'https://via.placeholder.com/150',
};

const mockEnhancedUser = {
  role: 'developer',
};

export const LoggedOut: Story = {
  args: {
    user: null,
    onLogin: fn(),
  },
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement, args }) => { ... }
};

export const LoggedInButton: Story = {
  args: {
    user: mockUser,
    enhancedUser: mockEnhancedUser,
    variant: 'button',
    onLogout: () => console.log('Logout clicked'),
  },
};

export const LoggedInMenu: Story = {
  args: {
    user: mockUser,
    enhancedUser: mockEnhancedUser,
    variant: 'menu',
    showUserInfo: true,
    onLogout: fn(),
    onProfileClick: fn(),
    onSettingsClick: fn(),
  },
  // Interactive play function commented out for production builds
  // play: async ({ canvasElement, args }) => { ... }
};

export const AdminUser: Story = {
  args: {
    user: mockUser,
    enhancedUser: { role: 'admin' },
    variant: 'menu',
    showUserInfo: true,
    hasRole: (role) => role === 'admin',
    onLogout: () => console.log('Logout clicked'),
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const WithUserInfo: Story = {
  args: {
    user: mockUser,
    enhancedUser: mockEnhancedUser,
    showUserInfo: true,
    variant: 'button',
    onLogout: () => console.log('Logout clicked'),
  },
};

export const NoProfilePicture: Story = {
  args: {
    user: { ...mockUser, picture: null },
    enhancedUser: mockEnhancedUser,
    variant: 'menu',
    showUserInfo: true,
    onLogout: () => console.log('Logout clicked'),
  },
};

// Quick Login Button Stories
export const QuickLoggedOut: Story = {
  render: () => (
    <QuickLoginButton 
      onLogin={() => console.log('Quick login clicked')}
    />
  ),
};

export const QuickLoggedIn: Story = {
  render: () => (
    <QuickLoginButton 
      user={mockUser}
      onLogout={() => console.log('Quick logout clicked')}
    />
  ),
};

export const QuickLoading: Story = {
  render: () => (
    <QuickLoginButton 
      isLoading={true}
    />
  ),
};