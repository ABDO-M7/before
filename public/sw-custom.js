/**
 * ✅ Custom Service Worker Enhancements
 * Additional service worker functionality for advanced caching and offline support
 */

// ✅ Cache version for cache invalidation
const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `arablaza-cache-${CACHE_VERSION}`;

// ✅ Install event - Precache critical resources
self.addEventListener("install", (event) => {
  console.log("[SW] Service Worker installing...", CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache critical resources
      return cache.addAll([
        "/",
        "/manifest.json",
        // Add other critical resources here
      ]).then(() => {
        console.log("[SW] Critical resources precached");
        // Skip waiting to activate immediately
        return self.skipWaiting();
      });
    })
  );
});

// ✅ Activate event - Clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker activating...", CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && cacheName.startsWith("arablaza-cache-")) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// ✅ Background sync for offline requests
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);
  
  if (event.tag === "api-queue") {
    event.waitUntil(syncApiRequests());
  }
});

// ✅ Sync API requests when back online
async function syncApiRequests() {
  // This would sync any queued API requests
  // Implementation depends on your API structure
  console.log("[SW] Syncing API requests...");
}

// ✅ Push notifications (if needed)
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");
  
  const options = {
    body: event.data ? event.data.text() : "New update available",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: "notification",
  };

  event.waitUntil(
    self.registration.showNotification("Arablaza", options)
  );
});

// ✅ Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow("/")
  );
});

// ✅ Message handler for communication with main thread
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);
  
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
