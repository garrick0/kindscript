/**
 * Development logging utilities for MSW
 * 
 * Provides request/response logging and debugging utilities
 * for MSW handlers during development.
 */

import { http, HttpResponse } from 'msw';

// Enable/disable logging based on environment and localStorage
const ENABLE_MSW_LOGGING = 
  typeof window !== 'undefined' 
    ? localStorage.getItem('MSW_LOGGING') !== 'false' && process.env.NODE_ENV === 'development'
    : process.env.NODE_ENV === 'development';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Log a request with formatted output
 */
export function logRequest(request: Request) {
  if (!ENABLE_MSW_LOGGING) return;
  
  const url = new URL(request.url);
  const method = request.method;
  const timestamp = new Date().toISOString();
  
  console.group(
    `${colors.cyan}[MSW]${colors.reset} ${colors.bright}${method}${colors.reset} ${url.pathname}`
  );
  console.log(`${colors.dim}Timestamp:${colors.reset} ${timestamp}`);
  console.log(`${colors.dim}Full URL:${colors.reset} ${url.href}`);
  
  // Log query parameters if present
  if (url.searchParams.toString()) {
    console.log(`${colors.dim}Query Params:${colors.reset}`);
    for (const [key, value] of url.searchParams) {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  // Log headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (!key.startsWith('sec-') && key !== 'cookie') { // Skip security headers
      headers[key] = value;
    }
  });
  if (Object.keys(headers).length > 0) {
    console.log(`${colors.dim}Headers:${colors.reset}`, headers);
  }
  
  console.groupEnd();
}

/**
 * Log a response with formatted output
 */
export function logResponse(response: Response, data?: any) {
  if (!ENABLE_MSW_LOGGING) return;
  
  const status = response.status;
  const statusColor = status >= 400 ? colors.red : status >= 300 ? colors.yellow : colors.green;
  
  console.group(
    `${colors.cyan}[MSW Response]${colors.reset} ${statusColor}${status}${colors.reset}`
  );
  
  // Log response headers
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  if (Object.keys(headers).length > 0) {
    console.log(`${colors.dim}Headers:${colors.reset}`, headers);
  }
  
  // Log response data
  if (data) {
    console.log(`${colors.dim}Data:${colors.reset}`, data);
  }
  
  console.groupEnd();
}

/**
 * Create a logging wrapper for handlers
 */
export function withLogging<T extends (...args: any[]) => any>(
  handler: T
): T {
  if (!ENABLE_MSW_LOGGING) return handler;
  
  return (async (...args: Parameters<T>) => {
    const [{ request }] = args;
    logRequest(request);
    
    const response = await handler(...args);
    
    // Try to extract data from response for logging
    if (response && typeof response === 'object' && 'clone' in response) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        logResponse(response, data);
      } catch {
        logResponse(response);
      }
    }
    
    return response;
  }) as T;
}

/**
 * Log handler registration
 */
export function logHandlerRegistration(handlers: any[]) {
  if (!ENABLE_MSW_LOGGING) return;
  
  console.group(`${colors.cyan}[MSW]${colors.reset} ${colors.bright}Registered Handlers${colors.reset}`);
  
  handlers.forEach(handler => {
    const info = handler.info || {};
    const method = info.method || 'ANY';
    const path = info.path || 'unknown';
    console.log(`  ${colors.green}✓${colors.reset} ${method} ${path}`);
  });
  
  console.groupEnd();
}

/**
 * Create a debug handler that logs all unhandled requests
 */
export const debugUnhandledRequests = [
  http.all('*', ({ request }) => {
    console.warn(
      `${colors.yellow}[MSW Warning]${colors.reset} Unhandled request: ${request.method} ${request.url}`
    );
    // Pass through to actual network
    return;
  }),
];

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  handler: T,
  name?: string
): T {
  if (!ENABLE_MSW_LOGGING) return handler;
  
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now();
    const [{ request }] = args;
    const url = new URL(request.url);
    
    const response = await handler(...args);
    
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    if (parseFloat(duration) > 1000) {
      console.warn(
        `${colors.yellow}[MSW Performance]${colors.reset} Slow handler: ${name || url.pathname} took ${duration}ms`
      );
    } else if (ENABLE_MSW_LOGGING) {
      console.log(
        `${colors.dim}[MSW Performance] ${name || url.pathname}: ${duration}ms${colors.reset}`
      );
    }
    
    return response;
  }) as T;
}

/**
 * Export a flag to check if logging is enabled
 */
export const isMSWLoggingEnabled = ENABLE_MSW_LOGGING;

/**
 * Manual logging functions for custom scenarios
 */
export const MSWLogger = {
  log: (message: string, data?: any) => {
    if (!ENABLE_MSW_LOGGING) return;
    console.log(`${colors.cyan}[MSW]${colors.reset} ${message}`, data || '');
  },
  
  warn: (message: string, data?: any) => {
    if (!ENABLE_MSW_LOGGING) return;
    console.warn(`${colors.yellow}[MSW Warning]${colors.reset} ${message}`, data || '');
  },
  
  error: (message: string, data?: any) => {
    console.error(`${colors.red}[MSW Error]${colors.reset} ${message}`, data || '');
  },
  
  group: (label: string) => {
    if (!ENABLE_MSW_LOGGING) return;
    console.group(`${colors.cyan}[MSW]${colors.reset} ${label}`);
  },
  
  groupEnd: () => {
    if (!ENABLE_MSW_LOGGING) return;
    console.groupEnd();
  },
};

// Export utility to wrap all handlers with logging
export function wrapHandlersWithLogging(handlers: any[]) {
  if (!ENABLE_MSW_LOGGING) return handlers;
  
  return handlers.map(handler => {
    // Wrap the resolver function with logging
    const originalResolver = handler.resolver;
    handler.resolver = withLogging(withPerformanceMonitoring(originalResolver));
    return handler;
  });
}