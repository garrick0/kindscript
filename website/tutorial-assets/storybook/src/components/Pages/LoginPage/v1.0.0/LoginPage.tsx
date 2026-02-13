'use client';

import React from 'react';
import { LoginForm } from '../../../molecules/LoginForm/v1.0.0/LoginForm';
import { AuthProvider } from '../../../organisms/AuthProvider/v1.0.0/AuthProvider';

interface LoginPageProps {
  redirectTo?: string;
  showSignup?: boolean;
}

/**
 * LoginPage - Complete auth page with all business logic
 * This is a self-contained page component that can be used directly
 */
export function LoginPage({
  redirectTo = '/dashboard',
  showSignup = true
}: LoginPageProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">I</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to Induction Studio
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
            <LoginForm 
              redirectTo={redirectTo}
              showSignupLink={showSignup}
              showSocialLogin={true}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}

/**
 * Export a version without provider for embedding in existing apps
 */
export function LoginPageContent({
  redirectTo = '/dashboard',
  showSignup = true
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">I</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to Induction Studio
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <LoginForm 
            redirectTo={redirectTo}
            showSignupLink={showSignup}
            showSocialLogin={true}
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:text-blue-500">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:text-blue-500">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}