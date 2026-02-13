/**
 * Test that MigrationsPage renders properly with MSW
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MigrationsPage } from './MigrationsPage';

describe('MigrationsPage Rendering', () => {
  it('should render MigrationsPage and load data', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );
    
    // Should show loading initially
    expect(screen.getByText('Loading migrations...')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Migration Manager')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should show the active migration section
    await waitFor(() => {
      expect(screen.getByText('Active Migration')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should have tabs
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /files/i })).toBeInTheDocument();
    
    // Should have migration data loaded from MSW
    const migrationCards = screen.getAllByRole('heading', { level: 3 });
    expect(migrationCards.length).toBeGreaterThan(0);
  });
});