'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface TestModeIndicatorProps {
  show?: boolean;
}

export function TestModeIndicator({ show = false }: TestModeIndicatorProps) {
  if (!show) return null;
  
  // Only show in development/test environments
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 text-center z-50">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-semibold text-sm">
          TEST MODE - Authentication using test credentials
        </span>
        <AlertTriangle className="h-4 w-4" />
      </div>
    </div>
  );
}