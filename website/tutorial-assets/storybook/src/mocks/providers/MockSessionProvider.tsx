'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

// Mock session for Storybook
const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

export function MockSessionProvider({ children }: { children: React.ReactNode }) {
  // In Storybook, provide a mock session
  // This allows components using useSession to work without actual auth
  // For components that use signIn/signOut, they'll work but won't actually redirect
  return (
    <SessionProvider session={mockSession} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}