'use client';

import { useEffect } from 'react';

/**
 * Loads RUM, error tracker, and offline support after the main thread is idle.
 * Reduces Script Evaluation / Parsing on initial load (saves ~100–300ms+ main-thread time).
 */
const IDLE_TIMEOUT_MS = 3500;

export default function DeferredMonitoring() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const load = () => {
      import('@/utils/rumTracking').catch(() => {});
      import('@/utils/errorTracker').catch(() => {});
      import('@/utils/offlineSupport').catch(() => {});
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(load, { timeout: IDLE_TIMEOUT_MS });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(load, 1500);
    return () => clearTimeout(t);
  }, []);

  return null;
}
