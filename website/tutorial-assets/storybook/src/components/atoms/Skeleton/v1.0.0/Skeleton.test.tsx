import React from 'react';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonList } from './Skeleton';

describe('Skeleton', () => {
  it('renders basic skeleton with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('bg-gray-200', 'animate-pulse', 'rounded');
  });

  it('renders with different variants', () => {
    const variants = ['text', 'circular', 'rectangular', 'rounded'] as const;
    variants.forEach(variant => {
      const { container } = render(<Skeleton variant={variant} />);
      const skeleton = container.firstChild as HTMLElement;
      if (variant === 'text') expect(skeleton).toHaveClass('rounded');
      if (variant === 'circular') expect(skeleton).toHaveClass('rounded-full');
      if (variant === 'rectangular') expect(skeleton).not.toHaveClass('rounded', 'rounded-full', 'rounded-lg');
      if (variant === 'rounded') expect(skeleton).toHaveClass('rounded-lg');
    });
  });

  it('renders with different animations', () => {
    const animations = ['pulse', 'wave', 'none'] as const;
    animations.forEach(animation => {
      const { container } = render(<Skeleton animation={animation} />);
      const skeleton = container.firstChild as HTMLElement;
      if (animation === 'pulse') expect(skeleton).toHaveClass('animate-pulse');
      if (animation === 'wave') expect(skeleton).toHaveClass('animate-shimmer');
      if (animation === 'none') expect(skeleton).not.toHaveClass('animate-pulse', 'animate-shimmer');
    });
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={100} height={50} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
  });
});

describe('SkeletonText', () => {
  it('renders multiple lines of text skeletons', () => {
    const lines = 3;
    const { container } = render(<SkeletonText lines={lines} />);
    expect(container.querySelectorAll('.bg-gray-200')).toHaveLength(lines);
  });

  it('makes last line shorter', () => {
    const { container } = render(<SkeletonText lines={2} />);
    const lines = container.querySelectorAll('.bg-gray-200');
    expect(lines[0]).toHaveStyle({ width: '100%' });
    expect(lines[1]).toHaveStyle({ width: '80%' });
  });
});

describe('SkeletonCard', () => {
  it('renders card structure with avatar and content', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    expect(container.querySelectorAll('.rounded')).toHaveLength(4);
    expect(container.querySelectorAll('.rounded-lg')).toHaveLength(3);
  });
});

describe('SkeletonTable', () => {
  it('renders table with specified rows and columns', () => {
    const rows = 3;
    const columns = 4;
    const { container } = render(<SkeletonTable rows={rows} columns={columns} />);
    expect(container.querySelectorAll('.border-b')).toHaveLength(rows + 1);
    const totalCells = (rows + 1) * columns;
    expect(container.querySelectorAll('.bg-gray-200')).toHaveLength(totalCells);
  });
});

describe('SkeletonList', () => {
  it('renders list with specified number of items', () => {
    const items = 3;
    const { container } = render(<SkeletonList items={items} />);
    expect(container.querySelectorAll('.rounded-lg')).toHaveLength(items);
  });
});