import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MigrationsPage } from './ui/MigrationsPage';

// Mock the SessionProviderWrapper to avoid auth complexity in tests
vi.mock('../../../../core/providers/SessionProviderWrapper', () => ({
  SessionProviderWrapper: ({ children }: { children: React.ReactNode }) => children,
}));

describe('MigrationsPage - Proper Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0, // Don't cache between tests
        },
      },
    });
  });

  it('should render loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // Should show loading spinner and text
    expect(screen.getByText('Loading migrations...')).toBeInTheDocument();
  });

  it('should render migration data after loading', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // First verify loading state appears
    expect(screen.getByText('Loading migrations...')).toBeInTheDocument();

    // Wait for loading to complete and data to render
    await waitFor(() => {
      expect(screen.queryByText('Loading migrations...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Now verify the component has rendered with data
    // Check for the main title
    expect(screen.getByText('Migration Manager')).toBeInTheDocument();
    
    // Check for the specific migration data from our custom handlers
    expect(screen.getByText('Portable Stories Migration')).toBeInTheDocument();
    
    // Check for compliance percentage (84.8% appears multiple times)
    const complianceElements = screen.getAllByText(/84\.8/);
    expect(complianceElements.length).toBeGreaterThan(0);
    
    // Check for status badges
    expect(screen.getByText('in-progress')).toBeInTheDocument();
    
    // Check for milestone information
    expect(screen.getByText(/Golden Examples/)).toBeInTheDocument();
  });

  it('should display migration with correct status', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading migrations...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show the main migration from our mock data
    expect(screen.getByText('Portable Stories Migration')).toBeInTheDocument();
    
    // Check status is displayed
    expect(screen.getByText('in-progress')).toBeInTheDocument();
  });

  it('should display migration milestones', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading migrations...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Check for milestone names
    expect(screen.getByText(/Golden Examples/)).toBeInTheDocument();
    expect(screen.getByText(/Simple Components/)).toBeInTheDocument();
    expect(screen.getByText(/Complex Components/)).toBeInTheDocument();
    expect(screen.getByText(/Target Compliance/)).toBeInTheDocument();
  });

  it('should handle empty migrations array', async () => {
    // Override the MSW handler to return empty array
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/migrations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return originalFetch(url);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading migrations...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show empty state
    expect(screen.getByText('No Migrations Found')).toBeInTheDocument();
    expect(screen.getByText('Create your first migration to get started.')).toBeInTheDocument();

    // Restore fetch
    global.fetch = originalFetch;
  });

  it('should properly call the migration service', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // Wait for the component to make API calls
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Verify the correct endpoints were called (relative URLs)
    expect(fetchSpy).toHaveBeenCalledWith('/api/migrations');
    expect(fetchSpy).toHaveBeenCalledWith('/api/migrations/history');

    fetchSpy.mockRestore();
  });
});