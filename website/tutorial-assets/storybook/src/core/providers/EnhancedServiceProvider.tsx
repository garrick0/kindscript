'use client'

import React, { ReactNode } from 'react'
import { ServiceProvider, ServiceProviderProps } from './ServiceProvider'
import { QueryProvider } from './QueryProvider'

export interface EnhancedServiceProviderProps extends ServiceProviderProps {
  showQueryDevtools?: boolean
}

/**
 * Enhanced service provider that includes both services and React Query
 * This provides caching, optimistic updates, and better data management
 */
export function EnhancedServiceProvider({ 
  children, 
  services,
  useMocks = false,
  showQueryDevtools = false
}: EnhancedServiceProviderProps) {
  return (
    <QueryProvider showDevtools={showQueryDevtools}>
      <ServiceProvider services={services} useMocks={useMocks}>
        {children}
      </ServiceProvider>
    </QueryProvider>
  )
}

// Re-export hooks from ServiceProvider for convenience
export { useServices, useReleaseService, useDocumentService, useSettingsService } from './ServiceProvider'