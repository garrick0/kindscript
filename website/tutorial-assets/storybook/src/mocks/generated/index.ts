// Generated unified exports from TypeSpec
// Do not edit manually - regenerate using npm run typespec:generate-all

// MSW and types
export * from './types';
export * from './handlers';
export * from './factories';

// Zod validation schemas
export * as ValidationSchemas from './validation-schemas';
export * as ValidationTypes from './validation-schemas';

// Re-export handlers with validation wrapper
import { handlers as baseHandlers } from './handlers';
import { z } from 'zod';

// Import validation schemas
import * as schemas from './validation-schemas';

/**
 * Wrap MSW handlers with Zod validation
 * This ensures consistency between mocks and backend validation
 */
export function getValidatedHandlers() {
  // For now, return base handlers
  // TODO: Implement validation wrapper using generated schemas
  return baseHandlers;
}

export const validatedHandlers = getValidatedHandlers();
