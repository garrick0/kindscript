/**
 * MSW Browser Setup
 * This file initializes MSW for browser environments (Storybook)
 */

import { setupWorker } from 'msw/browser';
import { getHandlers } from './handlers';
import { wrapHandlersWithLogging, MSWLogger, isMSWLoggingEnabled } from './handlers/dev-logging';

// Get handlers and optionally wrap with logging in development
const handlers = process.env.NODE_ENV === 'development' 
  ? wrapHandlersWithLogging(getHandlers())
  : getHandlers();

// Create the MSW worker with configured handlers
export const worker = setupWorker(...handlers);

// Start options
export const workerOptions = {
  onUnhandledRequest: 'bypass' as const,
  serviceWorker: {
    url: '/mockServiceWorker.js',
  },
};

// Initialize function for Storybook
export async function initializeMSW() {
  if (typeof window === 'undefined') {
    return;
  }

  // Start the worker and mark as active
  return worker.start(workerOptions).then(() => {
    // Mark MSW as started for ServiceProvider detection
    (window as any).__mswStarted = true;
    
    // Log MSW status
    if (isMSWLoggingEnabled) {
      MSWLogger.log('🔧 MSW Started with logging enabled');
      MSWLogger.log('API calls will be intercepted and logged');
      console.log('💡 Tip: Control logging with localStorage.setItem("MSW_LOGGING", "false")');
    } else {
      console.log('🔧 MSW Started - API calls will be intercepted');
    }
    
    // Make logging and error controls available globally in development
    if (process.env.NODE_ENV === 'development') {
      (window as any).MSW = {
        enableLogging: () => {
          localStorage.setItem('MSW_LOGGING', 'true');
          window.location.reload();
        },
        disableLogging: () => {
          localStorage.setItem('MSW_LOGGING', 'false');
          window.location.reload();
        },
        isLoggingEnabled: () => localStorage.getItem('MSW_LOGGING') !== 'false',
        // Error simulation controls are added by error-simulation.ts as window.ErrorSimulation
      };
      console.log('💻 MSW controls available via window.MSW');
      console.log('🔥 Error simulation available via window.ErrorSimulation');
    }
  });
}