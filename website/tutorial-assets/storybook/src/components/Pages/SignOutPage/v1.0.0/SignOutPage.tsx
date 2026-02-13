'use client';

import React, { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export interface SignOutPageProps {}

export const SignOutPage: React.FC<SignOutPageProps> = () => {
  useEffect(() => {
    // Sign out using NextAuth
    signOut({ callbackUrl: '/' }).then(() => {
      // Check if we're in Storybook environment
      if (typeof window !== 'undefined' && (window as any).__STORYBOOK_PREVIEW__) {
        console.log('[Storybook] Sign out simulated, would redirect to: /');
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">
          Signing out...
        </h2>
        <p className="text-gray-600">
          Please wait while we sign you out securely.
        </p>
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};