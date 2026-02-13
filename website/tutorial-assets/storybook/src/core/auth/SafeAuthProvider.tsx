'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Simplified user interface for SafeAuthProvider
 */
export interface SafeUser {
  id: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}

/**
 * Safe auth context that doesn't throw errors
 */
interface SafeAuthContextValue {
  // State
  user: SafeUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const SafeAuthContext = createContext<SafeAuthContextValue | null>(null);

interface SafeAuthProviderProps {
  children: React.ReactNode;
  mockUser?: SafeUser | null;
  fallbackUser?: SafeUser | null;
  initialLoading?: boolean;
}

/**
 * SafeAuthProvider - Error-resistant auth provider for testing and development
 * Always provides a valid context, never throws errors
 */
export function SafeAuthProvider({ 
  children, 
  mockUser = null,
  fallbackUser = null,
  initialLoading = false
}: SafeAuthProviderProps) {
  const [user, setUser] = useState<SafeUser | null>(
    mockUser || fallbackUser || null
  );
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  // Safe login that never throws
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In test/dev mode, accept any credentials
      if (email && password) {
        const testUser: SafeUser = {
          id: 'test-user-1',
          email,
          name: email.split('@')[0],
          picture: null,
        };
        setUser(testUser);
        return true;
      }
      
      setError('Invalid credentials');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Safe logout that never throws
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setUser(null);
      setError(null);
    } catch (err) {
      // Log error but don't throw
      console.warn('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: SafeAuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <SafeAuthContext.Provider value={value}>
      {children}
    </SafeAuthContext.Provider>
  );
}

/**
 * Hook to safely access auth context - never throws
 */
export function useSafeAuth(): SafeAuthContextValue {
  const context = useContext(SafeAuthContext);
  
  // Return safe defaults instead of throwing
  if (!context) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      login: async () => false,
      logout: async () => {},
      clearError: () => {},
    };
  }
  
  return context;
}

/**
 * Test wrapper that provides a mock authenticated user
 */
export function SafeAuthTestWrapper({ 
  children,
  testUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    picture: null,
  }
}: {
  children: React.ReactNode;
  testUser?: SafeUser;
}) {
  return (
    <SafeAuthProvider mockUser={testUser}>
      {children}
    </SafeAuthProvider>
  );
}