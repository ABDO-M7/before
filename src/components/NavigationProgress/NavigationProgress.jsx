'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const BAR_HEIGHT = 3;
const Z_INDEX = 99999;
const FAKE_PROGRESS_INTERVAL = 300;
const FAKE_PROGRESS_INCREMENT = 8;
const MAX_FAKE = 88;

/**
 * Top-of-page progress bar shown during client-side navigation.
 * - Starts when user clicks an internal link (same origin).
 * - Simulated progress (0 → ~88%) so the user sees movement during compile/render.
 * - Completes and hides when pathname changes (new page ready).
 * Works with Next.js App Router (Turbopack/Webpack "Compiling" / "Rendering" phase).
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const timerRef = useRef(null);
  const prevPathnameRef = useRef(pathname);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start progress bar and fake progress
  const start = useCallback(() => {
    setVisible(true);
    setPercent(0);
    clearTimer();
    let p = 0;
    timerRef.current = setInterval(() => {
      p = Math.min(p + FAKE_PROGRESS_INCREMENT, MAX_FAKE);
      setPercent(p);
      if (p >= MAX_FAKE) clearTimer();
    }, FAKE_PROGRESS_INTERVAL);
  }, [clearTimer]);

  // Finish: go to 100% then hide
  const finish = useCallback(() => {
    clearTimer();
    setPercent(100);
    const t = setTimeout(() => {
      setVisible(false);
      setPercent(0);
    }, 200);
    return () => clearTimeout(t);
  }, [clearTimer]);

  // Pathname changed → navigation finished
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (visible) {
        const cleanup = finish();
        return cleanup;
      }
    }
  }, [pathname, visible, finish]);

  // Global click: internal link clicked
  useEffect(() => {
    const handleClick = (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || a.hasAttribute('download')) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname) return;
        start();
      } catch {
        // relative url
        if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) start();
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, start]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading page"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: BAR_HEIGHT,
        zIndex: Z_INDEX,
        backgroundColor: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${percent}%`,
          backgroundColor: 'var(--primary-color, #0d6efd)',
          transition: percent >= 100 ? 'width 0.15s ease-out' : 'width 0.2s ease-out',
        }}
      />
    </div>
  );
}
