import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { LogIn, LogOut, Settings, User, ArrowRight } from 'lucide-react';

// Simple mock function for stories
const fn = () => () => {};

const meta: Meta<typeof Button> = {
  title: 'Design System/Atoms/Button/v1-0-0',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Button',
    onClick: fn(),
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive Button',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <LogIn size={16} />,
    children: 'Sign In',
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: <ArrowRight size={16} />,
    children: 'Continue',
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: <Settings size={20} />,
    'aria-label': 'Settings',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex gap-2 items-center">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon"><User size={20} /></Button>
      </div>
      <div className="flex gap-2 items-center">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button leftIcon={<LogIn size={16} />}>With Icon</Button>
      </div>
    </div>
  ),
};

// Interactive test stories commented out for production builds
// These require @storybook/test which isn't available in production
/*
export const InteractiveTest: Story = {
  args: {
    variant: 'default',
    children: 'Click to Test',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /click to test/i });
    
    // Test initial state
    await expect(button).toBeInTheDocument();
    await expect(button).toBeEnabled();
    
    // Test click interaction
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    
    // Test keyboard interaction
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const DisabledInteraction: Story = {
  args: {
    variant: 'secondary',
    children: 'Disabled Button',
    disabled: true,
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /disabled button/i });
    
    // Test disabled state
    await expect(button).toBeDisabled();
    
    // Attempt click (should not work)
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
*/