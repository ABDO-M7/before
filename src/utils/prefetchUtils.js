/**
 * ✅ Advanced Prefetching Utility for Next.js 16 App Router
 * Intelligent prefetching based on user behavior and viewport
 */

import { useRouter } from 'next/navigation';

/**
 * Prefetch a route when element enters viewport
 * @param {string} href - Route to prefetch
 * @param {HTMLElement} element - Element to observe
 */
export function prefetchOnIntersect(href, element) {
  if (typeof window === 'undefined' || !element) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Prefetch when element is visible using Next.js Link prefetch
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = href;
          document.head.appendChild(link);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '50px', // Start prefetching 50px before element is visible
    }
  );

  observer.observe(element);
  return () => observer.disconnect();
}

/**
 * Prefetch on hover with delay (React Hook)
 * @param {string} href - Route to prefetch
 * @param {number} delay - Delay in milliseconds (default: 100ms)
 * @returns {object} Object with prefetch and cancel functions
 */
export function usePrefetchOnHover(href, delay = 100) {
  if (typeof window === 'undefined') {
    return { onMouseEnter: () => {}, onMouseLeave: () => {} };
  }

  let timeoutId;

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => {
      // Use Next.js Link prefetch via link element
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

/**
 * Prefetch on hover with delay (Non-hook version for class components)
 * @param {string} href - Route to prefetch
 * @param {number} delay - Delay in milliseconds (default: 100ms)
 * @returns {object} Object with prefetch and cancel functions
 */
export function prefetchOnHover(href, delay = 100) {
  if (typeof window === 'undefined') return { prefetch: () => {}, cancel: () => {} };

  let timeoutId;
  const prefetch = () => {
    timeoutId = setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return { prefetch, cancel };
}

/**
 * Prefetch critical routes on page load
 * @param {string[]} routes - Array of routes to prefetch
 */
export function prefetchCriticalRoutes(routes = []) {
  if (typeof window === 'undefined') return;

  const prefetchRoute = (route) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  };

  // Wait for page to be interactive before prefetching
  if (document.readyState === 'complete') {
    routes.forEach(prefetchRoute);
  } else {
    window.addEventListener('load', () => {
      routes.forEach(prefetchRoute);
    });
  }
}

/**
 * Prefetch based on user's likely next action
 * @param {string} currentPath - Current pathname
 * @returns {string[]} Array of likely next routes
 */
export function getLikelyNextRoutes(currentPath) {
  const routeMap = {
    '/': ['/products', '/category'],
    '/products': ['/ad-listing', '/favourites'],
    '/category': ['/products', '/ad-listing'],
    '/product-details': ['/products', '/category'],
  };

  return routeMap[currentPath] || [];
}

/**
 * ✅ Predictive prefetching based on user behavior patterns
 * @param {string} currentPath - Current pathname
 * @param {object} userHistory - User navigation history
 */
export function predictivePrefetch(currentPath, userHistory = {}) {
  if (typeof window === 'undefined') return;

  // Get likely routes
  const likelyRoutes = getLikelyNextRoutes(currentPath);

  // Add routes from user history (most visited)
  if (userHistory.mostVisited) {
    likelyRoutes.push(...userHistory.mostVisited.slice(0, 2));
  }

  // Prefetch likely routes after a delay (when idle)
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      likelyRoutes.forEach((route) => {
        import('next/router').then(({ default: router }) => {
          router.prefetch(route);
        });
      });
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      likelyRoutes.forEach((route) => {
        import('next/router').then(({ default: router }) => {
          router.prefetch(route);
        });
      });
    }, 2000);
  }
}

/**
 * Track user navigation patterns for predictive prefetching
 */
export class NavigationTracker {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
  }

  trackNavigation(from, to) {
    this.history.push({ from, to, timestamp: Date.now() });
    
    // Keep only last N navigations
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Store in sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.setItem('nav_history', JSON.stringify(this.history.slice(-20)));
      } catch (e) {
        // Ignore storage errors
      }
    }
  }

  getMostVisitedRoutes(limit = 5) {
    const routeCounts = {};
    
    this.history.forEach(({ to }) => {
      routeCounts[to] = (routeCounts[to] || 0) + 1;
    });

    return Object.entries(routeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([route]) => route);
  }

  getNextRouteProbability(currentPath) {
    const nextRoutes = this.history
      .filter(({ from }) => from === currentPath)
      .map(({ to }) => to);

    const routeCounts = {};
    nextRoutes.forEach((route) => {
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    const total = nextRoutes.length;
    if (total === 0) return {};

    const probabilities = {};
    Object.entries(routeCounts).forEach(([route, count]) => {
      probabilities[route] = count / total;
    });

    return probabilities;
  }
}

// Export singleton instance
export const navigationTracker = new NavigationTracker();
