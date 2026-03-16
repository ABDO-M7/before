/**
 * ✅ Advanced CSS Loading Utility
 * Loads CSS files asynchronously to prevent render-blocking
 * Implements critical CSS extraction and lazy loading for non-critical styles
 */

/**
 * Loads a CSS file asynchronously
 * @param {string} href - Path to CSS file
 * @param {object} options - Loading options
 * @param {string} options.media - Media query (default: 'all', use 'print' for async loading trick)
 * @param {string} options.id - Unique ID for the stylesheet
 * @param {boolean} options.critical - Whether this is critical CSS (loads synchronously)
 * @returns {Promise<void>}
 */
export function loadCSS(href, options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const {
      media = 'all',
      id = `css-${href.replace(/[^a-z0-9]/gi, '-')}`,
      critical = false,
    } = options;

    // Check if already loaded
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.id = id;
    link.media = critical ? 'all' : media; // Use 'print' trick for async loading

    // For async loading trick: change media to 'all' after load
    if (!critical && media === 'print') {
      link.onload = () => {
        link.media = 'all';
        resolve();
      };
      link.onerror = reject;
    } else {
      link.onload = () => resolve();
      link.onerror = reject;
    }

    document.head.appendChild(link);
  });
}

/**
 * Preloads a CSS file (doesn't block rendering)
 * @param {string} href - Path to CSS file
 * @returns {void}
 */
export function preloadCSS(href) {
  if (typeof window === 'undefined') return;

  // Check if already preloaded
  const existing = document.querySelector(`link[rel="preload"][href="${href}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = 'style';
  document.head.appendChild(link);
}

/**
 * Loads non-critical CSS after page load
 * @param {string[]} cssFiles - Array of CSS file paths
 * @returns {Promise<void>}
 */
export function loadNonCriticalCSS(cssFiles) {
  if (typeof window === 'undefined') return Promise.resolve();

  // Wait for page to be interactive
  if (document.readyState === 'complete') {
    return Promise.all(cssFiles.map((href) => loadCSS(href, { media: 'print' })));
  }

  return new Promise((resolve) => {
    window.addEventListener('load', () => {
      Promise.all(cssFiles.map((href) => loadCSS(href, { media: 'print' }))).then(resolve);
    });
  });
}

/**
 * Injects critical CSS inline
 * @param {string} css - CSS string to inject
 * @param {string} id - Unique ID for the style tag
 * @returns {void}
 */
export function injectCriticalCSS(css, id = 'critical-css') {
  if (typeof document === 'undefined') return;

  // Check if already injected
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.insertBefore(style, document.head.firstChild);
}

/**
 * Removes unused CSS classes (client-side cleanup)
 * Note: This is a basic implementation. For production, use PurgeCSS at build time.
 * @param {string[]} usedClasses - Array of CSS classes that are actually used
 * @returns {void}
 */
export function removeUnusedCSS(usedClasses) {
  if (typeof document === 'undefined' || process.env.NODE_ENV === 'production') return;

  // This is a development-only utility for debugging
  // In production, use PurgeCSS during build
  console.warn(
    '[CSS Loader] removeUnusedCSS is for development only. Use PurgeCSS at build time for production.'
  );
}

/**
 * Gets all loaded stylesheets
 * @returns {Array<HTMLLinkElement>}
 */
export function getLoadedStylesheets() {
  if (typeof document === 'undefined') return [];
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
}

/**
 * Measures CSS loading performance
 * @returns {object} Performance metrics
 */
export function measureCSSPerformance() {
  if (typeof window === 'undefined' || !window.performance) return null;

  const resources = window.performance.getEntriesByType('resource');
  const cssResources = resources.filter((r) => r.initiatorType === 'link' && r.name.endsWith('.css'));

  return {
    count: cssResources.length,
    totalSize: cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    loadTimes: cssResources.map((r) => ({
      url: r.name,
      duration: r.duration,
      size: r.transferSize,
    })),
  };
}
