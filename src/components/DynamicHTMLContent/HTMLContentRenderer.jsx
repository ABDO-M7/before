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
  // Used to keep iframe-heavy HTML (e.g. tailwind CDN) out of the critical path on the home page.
  // When > 0, the iframe is mounted after this delay (ms).
  deferIframeLoadMs = 0,
  // While the iframe is deferred / loading, reserve space to reduce CLS.
  placeholderMinHeightPx = 200,
  onLoadComplete
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
    const trimmedContent = content.trim();
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

          // Initial call
          if (document.readyState === 'complete') {
            sendHeight();
          } else {
            window.addEventListener('DOMContentLoaded', () => sendHeight(), { once: true });
          }
        })();
      </script>
    `;

    if (isFullHtml) {
      if (trimmedContent.toLowerCase().includes('</body>')) {
        return trimmedContent.replace(/<\/body>/i, `${resizeScript}</body>`);
      } else if (trimmedContent.toLowerCase().includes('</html>')) {
        return trimmedContent.replace(/<\/html>/i, `${resizeScript}</html>`);
      } else {
        return trimmedContent + resizeScript;
      }
    }

    // Default wrapper for partial HTML
    return `
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              overflow: hidden; 
              font-family: system-ui, -apple-system, sans-serif;
            }
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
          loading="lazy"
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
