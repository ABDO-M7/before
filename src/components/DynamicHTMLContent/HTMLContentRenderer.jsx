'use client';

import { useEffect, useState } from 'react';

/**
 * HTMLContentRenderer Component
 * 
 * Renders HTML content dynamically using an iframe with srcdoc for perfect isolation.
 * Automatically resizes to fit content using ResizeObserver inside the iframe.
 * 
 * @param {string} htmlContent - The HTML content to render
 * @param {string} contentId - Unique identifier for this content
 */
export default function HTMLContentRenderer({
  htmlContent,
  contentId = 'html-content',
  baseHref,
  assetOrigin,
  // Used to keep iframe-heavy HTML (e.g. tailwind CDN) out of the critical path on the home page.
  // When > 0, the iframe is mounted after this delay (ms).
  deferIframeLoadMs = 0,
  // While the iframe is deferred / loading, reserve space to reduce CLS.
  placeholderMinHeightPx = 200,
  iframeLoading = 'lazy',
  iframeFetchPriority = 'auto',
  injectGoogleFonts = true,
  injectTailwindCdn = false,
  injectDefaultTableStyles = false,
  extraCss = '',
  deferUntilInView = false,
  inViewRootMarginPx = 300,
  onLoadComplete
}) {
  const [iframeHeight, setIframeHeight] = useState(`${placeholderMinHeightPx}px`);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);
  const [shouldRenderIframe, setShouldRenderIframe] = useState(deferIframeLoadMs <= 0 && !deferUntilInView);
  const [containerEl, setContainerEl] = useState(null);

  // Reset loading state and force re-mount when content changes
  useEffect(() => {
    setIsLoading(true);
    setIframeHeight(`${placeholderMinHeightPx}px`);
    setKey(prev => prev + 1);
    if (deferUntilInView || deferIframeLoadMs > 0) setShouldRenderIframe(false);
  }, [htmlContent, placeholderMinHeightPx, deferIframeLoadMs, deferUntilInView]);

  // Defer mounting the iframe to avoid critical-path blocking.
  useEffect(() => {
    // If we defer until in-view, IntersectionObserver will control mounting.
    if (deferUntilInView) {
      setShouldRenderIframe(false);
      return;
    }

    if (deferIframeLoadMs <= 0) {
      setShouldRenderIframe(true);
      return;
    }
    setShouldRenderIframe(false);
    const t = setTimeout(() => setShouldRenderIframe(true), deferIframeLoadMs);
    return () => clearTimeout(t);
  }, [deferIframeLoadMs, htmlContent, deferUntilInView]);

  // Defer mounting until the container is near the viewport (reduces TBT for heavy HTML).
  useEffect(() => {
    if (!deferUntilInView) return;
    if (!containerEl) return;
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: mount after a small delay.
      const t = setTimeout(() => setShouldRenderIframe(true), Math.max(0, deferIframeLoadMs));
      return () => clearTimeout(t);
    }

    let timeoutId = null;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries?.[0]?.isIntersecting) return;
        obs.disconnect();
        const delay = Math.max(0, deferIframeLoadMs);
        if (delay <= 0) setShouldRenderIframe(true);
        else timeoutId = setTimeout(() => setShouldRenderIframe(true), delay);
      },
      { root: null, rootMargin: `${Number(inViewRootMarginPx) || 0}px`, threshold: 0.01 }
    );

    obs.observe(containerEl);
    return () => {
      obs.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [deferUntilInView, containerEl, deferIframeLoadMs, inViewRootMarginPx]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'setHeight' && event.data.id === contentId) {
        const newHeight = event.data.height;
        if (newHeight > 0) {
          setIframeHeight(`${newHeight}px`);
          setIsLoading(false);
          if (onLoadComplete) onLoadComplete();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [contentId]);

  if (!htmlContent) {
    return null;
  }

  // Prepared HTML content
  const prepareHtml = (content) => {
    let trimmedContent = content.trim();
    const isFullHtml = trimmedContent.toLowerCase().includes('<html') || trimmedContent.toLowerCase().startsWith('<!doctype');

    const resolvedAssetOrigin = (() => {
      if (typeof assetOrigin === 'string' && assetOrigin.trim()) return assetOrigin.trim().replace(/\/$/, '');
      return null;
    })();

    // Fix common CMS asset paths that are root-relative (e.g. /storage/...) but hosted on a different origin.
    if (resolvedAssetOrigin) {
      const prefixUrl = (p) => `${resolvedAssetOrigin}${p.startsWith('/') ? '' : '/'}${p}`;
      const replaceQuoted = (attr, pathPrefix) => {
        const re = new RegExp(`(${attr}\\s*=\\s*["'])(${pathPrefix.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}[^"']*)(["'])`, 'gi');
        trimmedContent = trimmedContent.replace(re, (_m, p1, p2, p3) => {
          if (/^https?:\/\//i.test(p2) || /^data:/i.test(p2)) return `${p1}${p2}${p3}`;
          return `${p1}${prefixUrl(p2)}${p3}`;
        });
      };

      const replaceUnquoted = (attr, pathPrefix) => {
        const re = new RegExp(`(${attr}\\s*=\\s*)(${pathPrefix.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&')}[^\\s>]+)`, 'gi');
        trimmedContent = trimmedContent.replace(re, (_m, p1, p2) => {
          if (/^https?:\/\//i.test(p2) || /^data:/i.test(p2)) return `${p1}${p2}`;
          return `${p1}${prefixUrl(p2)}`;
        });
      };

      const replaceCssUrl = (pathPrefix) => {
        const escaped = pathPrefix.replace(/[-/\\^$*+?.()|[\\]{}]/g, '\\$&');
        // url(/storage/x.png)
        const re1 = new RegExp(`url\\(\\s*(${escaped}[^)"']*)\\s*\\)`, 'gi');
        trimmedContent = trimmedContent.replace(re1, (_m, p1) => {
          if (/^https?:\/\//i.test(p1) || /^data:/i.test(p1)) return `url(${p1})`;
          return `url(${prefixUrl(p1)})`;
        });
        // url('/storage/x.png') or url("/storage/x.png")
        const re2 = new RegExp(`url\\(\\s*(["'])(${escaped}[^"']*)\\1\\s*\\)`, 'gi');
        trimmedContent = trimmedContent.replace(re2, (_m, q, p2) => {
          if (/^https?:\/\//i.test(p2) || /^data:/i.test(p2)) return `url(${q}${p2}${q})`;
          return `url(${q}${prefixUrl(p2)}${q})`;
        });
      };

      // Root-relative paths
      replaceQuoted('src', '/storage/');
      replaceQuoted('href', '/storage/');
      replaceQuoted('src', '/uploads/');
      replaceQuoted('href', '/uploads/');
      replaceQuoted('src', '/assets/');
      replaceQuoted('href', '/assets/');

      replaceUnquoted('src', '/storage/');
      replaceUnquoted('href', '/storage/');
      replaceUnquoted('src', '/uploads/');
      replaceUnquoted('href', '/uploads/');
      replaceUnquoted('src', '/assets/');
      replaceUnquoted('href', '/assets/');

      replaceCssUrl('/storage/');
      replaceCssUrl('/uploads/');
      replaceCssUrl('/assets/');

      // Also handle non-leading-slash variants (storage/...)
      replaceQuoted('src', 'storage/');
      replaceQuoted('href', 'storage/');
      replaceQuoted('src', 'uploads/');
      replaceQuoted('href', 'uploads/');
      replaceQuoted('src', 'assets/');
      replaceQuoted('href', 'assets/');

      replaceUnquoted('src', 'storage/');
      replaceUnquoted('href', 'storage/');
      replaceUnquoted('src', 'uploads/');
      replaceUnquoted('href', 'uploads/');
      replaceUnquoted('src', 'assets/');
      replaceUnquoted('href', 'assets/');

      replaceCssUrl('storage/');
      replaceCssUrl('uploads/');
      replaceCssUrl('assets/');
    }

    const resolvedBaseHref = (() => {
      if (typeof baseHref === 'string' && baseHref.trim()) return baseHref.trim().replace(/\/$/, '') + '/';
      if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin.replace(/\/$/, '') + '/';
      return null;
    })();

    const baseInjection = resolvedBaseHref
      ? `<base href="${resolvedBaseHref}">`
      : '';

    const tailwindInjection = injectTailwindCdn
      ? `<script src="https://cdn.tailwindcss.com"></script>`
      : '';

    const resolvedExtraCss = typeof extraCss === 'string' ? extraCss : '';
    const tableCss = injectDefaultTableStyles
      ? `
        /* Default table styling for iframe-rendered blog content */
        table{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,.12)}
        thead tr{background:#0b1220;color:#fff}
        thead th{padding:14px 16px;font-weight:700;font-size:14px;white-space:nowrap}
        tbody td{padding:14px 16px;border-top:1px solid rgba(15,23,42,.08);font-size:14px;vertical-align:middle}
        tbody tr:nth-child(even){background:#f8fafc}
        td,th{text-align:right}
        @media(max-width:768px){thead th,tbody td{padding:12px 10px;font-size:13px}}
      `
      : '';

    const extraCssInjection = (tableCss || resolvedExtraCss)
      ? `<style>${tableCss}\n${resolvedExtraCss}</style>`
      : '';

    const resizeScript = `
      <script>
        (function() {
          let lastHeight = 0;
          const sendHeight = () => {
            const body = document.body;
            const html = document.documentElement;
            if (!body || !html) return;
            const height = Math.max(
              body.scrollHeight,
              body.offsetHeight,
              html.clientHeight,
              html.scrollHeight,
              html.offsetHeight
            );
            if (height !== lastHeight && height > 0) {
              lastHeight = height;
              window.parent.postMessage({ type: 'setHeight', id: '${contentId}', height: height }, '*');
            }
          };
          const sendHeightDeferred = () => requestAnimationFrame(sendHeight);

          const resizeObserver = new ResizeObserver(sendHeightDeferred);
          window.addEventListener('load', async () => {
            if (document.body) resizeObserver.observe(document.body);
            // Wait for web fonts to avoid multiple height jumps (CLS).
            try {
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }
            } catch (e) {}
            sendHeightDeferred();
            document.querySelectorAll('img').forEach(img => {
              if (img.complete) sendHeightDeferred();
              else img.addEventListener('load', sendHeightDeferred);
            });
          });

          // Handle all clicks to ensure proper navigation
          document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
              const href = link.getAttribute('href');
              if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                const targetEl = document.getElementById(targetId) || document.getElementsByName(targetId)[0];
                if (targetEl) {
                  e.preventDefault();
                  targetEl.scrollIntoView({ behavior: 'smooth' });
                  return;
                }
              }
              if (link.href && !link.href.startsWith('javascript:')) {
                e.preventDefault();
                if (link.target === '_blank') {
                  window.open(link.href, '_blank');
                } else {
                  window.parent.location.href = link.href;
                }
              }
            }
          }, true);

          // Initial call
          if (document.readyState === 'complete') {
            sendHeight();
          } else {
            window.addEventListener('DOMContentLoaded', () => sendHeight(), { once: true });
          }
        })();
      </script>
    `;

    const fontInjection = injectGoogleFonts
      ? `
      <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
      ${baseInjection}
      ${tailwindInjection}
      ${extraCssInjection}
      <style>
        body { font-family: 'Cairo', system-ui, -apple-system, sans-serif !important; }
        * { font-family: 'Cairo', system-ui, -apple-system, sans-serif !important; }
      </style>
    `
      : `${baseInjection}${tailwindInjection}${extraCssInjection}`;

    if (isFullHtml) {
      let result = trimmedContent;
      if (result.toLowerCase().includes('</head>')) {
        result = result.replace(/<\/head>/i, `${fontInjection}</head>`);
      } else {
        result = fontInjection + result;
      }

      if (result.toLowerCase().includes('</body>')) {
        return result.replace(/<\/body>/i, `${resizeScript}</body>`);
      } else if (result.toLowerCase().includes('</html>')) {
        return result.replace(/<\/html>/i, `${resizeScript}</html>`);
      } else {
        return result + resizeScript;
      }
    }

    // Default wrapper for partial HTML
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${injectGoogleFonts ? `
          <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">` : ''}
          ${baseInjection}
          ${tailwindInjection}
          ${extraCssInjection}
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              overflow: hidden; 
              font-family: 'Cairo', system-ui, -apple-system, sans-serif;
            }
            img { max-width: 100%; height: auto; }
            * { font-family: 'Cairo', system-ui, -apple-system, sans-serif; }
          </style>
        </head>
        <body>
          <div id="content-wrapper">${trimmedContent}</div>
          ${resizeScript}
        </body>
      </html>
    `;
  };

  const preparedHtml = prepareHtml(htmlContent);

  return (
    <div
      className={`html-content-wrapper html-content-wrapper-${contentId}`}
      ref={setContainerEl}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: isLoading ? `${placeholderMinHeightPx}px` : 'auto'
      }}
    >
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.8)',
          zIndex: 10
        }}>
          <div className="loader"></div>
        </div>
      )}
      {shouldRenderIframe ? (
        <iframe
          key={`${contentId}-${key}`}
          srcDoc={preparedHtml}
          loading={iframeLoading}
          fetchPriority={iframeFetchPriority}
          style={{
            width: '100%',
            height: isLoading ? `${placeholderMinHeightPx}px` : iframeHeight,
            border: 'none',
            overflow: 'hidden',
            display: 'block',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease, height 0.2s ease'
          }}
          title={`content-${contentId}`}
          scrolling="no"
        />
      ) : null}
    </div>
  );
}
