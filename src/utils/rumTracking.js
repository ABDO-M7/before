/**
 * ✅ Real User Monitoring (RUM) Utility
 * Tracks real user experience metrics and user interactions
 */

/**
 * Track user session information
 */
export class RUMTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.pageViews = 0;
    this.interactions = [];
    this.errors = [];
    this.performanceMetrics = {};
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track page view
   */
  trackPageView(pathname) {
    this.pageViews++;
    const pageViewData = {
      sessionId: this.sessionId,
      pathname,
      timestamp: Date.now(),
      timeOnSite: Date.now() - this.startTime,
      pageViewNumber: this.pageViews,
    };

    // Send to analytics (only in production)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        event_category: 'RUM',
        event_label: pathname,
        value: this.pageViews,
        non_interaction: true,
      });
    }

    // Store in sessionStorage for offline tracking
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const rumData = JSON.parse(sessionStorage.getItem('rum_data') || '{}');
        rumData.pageViews = (rumData.pageViews || 0) + 1;
        rumData.lastPageView = pageViewData;
        sessionStorage.setItem('rum_data', JSON.stringify(rumData));
      } catch (e) {
        // Ignore storage errors
      }
    }

    return pageViewData;
  }

  /**
   * Track user interaction
   */
  trackInteraction(type, element, metadata = {}) {
    const interaction = {
      sessionId: this.sessionId,
      type, // 'click', 'scroll', 'input', etc.
      element: element?.tagName || 'unknown',
      timestamp: Date.now(),
      ...metadata,
    };

    this.interactions.push(interaction);

    // Limit interactions array size
    if (this.interactions.length > 100) {
      this.interactions.shift();
    }

    // Send important interactions to analytics (only in production)
    if (process.env.NODE_ENV === 'production' && type === 'click' && window.gtag) {
      window.gtag('event', 'user_interaction', {
        event_category: 'RUM',
        event_label: type,
        value: 1,
      });
    }

    return interaction;
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    const errorData = {
      sessionId: this.sessionId,
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: Date.now(),
      context,
    };

    this.errors.push(errorData);

    // Limit errors array size
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    // Send to analytics (only in production)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }

    return errorData;
  }

  /**
   * Track performance metric
   */
  trackPerformanceMetric(name, value, unit = 'ms') {
    this.performanceMetrics[name] = {
      value,
      unit,
      timestamp: Date.now(),
    };

    // Send to analytics (only in production)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'RUM',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      });
    }
  }

  /**
   * Get session summary
   */
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      pageViews: this.pageViews,
      interactions: this.interactions.length,
      errors: this.errors.length,
      performanceMetrics: Object.keys(this.performanceMetrics).length,
    };
  }

  /**
   * Send session data to server (for detailed analysis)
   */
  async sendSessionData() {
    if (typeof window === 'undefined') return;

    const sessionData = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      pageViews: this.pageViews,
      interactions: this.interactions.slice(-20), // Last 20 interactions
      errors: this.errors,
      performanceMetrics: this.performanceMetrics,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: this.getConnectionInfo(),
    };

    // In production, send to your analytics endpoint
    // For now, just log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('RUM Session Data:', sessionData);
    }

    // Example: Send to analytics endpoint
    // try {
    //   await fetch('/api/rum', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(sessionData),
    //   });
    // } catch (error) {
    //   console.error('Failed to send RUM data:', error);
    // }
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    if (typeof window === 'undefined' || !navigator.connection) {
      return null;
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      effectiveType: conn?.effectiveType,
      downlink: conn?.downlink,
      rtt: conn?.rtt,
      saveData: conn?.saveData,
    };
  }
}

// Export singleton instance
export const rumTracker = new RUMTracker();

// Auto-track page views on route changes
if (typeof window !== 'undefined') {
  // Track initial page view
  rumTracker.trackPageView(window.location.pathname);

  // Track route changes (for Next.js)
  let lastPathname = window.location.pathname;
  const observer = new MutationObserver(() => {
    const currentPathname = window.location.pathname;
    if (currentPathname !== lastPathname) {
      rumTracker.trackPageView(currentPathname);
      lastPathname = currentPathname;
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Send session data before page unload
  window.addEventListener('beforeunload', () => {
    rumTracker.sendSessionData();
  });
}
