/**
 * Integration test for MigrationsPage
 * Verifies the component renders with all required providers
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { getHandlers } from '../../../../../mocks/handlers';
import { MigrationsPage } from './MigrationsPage';

describe('MigrationsPage Integration', () => {
  const server = setupServer(...getHandlers({ enableValidation: true }));
  
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  
  afterAll(() => {
    server.close();
  });
  
  it('should render with loading state initially', () => {
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
    
    // Should show loading state
    expect(screen.getByText('Loading migrations...')).toBeInTheDocument();
  });
  
  it('should render migrations after data loads', async () => {
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
    
    // Wait for migrations to load
    await waitFor(() => {
      expect(screen.getByText('Migration Manager')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check for migration content
    expect(screen.getByText('Active Migration')).toBeInTheDocument();
  });
  
  it('should handle empty migrations gracefully', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    
    // Override handler to return empty migrations
    server.use(
      ...getHandlers({ enableValidation: true }).map(handler => {
        if (handler.info.path === '/api/migrations') {
          return {
            ...handler,
            resolver: () => new Response(JSON.stringify({ migrations: [] }))
          };
        }
        return handler;
      })
    );
    
    render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );
    
    // Should show loading initially then handle empty state
    expect(screen.getByText('Loading migrations...')).toBeInTheDocument();
  });
});