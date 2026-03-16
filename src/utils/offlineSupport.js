/**
 * ✅ Progressive Enhancement - Offline Support Utility
 * Enhances offline functionality and low-connection support
 */

/**
 * Check if user is online
 */
export function isOnline() {
  if (typeof window === 'undefined') return true;
//  Identifying the cause: navigator.onLine reflects the OS/browser "network" flag.
//  In restricted networks the OS can mark the device offline (e.g., when connectivity checks to vendor servers fail) while your site still loads.
//  VPN changes how the OS reports that, so the badge disappears.
//  Fix: add a real connectivity check—ping your own origin; if the request succeeds, treat the app as online and  
  // return navigator.onLine;
}

/**
 * Check connection quality
 */
export function getConnectionQuality() {
  if (typeof window === 'undefined' || !navigator.connection) {
    return 'unknown';
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effectiveType = conn?.effectiveType;

  if (effectiveType === '4g') return 'excellent';
  if (effectiveType === '3g') return 'good';
  if (effectiveType === '2g') return 'poor';
  if (effectiveType === 'slow-2g') return 'very-poor';
  
  return 'unknown';
}

/**
 * Check if save data mode is enabled
 */
export function isSaveDataEnabled() {
  if (typeof window === 'undefined' || !navigator.connection) {
    return false;
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return conn?.saveData === true;
}

/**
 * Get connection information
 */
export function getConnectionInfo() {
  if (typeof window === 'undefined' || !navigator.connection) {
    return null;
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    effectiveType: conn?.effectiveType,
    downlink: conn?.downlink,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
    quality: getConnectionQuality(),
  };
}

/**
 * Optimize based on connection quality
 */
export function optimizeForConnection() {
  const quality = getConnectionQuality();
  const saveData = isSaveDataEnabled();

  return {
    // Reduce image quality on slow connections
    imageQuality: quality === 'very-poor' || quality === 'poor' || saveData ? 'low' : 'high',
    // Disable animations on slow connections
    animations: quality !== 'very-poor' && !saveData,
    // Reduce prefetching on slow connections
    prefetch: quality !== 'very-poor' && !saveData,
    // Reduce lazy loading threshold on slow connections
    lazyLoadThreshold: quality === 'very-poor' || saveData ? 0 : 50,
  };
}

/**
 * Show offline indicator
 */
export function showOfflineIndicator() {
  if (typeof window === 'undefined') return;

  // Check if indicator already exists
  if (document.getElementById('offline-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'offline-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff6b6b;
    color: white;
    padding: 12px;
    text-align: center;
    z-index: 10000;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  `;
  indicator.textContent = 'You are currently offline. Some features may be limited.';
  document.body.appendChild(indicator);

  // Remove when back online
  window.addEventListener('online', () => {
    if (indicator.parentNode) {
      indicator.style.background = '#51cf66';
      indicator.textContent = 'Connection restored!';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.remove();
        }
      }, 3000);
    }
  });
}

/**
 * Initialize offline support
 */
export function initOfflineSupport() {
  if (typeof window === 'undefined') return;

  // Only show offline badge after a real connectivity check, so we don't show
  // "offline" in restricted networks where navigator.onLine is false but the app works
  if (!isOnline()) {
    isOnlineWithCheck().then((online) => {
      if (!online) showOfflineIndicator();
    });
  }

  // Listen for online/offline events
  window.addEventListener('offline', () => {
    // Verify with a real check before showing badge (handles false "offline" in restricted networks)
    isOnlineWithCheck().then((online) => {
      if (!online) showOfflineIndicator();
    });
  });

  window.addEventListener('online', () => {
    // Reload page when back online (optional)
    // window.location.reload();
  });

  // Optimize based on connection
  const optimization = optimizeForConnection();
  
  // Store in window for components to access
  window.__connectionOptimization = optimization;

  return optimization;
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOfflineSupport);
  } else {
    initOfflineSupport();
  }
}
