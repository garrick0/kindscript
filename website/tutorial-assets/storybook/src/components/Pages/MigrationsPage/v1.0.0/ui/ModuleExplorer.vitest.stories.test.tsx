/**
 * Vitest tests for ModuleExplorer Storybook stories
 * 
 * Tests story rendering and basic functionality.
 * Uses composed stories from Storybook for consistent testing.
 */

import { describe, it, expect } from 'vitest';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as stories from './ModuleExplorer.stories';

// Compose all stories for testing
const composedStories = composeStories(stories);

describe('ModuleExplorer Stories', () => {
  describe('Story Rendering', () => {
    it('should render all stories without errors', () => {
      Object.entries(composedStories).forEach(([name, Story]) => {
        const { container, unmount } = render(<Story />);
        
        // Basic smoke test - story should render
        expect(container.firstChild).toBeTruthy();
        
        // Cleanup
        unmount();
      });
    });
  });

  describe('Play Function Execution', () => {
    const storyEntries = Object.entries(composedStories);
    
    storyEntries.forEach(([name, Story]) => {
      it(`should execute ${name} story play function if it exists`, async () => {
        const { container } = render(<Story />);
        
        // Execute play function if it exists
        if (Story.play) {
          await Story.play({
            canvasElement: container,
            args: Story.args || {},
            id: name.toLowerCase(),
            title: name,
            name: name,
            story: name,
            parameters: Story.parameters || {},
            globals: {},
            argTypes: {},
            initialArgs: Story.args || {},
            loaded: {},
            step: () => {},
            context: {} as any
          });
        }
        
        expect(container).toBeDefined();
      });
    });
  });

  describe('Story Configuration', () => {
    it('should have proper meta configuration', () => {
      const meta = (stories as any).default;
      
      expect(meta.title).toBe('Pages/MigrationsPage/ModuleExplorer');
      expect(meta.component).toBeDefined();
      expect(meta.parameters?.vitest).toBeDefined();
      expect(meta.parameters?.vitest?.testLevel).toBe('component');
    });

    it('should have play functions for interactive stories', () => {
      const storiesWithPlayFunctions = [
        'Default',
        'GridView', 
        'WithSearch',
        'WithStatusFilter',
        'WithError'
      ];
      
      storiesWithPlayFunctions.forEach(storyName => {
        const story = (composedStories as any)[storyName];
        expect(story?.play, `${storyName} should have a play function`).toBeDefined();
      });
    });

    it('should export expected stories', () => {
      const expectedStories = [
        'Default',
        'WithSelectedModule', 
        'GridView',
        'WithSearch',
        'WithStatusFilter',
        'WithValidationResults',
        'Loading',
        'Empty',
        'WithError',
        'WithMetrics'
      ];

      expectedStories.forEach(storyName => {
        expect((composedStories as any)[storyName], `${storyName} should be exported`).toBeDefined();
      });
    });
  });
});