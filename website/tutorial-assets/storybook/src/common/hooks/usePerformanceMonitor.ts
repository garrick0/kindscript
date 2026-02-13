import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateCount: number;
  lastUpdateTime: number;
}

interface PerformanceOptions {
  componentName: string;
  logThreshold?: number; // Log if render time exceeds this (ms)
  warnThreshold?: number; // Warn if render time exceeds this (ms)
  enableLogging?: boolean;
}

/**
 * Hook to monitor component performance metrics
 */
export function usePerformanceMonitor(options: PerformanceOptions) {
  const {
    componentName,
    logThreshold = 16, // 60fps = ~16ms per frame
    warnThreshold = 100,
    enableLogging = process.env.NODE_ENV === 'development',
  } = options;

  const metrics = useRef<PerformanceMetrics>({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    lastUpdateTime: 0,
  });

  const renderStart = useRef<number>(performance.now());

  // Track mount time
  useEffect(() => {
    const mountTime = performance.now() - renderStart.current;
    metrics.current.mountTime = mountTime;

    if (enableLogging && mountTime > logThreshold) {
      const level = mountTime > warnThreshold ? 'warn' : 'log';
      console[level](
        `[Performance] ${componentName} mounted in ${mountTime.toFixed(2)}ms`
      );
    }

    // Report to analytics if needed
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: `${componentName}_mount`,
        value: Math.round(mountTime),
        event_category: 'Component Performance',
      });
    }
  }, []);

  // Track updates
  useEffect(() => {
    metrics.current.updateCount++;
    const updateTime = performance.now() - renderStart.current;
    metrics.current.lastUpdateTime = updateTime;

    if (enableLogging && updateTime > logThreshold && metrics.current.updateCount > 1) {
      const level = updateTime > warnThreshold ? 'warn' : 'log';
      console[level](
        `[Performance] ${componentName} update #${metrics.current.updateCount} took ${updateTime.toFixed(2)}ms`
      );
    }
  });

  // Track render time
  metrics.current.renderTime = performance.now() - renderStart.current;
  renderStart.current = performance.now();

  const getMetrics = useCallback(() => metrics.current, []);

  const logMetrics = useCallback(() => {
    console.table({
      Component: componentName,
      'Mount Time (ms)': metrics.current.mountTime.toFixed(2),
      'Last Update (ms)': metrics.current.lastUpdateTime.toFixed(2),
      'Update Count': metrics.current.updateCount,
      'Last Render (ms)': metrics.current.renderTime.toFixed(2),
    });
  }, [componentName]);

  return {
    metrics: metrics.current,
    getMetrics,
    logMetrics,
  };
}

/**
 * Hook to measure async operation performance
 */
export function useAsyncPerformance(operationName: string) {
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current === 0) {
      console.warn(`[Performance] ${operationName}: start() was not called`);
      return 0;
    }

    const duration = performance.now() - startTimeRef.current;
    startTimeRef.current = 0;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${operationName} took ${duration.toFixed(2)}ms`);
    }

    // Report to analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: operationName,
        value: Math.round(duration),
        event_category: 'Async Operation',
      });
    }

    return duration;
  }, [operationName]);

  const measure = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
      start();
      try {
        const result = await asyncFn();
        end();
        return result;
      } catch (error) {
        end();
        throw error;
      }
    },
    [start, end]
  );

  return { start, end, measure };
}

// Web Vitals tracking
export function reportWebVitals(metric: any) {
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}