'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudioSidebar, StudioHeader } from '../../../organisms/Studio';
import { useStudio } from './useStudio';

export interface StudioPageProps {
  storybookUrl?: string;
  storyId?: string;
  pageId?: string;
  releaseId?: string;
}

function StudioContent({ storybookUrl, storyId, pageId, releaseId }: StudioPageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { controller, selectedStory, attachController } = useStudio();
  
  useEffect(() => {
    if (!iframeRef.current) return;

    const url = storybookUrl || process.env.NEXT_PUBLIC_STORYBOOK_URL || 'http://localhost:6007';
    const cleanup = attachController(iframeRef.current, url, { storyId, pageId, releaseId });
    
    return cleanup;
  }, [storybookUrl, storyId, pageId, releaseId, attachController]);

  return (
    <div className="h-full flex">
      {/* Studio-specific sidebar */}
      <StudioSidebar 
        controller={controller}
        selectedStory={selectedStory}
      />
      
      {/* Main studio area */}
      <div className="flex-1 flex flex-col">
        {/* Studio header with controls */}
        <StudioHeader 
          controller={controller}
          selectedStory={selectedStory}
        />
        
        {/* Storybook iframe */}
        <div className="flex-1 bg-white">
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Storybook Studio"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      </div>
    </div>
  );
}

export function StudioPage(props: StudioPageProps) {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading Studio...</div>}>
      <StudioContent {...props} />
    </Suspense>
  );
}