import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { setupMockServer } from './src/mocks/server';

// Setup MSW server for all tests
setupMockServer();

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Configure global fetch to handle relative URLs in tests
beforeAll(() => {
  // Store original fetch before MSW setup
  const originalFetch = globalThis.fetch;
  
  // Create a wrapper that converts relative URLs to absolute
  globalThis.fetch = async (input, init) => {
    let url = input;
    
    // Convert relative URLs to absolute URLs for MSW interception
    if (typeof input === 'string' && input.startsWith('/')) {
      url = `http://localhost:3000${input}`;
    } else if (input instanceof Request && input.url.startsWith('/')) {
      url = new Request(`http://localhost:3000${input.url}`, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        mode: input.mode,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        referrerPolicy: input.referrerPolicy,
        integrity: input.integrity,
        keepalive: input.keepalive,
        signal: input.signal
      });
    }
    
    return originalFetch.call(globalThis, url, init);
  };
});

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  const message = args.join(' ');
  // Suppress known non-critical warnings in test environment
  if (message.includes('Warning:') || message.includes('validateDOMNesting')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  // Suppress known non-critical warnings
  if (message.includes('componentWillReceiveProps') || message.includes('deprecated')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
  mockUser: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  mockDate: '2024-01-01T00:00:00.000Z',
};