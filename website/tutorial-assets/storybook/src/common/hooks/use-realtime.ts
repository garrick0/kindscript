import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
  table: 'documents' | 'pages' | 'releases' | 'workflows';
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

// Generic Supabase realtime subscription management utility
export function useRealtime(
  supabase: any,
  { table, filter, onInsert, onUpdate, onDelete }: RealtimeOptions
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) return;
    
    let channel: RealtimeChannel;

    const setupChannel = () => {
      const channelName = filter ? `${table}:${filter}` : table;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: filter,
          },
          (payload: any) => {
            setLastEvent(payload);
            console.log('Realtime event:', payload);

            // Invalidate relevant React Query caches
            switch (payload.eventType) {
              case 'INSERT':
                queryClient.invalidateQueries({ queryKey: [table] });
                if (payload.new?.id) {
                  queryClient.invalidateQueries({ queryKey: [table.slice(0, -1), payload.new.id] });
                }
                onInsert?.(payload);
                break;
              case 'UPDATE':
                queryClient.invalidateQueries({ queryKey: [table] });
                if (payload.new?.id) {
                  queryClient.invalidateQueries({ queryKey: [table.slice(0, -1), payload.new.id] });
                }
                onUpdate?.(payload);
                break;
              case 'DELETE':
                queryClient.invalidateQueries({ queryKey: [table] });
                if (payload.old?.id) {
                  queryClient.removeQueries({ queryKey: [table.slice(0, -1), payload.old.id] });
                }
                onDelete?.(payload);
                break;
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Realtime subscription status:', status);
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
  }, [supabase, table, filter, onInsert, onUpdate, onDelete, queryClient]);

  return { isConnected, lastEvent };
}