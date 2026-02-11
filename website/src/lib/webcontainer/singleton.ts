/**
 * WebContainer singleton manager
 *
 * WebContainer only allows one instance per browser tab, so we need to
 * manage it as a singleton that persists across React component mounts/unmounts.
 */

import { WebContainer } from '@webcontainer/api';

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

/**
 * Get or create the WebContainer instance
 *
 * This ensures only one WebContainer is ever booted, even if called
 * multiple times or from multiple components.
 */
export async function getWebContainer(): Promise<WebContainer> {
  // If already booted, return the instance
  if (instance) {
    return instance;
  }

  // If boot is in progress, wait for it
  if (bootPromise) {
    return bootPromise;
  }

  // Start booting
  bootPromise = WebContainer.boot();
  instance = await bootPromise;
  bootPromise = null;

  return instance;
}

/**
 * Check if WebContainer is already booted
 */
export function isWebContainerBooted(): boolean {
  return instance !== null;
}

/**
 * Reset the singleton (for testing only)
 */
export function resetWebContainer(): void {
  instance = null;
  bootPromise = null;
}
