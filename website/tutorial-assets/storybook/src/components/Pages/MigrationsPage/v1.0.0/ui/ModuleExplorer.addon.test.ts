/**
 * Storybook Vitest Addon Tests for ModuleExplorer
 * 
 * These tests demonstrate the @storybook/addon-vitest integration
 * for automated story testing within the Vitest environment.
 * 
 * Note: This uses basic functionality since @storybook/test-runner
 * may not be fully compatible with the current setup.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as stories from './ModuleExplorer.stories';

describe('ModuleExplorer Storybook Addon Tests', () => {
  beforeAll(() => {
    console.log('Setting up ModuleExplorer story tests...');
  });

  describe('Story Exports', () => {
    it('should export the default meta configuration', () => {
      const meta = (stories as any).default;
      expect(meta).toBeDefined();
      expect(meta.title).toBe('Pages/MigrationsPage/ModuleExplorer');
      expect(meta.component).toBeDefined();
    });

    it('should export all expected stories', () => {
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
        expect((stories as any)[storyName], `${storyName} should be exported`).toBeDefined();
      });
    });
  });

  describe('Story Configuration', () => {
    it('should have proper meta configuration', () => {
      const meta = (stories as any).default;
      
      expect(meta.parameters?.vitest).toBeDefined();
      expect(meta.parameters?.vitest?.testLevel).toBe('component');
      expect(meta.parameters?.layout).toBe('fullscreen');
    });

    it('should have consistent story structure', () => {
      Object.entries(stories).forEach(([name, story]) => {
        if (name === 'default') return;
        
        const storyObj = story as any;
        expect(storyObj.args).toBeDefined();
        expect(storyObj.args).toHaveProperty('className');
      });
    });
  });

  describe('Interactive Stories', () => {
    it('should have play functions for interactive stories', () => {
      const interactiveStories = [
        'Default', 
        'GridView', 
        'WithSearch', 
        'WithStatusFilter', 
        'WithError'
      ];
      
      interactiveStories.forEach(storyName => {
        const story = (stories as any)[storyName];
        expect(story.play, `${storyName} should have a play function`).toBeDefined();
        expect(typeof story.play).toBe('function');
      });
    });

    it('should validate play function signatures', () => {
      Object.entries(stories).forEach(([name, story]) => {
        if (name === 'default') return;
        
        const storyObj = story as any;
        if (storyObj.play) {
          expect(typeof storyObj.play).toBe('function');
          expect(storyObj.play.length).toBe(1); // Should take one parameter (PlayFunctionContext)
        }
      });
    });
  });

  describe('Story Parameters', () => {
    it('should have proper mock data for special states', () => {
      const { Loading, Empty, WithError } = stories as any;
      
      expect(Loading.parameters?.mockData).toBeDefined();
      expect(Empty.parameters?.mockData).toBeDefined();
      expect(WithError.parameters?.mockData).toBeDefined();
      expect(WithError.parameters?.mockData?.error).toBe('Failed to load modules');
    });

    it('should have documentation for stories', () => {
      const meta = (stories as any).default;
      const { WithMetrics } = stories as any;
      
      expect(meta.parameters?.docs?.description?.component).toBeDefined();
      expect(WithMetrics.parameters?.docs?.description?.story).toBeDefined();
    });
  });

  describe('Vitest Integration', () => {
    it('should be configured for Vitest addon', () => {
      const meta = (stories as any).default;
      
      expect(meta.parameters?.vitest).toEqual({
        testLevel: 'component'
      });
    });

    it('should support automated testing tags', () => {
      const meta = (stories as any).default;
      expect(meta.tags).toContain('autodocs');
    });
  });
});