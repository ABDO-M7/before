/**
 * ✅ CSS Loader Component – Lazy/deferred loading for non-critical CSS
 *
 * Project-wide lazy-load strategy:
 * - Images: loading="lazy" on <Image> and <img> (see LAZYLOAD audit).
 * - JS/Components: next/dynamic() for heavy components (auth modals, Swiper, Leaflet, etc.).
 * - Third-party scripts: next/script with strategy="lazyOnload" (analytics, pixel) in layout.js.
 * - CSS: Layout keeps critical CSS (style, bootstrap, accessibility, skeleton) sync;
 *   component-level CSS (e.g. AiTools.css, react-phone-input-2, leaflet) is bundled with
 *   their components and loads when those chunks load. Add any extra non-critical
 *   stylesheet paths below to load after the page is interactive.
 */

'use client';

import { useEffect } from 'react';
import { loadNonCriticalCSS, preloadCSS } from '@/utils/cssLoader';

/** Non-critical CSS – loaded after page is interactive (print-media trick) */
const NON_CRITICAL_CSS = [
  '/css/accessibility.css', // Deferred to avoid render-blocking; a11y styles apply after paint
];
const DEFERRED_BOOTSTRAP_CSS = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';

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

    // Load Bootstrap using non-blocking strategy
    loadNonCriticalCSS([DEFERRED_BOOTSTRAP_CSS]).catch(() => {});

    return () => {};
  }, []);

  return null; // This component doesn't render anything
}
