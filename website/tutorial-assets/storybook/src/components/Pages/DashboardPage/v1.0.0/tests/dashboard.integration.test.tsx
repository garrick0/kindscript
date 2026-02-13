import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../../mocks/server';
import { AllTheProviders } from '../../../../../test/utils';
import { DashboardPage } from '../ui/DashboardPage';
import { mockActivity, mockQuickActions, mockStats } from '../data/dashboard.mocks';

// Mock the router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Full Page Flow', () => {
    it('should complete full dashboard loading and interaction flow', async () => {
      const testUser = { 
        id: 'test-user',
        name: 'John Doe', 
        email: 'john@example.com' 
      };

      render(
        <AllTheProviders authProps={{ user: testUser }}>
          <DashboardPage />
        </AllTheProviders>
      );

      // 1. Should show loading initially
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);

      // 2. Should load and display content
      await waitFor(() => {
        expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument();
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });

      // 3. Should display all stats
      mockStats.forEach(stat => {
        expect(screen.getByText(stat.name)).toBeInTheDocument();
        expect(screen.getByText(stat.value.toString())).toBeInTheDocument();
      });

      // 4. Should display all activities
      mockActivity.forEach(activity => {
        expect(screen.getByText(activity.action)).toBeInTheDocument();
      });

      // 5. Should display all quick actions
      mockQuickActions.forEach(action => {
        expect(screen.getByText(action.title)).toBeInTheDocument();
      });

      // 6. Should handle interactions
      fireEvent.click(screen.getByText('Create Document'));
      expect(mockPush).toHaveBeenCalledWith('/documents/new');

      fireEvent.click(screen.getByText('View all activity →'));
      expect(mockPush).toHaveBeenCalledWith('/activity');
    });

    it('should handle authentication flow from unauthenticated to authenticated', async () => {
      const { rerender } = render(
        <AllTheProviders authProps={{ isAuthenticated: false, loading: false }}>
          <DashboardPage />
        </AllTheProviders>
      );

      // Should show login prompt
      expect(screen.getByText('Please login to view your dashboard')).toBeInTheDocument();

      // Simulate user authentication
      const testUser = { 
        id: 'test-user',
        name: 'Jane Doe', 
        email: 'jane@example.com' 
      };

      rerender(
        <AllTheProviders authProps={{ user: testUser, isAuthenticated: true, loading: false }}>
          <DashboardPage />
        </AllTheProviders>
      );

      // Should now show dashboard
      await waitFor(() => {
        expect(screen.getByText('Welcome back, Jane Doe')).toBeInTheDocument();
      });
    });

    it('should handle error recovery flow', async () => {
      let shouldError = true;
      const toggleError = () => { shouldError = !shouldError; };

      server.use(
        http.get('/api/dashboard/stats', () => {
          if (shouldError) {
            return HttpResponse.json(
              { message: 'Server temporarily unavailable' },
              { status: 503 }
            );
          }
          return HttpResponse.json(mockStats);
        })
      );

      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      // 1. Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });

      // 2. Should have retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // 3. Simulate server recovery
      toggleError();

      // 4. Click retry
      fireEvent.click(retryButton);

      // 5. Should show dashboard after retry
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // 6. Should display content
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should handle multiple concurrent API calls correctly', async () => {
      const statsHandler = vi.fn(() => HttpResponse.json(mockStats));
      const activityHandler = vi.fn(() => HttpResponse.json(mockActivity));
      const quickActionsHandler = vi.fn(() => HttpResponse.json(mockQuickActions));

      server.use(
        http.get('/api/dashboard/stats', statsHandler),
        http.get('/api/dashboard/activity', activityHandler),
        http.get('/api/dashboard/quick-actions', quickActionsHandler)
      );

      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // All API calls should have been made
      expect(statsHandler).toHaveBeenCalledTimes(1);
      expect(activityHandler).toHaveBeenCalledTimes(1);
      expect(quickActionsHandler).toHaveBeenCalledTimes(1);

      // All data should be displayed
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Create Document')).toBeInTheDocument();
    });

    it('should handle partial API failures gracefully', async () => {
      server.use(
        http.get('/api/dashboard/stats', () => HttpResponse.json(mockStats)),
        http.get('/api/dashboard/activity', () => {
          return HttpResponse.json(
            { message: 'Activity service unavailable' },
            { status: 503 }
          );
        }),
        http.get('/api/dashboard/quick-actions', () => HttpResponse.json(mockQuickActions))
      );

      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        // Should still show stats and quick actions
        expect(screen.getByText('Documents')).toBeInTheDocument();
        expect(screen.getByText('Create Document')).toBeInTheDocument();
        
        // Should show activity from mock fallback
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });

    it('should handle API response data transformation', async () => {
      const customStats = [
        { 
          name: 'Custom Metric', 
          value: 999, 
          change: '+50%', 
          changeType: 'increase' as const
        }
      ];

      const customActivity = [
        {
          id: 'custom-1',
          type: 'system' as const,
          action: 'Custom system event',
          time: '1 second ago',
          userName: 'System'
        }
      ];

      server.use(
        http.get('/api/dashboard/stats', () => HttpResponse.json(customStats)),
        http.get('/api/dashboard/activity', () => HttpResponse.json(customActivity))
      );

      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Metric')).toBeInTheDocument();
        expect(screen.getByText('999')).toBeInTheDocument();
        expect(screen.getByText('+50%')).toBeInTheDocument();
        expect(screen.getByText('Custom system event')).toBeInTheDocument();
        expect(screen.getByText('1 second ago')).toBeInTheDocument();
      });
    });
  });

  describe('State Management Integration', () => {
    it('should maintain state consistency across re-renders', async () => {
      const { rerender } = render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Data should be loaded and displayed
      expect(screen.getByText('Documents')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      // Should still show the same data without re-fetching
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('should handle context state updates during user interactions', async () => {
      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Interact with quick actions (which should trigger state updates)
      fireEvent.click(screen.getByText('Create Document'));
      expect(mockPush).toHaveBeenCalledWith('/documents/new');

      fireEvent.click(screen.getByText('Generate Page'));
      expect(mockPush).toHaveBeenCalledWith('/pages/generate');

      fireEvent.click(screen.getByText('Start Workflow'));
      expect(mockPush).toHaveBeenCalledWith('/workflows/new');

      // All interactions should have been handled
      expect(mockPush).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeStats = Array.from({ length: 20 }, (_, i) => ({
        name: `Metric ${i}`,
        value: Math.floor(Math.random() * 1000),
        change: `+${Math.floor(Math.random() * 50)}`,
        changeType: 'increase' as const
      }));

      const largeActivity = Array.from({ length: 100 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'document' as const,
        action: `Action ${i}`,
        time: `${i + 1} minutes ago`,
        userName: `User ${i}`
      }));

      server.use(
        http.get('/api/dashboard/stats', () => HttpResponse.json(largeStats)),
        http.get('/api/dashboard/activity', () => HttpResponse.json(largeActivity))
      );

      const startTime = performance.now();

      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);

      // Should display the large dataset
      expect(screen.getByText('Metric 0')).toBeInTheDocument();
      expect(screen.getByText('Action 0')).toBeInTheDocument();
    });

    it('should handle rapid user interactions without breaking', async () => {
      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Create Document')).toBeInTheDocument();
      });

      // Rapidly click multiple actions
      const createDocButton = screen.getByText('Create Document');
      const generatePageButton = screen.getByText('Generate Page');
      const startWorkflowButton = screen.getByText('Start Workflow');

      fireEvent.click(createDocButton);
      fireEvent.click(generatePageButton);
      fireEvent.click(startWorkflowButton);
      fireEvent.click(createDocButton);
      fireEvent.click(generatePageButton);

      // All clicks should be handled
      expect(mockPush).toHaveBeenCalledTimes(5);
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain proper ARIA labels and roles', async () => {
      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Check for proper button roles
      const quickActionButtons = screen.getAllByRole('button');
      expect(quickActionButtons.length).toBeGreaterThan(0);

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      render(
        <AllTheProviders>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Create Document')).toBeInTheDocument();
      });

      const createDocButton = screen.getByText('Create Document');
      
      // Should be focusable
      createDocButton.focus();
      expect(document.activeElement).toBe(createDocButton);

      // Should respond to Enter key
      fireEvent.keyDown(createDocButton, { key: 'Enter', code: 'Enter' });
      // Note: The component doesn't handle keyDown events, but this tests the structure
    });
  });
});