'use client';

import { Clock, FileText, GitBranch, Minus, Package, TrendingDown, TrendingUp, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSafeAuth } from '../../../../../core/auth/SafeAuthProvider';
import { Button } from '../../../../atoms/Button/v1.0.0/Button';
import { Skeleton, SkeletonCard, SkeletonTable } from '../../../../atoms/Skeleton';
import { ErrorBoundary } from '../../../../molecules/ErrorBoundary';
import { DashboardPageProvider } from '../domain/DashboardPageContext';
import { useDashboard } from '../domain/useDashboard';

export interface DashboardPageProps {
  userId?: string;
}

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

function DashboardPageContent({ userId }: DashboardPageProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useSafeAuth();
  const { stats, recentActivity, quickActions, loading: dashboardLoading, error, refetch } = useDashboard();

  // Handle quick actions
  const handleQuickAction = (actionId: string) => {
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
  };

  // Auth loading state first
  if (authLoading) {
    return (
      <ErrorBoundary>
        <div className="p-8 min-h-screen bg-gray-50" data-testid="skeleton">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton variant="text" width="300px" height={36} className="mb-2" />
            <Skeleton variant="text" width="500px" height={24} />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          {/* Activity Section Skeleton */}
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

  // Dashboard loading state (only if authenticated)
  if (dashboardLoading) {
    return (
      <ErrorBoundary>
        <div className="p-8 min-h-screen bg-gray-50" data-testid="skeleton">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton variant="text" width="300px" height={36} className="mb-2" />
            <Skeleton variant="text" width="500px" height={24} />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          {/* Activity Section Skeleton */}
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
      </ErrorBoundary>
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
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{user ? `, ${user.name || user.email}` : ''}
        </h1>
        <p className="text-gray-600 mt-2">
          Build AI-powered applications with hierarchical context management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = iconMap[stat.name as keyof typeof iconMap] || FileText;
          const TrendIcon = stat.changeType === 'increase' ? TrendingUp : 
                           stat.changeType === 'decrease' ? TrendingDown : Minus;
          
          // Map stat names to navigation paths
          const statPaths: Record<string, string> = {
            'Documents': '/documents',
            'Releases': '/releases',
            'Pages': '/pages',
            'Workflows': '/workflows'
          };
          
          const navigationPath = statPaths[stat.name];
          
          return (
            <div 
              key={stat.name} 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigationPath && router.push(navigationPath)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <TrendIcon className={`h-4 w-4 mr-1 ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 
                      'text-gray-400'
                    }`} />
                    <p className={`text-sm ${
                      stat.changeType === 'increase' ? 'text-green-600' : 
                      stat.changeType === 'decrease' ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {stat.change} this week
                    </p>
                  </div>
                </div>
                <Icon className="h-8 w-8 text-gray-400" />
              </div>
              {navigationPath && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all →
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity to display
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'document' ? 'bg-blue-600' :
                    activity.type === 'release' ? 'bg-green-600' :
                    activity.type === 'page' ? 'bg-purple-600' :
                    activity.type === 'workflow' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <p className="text-xs text-gray-500">
                        Type: {activity.type}
                      </p>
                      {activity.userName && (
                        <p className="text-xs text-gray-500">
                          By: {activity.userName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {activity.time}
                </div>
              </div>
            ))
          )}
        </div>
        {recentActivity.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <button 
              onClick={() => router.push('/activity')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all activity →
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const bgColor = colorMap[action.color as keyof typeof colorMap] || colorMap.blue;
            const Icon = action.id === 'create-document' ? FileText :
                         action.id === 'generate-page' ? GitBranch :
                         action.id === 'start-workflow' ? Workflow : FileText;
            
            return (
              <button 
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className={`${bgColor} text-white rounded-lg p-6 transition-colors`}
              >
                <Icon className="h-8 w-8 mb-4" />
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Quick Navigation */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/knowledge')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Package className="h-6 w-6 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Knowledge Base</h3>
            <p className="text-sm text-gray-500 mt-1">AI-ready documentation</p>
          </button>
          <button 
            onClick={() => router.push('/studio')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <GitBranch className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Studio</h3>
            <p className="text-sm text-gray-500 mt-1">Component explorer</p>
          </button>
          <button 
            onClick={() => router.push('/pages')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <FileText className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Pages</h3>
            <p className="text-sm text-gray-500 mt-1">Manage site pages</p>
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
          >
            <Workflow className="h-6 w-6 text-orange-600 mb-2" />
            <h3 className="font-medium text-gray-900">Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Configure platform</p>
          </button>
        </div>
      </div>

      {/* Footer info for debugging */}
      {user && (
        <div className="mt-12 text-sm text-gray-500 text-center">
          Logged in as: {user.name} ({user.email})
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

export function DashboardPage(props: DashboardPageProps) {
  return (
    <DashboardPageProvider>
      <DashboardPageContent {...props} />
    </DashboardPageProvider>
  );
}