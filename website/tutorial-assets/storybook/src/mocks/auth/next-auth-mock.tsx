'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Session } from 'next-auth';

// Mock session data
export const mockSession: Session = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Create a context for mock auth state
interface MockAuthContext {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  setSession: (session: Session | null) => void;
}

const MockAuthContext = createContext<MockAuthContext | null>(null);

// Mock SessionProvider that maintains state
export function MockSessionProvider({ 
  children, 
  session: initialSession = mockSession 
}: { 
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const status = session ? 'authenticated' : 'unauthenticated';

  return (
    <MockAuthContext.Provider value={{ session, status, setSession }}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Mock useSession hook
export function useSession() {
  const context = useContext(MockAuthContext);
  
  if (!context) {
    // Fallback for when not wrapped in provider
    return {
      data: mockSession,
      status: 'authenticated' as const,
      update: async () => mockSession,
    };
  }

  return {
    data: context.session,
    status: context.status,
    update: async () => context.session,
  };
}

// Mock signIn function
export async function signIn(
  provider?: string,
  options?: { callbackUrl?: string; redirect?: boolean }
) {
  console.log(`[Mock] signIn called with provider: ${provider}, options:`, options);
  
  // Simulate async behavior
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In Storybook, we can't actually redirect, but we can log the intent
  if (options?.callbackUrl && options?.redirect !== false) {
    console.log(`[Mock] Would redirect to: ${options.callbackUrl}`);
  }
  
  // Return mock success response
  return {
    error: undefined,
    status: 200,
    ok: true,
    url: options?.callbackUrl || '/dashboard',
  };
}

// Mock signOut function  
export async function signOut(options?: { callbackUrl?: string; redirect?: boolean }) {
  console.log('[Mock] signOut called with options:', options);
  
  // Simulate async behavior
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In Storybook, we can't actually redirect, but we can log the intent
  if (options?.callbackUrl && options?.redirect !== false) {
    console.log(`[Mock] Would redirect to: ${options.callbackUrl}`);
  }
  
  // Get the context if available to clear session
  const context = useContext(MockAuthContext);
  if (context) {
    context.setSession(null);
  }
  
  return {
    url: options?.callbackUrl || '/',
  };
}

// Mock getCsrfToken function
export async function getCsrfToken() {
  return 'mock-csrf-token';
}

// Mock getSession function
export async function getSession() {
  return mockSession;
}

// Export everything as a module for easy mocking in tests/stories
export const mockNextAuth = {
  useSession,
  signIn,
  signOut,
  getCsrfToken,
  getSession,
  SessionProvider: MockSessionProvider,
};