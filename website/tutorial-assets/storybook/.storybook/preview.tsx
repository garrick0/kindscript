import type { Preview } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { withChromaticFixes } from './decorators/chromatic-decorator';
import React from 'react';
import { getHandlers } from '../src/mocks/handlers';
import { MockSessionProvider } from '../src/mocks/providers/MockSessionProvider';

// Initialize MSW with onUnhandledRequest option
initialize({
  onUnhandledRequest: 'bypass',
});

// Set flags for detection of Storybook environment
if (typeof window !== 'undefined') {
  (window as any).__mswStarted = true;
  (window as any).__STORYBOOK_PREVIEW__ = true;
  console.log('🔧 MSW Initialized - API calls will be intercepted');
  console.log('📚 Storybook Preview Mode - Auth functions will be mocked');
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    msw: {
      handlers: getHandlers({ scenario: 'demo' }),
    },
    chromatic: {
      // Configure Chromatic parameters globally
      delay: 300,
      pauseAnimationAtEnd: true,
    },
  },
  loaders: [mswLoader],
  decorators: [
    withChromaticFixes,
    (Story) => (
      <MockSessionProvider>
        <div style={{ padding: '2rem' }}>
          <Story />
        </div>
      </MockSessionProvider>
    ),
  ],
};

export default preview;