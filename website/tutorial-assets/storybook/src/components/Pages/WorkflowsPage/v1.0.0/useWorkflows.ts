import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// Removed Supabase import - handled by backend

export interface Workflow {
  id: number;
  name: string;
  description: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  progress: number;
  lastRun: string;
  duration: string;
  steps: number;
}

export function useWorkflows(userId?: string) {
  const [workflows] = useState<Workflow[]>([
    {
      id: 1,
      name: 'Document to PRD',
      description: 'Convert strategic documents into Product Requirements Document',
      status: 'completed',
      progress: 100,
      lastRun: '2024-01-15 10:30',
      duration: '5 min',
      steps: 3
    },
    {
      id: 2,
      name: 'PRD to Wireframes',
      description: 'Generate wireframes from Product Requirements Document',
      status: 'running',
      progress: 65,
      lastRun: '2024-01-15 11:45',
      duration: '3 min',
      steps: 4
    },
    {
      id: 3,
      name: 'Consolidate Documents',
      description: 'Merge multiple sources into authoritative document',
      status: 'failed',
      progress: 30,
      lastRun: '2024-01-15 09:15',
      duration: '2 min',
      steps: 2
    },
    {
      id: 4,
      name: 'Full Pipeline',
      description: 'Complete document to production wireframe pipeline',
      status: 'pending',
      progress: 0,
      lastRun: 'Never',
      duration: '-',
      steps: 7
    },
  ]);

  const executeWorkflow = useCallback((workflowId: number) => {
    console.log('Executing workflow:', workflowId);
    // In real implementation, this would call an API
  }, []);

  const pauseWorkflow = useCallback((workflowId: number) => {
    console.log('Pausing workflow:', workflowId);
    // In real implementation, this would call an API
  }, []);

  return {
    workflows,
    executeWorkflow,
    pauseWorkflow
  };
}

// Workflow-specific realtime monitoring hook
export function useWorkflowRealtime(supabase?: any) {
  const [isConnected, setIsConnected] = useState(false);
  const [workflowUpdates, setWorkflowUpdates] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const handleUpdate = useCallback((payload: any) => {
    // Only track status changes for active monitoring
    if (payload.new?.status !== payload.old?.status) {
      setWorkflowUpdates(prev => [...prev, payload]);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let channel: any; // RealtimeChannel type

    const setupChannel = () => {
      channel = supabase
        .channel('workflows')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'workflows',
          },
          (payload: any) => {
            console.log('Workflow realtime event:', payload);
            handleUpdate(payload);
            
            // Invalidate React Query caches
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            if (payload.new?.id) {
              queryClient.invalidateQueries({ queryKey: ['workflow', payload.new.id] });
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Workflow realtime subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [supabase, handleUpdate, queryClient]);

  return {
    isConnected,
    workflowUpdates,
  };
}