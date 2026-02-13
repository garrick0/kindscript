import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from './MigrationsPage.stories';

// Compose all stories from the MigrationsPage.stories file
const { Default, Loading } = composeStories(stories);

describe('MigrationsPage Portable Stories', () => {
  it('renders Default story correctly', async () => {
    render(<Default />);
    
    // Check that the page renders without crashing
    const container = document.body.firstChild;
    expect(container).toBeInTheDocument();
    
    // Look for loading text which appears in both Default and Loading states
    const loadingText = screen.queryByText(/loading migrations/i);
    expect(loadingText).toBeInTheDocument();
    
    // Check that the component renders with expected structure
    expect(document.body).toContainHTML('div');
  });

  it('renders Loading story correctly', async () => {
    render(<Loading />);
    
    // Check that loading state renders
    const container = document.body.firstChild;
    expect(container).toBeInTheDocument();
    
    // Look for loading text and spinner
    const loadingText = screen.getByText(/loading migrations/i);
    expect(loadingText).toBeInTheDocument();
    
    // Check for loading spinner (svg element)
    const spinner = document.querySelector('svg[aria-hidden="true"]');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });
});