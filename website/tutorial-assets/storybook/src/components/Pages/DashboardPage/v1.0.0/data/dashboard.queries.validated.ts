import { useQuery, useQueryClient } from '@tanstack/react-query';
// import { createValidatedQuery } from '../../../../utils/validation/query-validation';
import type { Activity, DashboardData, DashboardStat, Notification, QuickAction } from '../types/dashboard.types';

// API endpoints
const API_ENDPOINTS = {
  dashboard: '/api/dashboard',
  stats: '/api/dashboard/stats',
  activity: '/api/dashboard/activity',
  notifications: '/api/dashboard/notifications',
  quickActions: '/api/dashboard/quick-actions',
} as const;

// Query keys
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardQueryKeys.all, 'data'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  activity: (limit?: number) => [...dashboardQueryKeys.all, 'activity', { limit }] as const,
  notifications: () => [...dashboardQueryKeys.all, 'notifications'] as const,
  quickActions: () => [...dashboardQueryKeys.all, 'quickActions'] as const,
};

// Stats query
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: async (): Promise<DashboardStat[]> => {
      const response = await fetch(API_ENDPOINTS.stats);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Dashboard data query
export function useDashboardData() {
  return useQuery({
    queryKey: dashboardQueryKeys.data(),
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch(API_ENDPOINTS.dashboard);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Recent activity query with validation
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: dashboardQueryKeys.activity(limit),
    queryFn: async (): Promise<Activity[]> => {
      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await fetch(`${API_ENDPOINTS.activity}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// Notifications query
export function useNotifications() {
  return useQuery({
    queryKey: dashboardQueryKeys.notifications(),
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch(API_ENDPOINTS.notifications);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 10 * 1000, // 10 seconds - notifications are real-time
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// Quick actions query with validation
export function useQuickActions() {
  return useQuery({
    queryKey: dashboardQueryKeys.quickActions(),
    queryFn: async (): Promise<QuickAction[]> => {
      const response = await fetch(API_ENDPOINTS.quickActions);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quick actions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - actions don't change often
  });
}

// Combined dashboard query hook for convenience
export function useDashboard() {
  const stats = useDashboardStats();
  const activity = useRecentActivity();
  const notifications = useNotifications();
  const quickActions = useQuickActions();
  const queryClient = useQueryClient();

  const loading = stats.isLoading || activity.isLoading || quickActions.isLoading;
  const error = stats.error || activity.error || quickActions.error || notifications.error;

  const refetchAll = async () => {
    await Promise.all([
      stats.refetch(),
      activity.refetch(),
      notifications.refetch(),
      quickActions.refetch(),
    ]);
  };

  return {
    stats: stats.data || [],
    recentActivity: activity.data || [],
    notifications: notifications.data || [],
    quickActions: quickActions.data || [],
    loading,
    error: error as Error | null,
    refetch: refetchAll,
    invalidate: () => queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all }),
  };
}

// No additional exports needed - all functions are already exported above
