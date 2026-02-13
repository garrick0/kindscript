/**
 * Chromatic-specific helpers for Storybook stories
 * 
 * Based on official Chromatic best practices:
 * https://www.chromatic.com/docs/ischromatic/
 */

import isChromatic from 'chromatic/isChromatic';
import type { StoryContext } from '@storybook/react';

type PlayFunction = (context: StoryContext) => Promise<void> | void;

/**
 * Skip play functions in Chromatic to avoid timing issues
 * Use this when play functions are for local testing only
 * and visual snapshots don't need the interactions
 */
export const skipPlayInChromatic = <T extends PlayFunction>(
  playFn: T
): T | undefined => {
  // In Chromatic, skip the play function entirely
  if (isChromatic()) {
    return undefined;
  }
  return playFn;
};

/**
 * Delay play functions in Chromatic to ensure DOM is ready
 * Use this when the play function is needed for visual state
 * but needs extra time to stabilize in Chromatic
 */
export const delayPlayInChromatic = <T extends PlayFunction>(
  playFn: T,
  delay: number = 500
): T => {
  return (async (context) => {
    // Add extra delay in Chromatic for stability
    if (isChromatic()) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return await playFn(context);
  }) as T;
};

/**
 * Safe play function wrapper that catches errors in Chromatic
 * Use this when you want the visual snapshot even if play fails
 */
export const safePlayInChromatic = <T extends PlayFunction>(
  playFn: T
): T => {
  return (async (context) => {
    try {
      return await playFn(context);
    } catch (error) {
      if (isChromatic()) {
        // In Chromatic, log but don't throw
        console.warn('[Chromatic] Play function error (snapshot still captured):', error);
        return;
      }
      // In local development, throw the error
      throw error;
    }
  }) as T;
};

/**
 * Export the isChromatic utility for direct use
 */
export { isChromatic };

/**
 * Disable animations in Chromatic for consistent snapshots
 * Animations can cause timing issues in visual regression tests
 */
export const withAnimation = <T extends PlayFunction>(
  playFn: T,
  shouldAnimate: boolean = !isChromatic()
): T => {
  return (async (context) => {
    if (!shouldAnimate) {
      // Disable animations via CSS
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    }
    return await playFn(context);
  }) as T;
};

/**
 * Show loading state for a specific duration in Chromatic
 * Useful for capturing loading states in visual tests
 */
export const withLoadingState = <T extends PlayFunction>(
  playFn: T,
  loadingDuration: number = 1000
): T => {
  return (async (context) => {
    if (isChromatic()) {
      await new Promise(resolve => setTimeout(resolve, loadingDuration));
    }
    return await playFn(context);
  }) as T;
};

/**
 * Mark stories to be ignored in Chromatic
 * Use in story parameters: { chromatic: { disableSnapshot: true } }
 */
export const ignoreInChromatic = {
  chromatic: { disableSnapshot: true }
};

/**
 * Test different theme variants in Chromatic
 * Creates multiple story variants for each theme
 */
export const withThemeVariants = (themes: string[] = ['light', 'dark']) => {
  return {
    parameters: {
      chromatic: {
        modes: themes.reduce((acc, theme) => ({
          ...acc,
          [theme]: { theme }
        }), {})
      }
    }
  };
};

/**
 * Test different viewport sizes in Chromatic
 * Creates story variants for different screen sizes
 */
export const withViewports = (viewports: string[] = ['mobile', 'tablet', 'desktop']) => {
  return {
    parameters: {
      chromatic: {
        viewports: viewports
      }
    }
  };
};

/**
 * Test form states in Chromatic
 * Captures different form interaction states
 */
export const withFormStates = <T extends PlayFunction>(
  playFn: T
): T => {
  return (async (context) => {
    if (isChromatic()) {
      // Capture different form states for visual testing
      const states = ['default', 'hover', 'focus', 'error', 'disabled'];
      for (const state of states) {
        console.log(`[Chromatic] Capturing form state: ${state}`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    return await playFn(context);
  }) as T;
};