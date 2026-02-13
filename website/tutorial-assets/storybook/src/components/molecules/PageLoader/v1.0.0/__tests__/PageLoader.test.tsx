import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PageLoader } from '../PageLoader';

// Mock window and document
beforeEach(() => {
  global.document = window.document;
  global.window = window;
});

describe('PageLoader', () => {
  it('renders loading state', () => {
    render(<PageLoader loading={true}>Content</PageLoader>);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('renders children when not loading', () => {
    render(<PageLoader loading={false}>Content</PageLoader>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const error = new Error('Test error');
    render(<PageLoader error={error}>Content</PageLoader>);
    expect(screen.getByText('Error loading page')).toBeInTheDocument();
  });

  it('shows retry button in error state', () => {
    const error = new Error('Test error');
    const onRetry = vi.fn();
    render(<PageLoader error={error} onRetry={onRetry}>Content</PageLoader>);
    const retryButton = screen.getByText('Retry');
    retryButton.click();
    expect(onRetry).toHaveBeenCalled();
  });
});