import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
// Removed Supabase import - handled by backend

export interface Page {
  id: string;
  name: string;
  versions: string[];
  latestVersion: string;
  lastModified: string;
  status: 'published' | 'draft' | 'in-review';
  description: string;
}

export function usePages(userId?: string) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVersion, setFilterVersion] = useState('all');

  const [pages] = useState<Page[]>([
    {
      id: 'dashboard',
      name: 'Dashboard',
      versions: ['v1', 'v2'],
      latestVersion: 'v2',
      lastModified: '2024-01-15',
      status: 'published',
      description: 'Main application dashboard with analytics'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      versions: ['v1'],
      latestVersion: 'v1',
      lastModified: '2024-01-14',
      status: 'published',
      description: 'Data visualization and reporting'
    },
    {
      id: 'settings',
      name: 'Settings',
      versions: ['v1'],
      latestVersion: 'v1',
      lastModified: '2024-01-13',
      status: 'draft',
      description: 'User and system configuration'
    },
    {
      id: 'profile',
      name: 'Profile',
      versions: ['v1'],
      latestVersion: 'v1',
      lastModified: '2024-01-12',
      status: 'published',
      description: 'User profile management'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      versions: ['v1', 'v2', 'v3'],
      latestVersion: 'v3',
      lastModified: '2024-01-11',
      status: 'in-review',
      description: 'Notification center and preferences'
    },
  ]);

  const filteredPages = useMemo(() => {
    return pages.filter(page =>
      page.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pages, searchQuery]);

  return {
    pages,
    searchQuery,
    setSearchQuery,
    filterVersion,
    setFilterVersion,
    filteredPages
  };
}

// Page-specific realtime hook
export function usePageRealtime(pageId?: string, supabase?: any) {
  const [isConnected, setIsConnected] = useState(false);
  const [pageUpdates, setPageUpdates] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const handleUpdate = useCallback((payload: any) => {
    setPageUpdates(prev => [...prev, payload]);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let channel: any; // RealtimeChannel type

    const setupChannel = () => {
      const channelName = pageId ? `page:${pageId}` : 'pages';
      const filter = pageId ? `id=eq.${pageId}` : undefined;
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pages',
            filter: filter,
          },
          (payload: any) => {
            console.log('Page realtime event:', payload);
            handleUpdate(payload);
            
            // Invalidate React Query caches
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            if (pageId) {
              queryClient.invalidateQueries({ queryKey: ['page', pageId] });
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Page realtime subscription status:', status);
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
  }, [pageId, supabase, handleUpdate, queryClient]);

  return {
    isConnected,
    pageUpdates,
  };
}