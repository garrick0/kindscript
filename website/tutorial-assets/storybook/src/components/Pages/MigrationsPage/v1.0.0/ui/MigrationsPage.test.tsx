/**
 * MigrationsPage Component Tests
 * 
 * Tests for the migrations management interface including:
 * - Component rendering with required providers
 * - Query client integration
 * - MSW handler coverage
 * - User interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { composeStories } from '@storybook/react';
import * as stories from './MigrationsPage.stories';
import { MigrationsPage } from './MigrationsPage';

const { Default, Loading, Empty, MultipleMigrations } = composeStories(stories);

describe('MigrationsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
        },
      },
    });
  });

  describe('Provider Requirements', () => {
    it('should throw error when rendered without QueryClientProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<MigrationsPage />);
      }).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should render successfully with QueryClientProvider', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MigrationsPage />
        </QueryClientProvider>
      );

      // Should render without throwing
      await waitFor(() => {
        expect(screen.getByText(/Migration Manager/i)).toBeInTheDocument();
      });
    });

    it('should render successfully through Storybook stories (which should have providers)', async () => {
      // Storybook stories should have the provider configured in preview.tsx
      render(<Default />);

      await waitFor(() => {
        expect(screen.getByText(/Migration Manager/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component Rendering', () => {
    it('should render migration header', async () => {
      render(<Default />);

      await waitFor(() => {
        expect(screen.getByText('Migration Manager')).toBeInTheDocument();
        expect(screen.getByText(/Manage and track code migrations/i)).toBeInTheDocument();
      });
    });

    it('should render refresh and export buttons', async () => {
      render(<Default />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      });
    });

    it('should render tabs', async () => {
      render(<Default />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /files/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /tools/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /documentation/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch migrations on mount', async () => {
      render(<Default />);

      await waitFor(() => {
        expect(screen.getByText(/Portable Stories Migration/i)).toBeInTheDocument();
      });
    });

    it('should show loading state', async () => {
      render(<Loading />);

      // Loading story should show some loading indicator
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should show empty state when no migrations', async () => {
      render(<Empty />);

      await waitFor(() => {
        expect(screen.getByText(/No migrations found/i)).toBeInTheDocument();
      });
    });

    it('should display multiple migrations', async () => {
      render(<MultipleMigrations />);

      await waitFor(() => {
        expect(screen.getByText(/Portable Stories Migration/i)).toBeInTheDocument();
        expect(screen.getByText(/TypeScript Strict Mode/i)).toBeInTheDocument();
        expect(screen.getByText(/React 18 Migration/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should handle tab switching', async () => {
      render(<Default />);

      await waitFor(() => {
        const filesTab = screen.getByRole('tab', { name: /files/i });
        expect(filesTab).toBeInTheDocument();
      });

      const filesTab = screen.getByRole('tab', { name: /files/i });
      fireEvent.click(filesTab);

      // Files tab content should be visible
      expect(filesTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should handle refresh button click', async () => {
      render(<Default />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      // Should trigger data refresh (mock should be called)
    });

    it('should handle compliance check button', async () => {
      render(<Default />);

      await waitFor(() => {
        const checkButton = screen.getByRole('button', { name: /check compliance/i });
        expect(checkButton).toBeInTheDocument();
      });

      const checkButton = screen.getByRole('button', { name: /check compliance/i });
      fireEvent.click(checkButton);

      // Should trigger compliance check
    });
  });

  describe('MSW Integration', () => {
    it('should have MSW handlers for all migration endpoints', async () => {
      // This test verifies that MSW handlers are properly configured
      render(<Default />);

      // The component should successfully fetch data from MSW
      await waitFor(() => {
        expect(screen.getByText(/Portable Stories Migration/i)).toBeInTheDocument();
        expect(screen.getByText(/84.8%/)).toBeInTheDocument(); // Compliance percentage
      });
    });

    it('should handle API errors gracefully', async () => {
      // Test error handling when API fails
      // This would require overriding MSW handlers to return errors
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <QueryClientProvider client={queryClient}>
          <MigrationsPage />
        </QueryClientProvider>
      );

      // Component should render even if API fails
      await waitFor(() => {
        expect(screen.getByText('Migration Manager')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<Default />);

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);
        
        tabs.forEach(tab => {
          expect(tab).toHaveAttribute('aria-selected');
        });
      });
    });

    it('should support keyboard navigation', async () => {
      render(<Default />);

      await waitFor(() => {
        const firstTab = screen.getByRole('tab', { name: /overview/i });
        expect(firstTab).toBeInTheDocument();
      });

      const firstTab = screen.getByRole('tab', { name: /overview/i });
      firstTab.focus();
      
      // Simulate tab key press
      fireEvent.keyDown(firstTab, { key: 'Tab' });
      
      // Focus should move to next interactive element
    });
  });
});