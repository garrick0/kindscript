import { useState, useCallback } from 'react'
import type { FilterState } from '../../ReleasesManager/v1.0.0/release.types'

export interface UseFiltersReturn {
  filters: FilterState
  updateFilters: (updates: Partial<FilterState>) => void
  resetFilters: () => void
  isFiltered: boolean
  setSearch: (search: string) => void
  setStatus: (status: FilterState['status']) => void
  toggleTag: (tag: string) => void
}

const defaultFilters: FilterState = {
  status: 'all',
  search: '',
  tags: [],
  author: undefined,
}

export function useFilters(initialFilters?: Partial<FilterState>): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters,
  })

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev: FilterState) => ({ ...prev, ...updates }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const setSearch = useCallback((search: string) => {
    setFilters((prev: FilterState) => ({ ...prev, search }))
  }, [])

  const setStatus = useCallback((status: FilterState['status']) => {
    setFilters((prev: FilterState) => ({ ...prev, status }))
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev: FilterState) => {
      const currentTags = prev.tags || []
      const hasTag = currentTags.includes(tag)
      
      return {
        ...prev,
        tags: hasTag
          ? currentTags.filter((t: string) => t !== tag)
          : [...currentTags, tag],
      }
    })
  }, [])

  const isFiltered = !!(
    (filters.status && filters.status !== 'all') ||
    (filters.search && filters.search !== '') ||
    (filters.tags && filters.tags.length > 0) ||
    filters.author
  )

  return {
    filters,
    updateFilters,
    resetFilters,
    isFiltered,
    setSearch,
    setStatus,
    toggleTag,
  }
}