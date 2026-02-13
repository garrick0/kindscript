import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MigrationsPage } from './ui/MigrationsPage';
import { MigrationService } from './data/migration.service';

// Mock the SessionProviderWrapper
vi.mock('../../../../core/providers/SessionProviderWrapper', () => ({
  SessionProviderWrapper: ({ children }: { children: React.ReactNode }) => children,
}));

describe('MigrationsPage Debug', () => {
  it('should reveal why component stays in loading state', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });

    // Spy on the service to see what it returns
    const service = new MigrationService();
    const getMigrationsSpy = vi.spyOn(service, 'getMigrations');
    
    // Also spy on fetch to see the actual network call
    const fetchSpy = vi.spyOn(global, 'fetch');

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MigrationsPage />
      </QueryClientProvider>
    );

    // Give it time to make the request
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('=== DEBUG INFO ===');
    console.log('Fetch called:', fetchSpy.mock.calls.length, 'times');
    if (fetchSpy.mock.calls.length > 0) {
      console.log('Fetch URL:', fetchSpy.mock.calls[0][0]);
      
      // Make the same call directly to see what we get
      try {
        const response = await fetch('http://localhost:3000/api/migrations');
        const data = await response.json();
        console.log('Direct fetch response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Direct fetch error:', e);
      }
    }
    
    console.log('Service getMigrations called:', getMigrationsSpy.mock.calls.length, 'times');
    
    // Check what's rendered
    const html = container.innerHTML;
    const hasLoadingState = html.includes('Loading migrations');
    const hasMigrationManager = html.includes('Migration Manager');
    const hasPortableStories = html.includes('Portable Stories');
    
    console.log('Has loading state:', hasLoadingState);
    console.log('Has Migration Manager:', hasMigrationManager);
    console.log('Has Portable Stories:', hasPortableStories);
    
    if (!hasPortableStories && hasMigrationManager) {
      console.log('Component rendered but no data shown!');
      console.log('First 500 chars of HTML:', html.slice(0, 500));
    }

    // Now let's manually call the service to see what it returns
    try {
      const migrations = await service.getMigrations();
      console.log('Service returned migrations:', migrations.length);
      if (migrations.length > 0) {
        console.log('First migration:', JSON.stringify(migrations[0], null, 2));
      }
    } catch (e) {
      console.log('Service error:', e);
    }
  });
});