'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Base user interface
 */
export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  emailVerified?: boolean | null;
}

/**
 * Auth session interface
 */
export interface AuthSession {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Auth context value
 */
interface AuthContextValue {
  // State
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;

  // Methods
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  mockUser?: User | null; // For Storybook testing
  initialSession?: AuthSession | null; // For SSR
  onError?: (error: Error) => void;
}

/**
 * AuthProvider Organism
 * Manages all authentication state and business logic
 * This is a self-contained component with all auth logic
 */
export function AuthProvider({ 
  children, 
  mockUser,
  initialSession,
  onError
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(mockUser || initialSession?.user || null);
  const [session, setSession] = useState<AuthSession | null>(initialSession || null);
  const [isLoading, setIsLoading] = useState(!mockUser && !initialSession);
  const [error, setError] = useState<Error | null>(null);

  // Load session on mount (client-side)
  useEffect(() => {
    if (mockUser || initialSession) return; // Skip if mocked or SSR

    const loadSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/session');
        
        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData?.user) {
            setSession(sessionData);
            setUser(sessionData.user);
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        const error = err instanceof Error ? err : new Error('Failed to load session');
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [mockUser, initialSession, onError]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      setSession(data.session);
      setUser(data.session.user);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Login with OAuth provider
  const loginWithProvider = useCallback(async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Redirect to OAuth provider
      window.location.href = `/api/auth/signin?provider=${provider}`;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('OAuth login failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await fetch('/api/auth/signout', { method: 'POST' });
      
      setSession(null);
      setUser(null);
      
      // Redirect to home
      window.location.href = '/';
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Logout failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Signup
  const signup = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();
      setSession(data.session);
      setUser(data.session.user);
      
      // Redirect to onboarding or dashboard
      window.location.href = '/onboarding';
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Signup failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        setSession(sessionData);
        setUser(sessionData.user);
      } else {
        // Session expired
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Session refresh failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Update user profile
  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      if (session) {
        setSession({ ...session, user: updatedUser });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('User update failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    error,
    login,
    loginWithProvider,
    logout,
    signup,
    refreshSession,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook to require authentication
 */
export function useRequireAuth(redirectTo = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);
  
  return { isAuthenticated, isLoading };
}