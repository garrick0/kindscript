import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MigrationsPage } from './ui/MigrationsPage';

// Mock the SessionProviderWrapper to avoid auth complexity in tests
vi.mock('../../../../core/providers/SessionProviderWrapper', () => ({
  SessionProviderWrapper: ({ children }: { children: React.ReactNode }) => children,
}));

// Create a test server specifically for this test
const server = setupServer(
  http.get('*/api/migrations', () => {
    console.log('[TEST] MSW handler called for /api/migrations');
    return HttpResponse.json([
      {
        id: 'portable-stories',
        name: 'Portable Stories Migration',
        description: 'Migrate test files to use Storybook portable stories pattern',
        status: 'in-progress',
        compliance: 84.8,
        target: 95,
        totalFiles: 47,
        filesCompliant: 28,
        filesRemaining: 5,
        startDate: '2025-08-20',
        elapsedTime: '5 days',
        timeEstimate: '2-4 hours',
        eta: '2025-08-25',
        successRate: 100,
        milestones: []
      }
    ]);
  }),
  http.get('*/api/migrations/history', () => {
    console.log('[TEST] MSW handler called for /api/migrations/history');
    return HttpResponse.json([]);
  })
);

describe('MigrationsPage Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Start the test server
    server.listen({ onUnhandledRequest: 'bypass' });
    
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0, // Force fresh data
          gcTime: 0, // Don't cache
        },
      },
    });
  });

  afterEach(() => {
    server.close();
  });

  it('should actually fetch and render migration data from MSW', async () => {
    console.log('[TEST] Starting integration test');
    
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // First, verify loading state appears
    expect(screen.getByText('Loading migrations...')).toBeInTheDocument();
    console.log('[TEST] Loading state confirmed');

    // Wait for the data to load and component to re-render
    await waitFor(() => {
      // The loading state should disappear
      expect(screen.queryByText('Loading migrations...')).not.toBeInTheDocument();
    }, { timeout: 5000 });
    
    console.log('[TEST] Loading state gone');

    // Now check if the actual content rendered
    const titleElement = screen.queryByText('Migration Manager');
    const portableStoriesElement = screen.queryByText(/Portable Stories Migration/i);
    const complianceElement = screen.queryByText(/84.8/);
    
    console.log('[TEST] Title found:', !!titleElement);
    console.log('[TEST] Portable Stories found:', !!portableStoriesElement);
    console.log('[TEST] Compliance found:', !!complianceElement);
    
    // Log the actual rendered content if assertions fail
    if (!titleElement || !portableStoriesElement) {
      console.log('[TEST] Rendered HTML:', container.innerHTML.slice(0, 500));
    }

    // These should pass if the component actually renders with data
    expect(titleElement).toBeInTheDocument();
    expect(portableStoriesElement).toBeInTheDocument();
    expect(complianceElement).toBeInTheDocument();
  });

  it('should show loading state when no data is available', () => {
    // Override handler to return empty array
    server.use(
      http.get('*/api/migrations', () => {
        return HttpResponse.json([]);
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // Should show loading state when migrations array is empty
    expect(screen.getByText('Loading migrations...')).toBeInTheDocument();
  });
});