'use client'

import React from 'react'
import { ReleasesList } from '../../../organisms/ReleasesList/v1.0.0/ReleasesList'
import { ReleaseFilters } from '../../../organisms/ReleaseFilters/v1.0.0/ReleaseFilters'
import { Button } from '../../../atoms/Button/v1.0.0/Button'
import { ErrorBoundary } from '../../../molecules/ErrorBoundary/v1.0.0/ErrorBoundary'
import { Skeleton, SkeletonCard } from '../../../atoms/Skeleton/v1.0.0/Skeleton'
import { useReleases } from '../../../organisms/ReleasesManager/v1.0.0/useReleases'
import { useAuth } from '../../../../core/auth/useAuth'
import { useFilters } from '../../../organisms/ReleaseFilters/v1.0.0/useFilters'
import { useRouter } from 'next/navigation'

export interface ReleasesPageProps {
  // Minimal props from Next.js
  searchParams?: { 
    status?: string
    search?: string
    page?: string
  }
  userId?: string
}

export function ReleasesPage({ searchParams, userId }: ReleasesPageProps) {
  // All business logic via hooks
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { filters, updateFilters, resetFilters } = useFilters({
    status: searchParams?.status as 'all' | 'draft' | 'published' | 'archived' | undefined,
    search: searchParams?.search,
  })
  const { releases, loading: releasesLoading, error, actions, refetch } = useReleases(filters)

  // Business logic methods
  const handleCreateRelease = () => {
    router.push('/releases/new')
  }

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      updateFilters({ status: value as any })
    } else if (key === 'search') {
      updateFilters({ search: value })
    }
    // Update URL params
    const params = new URLSearchParams()
    if (value && value !== 'all') {
      params.set(key, value)
    }
    router.push(`/releases?${params.toString()}`)
  }

  const handleClearFilters = () => {
    resetFilters()
    router.push('/releases')
  }

  const handleDeleteRelease = async (id: string) => {
    if (confirm('Are you sure you want to delete this release?')) {
      try {
        await actions.delete(id)
        // Could show a toast here
      } catch (error) {
        console.error('Failed to delete release:', error)
        // Could show an error toast here
      }
    }
  }

  // Guard clauses
  if (authLoading || releasesLoading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <Skeleton variant="text" width="150px" height={32} className="mb-2" />
                <Skeleton variant="text" width="300px" height={20} />
              </div>
              <Skeleton variant="rounded" width="140px" height={40} />
            </div>

            {/* Filters Skeleton */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex gap-4">
                <Skeleton variant="rounded" height={36} className="flex-1" />
                <Skeleton variant="rounded" width={100} height={36} />
                <Skeleton variant="rounded" width={100} height={36} />
              </div>
            </div>

            {/* Releases Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg mb-4">Please login to view releases</div>
        <Button onClick={() => router.push('/auth/signin')}>
          Sign In
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg text-red-600 mb-4">
          Error loading releases: {error.message}
        </div>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  // Main render
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Releases</h1>
            <p className="text-gray-600 mt-2">
              Manage and deploy your application releases
            </p>
          </div>
          <Button onClick={handleCreateRelease}>
            Create New Release
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <ReleaseFilters
            currentStatus={filters.status}
            currentSearch={filters.search}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Releases List */}
        <div className="bg-white rounded-lg shadow-sm">
          {releases.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {filters.search || (filters.status && filters.status !== 'all')
                  ? 'No releases found matching your filters'
                  : 'No releases yet'}
              </p>
              {!filters.search && (!filters.status || filters.status === 'all') && (
                <Button onClick={handleCreateRelease}>
                  Create Your First Release
                </Button>
              )}
            </div>
          ) : (
            <ReleasesList
              searchParams={{
                page: searchParams?.page,
                status: filters.status,
                search: filters.search,
              }}
              onDelete={handleDeleteRelease}
            />
          )}
        </div>

        {/* User info (for debugging in Storybook) */}
        {user && (
          <div className="mt-8 text-sm text-gray-500">
            Logged in as: {user.name} ({user.email})
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  )
}