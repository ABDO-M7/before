'use client';

import { useEffect, useState } from 'react';

/**
 * Loads Web Vitals and its monitoring utils (performanceMonitor, performanceAlerts,
 * analyticsDashboard, performanceBudgets) only after the main thread is idle.
 * Reduces Script Evaluation / Parsing on initial load.
 */
const IDLE_TIMEOUT_MS = 3000;

export default function DeferredWebVitals() {
  const [WebVitalsComponent, setWebVitalsComponent] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const load = () => {
      import('@/components/WebVitals').then((mod) => {
        setWebVitalsComponent(() => mod.default);
      }).catch(() => {});
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(load, { timeout: IDLE_TIMEOUT_MS });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(load, 1200);
    return () => clearTimeout(t);
  }, []);

  return WebVitalsComponent ? <WebVitalsComponent /> : null;
}
