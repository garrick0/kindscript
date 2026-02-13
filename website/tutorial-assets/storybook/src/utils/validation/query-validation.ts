import { useQuery, UseQueryResult, UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

/**
 * Creates a validated query hook that ensures response data matches expected schema
 */
export function createValidatedQuery<TData>(
  schema: z.ZodSchema<TData>,
  queryKey: string,
  queryFn: () => Promise<unknown>,
  options?: Omit<UseQueryOptions<unknown, Error, TData>, 'queryKey' | 'queryFn'>
) {
  return function useValidatedQuery(): UseQueryResult<TData, Error> {
    return useQuery({
      queryKey: [queryKey],
      queryFn: async () => {
        const data = await queryFn();
        return schema.parse(data);
      },
      ...options,
    });
  };
}

/**
 * Validates data against a schema and returns typed result
 */
export function validateQueryData<TData>(
  data: unknown,
  schema: z.ZodSchema<TData>
): TData {
  return schema.parse(data);
}

/**
 * Safe validation that returns result or null on error
 */
export function safeValidateQueryData<TData>(
  data: unknown,
  schema: z.ZodSchema<TData>
): TData | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}