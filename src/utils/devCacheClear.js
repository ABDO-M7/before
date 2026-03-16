/**
 * ✅ Development Cache Clear Utility
 * Automatically clears service workers and caches in development mode
 * This prevents stale cache issues when developing
 */

export function clearDevCaches() {
  if (typeof window === 'undefined') return;
  
  // Only run in development
  if (process.env.NODE_ENV !== 'development') return;

  console.log('[Dev] Clearing service workers and caches for fresh development...');

  // 1. Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('[Dev] Service worker unregistered:', registration.scope);
      }
    });
  }

  // 2. Clear all caches (Cache API)
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
        console.log('[Dev] Cache deleted:', cacheName);
      });
    });
  }

  // 3. Clear localStorage cache keys (optional - keeps user data)
  const cacheKeys = Object.keys(localStorage).filter(key => 
    key.includes('cache') || key.includes('sw-') || key.includes('workbox')
  );
  cacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('[Dev] localStorage cache key removed:', key);
  });

  console.log('[Dev] ✅ Cache clearing complete! You should see fresh content now.');
}

// Auto-run on import in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run once when the module is imported
  clearDevCaches();
}
