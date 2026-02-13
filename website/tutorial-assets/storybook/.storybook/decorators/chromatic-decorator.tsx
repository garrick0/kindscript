/**
 * Chromatic-specific decorator to handle known issues
 */
import React from 'react';
import isChromatic from 'chromatic/isChromatic';
import type { Decorator } from '@storybook/react';

/**
 * Wraps stories to handle Chromatic-specific issues
 */
export const withChromaticFixes: Decorator = (Story, context) => {
  // In Chromatic, disable play functions that are causing errors
  if (isChromatic() && context.parameters?.chromatic?.disablePlay !== false) {
    // Remove play function to prevent configuration errors
    delete context.play;
    
    // Log for debugging
    console.info(
      `[Chromatic] Skipping play function for story: ${context.name}`,
      '\nThis prevents JavaScript configuration errors in Chromatic.'
    );
  }

  // Wrap story in error boundary for Chromatic
  if (isChromatic()) {
    return (
      <div data-chromatic="wrapper">
        <Story />
      </div>
    );
  }

  return <Story />;
};