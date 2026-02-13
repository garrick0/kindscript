import { useMutation, useQueryClient } from '@tanstack/react-query';

// Simple toast functions (replace with actual toast library if needed)
const showSuccessToast = (message: string) => {
  console.log('✅', message);
  // In production, use a real toast library
};

const showErrorToast = (message: string) => {
  console.error('❌', message);
  // In production, use a real toast library
};

export interface OptimisticMutationOptions<T, V> {
  mutationFn: (variables: V) => Promise<T>;
  onOptimisticUpdate?: (variables: V, queryClient: any) => void;
  onSuccessMessage?: string;
  onErrorMessage?: string;
  invalidateQueries?: string[][];
  removeQueries?: string[][];
}

// Generic optimistic mutation pattern for use across features
export function useOptimisticMutation<T, V>({
  mutationFn,
  onOptimisticUpdate,
  onSuccessMessage,
  onErrorMessage,
  invalidateQueries = [],
  removeQueries = [],
}: OptimisticMutationOptions<T, V>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await Promise.all(
        invalidateQueries.map(queryKey => 
          queryClient.cancelQueries({ queryKey })
        )
      );

      // Snapshot previous values
      const previousData: Record<string, any> = {};
      invalidateQueries.forEach((queryKey, index) => {
        previousData[index] = queryClient.getQueryData(queryKey);
      });

      // Optimistically update
      if (onOptimisticUpdate) {
        onOptimisticUpdate(variables, queryClient);
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        invalidateQueries.forEach((queryKey, index) => {
          queryClient.setQueryData(queryKey, context.previousData[index]);
        });
      }

      // Show error message
      const message = onErrorMessage || 'Operation failed';
      showErrorToast(message);
    },
    onSuccess: (data, variables, context) => {
      // Show success message
      if (onSuccessMessage) {
        showSuccessToast(onSuccessMessage);
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Remove stale queries
      removeQueries.forEach(queryKey => {
        queryClient.removeQueries({ queryKey });
      });
    },
  });
}