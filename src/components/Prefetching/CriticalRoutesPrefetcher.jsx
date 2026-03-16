"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { prefetchCriticalRoutes, predictivePrefetch } from '@/utils/prefetchUtils';

/**
 * ✅ Critical Routes Prefetcher Component
 * Prefetches critical routes on page load and uses predictive prefetching
 * based on current pathname
 */
const CriticalRoutesPrefetcher = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Define critical routes based on current page
    const criticalRoutes = getCriticalRoutesForPath(pathname);

    // Prefetch critical routes after page is interactive
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback for non-blocking prefetching
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          prefetchCriticalRoutes(criticalRoutes);
        }, { timeout: 2000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          prefetchCriticalRoutes(criticalRoutes);
        }, 2000);
      }
    }
  }, [pathname]);

  return null; // This component doesn't render anything
};

/**
 * Get critical routes to prefetch based on current pathname
 */
function getCriticalRoutesForPath(pathname) {
  const routeMap = {
    '/': ['/products', '/category', '/ad-listing'],
    '/products': ['/ad-listing', '/favourites', '/'],
    '/category': ['/products', '/ad-listing'],
    '/product-details': ['/products', '/category'],
    '/ad-listing': ['/products', '/favourites'],
    '/favourites': ['/products', '/ad-listing'],
    '/chat': ['/products', '/favourites'],
    '/profile': ['/ad-listing', '/favourites'],
  };

  // Get routes for current path or default routes
  return routeMap[pathname] || ['/products', '/category'];
}

export default CriticalRoutesPrefetcher;
