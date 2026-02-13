import React from 'react';
import { cn } from '../../../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };
  
  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? 40 : '100%'),
    height: height || (variant === 'text' ? 20 : variant === 'circular' ? 40 : 100),
    ...props.style,
  };
  
  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Compound components for common patterns
export function SkeletonText({ 
  lines = 3, 
  className,
  ...props 
}: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white rounded-lg shadow p-4', className)} {...props}>
      <div className="flex items-start space-x-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="75%" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={2} />
      </div>
      <div className="mt-4 flex space-x-2">
        <Skeleton variant="rounded" width={80} height={32} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: {
  rows?: number;
  columns?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Header */}
      <div className="flex space-x-4 pb-3 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={16} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-3 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              height={16}
              className="flex-1"
              width={colIndex === 0 ? '40%' : '100%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({
  items = 3,
  className,
  ...props
}: {
  items?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="30%" height={16} />
            <Skeleton variant="text" width="60%" height={14} />
          </div>
          <Skeleton variant="rounded" width={60} height={28} />
        </div>
      ))}
    </div>
  );
}