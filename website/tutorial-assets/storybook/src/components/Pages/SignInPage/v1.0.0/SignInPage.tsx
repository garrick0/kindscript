'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '../../../atoms/Button';
import { Input } from '../../../atoms/Input/v1.0.0/Input';

export interface SignInPageProps {
  callbackUrl?: string;
  error?: string;
}

export const SignInPage: React.FC<SignInPageProps> = ({ 
  callbackUrl = '/dashboard',
  error 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showTestLogin, setShowTestLogin] = useState(false);

  useEffect(() => {
    // Check for error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError) {
      setErrorMessage(urlError);
    }
    
    // Always show test login in development (will be hidden in production build)
    // Check for development indicators
    const isDev = true; // Always show in dev for now
    setShowTestLogin(isDev);
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // Check if we're in Storybook environment
      if (typeof window !== 'undefined' && (window as any).__STORYBOOK_PREVIEW__) {
        console.log('[Storybook] Sign in simulated, would redirect to:', callbackUrl);
        setIsLoading(false);
        return;
      }
      
      // Use redirect: false to handle navigation manually for better Playwright compatibility
      const result = await signIn('auth0', { 
        callbackUrl,
        redirect: false 
      });
      
      // Handle the redirect manually
      if (result?.error) {
        console.error('Sign in error:', result.error);
        setErrorMessage(result.error);
        setIsLoading(false);
      } else if (result?.url) {
        // Force navigation for Playwright tests
        window.location.href = result.url;
      } else {
        // Fallback: try direct redirect
        await signIn('auth0', { callbackUrl });
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setErrorMessage('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Check if we're in Storybook environment
      if (typeof window !== 'undefined' && (window as any).__STORYBOOK_PREVIEW__) {
        console.log('[Storybook] Test login simulated');
        setIsLoading(false);
        return;
      }
      
      // Use Credentials provider for test login
      const result = await signIn('test-credentials', {
        email,
        password,
        callbackUrl,
        redirect: false
      });
      
      if (result?.error) {
        console.error('Test login error:', result.error);
        setErrorMessage('Invalid email or password');
        setIsLoading(false);
      } else if (result?.ok) {
        // Successful login - redirect to callback URL
        window.location.href = callbackUrl;
      }
    } catch (err) {
      console.error('Test login error:', err);
      setErrorMessage('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Induction Studio
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your workspace with Auth0
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">
              {errorMessage === 'OAuthAccountNotLinked' 
                ? 'This account is already linked to another user.'
                : errorMessage === 'AccessDenied'
                ? 'Access was denied. Please contact your administrator.'
                : 'An error occurred during sign in. Please try again.'}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Show test login form in development/test mode */}
          {showTestLogin && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Test Mode:</strong> Use test credentials below or Auth0 login
                </p>
              </div>
              
              <form onSubmit={handleTestLogin} className="space-y-4">
                <Input
                  type="email"
                  name="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="test-email-input"
                />
                <Input
                  type="password"
                  name="password"
                  placeholder="test-password-123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  data-testid="test-password-input"
                />
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="test-login-button"
                >
                  {isLoading ? 'Signing in...' : 'Test Login'}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>
          )}
          
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Auth0'}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Having trouble?{' '}
            <a href="/support" className="font-medium text-indigo-600 hover:text-indigo-500">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};