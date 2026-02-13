import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../../mocks/server';
import { AllTheProviders } from '../../../../../test/utils';
import { mockActivity, mockNotifications, mockQuickActions, mockStats } from '../data/dashboard.mocks';
import { DashboardPageProvider } from './DashboardPageContext';
import { useDashboard } from './useDashboard';

// Create a wrapper specifically for dashboard tests
const DashboardTestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AllTheProviders>
    <DashboardPageProvider>
      {children}
    </DashboardPageProvider>
  </AllTheProviders>
);

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Add default MSW handlers for dashboard endpoints
    server.use(
      // Dashboard stats endpoint - return consistent data for tests
      http.get('/api/dashboard/stats', () => {
        return HttpResponse.json({
          documents: 42,
          releases: 3,
          pages: 8,
          workflows: 5
        });
      }),
      
      // Dashboard activity endpoint
      http.get('/api/dashboard/activity', () => {
        return HttpResponse.json(mockActivity);
      }),
      
      // Dashboard quick actions endpoint
      http.get('/api/dashboard/quick-actions', () => {
        return HttpResponse.json(mockQuickActions);
      }),
      
      // Dashboard notifications endpoint
      http.get('/api/dashboard/notifications', () => {
        return HttpResponse.json(mockNotifications);
      })
    );
  });

  describe('Data Fetching', () => {
    it('should fetch and return dashboard data successfully', async () => {
      // Mock the API to return specific data that matches our expectations
      const mockApiStats = { documents: 42, releases: 3, pages: 8, workflows: 5 };
      const expectedTransformedStats = [
        { name: 'Documents', label: 'Total Documents', value: '42', change: '+12', changeType: 'increase' },
        { name: 'Releases', label: 'Active Releases', value: '3', change: '-2', changeType: 'decrease' },
        { name: 'Pages', label: 'Pages', value: '8', change: '0', changeType: 'neutral' },
        { name: 'Workflows', label: 'Active Workflows', value: '5', change: '+1', changeType: 'increase' }
      ];

      server.use(
        http.get('/api/dashboard/stats', () => HttpResponse.json(mockApiStats)),
        http.get('/api/dashboard/activity', () => HttpResponse.json(mockActivity)),
        http.get('/api/dashboard/quick-actions', () => HttpResponse.json(mockQuickActions)),
        http.get('/api/dashboard/notifications', () => HttpResponse.json(mockNotifications))
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(expectedTransformedStats);
      expect(result.current.recentActivity).toEqual(mockActivity);
      expect(result.current.quickActions).toEqual(mockQuickActions);
      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.error).toBe(null);
    });

    it('should handle loading states correctly', async () => {
      // Mock delayed response
      const mockApiStats = { documents: 42, releases: 3, pages: 8, workflows: 5 };
      const expectedTransformedStats = [
        { name: 'Documents', label: 'Total Documents', value: '42', change: '+12', changeType: 'increase' },
        { name: 'Releases', label: 'Active Releases', value: '3', change: '-2', changeType: 'decrease' },
        { name: 'Pages', label: 'Pages', value: '8', change: '0', changeType: 'neutral' },
        { name: 'Workflows', label: 'Active Workflows', value: '5', change: '+1', changeType: 'increase' }
      ];

      server.use(
        http.get('/api/dashboard/stats', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json(mockApiStats);
        }),
        http.get('/api/dashboard/activity', () => HttpResponse.json(mockActivity)),
        http.get('/api/dashboard/quick-actions', () => HttpResponse.json(mockQuickActions)),
        http.get('/api/dashboard/notifications', () => HttpResponse.json([]))
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toEqual(mockStats); // Should return mock data during loading

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // After loading, should have transformed API data
      expect(result.current.stats).toEqual(expectedTransformedStats);
    });

    it('should return mock data as fallback when API fails', async () => {
      // Mock ALL APIs to fail to test fallback behavior
      server.use(
        http.get('/api/dashboard/stats', () => {
          return HttpResponse.json(
            { message: 'Stats server error' },
            { status: 500 }
          );
        }),
        http.get('/api/dashboard/activity', () => {
          return HttpResponse.json(
            { message: 'Activity server error' },
            { status: 500 }
          );
        }),
        http.get('/api/dashboard/quick-actions', () => {
          return HttpResponse.json(
            { message: 'Quick actions server error' },
            { status: 500 }
          );
        }),
        http.get('/api/dashboard/notifications', () => {
          return HttpResponse.json(
            { message: 'Notifications server error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still have mock data as fallback
      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.recentActivity).toEqual(mockActivity);
      expect(result.current.quickActions).toEqual(mockQuickActions);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle stats API error', async () => {
      server.use(
        http.get('/api/dashboard/stats', () => {
          return HttpResponse.json(
            { message: 'Stats error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error.message).toContain('Failed to fetch stats');
    });

    it('should handle activity API error', async () => {
      server.use(
        http.get('/api/dashboard/activity', () => {
          return HttpResponse.json(
            { message: 'Activity error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error.message).toContain('Failed to fetch activity');
    });

    it('should handle quick actions API error', async () => {
      server.use(
        http.get('/api/dashboard/quick-actions', () => {
          return HttpResponse.json(
            { message: 'Quick actions error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error.message).toContain('Failed to fetch quick actions');
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch all data when refetch is called', async () => {
      const statsHandler = vi.fn(() => HttpResponse.json({ documents: 42, releases: 3, pages: 8, workflows: 5 }));
      const activityHandler = vi.fn(() => HttpResponse.json(mockActivity));
      const quickActionsHandler = vi.fn(() => HttpResponse.json(mockQuickActions));
      const notificationsHandler = vi.fn(() => HttpResponse.json(mockNotifications));

      server.use(
        http.get('/api/dashboard/stats', statsHandler),
        http.get('/api/dashboard/activity', activityHandler),
        http.get('/api/dashboard/quick-actions', quickActionsHandler),
        http.get('/api/dashboard/notifications', notificationsHandler)
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Initial calls
      expect(statsHandler).toHaveBeenCalledTimes(1);
      expect(activityHandler).toHaveBeenCalledTimes(1);
      expect(quickActionsHandler).toHaveBeenCalledTimes(1);
      expect(notificationsHandler).toHaveBeenCalledTimes(1);

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      // Should be called again
      expect(statsHandler).toHaveBeenCalledTimes(2);
      expect(activityHandler).toHaveBeenCalledTimes(2);
      expect(quickActionsHandler).toHaveBeenCalledTimes(2);
      expect(notificationsHandler).toHaveBeenCalledTimes(2);
    });

    it('should handle refetch errors gracefully', async () => {
      server.use(
        http.get('/api/dashboard/stats', () => {
          return HttpResponse.json(
            { message: 'Refetch error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('State Management Handlers', () => {
    it('should provide selectStat handler', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.handlers.selectStat).toBe('function');

      act(() => {
        result.current.handlers.selectStat('Documents');
      });

      // State should be updated through context
      expect(result.current.state).toBeDefined();
    });

    it('should provide setTimeRange handler', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.handlers.setTimeRange).toBe('function');

      act(() => {
        result.current.handlers.setTimeRange('7d');
      });

      expect(result.current.state).toBeDefined();
    });

    it('should provide setView handler', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.handlers.setView).toBe('function');

      act(() => {
        result.current.handlers.setView('list');
      });

      expect(result.current.state).toBeDefined();
    });

    it('should provide retry handler that calls refetch', async () => {
      let callCount = 0;
      const mockStatsHandler = vi.fn(() => {
        callCount++;
        return HttpResponse.json({ documents: 42, releases: 3, pages: 8, workflows: 5 });
      });

      server.use(
        http.get('/api/dashboard/stats', mockStatsHandler)
      );

      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.handlers.retry).toBe('function');
      
      // Initial call count should be 1
      expect(mockStatsHandler).toHaveBeenCalledTimes(1);

      // Call retry handler
      act(() => {
        result.current.handlers.retry();
      });

      // Wait for refetch to complete
      await waitFor(() => {
        expect(mockStatsHandler).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Return Value Structure', () => {
    it('should return all required properties', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check all required properties are present
      expect(result.current).toHaveProperty('stats');
      expect(result.current).toHaveProperty('recentActivity');
      expect(result.current).toHaveProperty('quickActions');
      expect(result.current).toHaveProperty('notifications');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('handlers');

      // Check handlers object structure
      expect(result.current.handlers).toHaveProperty('selectStat');
      expect(result.current.handlers).toHaveProperty('setTimeRange');
      expect(result.current.handlers).toHaveProperty('setView');
      expect(result.current.handlers).toHaveProperty('retry');

      // Check types
      expect(Array.isArray(result.current.stats)).toBe(true);
      expect(Array.isArray(result.current.recentActivity)).toBe(true);
      expect(Array.isArray(result.current.quickActions)).toBe(true);
      expect(Array.isArray(result.current.notifications)).toBe(true);
      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.refetch).toBe('function');
    });

    it('should return consistent data structure', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Stats should have expected structure
      result.current.stats.forEach(stat => {
        expect(stat).toHaveProperty('name');
        expect(stat).toHaveProperty('value');
        expect(typeof stat.name).toBe('string');
        expect(['string', 'number'].includes(typeof stat.value)).toBe(true);
      });

      // Activity should have expected structure
      result.current.recentActivity.forEach(activity => {
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('action');
        expect(typeof activity.id).toBe('string');
        expect(typeof activity.type).toBe('string');
        expect(typeof activity.action).toBe('string');
      });

      // Quick actions should have expected structure
      result.current.quickActions.forEach(action => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('title');
        expect(action).toHaveProperty('description');
        expect(typeof action.id).toBe('string');
        expect(typeof action.title).toBe('string');
        expect(typeof action.description).toBe('string');
      });
    });
  });

  describe('Context Integration', () => {
    it('should integrate with dashboard context for state management', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have access to context state
      expect(result.current.state).toBeDefined();
      expect(typeof result.current.state).toBe('object');
    });

    it('should handle context dispatch actions', async () => {
      const { result } = renderHook(() => useDashboard(), {
        wrapper: DashboardTestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should be able to call handlers without errors
      expect(() => {
        act(() => {
          result.current.handlers.selectStat('Documents');
          result.current.handlers.setTimeRange('7d');
          result.current.handlers.setView('grid');
        });
      }).not.toThrow();
    });
  });
});