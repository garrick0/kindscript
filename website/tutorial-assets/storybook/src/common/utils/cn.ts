import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to concatenate class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  try {
    // Filter out undefined/null values and convert to strings
    const filteredInputs = inputs
      .filter(input => input != null)
      .map(input => typeof input === 'string' ? input : String(input))
      .filter(input => input !== 'undefined' && input !== 'null');
    
    return twMerge(clsx(filteredInputs));
  } catch (error) {
    // Fallback: just join strings with spaces
    console.warn('cn() error, using fallback:', error);
    return inputs
      .filter(input => input != null && typeof input === 'string')
      .join(' ');
  }
}
