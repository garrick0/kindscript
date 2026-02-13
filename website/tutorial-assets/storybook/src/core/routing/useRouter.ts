import { useCallback } from 'react'

export interface Router {
  push: (path: string) => void
  replace: (path: string) => void
  back: () => void
  forward: () => void
  refresh: () => void
  prefetch: (path: string) => void
}

export function useRouter(): Router {
  // Check if we're in Next.js environment
  const isNextJs = typeof window !== 'undefined' && 
    'next' in window && 
    !window.parent.location.href.includes('storybook')

  // Check if we're in Storybook
  const isStorybook = typeof window !== 'undefined' && 
    (window.parent !== window || window.location.href.includes('storybook'))

  // For Next.js environment, use the real router
  if (isNextJs) {
    try {
      // Dynamic import to avoid build issues in Storybook
      const { useRouter: useNextRouter } = require('next/navigation')
      return useNextRouter()
    } catch (error) {
      console.warn('Next.js router not available, using mock router')
    }
  }

  // Mock router for Storybook and testing
  const push = useCallback((path: string) => {
    console.log('[Mock Router] Navigate to:', path)
    if (!isStorybook && typeof window !== 'undefined') {
      window.history.pushState({}, '', path)
    }
  }, [isStorybook])

  const replace = useCallback((path: string) => {
    console.log('[Mock Router] Replace with:', path)
    if (!isStorybook && typeof window !== 'undefined') {
      window.history.replaceState({}, '', path)
    }
  }, [isStorybook])

  const back = useCallback(() => {
    console.log('[Mock Router] Go back')
    if (!isStorybook && typeof window !== 'undefined') {
      window.history.back()
    }
  }, [isStorybook])

  const forward = useCallback(() => {
    console.log('[Mock Router] Go forward')
    if (!isStorybook && typeof window !== 'undefined') {
      window.history.forward()
    }
  }, [isStorybook])

  const refresh = useCallback(() => {
    console.log('[Mock Router] Refresh')
    if (!isStorybook && typeof window !== 'undefined') {
      window.location.reload()
    }
  }, [isStorybook])

  const prefetch = useCallback((path: string) => {
    console.log('[Mock Router] Prefetch:', path)
  }, [])

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch,
  }
}