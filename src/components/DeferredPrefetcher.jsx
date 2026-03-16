'use client';

import { useEffect, useState } from 'react';

/**
 * Loads CriticalRoutesPrefetcher (and prefetchUtils) after the main thread is idle.
 * Keeps prefetch logic out of the critical path.
 */
const IDLE_TIMEOUT_MS = 4000;

export default function DeferredPrefetcher() {
  const [Prefetcher, setPrefetcher] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const load = () => {
      import('@/components/Prefetching/CriticalRoutesPrefetcher').then((mod) => {
        setPrefetcher(() => mod.default);
      }).catch(() => {});
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(load, { timeout: IDLE_TIMEOUT_MS });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(load, 2000);
    return () => clearTimeout(t);
  }, []);

  return Prefetcher ? <Prefetcher /> : null;
}
