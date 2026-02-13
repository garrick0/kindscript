import { z } from 'zod';

// Document validation schemas
export const createDocumentSchema = z.object({
  title: z.string()
    .min(1, 'Document title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required'),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  tags: z.array(z.string()).optional(),
  authoritative: z.boolean().optional(),
  metadata: z.object({
    author: z.string().optional(),
    category: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

// Type exports
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;