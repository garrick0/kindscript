import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Search, Mail, Lock, User } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'Design System/Atoms/Input/v1.0.0',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    inputSize: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Hello World',
    onChange: () => {},
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    placeholder: 'Invalid input',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    placeholder: 'Valid input',
  },
};

export const Small: Story = {
  args: {
    inputSize: 'sm',
    placeholder: 'Small input',
  },
};

export const Large: Story = {
  args: {
    inputSize: 'lg',
    placeholder: 'Large input',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
  },
};

export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Search size={16} />,
    placeholder: 'Search...',
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: <Mail size={16} />,
    placeholder: 'Enter email...',
    type: 'email',
  },
};

export const Password: Story = {
  args: {
    leftIcon: <Lock size={16} />,
    type: 'password',
    placeholder: 'Enter password...',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Input placeholder="Default input" />
      <Input variant="error" placeholder="Error state" />
      <Input variant="success" placeholder="Success state" />
      <Input leftIcon={<User size={16} />} placeholder="With left icon" />
      <Input rightIcon={<Search size={16} />} placeholder="With right icon" />
      <Input disabled placeholder="Disabled input" />
    </div>
  ),
};