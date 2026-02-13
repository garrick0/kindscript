import { useState, useCallback } from 'react';

// Mock StorybookController for now - should be imported from actual implementation
class StorybookController {
  private url: string;
  private iframe: HTMLIFrameElement | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  attach(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    iframe.src = this.url;
    
    // Simulate ready event
    setTimeout(() => {
      this.emit('ready');
    }, 1000);
  }

  detach() {
    if (this.iframe) {
      this.iframe.src = '';
      this.iframe = null;
    }
    this.listeners.clear();
  }

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(handler);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(handler => handler(...args));
  }

  navigateToStory(storyId: string) {
    console.log('Navigate to story:', storyId);
    this.emit('storyRendered', { id: storyId });
  }

  navigateToPage(pageId: string) {
    console.log('Navigate to page:', pageId);
  }

  navigateToRelease(releaseId: string) {
    console.log('Navigate to release:', releaseId);
  }
}

interface StudioOptions {
  storyId?: string;
  pageId?: string;
  releaseId?: string;
}

export function useStudio() {
  const [controller, setController] = useState<StorybookController | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  const attachController = useCallback((iframe: HTMLIFrameElement, url: string, options: StudioOptions) => {
    const ctrl = new StorybookController(url);
    
    ctrl.attach(iframe);
    
    // Listen for Storybook events
    ctrl.on('ready', () => {
      console.log('Storybook ready');
      
      // Navigate based on options
      if (options.storyId) {
        ctrl.navigateToStory(options.storyId);
      } else if (options.pageId) {
        ctrl.navigateToPage(options.pageId);
      } else if (options.releaseId) {
        ctrl.navigateToRelease(options.releaseId);
      }
    });
    
    ctrl.on('storyRendered', (story: any) => {
      console.log('Story rendered:', story);
      setSelectedStory(story.id);
    });
    
    ctrl.on('storyError', (error: any) => {
      console.error('Story error:', error);
    });
    
    setController(ctrl);
    
    // Return cleanup function
    return () => {
      ctrl.detach();
      setController(null);
      setSelectedStory(null);
    };
  }, []);

  return {
    controller,
    selectedStory,
    attachController
  };
}