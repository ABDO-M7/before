'use client';

import { useEffect, useState } from 'react';
// import { useRef } from 'react'; // unused

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
  // Used to keep iframe-heavy HTML (e.g. tailwind CDN) out of the critical path on the home page.
  // When > 0, the iframe is mounted after this delay (ms).
  deferIframeLoadMs = 0,
  // While the iframe is deferred / loading, reserve space to reduce CLS.
  placeholderMinHeightPx = 200
}) {
  const [iframeHeight, setIframeHeight] = useState('0px');
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);
  const [shouldRenderIframe, setShouldRenderIframe] = useState(deferIframeLoadMs <= 0);

  // Reset loading state and force re-mount when content changes
  useEffect(() => {
    setIsLoading(true);
    setIframeHeight('0px');
    setKey(prev => prev + 1);
    if (deferIframeLoadMs > 0) setShouldRenderIframe(false);
  }, [htmlContent]);

  // Defer mounting the iframe to avoid critical-path blocking.
  useEffect(() => {
    if (deferIframeLoadMs <= 0) {
      setShouldRenderIframe(true);
      return;
    }
    setShouldRenderIframe(false);
    const t = setTimeout(() => setShouldRenderIframe(true), deferIframeLoadMs);
    return () => clearTimeout(t);
  }, [deferIframeLoadMs, htmlContent]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'setHeight' && event.data.id === contentId) {
        const newHeight = event.data.height;
        if (newHeight > 0) {
          setIframeHeight(`${newHeight}px`);
          setIsLoading(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [contentId]);

  if (!htmlContent) {
    return null;
  }

  // Cairo font files are already cached by the browser from the parent page (next/font/google).
  // Use @font-face with the same Google Fonts URL but load it non-blocking via font-display:swap.
  // On repeat visits, the browser serves from disk cache (no network request).
  const cairoFontLink = `<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">`;
  const cairoFontStyle = `* { font-family: 'Cairo', system-ui, -apple-system, sans-serif !important; }`;

  // ✅ Strip heavy external resources (Tailwind CDN, OTHER Google Fonts, Font Awesome CDN)
  // These add ~300 KiB+ of render-blocking resources to EVERY page that embeds this iframe
  // Note: We strip all Google Fonts first, then inject only Cairo after
  const stripHeavyResources = (html) => {
    return html
      // Keep Tailwind CDN when needed for embedded tool UIs.
      // (We handle critical-path impact by deferring the iframe mount on the homepage.)
      // Remove ALL Google Fonts <link> (we inject only Cairo after stripping)
      // Remove ALL Google Fonts <link> (we inject only Cairo after stripping)
      .replace(/<link[^>]*href=["'][^"']*fonts\.googleapis\.com[^"']*["'][^>]*\/?>/gi, '')
      // Remove Font Awesome CDN (all.min.css ~19 KiB + woff2 ~148 KiB)
      .replace(/<link[^>]*href=["'][^"']*cdnjs\.cloudflare\.com[^"']*font-?awesome[^"']*["'][^>]*\/?>/gi, '')
      .replace(/<link[^>]*href=["'][^"']*cdnjs\.cloudflare\.com[^"']*all\.min\.css[^"']*["'][^>]*\/?>/gi, '');
  };

  // Sanitize/Prepare the HTML content
  const prepareHtml = (content) => {
    const trimmedContent = stripHeavyResources(content.trim());
    const isFullHtml = trimmedContent.toLowerCase().includes('<html') || trimmedContent.toLowerCase().startsWith('<!doctype');

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

          // Initial call (no polling interval to reduce forced reflow + CLS).
          if (document.readyState === 'complete') {
            try {
              if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => sendHeight());
              } else {
                sendHeight();
              }
            } catch (e) {
              sendHeight();
            }
          } else {
            window.addEventListener('DOMContentLoaded', () => sendHeight(), { once: true });
          }
        })();
      </script>
    `;

    // ✅ Inject Cairo font into full HTML content
    if (isFullHtml) {
      let result = trimmedContent;
      // Inject Cairo font link + override style into <head>
      if (result.toLowerCase().includes('</head>')) {
        result = result.replace(/<\/head>/i, `${cairoFontLink}<style>${cairoFontStyle}</style></head>`);
      } else if (result.toLowerCase().includes('<body')) {
        result = result.replace(/<body/i, `${cairoFontLink}<style>${cairoFontStyle}</style><body`);
      }
      // Inject resize script before </body>
      if (result.toLowerCase().includes('</body>')) {
        return result.replace(/<\/body>/i, `${resizeScript}</body>`);
      } else if (result.toLowerCase().includes('</html>')) {
        return result.replace(/<\/html>/i, `${resizeScript}</html>`);
      } else {
        return result + resizeScript;
      }
    }

    // If it's partial, wrap it with Cairo font
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${cairoFontLink}
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              overflow: hidden; 
              font-family: 'Cairo', system-ui, -apple-system, sans-serif;
            }
            ${cairoFontStyle}
            img { max-width: 100%; height: auto; }
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
          style={{
            width: '100%',
            height: iframeHeight,
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
