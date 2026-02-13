'use client';

import React from 'react';

// This wrapper handles both Storybook and Platform contexts
export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  // In Platform context, SessionProvider is already provided by root layout
  // In Storybook context, we'll provide a mock
  
  // Check if we're in a Next.js app context (has SessionProvider from root)
  // If not, we need to provide our own mock context
  if (typeof window !== 'undefined' && !('__NEXTAUTH' in window)) {
    // We're in Storybook or a test environment without NextAuth
    // Provide a mock context
    const MockSessionContext = React.createContext({
      data: null,
      status: 'unauthenticated' as const,
      update: async () => undefined,
    });
    
    return (
      <MockSessionContext.Provider value={{
        data: null,
        status: 'unauthenticated',
        update: async () => undefined,
      }}>
        {children}
      </MockSessionContext.Provider>
    );
  }
  
  // In Next.js app, SessionProvider is already at the root
  return <>{children}</>;
}