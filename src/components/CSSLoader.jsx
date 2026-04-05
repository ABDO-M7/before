/**
 * ✅ CSS Loader Component – Lazy/deferred loading for non-critical CSS
 *
 * Bootstrap is already bundled via npm (package.json dependency) — the CDN version
 * was causing a redundant network request that competes with LCP resources.
 * Only truly non-critical stylesheets (accessibility) are deferred here.
 */

'use client';

import { useEffect } from 'react';
import { loadNonCriticalCSS, preloadCSS } from '@/utils/cssLoader';

/** Non-critical CSS – loaded after page is interactive (print-media trick) */
const NON_CRITICAL_CSS = [
  '/css/accessibility.css', // Deferred to avoid render-blocking; a11y styles apply after paint
];

/** CSS to preload (hint only, does not block render) */
const PRELOAD_CSS = [];

export default function CSSLoader() {
  useEffect(() => {
    // Preload CSS files (non-blocking)
    PRELOAD_CSS.forEach((href) => {
      preloadCSS(href);
    });

    // Load non-critical CSS after page is interactive
    if (NON_CRITICAL_CSS.length > 0) {
      loadNonCriticalCSS(NON_CRITICAL_CSS).catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[CSS Loader] Failed to load non-critical CSS:', error);
        }
      });
    }

    return () => {};
  }, []);

  return null; // This component doesn't render anything
}
