import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard, dashboardKeys } from './dashboard.queries';

const mockStats = [
  { id: 1, label: 'Total Users', value: '1,234' },
  { id: 2, label: 'Active Projects', value: '56' }
];

const mockActivity = [
  { id: 1, type: 'project_created', timestamp: '2024-01-01T00:00:00Z' }
];

const mockNotifications = [
  { id: 1, message: 'New update available', type: 'info' }
];

const mockQuickActions = [
  { id: 1, label: 'Create Project', action: 'create_project' }
];

const server = setupServer(
  http.get('/api/dashboard/stats', () => {
    return new Response(JSON.stringify(mockStats));
  }),
  http.get('/api/dashboard/activity', () => {
    return new Response(JSON.stringify(mockActivity));
  }),
  http.get('/api/dashboard/notifications', () => {
    return new Response(JSON.stringify(mockNotifications));
  }),
  http.get('/api/dashboard/quick-actions', () => {
    return new Response(JSON.stringify(mockQuickActions));
  })
);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('dashboard queries', () => {
  beforeEach(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('should show loading state initially', () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
  });

  it('should load all dashboard data successfully', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.recentActivity).toEqual(mockActivity);
    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.quickActions).toEqual(mockQuickActions);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    server.use(
      http.get('/api/dashboard/stats', () => {
        return new Response('Error', { status: 500 });
      })
    );

    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.stats).toEqual([]);
  });

  it('should refetch all data when refetch is called', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedStats = [{ id: 1, label: 'Total Users', value: '1,235' }];
    server.use(
      http.get('/api/dashboard/stats', () => {
        return new Response(JSON.stringify(updatedStats));
      })
    );

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.stats).toEqual(updatedStats);
    });
  });

  it('should invalidate queries when invalidate is called', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedStats = [{ id: 1, label: 'Total Users', value: '1,235' }];
    server.use(
      http.get('/api/dashboard/stats', () => {
        return new Response(JSON.stringify(updatedStats));
      })
    );

    await result.current.invalidate();

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.stats).toEqual(updatedStats);
    });
  });
});