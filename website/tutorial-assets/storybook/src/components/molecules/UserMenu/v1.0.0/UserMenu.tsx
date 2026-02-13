'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '../../../atoms/Button/v1.0.0/Button';

export interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className={`flex items-center ${className}`}>
        <Button
          variant="default"
          size="sm"
          onClick={() => window.location.href = '/api/auth/signin'}
        >
          Sign In
        </Button>
      </div>
    );
  }

  const userInitial = session.user.name?.[0] || session.user.email?.[0] || '?';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
          {userInitial.toUpperCase()}
        </div>
        <span className="hidden md:block text-gray-700">{session.user.name || session.user.email}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-gray-700 border-b">
                <div className="font-medium">{session.user.name}</div>
                <div className="text-gray-500">{session.user.email}</div>
              </div>
              
              <a
                href="/settings"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Settings
              </a>
              
              <a
                href="/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </a>
              
              <hr className="my-1" />
              
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/' }).then(() => {
                    // Check if we're in Storybook environment
                    if (typeof window !== 'undefined' && (window as any).__STORYBOOK_PREVIEW__) {
                      console.log('[Storybook] Sign out simulated from UserMenu');
                    }
                  });
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;