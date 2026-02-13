'use client';

import { FileText, GitBranch, Package, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { Suspense } from 'react';
import { usePerformanceMonitor } from '../../../../../common/hooks/usePerformanceMonitor';
import { useAuth } from '../../../../../core/auth/useAuth';
import { Button } from '../../../../atoms/Button';
import { Skeleton, SkeletonCard, SkeletonTable } from '../../../../atoms/Skeleton';
// import { createLazySection } from '../../../../common/LazyLoader';
import { ErrorBoundary } from '../../../../molecules/ErrorBoundary';
import { DashboardPageProvider } from '../domain/DashboardPageContext';
import { useDashboard } from '../domain/useDashboard';
import StatsSection from './sections/StatsSection';
import RecentActivitySection from './sections/RecentActivitySection';
import QuickActionsSection from './sections/QuickActionsSection';

export interface DashboardPageOptimizedProps {
  userId?: string;
}

// Lazy-loaded sections removed - using direct imports for now
// const StatsSection = createLazySection(
//   'dashboard-stats',
//   () => import('./sections/StatsSection'),
//   { priority: 'high' } // Stats are critical, load immediately
// );

// const RecentActivitySection = createLazySection(
//   'dashboard-activity', 
//   () => import('./sections/RecentActivitySection'),
//   { priority: 'medium' } // Load when visible
// );

// const QuickActionsSection = createLazySection(
//   'dashboard-actions',
//   () => import('./sections/QuickActionsSection'), 
//   { priority: 'low' } // Load on hover or after delay
// );

const iconMap = {
  'Documents': FileText,
  'Releases': Package,
  'Pages': GitBranch,
  'Workflows': Workflow,
};

const colorMap = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};

function DashboardPageOptimizedContent({ userId }: DashboardPageOptimizedProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { stats, recentActivity, quickActions, loading: dashboardLoading, error, refetch } = useDashboard();

  // Enhanced performance monitoring
  const { 
    metrics,
    getMetrics,
    logMetrics 
  } = usePerformanceMonitor({
    componentName: 'DashboardPage',
    warnThreshold: 100,
    enableLogging: process.env.NODE_ENV === 'development'
  });

  // Track page interactions
  const handleQuickAction = React.useCallback((actionId: string) => {
    // Performance tracking could be added here
    
    switch (actionId) {
      case 'create-document':
        router.push('/documents/new');
        break;
      case 'generate-page':
        router.push('/pages/generate');
        break;
      case 'start-workflow':
        router.push('/workflows/new');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  }, [router]);

  // Performance monitoring effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        logMetrics();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [logMetrics]);

  // Optimized loading state with progressive disclosure
  if (authLoading || dashboardLoading) {
    return (
      <ErrorBoundary>
        <div className="p-8 min-h-screen bg-gray-50">
          {/* Header loads immediately */}
          <DashboardHeader user={user} loading />
          
          {/* Progressive loading skeletons */}
          <div className="space-y-8">
            {/* Stats skeleton - high priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <SkeletonCard key={i} className="h-32" />
              ))}
            </div>

            {/* Activity skeleton - loads after stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <Skeleton variant="text" width="150px" height={24} className="mb-4" />
                <SkeletonTable rows={5} columns={2} />
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <Skeleton variant="text" width="150px" height={24} className="mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Auth check
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg mb-4">Please login to view your dashboard</div>
        <Button onClick={() => router.push('/auth/signin')}>
          Sign In
        </Button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg text-red-600 mb-4">
          Error loading dashboard: {error.message}
        </div>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-8 min-h-screen bg-gray-50">
        {/* Header - loads immediately */}
        <DashboardHeader user={user} />
        
        {/* Progressive content loading */}
        <div className="space-y-8">
          {/* Stats Section - Critical, loads first */}
          <Suspense fallback={<StatsSkeletonFallback />}>
            <StatsSection 
              stats={stats}
              iconMap={iconMap}
              onStatClick={(statId: string) => {
                // Performance tracking could be added here
                // Handle stat click
                console.log('Stat clicked:', statId);
              }}
            />
          </Suspense>

          {/* Recent Activity - Loads when visible */}
          <Suspense fallback={<ActivitySkeletonFallback />}>
            <RecentActivitySection 
              recentActivity={recentActivity}
              onViewAllClick={() => {
                // Performance tracking could be added here
                router.push('/activity');
              }}
            />
          </Suspense>

          {/* Quick Actions - Loads last or on interaction */}
          <Suspense fallback={<ActionsSkeletonFallback />}>
            <QuickActionsSection 
              quickActions={quickActions}
              colorMap={colorMap}
              onActionClick={handleQuickAction}
            />
          </Suspense>
        </div>

        {/* Debug info - only in development */}
        {process.env.NODE_ENV === 'development' && user && (
          <div className="mt-12 text-sm text-gray-500 text-center">
            Logged in as: {user.name} ({user.email})
            <button 
              onClick={() => logMetrics()}
              className="ml-4 text-blue-600 hover:text-blue-700"
            >
              Show Performance Metrics
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// Optimized header component
const DashboardHeader = React.memo(function DashboardHeader({ 
  user, 
  loading = false 
}: { 
  user?: any; 
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="mb-8">
        <Skeleton variant="text" width="300px" height={36} className="mb-2" />
        <Skeleton variant="text" width="500px" height={24} />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome back{user ? `, ${user.name || user.email}` : ''}
      </h1>
      <p className="text-gray-600 mt-2">
        Build AI-powered applications with hierarchical context management
      </p>
    </div>
  );
});

// Optimized skeleton components
const StatsSkeletonFallback = React.memo(function StatsSkeletonFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width="60px" height={14} />
          </div>
          <Skeleton variant="text" width="80px" height={32} className="mb-1" />
          <Skeleton variant="text" width="100px" height={16} />
        </div>
      ))}
    </div>
  );
});

const ActivitySkeletonFallback = React.memo(function ActivitySkeletonFallback() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton variant="text" width="150px" height={24} />
      </div>
      <div className="divide-y divide-gray-200">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton variant="circular" width={8} height={8} />
              <div>
                <Skeleton variant="text" width="200px" height={16} className="mb-1" />
                <Skeleton variant="text" width="150px" height={12} />
              </div>
            </div>
            <Skeleton variant="text" width="60px" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
});

const ActionsSkeletonFallback = React.memo(function ActionsSkeletonFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-200 rounded-lg p-6 animate-pulse">
          <Skeleton variant="circular" width={32} height={32} className="mb-4" />
          <Skeleton variant="text" width="120px" height={20} className="mb-2" />
          <Skeleton variant="text" width="100%" height={16} />
        </div>
      ))}
    </div>
  );
});

export function DashboardPageOptimized(props: DashboardPageOptimizedProps) {
  return (
    <DashboardPageProvider>
      <DashboardPageOptimizedContent {...props} />
    </DashboardPageProvider>
  );
}