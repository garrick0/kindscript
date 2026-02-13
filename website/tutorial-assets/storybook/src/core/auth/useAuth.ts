'use client';

import { useMemo, useState, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

interface AuthError {
  message: string;
  code?: string;
}

interface AuthState {
  user: any | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
  session: any | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setError({
          message: 'Invalid email or password',
          code: result.error
        });
      }
    } catch (err) {
      setError({
        message: 'An error occurred during login',
        code: 'UNKNOWN_ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithProvider = useCallback(async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn(provider, { redirect: false });
      if (result?.error) {
        setError({
          message: `Failed to sign in with ${provider}`,
          code: result.error
        });
      }
    } catch (err) {
      setError({
        message: `An error occurred signing in with ${provider}`,
        code: 'PROVIDER_ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return useMemo(() => ({
    user: session?.user || null,
    loading: status === 'loading',
    error,
    isAuthenticated: !!session?.user,
    session,
    login,
    loginWithProvider,
    logout,
    clearError,
    isLoading: status === 'loading' || isLoading,
  }), [session, status, error, isLoading, login, loginWithProvider, logout, clearError]);
}