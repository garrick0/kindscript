import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonList } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Atoms/Skeleton/v1.0.0',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular', 'rounded'],
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'none'],
    },
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'text',
    animation: 'pulse',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Text</p>
        <Skeleton variant="text" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Circular</p>
        <Skeleton variant="circular" width={60} height={60} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Rectangular</p>
        <Skeleton variant="rectangular" height={100} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Rounded</p>
        <Skeleton variant="rounded" height={100} />
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Pulse Animation</p>
        <Skeleton animation="pulse" height={40} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Wave Animation</p>
        <Skeleton animation="wave" height={40} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">No Animation</p>
        <Skeleton animation="none" height={40} />
      </div>
    </div>
  ),
};

export const TextSkeleton: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Single Line</p>
        <SkeletonText lines={1} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Three Lines</p>
        <SkeletonText lines={3} />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Five Lines</p>
        <SkeletonText lines={5} />
      </div>
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ),
};

export const TableSkeleton: Story = {
  render: () => (
    <div className="bg-white p-4 rounded-lg shadow">
      <SkeletonTable rows={5} columns={4} />
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => <SkeletonList items={4} />,
};

export const CompletePageSkeleton: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Skeleton variant="text" width="200px" height={32} className="mb-2" />
        <Skeleton variant="text" width="400px" height={20} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg shadow">
            <Skeleton variant="text" width="100px" height={14} className="mb-2" />
            <Skeleton variant="text" width="60px" height={24} />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width="150px" height={24} />
          <Skeleton variant="rounded" width="100px" height={36} />
        </div>
        <SkeletonTable rows={4} columns={3} />
      </div>
    </div>
  ),
};

export const ProfileSkeleton: Story = {
  render: () => (
    <div className="bg-white p-6 rounded-lg shadow max-w-sm">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="120px" height={20} />
          <Skeleton variant="text" width="180px" height={16} />
          <Skeleton variant="text" width="100px" height={14} />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="mt-4 flex space-x-2">
        <Skeleton variant="rounded" width="100%" height={36} />
        <Skeleton variant="rounded" width="100%" height={36} />
      </div>
    </div>
  ),
};