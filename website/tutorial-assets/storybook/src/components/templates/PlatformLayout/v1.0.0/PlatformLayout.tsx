'use client';

import React from 'react';
import { TestModeIndicator } from '../../../molecules/TestModeIndicator';

export interface PlatformLayoutProps {
  children: React.ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  // Show test mode indicator if test auth is enabled
  const isTestMode = process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === 'true' || 
                     process.env.ENABLE_TEST_AUTH === 'true';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <TestModeIndicator show={isTestMode} />
      <div className={`flex h-screen ${isTestMode ? 'pt-10' : ''}`}>
        {/* Sidebar placeholder - can be enhanced later */}
        <aside className="w-64 bg-white border-r border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-800">Induction Studio</h2>
            {isTestMode && (
              <div className="mt-2 text-xs text-yellow-600 font-medium">
                TEST MODE
              </div>
            )}
          </div>
          <nav className="mt-8 px-4">
            <a href="/dashboard" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
              Dashboard
            </a>
            <a href="/documents" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
              Documents
            </a>
            <a href="/releases" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
              Releases
            </a>
            <a href="/settings" className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded">
              Settings
            </a>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}