/**
 * MSW Server Setup
 * This file initializes MSW for Node.js environments (tests)
 */

import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { getHandlers } from './handlers';

// Create the MSW server with TypeSpec generated handlers for tests
export const server = setupServer(...getHandlers());

// Server lifecycle methods for tests
export function setupMockServer() {
  beforeAll(() => {
    console.log('🔧 Setting up MSW server for tests');
    console.log('🔧 Handlers loaded:', server.listHandlers().length);
    
    server.listen({ 
      onUnhandledRequest: (req) => {
        console.warn(`🚨 UNHANDLED MSW REQUEST: ${req.method} ${req.url}`);
        return 'bypass';
      }
    });
    
    console.log('✅ MSW server listening');
  });
  
  afterEach(() => {
    server.resetHandlers();
  });
  
  afterAll(() => {
    console.log('🔧 Closing MSW server');
    server.close();
  });
}