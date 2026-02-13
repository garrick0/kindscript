import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from '../../ErrorBoundary/v1.0.0/ErrorBoundary';
import { Skeleton } from '../../../atoms/Skeleton/v1.0.0/Skeleton';

export interface PageLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: ComponentType<{ error: Error; reset: () => void }>;
  pageName?: string;
}

/**
 * PageLoader provides error boundary and suspense loading for lazy-loaded pages
 * This enables code splitting and better performance
 */
export function PageLoader({ 
  children, 
  fallback,
  errorFallback,
  pageName = 'page'
}: PageLoaderProps) {
  const defaultFallback = (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton variant="text" width="300px" height={36} className="mb-2" />
          <Skeleton variant="text" width="500px" height={24} />
        </div>
        
        {/* Content skeleton */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <Skeleton variant="rectangular" height={200} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton variant="rounded" height={100} />
              <Skeleton variant="rounded" height={100} />
              <Skeleton variant="rounded" height={100} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary 
      fallback={errorFallback}
      onError={(error) => {
        console.error(`Error loading ${pageName}:`, error);
      }}
    >
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * HOC to wrap a lazy-loaded component with PageLoader
 */
export function withPageLoader<T extends object>(
  Component: ComponentType<T>,
  options?: Omit<PageLoaderProps, 'children'>
): ComponentType<T> {
  return (props: T) => (
    <PageLoader {...options}>
      <Component {...props} />
    </PageLoader>
  );
}