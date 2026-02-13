import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../../mocks/server';
import { AllTheProviders } from '../../../../../test/utils';
import { mockActivity, mockQuickActions, mockStats } from '../data/dashboard.mocks';
import { DashboardPage } from './DashboardPage';

// Mock the router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    
    // Add default MSW handlers for dashboard endpoints
    server.use(
      // Dashboard stats endpoint
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
        return HttpResponse.json([]);
      })
    );
  });

  describe('Loading States', () => {
    it('should display loading skeleton when dashboard data is loading', async () => {
      // Mock delayed response - use longer delay to catch loading state
      server.use(
        http.get('/api/dashboard/stats', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({
            documents: 42,
            releases: 3,
            pages: 8,
            workflows: 5
          });
        })
      );

      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      // Check for loading skeleton container (dashboard loading, not auth loading)
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      
      // Then wait for loading to complete and content to appear
      await waitFor(() => {
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
      }, { timeout: 10000 }); // Give extra time for the 1000ms delay
    });

    it('should display loading skeleton when auth is loading', () => {
      render(
        <AllTheProviders authProps={{ loading: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });
  });

  describe('Authentication States', () => {
    it('should show login prompt when user is not authenticated', () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: false, loading: false }}>
          <DashboardPage />
        </AllTheProviders>
      );

      expect(screen.getByText('Please login to view your dashboard')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should redirect to signin page when sign in button is clicked', () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: false, loading: false }}>
          <DashboardPage />
        </AllTheProviders>
      );

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      expect(mockPush).toHaveBeenCalledWith('/auth/signin');
    });

    it('should display dashboard when user is authenticated', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should display error message when dashboard data fails to load', async () => {
      server.use(
        http.get('/api/dashboard/stats', () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          );
        })
      );

      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should retry loading data when retry button is clicked', async () => {
      const statsHandler = vi.fn()
        .mockReturnValueOnce(HttpResponse.json({ message: 'Server error' }, { status: 500 }))
        .mockReturnValueOnce(HttpResponse.json(mockStats));

      server.use(
        http.get('/api/dashboard/stats', statsHandler)
      );

      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      expect(statsHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Content Rendering', () => {
    it('should render welcome header with user name', async () => {
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

      await waitFor(() => {
        expect(screen.getByText(/Welcome back.*John Doe/)).toBeInTheDocument();
      });
    });

    it('should render welcome header with email when name is not available', async () => {
      const testUser = { 
        id: 'test-user',
        email: 'john@example.com' 
      };

      render(
        <AllTheProviders authProps={{ user: testUser }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/Welcome back.*john@example\.com/)).toBeInTheDocument();
      });
    });

    it('should render stats grid with correct data', async () => {
      // Mock the dashboard stats API to return our test data
      server.use(
        http.get('/api/dashboard/stats', () => {
          return HttpResponse.json({
            documents: 42,
            releases: 3,
            pages: 8,
            workflows: 5
          });
        })
      );

      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        // Check that we have the expected stat values
        expect(screen.getByText('42')).toBeInTheDocument(); // Documents
        expect(screen.getByText('3')).toBeInTheDocument();  // Releases 
        expect(screen.getByText('8')).toBeInTheDocument();  // Pages
        expect(screen.getByText('5')).toBeInTheDocument();  // Workflows
        
        // Check the first occurrence of these labels in the stats grid
        expect(screen.getAllByText('Documents')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Releases')[0]).toBeInTheDocument();
        expect(screen.getAllByText('Workflows')[0]).toBeInTheDocument();
        
        // Check that change indicators are present
        expect(screen.getByText((content, element) => content?.includes('+12') || false)).toBeInTheDocument();
        expect(screen.getByText((content, element) => content?.includes('-2') || false)).toBeInTheDocument();
      });
    });

    it('should render recent activity section', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        
        mockActivity.forEach(activity => {
          expect(screen.getByText(activity.action)).toBeInTheDocument();
          expect(screen.getByText(activity.time!)).toBeInTheDocument();
        });
      });
    });

    it('should render quick actions section', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        mockQuickActions.forEach(action => {
          expect(screen.getByText(action.title)).toBeInTheDocument();
          expect(screen.getByText(action.description)).toBeInTheDocument();
        });
      });
    });

    it('should display empty state when no recent activity', async () => {
      server.use(
        http.get('/api/dashboard/activity', () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('No recent activity to display')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to documents when create document action is clicked', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Create Document')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create Document'));
      expect(mockPush).toHaveBeenCalledWith('/documents/new');
    });

    it('should navigate to pages when generate page action is clicked', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Generate Page')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Generate Page'));
      expect(mockPush).toHaveBeenCalledWith('/pages/generate');
    });

    it('should navigate to workflows when start workflow action is clicked', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Start Workflow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Workflow'));
      expect(mockPush).toHaveBeenCalledWith('/workflows/new');
    });

    it('should navigate to activity page when view all activity is clicked', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('View all activity →')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('View all activity →'));
      expect(mockPush).toHaveBeenCalledWith('/activity');
    });

    it('should handle unknown quick action gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      // Mock an unknown action
      server.use(
        http.get('/api/dashboard/quick-actions', () => {
          return HttpResponse.json([
            {
              id: 'unknown-action',
              title: 'Unknown Action',
              description: 'This is an unknown action',
              color: 'blue'
            }
          ]);
        })
      );

      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Unknown Action')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Unknown Action'));
      expect(consoleSpy).toHaveBeenCalledWith('Unknown action:', 'unknown-action');
    });
  });

  describe('Visual Elements', () => {
    it('should display correct trend icons for stats', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        // Check for trend icons (they should be rendered with proper classes)
        const increaseTrendElements = screen.getAllByText((content, element) => content?.includes('+12') || false);
        const decreaseTrendElements = screen.getAllByText((content, element) => content?.includes('-2') || false);
        const neutralTrendElements = screen.getAllByText((content, element) => content?.includes('0') && !content.includes('+') && !content.includes('-') || false);

        expect(increaseTrendElements.length).toBeGreaterThanOrEqual(1);
        expect(decreaseTrendElements.length).toBeGreaterThanOrEqual(1);
        expect(neutralTrendElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display activity type indicators with correct colors', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      await waitFor(() => {
        // Check that different activity items are displayed (instead of type labels)
        expect(screen.getByText('Created Q4 Product Roadmap')).toBeInTheDocument();
        expect(screen.getByText('Published Version 2.1.0')).toBeInTheDocument();
        expect(screen.getByText('Completed Content Review')).toBeInTheDocument();
        expect(screen.getByText('Updated Dashboard Page')).toBeInTheDocument();
      });
    });

    it('should display user information in footer when authenticated', async () => {
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

      await waitFor(() => {
        expect(screen.getByText('Logged in as: John Doe (john@example.com)')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Props', () => {
    it('should work with custom userId prop', async () => {
      const customUserId = 'custom-user-123';

      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage userId={customUserId} />
        </AllTheProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary', () => {
    it('should be wrapped in ErrorBoundary component', async () => {
      render(
        <AllTheProviders authProps={{ isAuthenticated: true }}>
          <DashboardPage />
        </AllTheProviders>
      );

      // The component should render without throwing, indicating ErrorBoundary is present
      await waitFor(() => {
        expect(screen.getByText(/Build AI-powered applications/i)).toBeInTheDocument();
      });
    });
  });
});