import { z } from 'zod';

// Release validation schemas
export const createReleaseSchema = z.object({
  name: z.string()
    .min(1, 'Release name is required')
    .max(100, 'Release name must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  version: z.string()
    .regex(/^v\d+\.\d+\.\d+$/, 'Version must be in format v1.0.0'),
  releaseDate: z.string().optional(),
  pages: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateReleaseSchema = createReleaseSchema.partial();

// Type exports
export type CreateReleaseInput = z.infer<typeof createReleaseSchema>;
export type UpdateReleaseInput = z.infer<typeof updateReleaseSchema>;