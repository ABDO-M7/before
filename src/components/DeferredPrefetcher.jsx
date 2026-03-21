'use client';

import { useEffect, useState } from 'react';

/**
 * Loads CriticalRoutesPrefetcher (and prefetchUtils) after the main thread is idle.
 * Keeps prefetch logic out of the critical path.
 */
export default function DeferredPrefetcher() {
  const [Prefetcher, setPrefetcher] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Avoid aggressive route prefetch on mobile/slow connections.
    const isMobileViewport = window.innerWidth <= 1024;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = !!conn?.saveData;
    const effectiveType = (conn?.effectiveType || '').toLowerCase();
    const isSlowConnection =
      effectiveType.includes('2g') || effectiveType.includes('3g');

    if (isMobileViewport || saveData || isSlowConnection) {
      return;
    }

    const load = () => {
      import('@/components/Prefetching/CriticalRoutesPrefetcher').then((mod) => {
        setPrefetcher(() => mod.default);
      }).catch(() => {});
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(load, { timeout: 15000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(load, 12000);
    return () => clearTimeout(t);
  }, []);

  return Prefetcher ? <Prefetcher /> : null;
}
