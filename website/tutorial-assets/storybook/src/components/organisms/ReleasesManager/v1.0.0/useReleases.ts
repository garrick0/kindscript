import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useReleaseService } from '../../../../providers/ServiceProvider'
import type { Release, ReleaseData, FilterState } from './release.types'
// Removed Supabase import - handled by backend

export interface UseReleasesReturn {
  releases: Release[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  actions: {
    create: (data: ReleaseData) => Promise<Release>
    update: (id: string, data: Partial<ReleaseData>) => Promise<Release>
    delete: (id: string) => Promise<void>
    publish: (id: string) => Promise<Release>
    archive: (id: string) => Promise<Release>
    duplicate: (id: string, name: string) => Promise<Release>
  }
}

export function useReleases(filters?: FilterState): UseReleasesReturn {
  const releaseService = useReleaseService()
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchReleases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await releaseService.getAll()
      setReleases(data)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch releases:', err)
    } finally {
      setLoading(false)
    }
  }, [releaseService, filters])

  useEffect(() => {
    fetchReleases()
  }, [fetchReleases])

  const actions = {
    create: async (data: ReleaseData): Promise<Release> => {
      try {
        const newRelease = await releaseService.create(data)
        setReleases(prev => [newRelease, ...prev])
        return newRelease
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },

    update: async (id: string, data: Partial<ReleaseData>): Promise<Release> => {
      try {
        const updated = await releaseService.update({ id, ...data })
        setReleases(prev => prev.map(r => (r.id === id ? updated : r)))
        return updated
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        // For ReleaseService, use deleteRelease method
        if ('deleteRelease' in releaseService) {
          await (releaseService as any).deleteRelease(id)
        } else {
          // For MockReleaseService, use delete method
          await (releaseService as any).delete(id)
        }
        setReleases(prev => prev.filter(r => r.id !== id))
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },

    publish: async (id: string): Promise<Release> => {
      try {
        const published = await releaseService.publish(id)
        setReleases(prev => prev.map(r => (r.id === id ? published : r)))
        return published
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },

    archive: async (id: string): Promise<Release> => {
      try {
        const archived = await releaseService.archive(id)
        setReleases(prev => prev.map(r => (r.id === id ? archived : r)))
        return archived
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },

    duplicate: async (id: string, name: string): Promise<Release> => {
      try {
        const duplicated = await releaseService.duplicate(id)
        setReleases(prev => [duplicated, ...prev])
        return duplicated
      } catch (err) {
        setError(err as Error)
        throw err
      }
    },
  }

  return {
    releases,
    loading,
    error,
    refetch: fetchReleases,
    actions,
  }
}

// Release-specific realtime hook
export function useReleaseRealtime(releaseId?: string, supabase?: any) {
  const [isConnected, setIsConnected] = useState(false)
  const [releaseUpdates, setReleaseUpdates] = useState<any[]>([])
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!supabase || !releaseId) return

    let channel: any // RealtimeChannel type from Supabase

    const setupChannel = () => {
      channel = supabase
        .channel(`release:${releaseId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'releases',
            filter: `id=eq.${releaseId}`,
          },
          (payload: any) => {
            console.log('Release realtime event:', payload)
            setReleaseUpdates(prev => [...prev, payload])
            
            // Invalidate React Query caches
            queryClient.invalidateQueries({ queryKey: ['releases'] })
            queryClient.invalidateQueries({ queryKey: ['release', releaseId] })
          }
        )
        .subscribe((status: any) => {
          console.log('Release realtime subscription status:', status)
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    setupChannel()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        setIsConnected(false)
      }
    }
  }, [releaseId, supabase, queryClient])

  return {
    isConnected,
    releaseUpdates,
  }
}