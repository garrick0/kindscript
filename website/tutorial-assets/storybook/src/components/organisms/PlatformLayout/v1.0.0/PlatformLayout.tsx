'use client';

import React, { useState } from 'react';
import { Sidebar, type NavigationItem } from '../../../molecules/Sidebar/v1.0.0/Sidebar';

export interface PlatformLayoutProps {
  children: React.ReactNode;
  navigation?: NavigationItem[]; // Make optional with default
  activeHref?: string;
  onNavigate?: (item: NavigationItem) => void;
  logo?: React.ReactNode;
  title?: string;
  headerContent?: React.ReactNode;
  chatContent?: React.ReactNode;
  userMenuContent?: React.ReactNode;
  className?: string;
}

export const PlatformLayout: React.FC<PlatformLayoutProps> = ({
  children,
  navigation = [],
  activeHref,
  onNavigate,
  logo,
  title = 'Platform',
  headerContent,
  chatContent,
  userMenuContent,
  className = ''
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className={`h-screen flex overflow-hidden bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        navigation={navigation}
        activeHref={activeHref}
        onNavigate={onNavigate}
        logo={logo}
        title={title}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4 flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {headerContent}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Chat Toggle */}
            {chatContent && (
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle chat"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            )}
            
            {/* User Menu */}
            {userMenuContent}
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
      
      {/* Chat Sidebar */}
      {chatContent && (
        <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 ${
          chatOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50`}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Chat</h3>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close chat"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {chatContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformLayout;