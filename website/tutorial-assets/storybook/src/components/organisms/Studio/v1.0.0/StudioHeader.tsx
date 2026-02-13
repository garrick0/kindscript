'use client';

import { useState } from 'react';
import { 
  Menu, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Settings, 
  Share2, 
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  Code,
  Palette
} from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface StudioHeaderProps {
  onMenuClick?: () => void; // Make optional with default
  onCommand?: (command: string, payload?: any) => void;
  currentStory?: {
    id: string;
    title: string;
    path?: string;
  };
  selectedStory?: string | null; // Platform passes selectedStory
  controller?: any; // Platform passes controller
  isFullscreen?: boolean;
  isLoading?: boolean;
  viewMode?: 'story' | 'code' | 'docs';
  viewport?: 'desktop' | 'tablet' | 'mobile';
  className?: string;
}

const VIEWPORT_SIZES = {
  desktop: { icon: Monitor, label: 'Desktop', width: '100%' },
  tablet: { icon: Tablet, label: 'Tablet', width: '768px' },
  mobile: { icon: Smartphone, label: 'Mobile', width: '375px' }
};

const VIEW_MODES = {
  story: { icon: Eye, label: 'Canvas' },
  code: { icon: Code, label: 'Code' },
  docs: { icon: Palette, label: 'Docs' }
};

export function StudioHeader({
  onMenuClick,
  onCommand,
  currentStory,
  isFullscreen = false,
  isLoading = false,
  viewMode = 'story',
  viewport = 'desktop',
  className
}: StudioHeaderProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleCommand = (command: string, payload?: any) => {
    onCommand?.(command, payload);
  };

  const handleShare = () => {
    if (currentStory) {
      const url = `${window.location.origin}/studio?story=${currentStory.id}`;
      navigator.clipboard.writeText(url);
      setShowShareMenu(false);
      // You could show a toast notification here
    }
  };

  const handleExport = () => {
    handleCommand('export', { storyId: currentStory?.id });
    setShowShareMenu(false);
  };

  return (
    <header className={cn(
      "bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between",
      className
    )}>
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        {/* Story Info */}
        {currentStory && (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{currentStory.title}</div>
              {currentStory.path && (
                <div className="text-xs text-gray-500">{currentStory.path}</div>
              )}
            </div>
            {isLoading && (
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Center - View Mode & Viewport Controls */}
      <div className="flex items-center gap-4">
        {/* View Mode Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {Object.entries(VIEW_MODES).map(([mode, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={mode}
                onClick={() => handleCommand('changeView', mode)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  viewMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Viewport Controls */}
        {viewMode === 'story' && (
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
            {Object.entries(VIEWPORT_SIZES).map(([size, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={size}
                  onClick={() => handleCommand('changeViewport', size)}
                  className={cn(
                    "p-2 rounded hover:bg-gray-100 transition-colors",
                    viewport === size && "bg-blue-100 text-blue-600"
                  )}
                  title={`${config.label} (${config.width})`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Fullscreen Toggle */}
        <button
          onClick={() => handleCommand('toggleFullscreen')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 text-gray-600" />
          ) : (
            <Maximize2 className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={() => handleCommand('refresh')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Refresh Story"
          disabled={isLoading}
        >
          <RefreshCw className={cn(
            "h-5 w-5 text-gray-600",
            isLoading && "animate-spin"
          )} />
        </button>

        {/* Share Menu */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Share & Export"
          >
            <Share2 className="h-5 w-5 text-gray-600" />
          </button>

          {showShareMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4" />
                  Copy Story Link
                </button>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Export Story
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    handleCommand('openInNewTab');
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Maximize2 className="h-4 w-4" />
                  Open in New Tab
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => handleCommand('openSettings')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </header>
  );
}

export type { StudioHeaderProps };