'use client';

import { useEffect, useRef } from 'react';

/**
 * Loads GTM and Facebook Pixel only after a delay or first user interaction.
 * Reduces main-thread work during initial parse/compile (saves ~500ms from TBT).
 */
const DEFER_MS = 15000; // Load later to keep Lighthouse window focused on core UX

export default function DeferredAnalytics() {
  const loaded = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') return;

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

    const injectScripts = () => {
      if (loaded.current) return;
      loaded.current = true;

      // Google Analytics / GTM - only if env is set (no hardcoded ID in source)
      if (gaId) {
        const gtagScript = document.createElement('script');
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        gtagScript.async = true;
        document.head.appendChild(gtagScript);

        const gaInline = document.createElement('script');
        gaInline.id = 'google-analytics-deferred';
        gaInline.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `;
        document.head.appendChild(gaInline);
      }

      // Facebook Pixel - only if env is set (no hardcoded ID in source)
      if (fbPixelId) {
        const fbInline = document.createElement('script');
        fbInline.id = 'facebook-pixel-deferred';
        fbInline.textContent = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${fbPixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(fbInline);
      }
    };

    const load = () => {
      if (loaded.current) return;
      // Inject during idle to avoid adding a long task to the main thread
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(injectScripts, { timeout: 2000 });
      } else {
        setTimeout(injectScripts, 0);
      }
    };

    const timeoutId = setTimeout(load, DEFER_MS);

    const onInteract = () => {
      load();
      clearTimeout(timeoutId);
      events.forEach(([ev, fn]) => window.removeEventListener(ev, fn));
    };

    const events = [
      ['click', onInteract],
      ['keydown', onInteract],
      ['touchstart', onInteract],
    ];
    events.forEach(([ev, fn]) => window.addEventListener(ev, fn, { once: true, passive: true }));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(([ev, fn]) => window.removeEventListener(ev, fn));
    };
  }, []);

  return null;
}
