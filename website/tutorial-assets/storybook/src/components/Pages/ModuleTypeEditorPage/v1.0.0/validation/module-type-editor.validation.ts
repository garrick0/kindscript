/**
 * ModuleTypeEditor Validation Schemas
 * 
 * Zod schemas for validating module type editor inputs and configurations.
 */

import { z } from 'zod';

// Discovery pattern validation
export const discoveryPatternSchema = z.object({
  basePattern: z.string().min(1, 'Base pattern is required'),
  instancePattern: z.string().min(1, 'Instance pattern is required'),
  filePatterns: z.object({
    required: z.array(z.string()),
    optional: z.array(z.string()),
    forbidden: z.array(z.string())
  })
});

// Structure definition validation
export const structureDefinitionSchema = z.object({
  folders: z.array(z.object({
    path: z.string().min(1, 'Folder path is required'),
    required: z.boolean(),
    description: z.string().optional()
  })),
  files: z.array(z.object({
    path: z.string().min(1, 'File path is required'),
    required: z.boolean(),
    validation: z.object({
      schema: z.string()
    }).optional()
  })),
  dependencies: z.array(z.any())
});

// Assertion definition validation
export const assertionDefinitionSchema = z.object({
  id: z.string().min(1, 'Assertion ID is required'),
  name: z.string().min(1, 'Assertion name is required'),
  description: z.string(),
  type: z.enum(['eslint', 'test', 'structure', 'dependency', 'custom']),
  config: z.any(),
  execution: z.object({
    runOn: z.enum(['save', 'commit', 'manual']),
    timeout: z.number().min(1000).max(600000),
    cache: z.boolean(),
    parallel: z.boolean()
  }),
  severity: z.enum(['error', 'warning', 'info'])
});

// Module type form data validation
export const moduleTypeFormDataSchema = z.object({
  id: z.string().min(1, 'Module type ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  discovery: discoveryPatternSchema,
  structure: structureDefinitionSchema,
  assertions: z.array(assertionDefinitionSchema),
  metadata: z.object({
    author: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    tags: z.array(z.string()),
    documentation: z.string().url().optional().or(z.literal(''))
  })
});

// Search query validation
export const searchQuerySchema = z.string().max(100, 'Search query too long');

// Discovery test input validation
export const discoveryTestInputSchema = z.object({
  basePattern: z.string().min(1, 'Base pattern is required'),
  instancePattern: z.string().min(1, 'Instance pattern is required')
});

// Import data validation
export const importDataSchema = z.array(moduleTypeFormDataSchema);

// Export request validation
export const exportRequestSchema = z.object({
  ids: z.array(z.string().min(1))
});

// Validation helper functions
export const validateModuleTypeForm = (data: unknown) => {
  return moduleTypeFormDataSchema.safeParse(data);
};

export const validateDiscoveryTest = (data: unknown) => {
  return discoveryTestInputSchema.safeParse(data);
};

export const validateImportData = (data: unknown) => {
  return importDataSchema.safeParse(data);
};

export const validateExportRequest = (data: unknown) => {
  return exportRequestSchema.safeParse(data);
};