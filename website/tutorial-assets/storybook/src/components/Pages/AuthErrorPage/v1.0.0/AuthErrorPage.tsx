'use client';

import React from 'react';
import { Button } from '../../../atoms/Button';

export interface AuthErrorPageProps {
  error?: string;
}

export const AuthErrorPage: React.FC<AuthErrorPageProps> = ({ error }) => {
  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from the OAuth provider.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth provider user in the database.';
      case 'EmailCreateAccount':
        return 'Could not create email provider user in the database.';
      case 'Callback':
        return 'Error in the OAuth callback handler route.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account.';
      case 'EmailSignin':
        return 'Check your email address for the verification link.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
        </div>

        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {error ? `Error: ${error}` : 'Authentication Failed'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{getErrorMessage()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={() => window.location.href = '/api/auth/signin'}
          >
            Try Again
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            If this problem persists,{' '}
            <a href="/support" className="font-medium text-indigo-600 hover:text-indigo-500">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage;