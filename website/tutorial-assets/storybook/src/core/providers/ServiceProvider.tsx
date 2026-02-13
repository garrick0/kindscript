'use client'

import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import { ReleaseService } from '../../components/organisms/ReleasesManager/v1.0.0/release.service'
import { DocumentService } from '../../components/organisms/DocumentManager/v1.0.0/document.service'
import { SettingsService } from '../../components/Pages/SettingsPage/v1.0.0/settings.service'
import { DashboardService } from '../../components/Pages/DashboardPage/v1.0.0/dashboard.service'

export interface Services {
  releases: ReleaseService
  dashboard?: DashboardService
  documents?: DocumentService
  settings?: SettingsService
  workflows?: any
}

const ServiceContext = createContext<Services | null>(null)

export interface ServiceProviderProps {
  children: ReactNode
  services?: Services
  useMocks?: boolean
}

/**
 * Detect if MSW is available and active
 */
function isMSWActive(): boolean {
  // Check if we're in a Storybook environment
  if (typeof window !== 'undefined') {
    // Check for MSW worker registration
    if ('__mswStarted' in window) {
      return true;
    }
    // Check for Storybook environment
    if (window.location.href.includes('iframe.html') || 
        window.parent !== window) {
      return true;
    }
  }
  return false;
}

export function ServiceProvider({ 
  children, 
  services,
  useMocks = false 
}: ServiceProviderProps) {
  // Detect MSW automatically
  const mswActive = useMemo(() => isMSWActive(), []);
  
  // Default services
  const defaultServices: Services = useMemo(() => {
    // If MSW is active OR useMocks is true, use real services that will be intercepted
    if (mswActive || useMocks) {
      // Use real services with API endpoints - MSW will intercept these
      return {
        releases: new ReleaseService('/api/releases'),
        dashboard: new DashboardService('/api/dashboard'),
        documents: new DocumentService('/api/documents'),
        settings: new SettingsService('/api/settings'),
      };
    }
    
    // In production without MSW, use real services
    return {
      releases: new ReleaseService('/api/releases'),
      dashboard: new DashboardService('/api/dashboard'),
      documents: new DocumentService('/api/documents'),
      settings: new SettingsService('/api/settings'),
    };
  }, [mswActive, useMocks])

  return (
    <ServiceContext.Provider value={services || defaultServices}>
      {children}
    </ServiceContext.Provider>
  )
}

export function useServices(): Services {
  const context = useContext(ServiceContext)
  if (!context) {
    throw new Error('useServices must be used within ServiceProvider')
  }
  return context
}

// Individual service hooks for convenience
export function useReleaseService() {
  const { releases } = useServices()
  return releases
}


export function useDocumentService() {
  const { documents } = useServices()
  return documents
}

export function useSettingsService() {
  const { settings } = useServices()
  return settings
}