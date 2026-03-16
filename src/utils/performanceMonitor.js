/**
 * ✅ Advanced Performance Monitoring Utility
 * Comprehensive performance tracking and monitoring
 */

/**
 * Measures and logs performance metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (typeof window === 'undefined') return;

    // Monitor Long Tasks (blocking operations)
    this.observeLongTasks();
    
    // Monitor Resource Timing
    this.observeResourceTiming();
    
    // Monitor Layout Shifts
    this.observeLayoutShifts();
    
    // Monitor Largest Contentful Paint
    this.observeLCP();
  }

  /**
   * Observe Long Tasks (PerformanceObserver API)
   */
  observeLongTasks() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log long tasks (> 50ms) to console in development
          if (process.env.NODE_ENV === 'development' && entry.duration > 50) {
            console.warn('Long Task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }

          // Send to analytics if available (only in production)
          if (process.env.NODE_ENV === 'production' && window.gtag && entry.duration > 50) {
            window.gtag('event', 'long_task', {
              event_category: 'Performance',
              value: Math.round(entry.duration),
              non_interaction: true,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      // Long Task API not supported
    }
  }

  /**
   * Observe Resource Timing
   */
  observeResourceTiming() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Track slow resources (> 1s)
          if (entry.duration > 1000) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Slow resource detected:', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.initiatorType,
              });
            }

            // Send to analytics (only in production)
            if (process.env.NODE_ENV === 'production' && window.gtag) {
              window.gtag('event', 'slow_resource', {
                event_category: 'Performance',
                event_label: entry.initiatorType,
                value: Math.round(entry.duration),
                non_interaction: true,
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      // Resource Timing API not supported
    }
  }

  /**
   * Observe Layout Shifts
   */
  observeLayoutShifts() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        // Log significant layout shifts
        if (clsValue > 0.1) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('High CLS detected:', clsValue);
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      // Layout Shift API not supported
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  observeLCP() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        // Log LCP details
        if (process.env.NODE_ENV === 'development') {
          console.log('LCP:', {
            value: lastEntry.renderTime || lastEntry.loadTime,
            element: lastEntry.element?.tagName,
            url: lastEntry.url,
          });
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (e) {
      // LCP API not supported
    }
  }

  /**
   * Get Navigation Timing metrics
   */
  getNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance) return null;

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    return {
      // DNS
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP
      tcp: timing.connectEnd - timing.connectStart,
      // Request
      request: timing.responseStart - timing.requestStart,
      // Response
      response: timing.responseEnd - timing.responseStart,
      // DOM Processing
      domProcessing: timing.domComplete - timing.domInteractive,
      // Load
      load: timing.loadEventEnd - timing.navigationStart,
      // Navigation Type
      type: navigation.type,
    };
  }

  /**
   * Get Resource Timing metrics
   */
  getResourceTiming() {
    if (typeof window === 'undefined' || !window.performance) return [];

    const resources = window.performance.getEntriesByType('resource');
    return resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType,
    }));
  }

  /**
   * Cleanup observers
   */
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
