/**
 * Memoization utilities for performance optimization
 */

/**
 * Create a memoized version of a function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    maxSize?: number;
    ttl?: number; // Time to live in milliseconds
    keyResolver?: (...args: Parameters<T>) => string;
  }
): T {
  const {
    maxSize = 100,
    ttl = Infinity,
    keyResolver = (...args: any[]) => JSON.stringify(args),
  } = options || {};

  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyResolver(...args);
    const cached = cache.get(key);

    // Check if cached value exists and is still valid
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < ttl) {
        return cached.value;
      }
      // Remove expired entry
      cache.delete(key);
    }

    // Compute and cache the result
    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });

    // Implement LRU eviction if cache is too large
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
}

/**
 * Debounce a function to limit execution frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;
  let lastResult: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = fn(...args);

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  }) as T;
}

/**
 * Create a memoized selector for derived state
 */
export function createSelector<T, R>(
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): (state: T) => R {
  let lastState: T | undefined;
  let lastResult: R | undefined;

  return (state: T): R => {
    if (state === lastState && lastResult !== undefined) {
      return lastResult as R;
    }

    const result = selector(state);

    if (
      lastResult !== undefined &&
      (equalityFn ? equalityFn(result, lastResult) : result === lastResult)
    ) {
      return lastResult as R;
    }

    lastState = state;
    lastResult = result;
    return result;
  };
}

/**
 * Batch updates to reduce re-renders
 */
export class BatchUpdater<T> {
  private pending: T[] = [];
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    private callback: (updates: T[]) => void,
    private delay: number = 0
  ) {}

  add(update: T): void {
    this.pending.push(update);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.pending.length === 0) return;

    const updates = [...this.pending];
    this.pending = [];

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.callback(updates);
  }

  clear(): void {
    this.pending = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Deep equality check for memoization
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Shallow equality check for memoization
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (a[key] !== b[key]) return false;
  }

  return true;
}