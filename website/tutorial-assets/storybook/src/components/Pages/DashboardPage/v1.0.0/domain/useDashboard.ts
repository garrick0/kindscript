'use client';

import { useCallback } from 'react';
// import type { DashboardStats } from '../../../../mocks/generated/types';
import { mockActivity, mockQuickActions, mockStats } from '../data/dashboard.mocks';
import {
    useDashboardStats, useNotifications, useQuickActions, useRecentActivity
} from '../data/dashboard.queries';
import { useDashboardPageContext } from './DashboardPageContext';

/**
 * Transform TypeSpec DashboardStats object to UI array format
 */
function transformStatsToArray(dashboardStats: any): any[] {
  return [
    {
      name: 'Documents',
      label: 'Total Documents',
      value: String(dashboardStats.documents),
      change: '+12', // Mock change for now
      changeType: 'increase'
    },
    {
      name: 'Releases',
      label: 'Active Releases',
      value: String(dashboardStats.releases),
      change: '-2', // Mock change for now
      changeType: 'decrease'
    },
    {
      name: 'Pages',
      label: 'Pages',
      value: String(dashboardStats.pages),
      change: '0', // Mock change for now
      changeType: 'neutral'
    },
    {
      name: 'Workflows',
      label: 'Active Workflows',
      value: String(dashboardStats.workflows),
      change: '+1', // Mock change for now
      changeType: 'increase'
    }
  ];
}

export interface UseDashboardReturn {
  stats: any[];
  recentActivity: any[];
  quickActions: any[];
  notifications: any[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  state: any;
  handlers: {
    selectStat: (statId: string) => void;
    setTimeRange: (range: string) => void;
    setView: (view: 'grid' | 'list') => void;
    retry: () => void;
  };
}

export function useDashboard(): UseDashboardReturn {
  const { state, dispatch } = useDashboardPageContext();
  
  // Use the query hooks
  const statsQuery = useDashboardStats();
  const activityQuery = useRecentActivity();
  const quickActionsQuery = useQuickActions();
  const notificationsQuery = useNotifications();

  // Combined loading state
  const loading = statsQuery.isLoading || 
                  activityQuery.isLoading || 
                  quickActionsQuery.isLoading;

  // Combined error state
  const error = statsQuery.error || 
                activityQuery.error || 
                quickActionsQuery.error || 
                notificationsQuery.error;

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      statsQuery.refetch(),
      activityQuery.refetch(),
      quickActionsQuery.refetch(),
      notificationsQuery.refetch(),
    ]);
  }, [statsQuery.refetch, activityQuery.refetch, quickActionsQuery.refetch, notificationsQuery.refetch]);

  // Handlers for state management
  const handlers = {
    selectStat: (statId: string) => {
      dispatch({ type: 'SELECT_STAT', payload: statId });
    },
    setTimeRange: (range: string) => {
      dispatch({ type: 'SET_TIME_RANGE', payload: range });
    },
    setView: (view: 'grid' | 'list') => {
      dispatch({ type: 'SET_VIEW', payload: view });
    },
    retry: () => {
      refetch();
    }
  };

  // Transform API data to UI format or use mock data as fallback
  const stats = statsQuery.data && !statsQuery.error ? transformStatsToArray(statsQuery.data) : mockStats;
  const recentActivity = activityQuery.data && !activityQuery.error ? activityQuery.data : mockActivity;
  const quickActions = quickActionsQuery.data && !quickActionsQuery.error ? quickActionsQuery.data : mockQuickActions;
  const notifications = notificationsQuery.data && !notificationsQuery.error ? notificationsQuery.data : [];

  return {
    stats,
    recentActivity,
    quickActions,
    notifications,
    loading,
    error: error as Error | null,
    refetch,
    state,
    handlers,
  };
}