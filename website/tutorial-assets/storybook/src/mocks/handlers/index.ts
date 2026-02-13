// Main MSW handlers configuration - 100% TypeSpec Generated
import { handlers } from '../generated/handlers';
import { wrapHandlersWithLogging, logHandlerRegistration, MSWLogger } from './dev-logging';
// Error simulation removed - had TypeScript issues

/**
 * Handler configuration - Uses ONLY TypeSpec generated handlers
 * Everything is auto-generated from TypeSpec - zero manual maintenance!
 */
export function getHandlers(options?: {
  enableLogging?: boolean;
  enableErrorSimulation?: boolean;
  scenario?: string;
}) {
  const enableLogging = options?.enableLogging ?? process.env.NODE_ENV === 'development';
  const enableErrorSimulation = options?.enableErrorSimulation ?? false;
  
  // Use TypeSpec generated handlers directly
  let handlersList = [...handlers];
  MSWLogger.log('Using TypeSpec generated handlers');
  
  // Error simulation disabled - had TypeScript issues
  if (enableErrorSimulation) {
    MSWLogger.log('Error simulation requested but not available');
  }
  
  // Add logging in development
  if (enableLogging) {
    handlersList = wrapHandlersWithLogging(handlersList);
    logHandlerRegistration(handlersList);
  }
  
  return handlersList;
}

// Export generated handlers for direct use in stories
export { handlers };

// Export logging utilities
export { MSWLogger } from './dev-logging';

// Error simulation utilities removed

// Default export uses generated handlers
export default getHandlers();