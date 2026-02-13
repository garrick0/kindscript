'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '../../../../utils/hooks/useAuth';
import { Shield, AlertTriangle, LogIn, Loader } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireRole?: 'admin' | 'user' | 'viewer';
  requirePermissions?: string[];
  redirectTo?: string;
}

/**
 * AuthGuard Organism
 * Protects content behind authentication
 * Contains all authorization logic
 */
export function AuthGuard({ 
  children, 
  fallback,
  requireRole,
  requirePermissions = [],
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state
  if (isLoading) {
    return fallback || <AuthLoadingState />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return <AuthLoginState />;
  }

  // Check role requirement (simplified - would need role in user object)
  if (requireRole) {
    const userRole = (user as any)?.role;
    if (userRole !== requireRole && userRole !== 'admin') {
      return <AuthUnauthorizedState 
        message={`This page requires ${requireRole} role.`} 
        userRole={userRole} 
      />;
    }
  }

  // Check permissions requirement (simplified - would need permissions in user object)
  if (requirePermissions.length > 0) {
    const userPermissions = (user as any)?.permissions || [];
    const missingPermissions = requirePermissions.filter(
      permission => !userPermissions.includes(permission)
    );
    
    if (missingPermissions.length > 0) {
      return <AuthUnauthorizedState 
        message="You don't have the required permissions to access this page."
        missingPermissions={missingPermissions}
      />;
    }
  }

  return <>{children}</>;
}

function AuthLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}

function AuthLoginState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <LogIn className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
        <a
          href="/auth/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <LogIn size={16} />
          Sign In
        </a>
      </div>
    </div>
  );
}

function AuthUnauthorizedState({ 
  message, 
  userRole, 
  missingPermissions 
}: { 
  message: string; 
  userRole?: string; 
  missingPermissions?: string[] 
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <Shield className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        
        {userRole && (
          <p className="text-sm text-gray-500 mb-2">
            Your current role: <span className="font-medium">{userRole}</span>
          </p>
        )}
        
        {missingPermissions && missingPermissions.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Required permissions:</p>
            <ul className="text-xs text-gray-400 space-y-1">
              {missingPermissions.map(permission => (
                <li key={permission} className="bg-gray-100 px-2 py-1 rounded">
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
          <a
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Higher-order component for wrapping pages with auth
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireRole?: 'admin' | 'user' | 'viewer';
    requirePermissions?: string[];
    fallback?: ReactNode;
  }
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard
        requireRole={options?.requireRole}
        requirePermissions={options?.requirePermissions}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };
}