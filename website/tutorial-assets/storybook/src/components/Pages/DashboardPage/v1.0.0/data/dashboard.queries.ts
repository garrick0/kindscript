import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Activity, DashboardData, DashboardStat, Notification, QuickAction } from '../types/dashboard.types';

// API endpoints
const API_ENDPOINTS = {
  dashboard: '/api/dashboard',
  stats: '/api/dashboard/stats',
  activity: '/api/dashboard/activity',
  notifications: '/api/dashboard/notifications',
  quickActions: '/api/dashboard/quick-actions',
} as const;

// Query keys factory
export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardKeys.all, 'data'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  notifications: () => [...dashboardKeys.all, 'notifications'] as const,
  quickActions: () => [...dashboardKeys.all, 'quickActions'] as const,
};

// Main dashboard data query
export function useDashboardData() {
  return useQuery({
    queryKey: dashboardKeys.data(),
    queryFn: async (): Promise<DashboardData> => {
      const response = await fetch(API_ENDPOINTS.dashboard, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

// Stats query
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardStat[]> => {
      const response = await fetch(API_ENDPOINTS.stats, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute - stats update frequently
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Recent activity query
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: async (): Promise<Activity[]> => {
      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await fetch(`${API_ENDPOINTS.activity}?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// Notifications query
export function useNotifications() {
  return useQuery({
    queryKey: dashboardKeys.notifications(),
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch(API_ENDPOINTS.notifications, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 10 * 1000, // 10 seconds - notifications are real-time
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// Quick actions query
export function useQuickActions() {
  return useQuery({
    queryKey: dashboardKeys.quickActions(),
    queryFn: async (): Promise<QuickAction[]> => {
      const response = await fetch(API_ENDPOINTS.quickActions, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quick actions: ${response.statusText}`);
      }
      
      return response.json();
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
    invalidate: () => queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
  };
}