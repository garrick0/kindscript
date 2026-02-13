import { z } from 'zod';

// Search/Filter validation schemas - shared across search components
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.object({
    type: z.enum(['all', 'releases', 'documents', 'pages']).optional(),
    status: z.enum(['all', 'draft', 'published', 'archived']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    author: z.string().optional(),
  }).optional(),
  sort: z.enum(['relevance', 'date', 'name', 'status']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Type exports
export type SearchInput = z.infer<typeof searchSchema>;