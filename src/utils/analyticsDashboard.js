/**
 * ✅ Advanced Analytics Dashboard Utility
 * Comprehensive performance insights and analytics aggregation
 */

/**
 * Performance metrics aggregator
 */
export class AnalyticsDashboard {
  constructor() {
    this.metrics = {
      webVitals: {},
      apiCalls: [],
      errors: [],
      userInteractions: [],
      pageViews: [],
    };
    this.startTime = Date.now();
  }

  /**
   * Aggregate Web Vitals metrics
   */
  aggregateWebVitals(metric) {
    const { name, value } = metric;
    
    if (!this.metrics.webVitals[name]) {
      this.metrics.webVitals[name] = {
        values: [],
        average: 0,
        min: Infinity,
        max: 0,
        count: 0,
      };
    }

    const metricData = this.metrics.webVitals[name];
    metricData.values.push(value);
    metricData.count++;
    metricData.min = Math.min(metricData.min, value);
    metricData.max = Math.max(metricData.max, value);
    metricData.average = metricData.values.reduce((a, b) => a + b, 0) / metricData.values.length;

    // Keep only last 100 values
    if (metricData.values.length > 100) {
      metricData.values.shift();
    }

    return metricData;
  }

  /**
   * Track API call
   */
  trackAPICall(url, duration, status, error = null) {
    const apiCall = {
      url,
      duration,
      status,
      error,
      timestamp: Date.now(),
    };

    this.metrics.apiCalls.push(apiCall);

    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }

    return apiCall;
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    const errorData = {
      ...error,
      context,
      timestamp: Date.now(),
    };

    this.metrics.errors.push(errorData);

    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }

    return errorData;
  }

  /**
   * Track user interaction
   */
  trackInteraction(type, element, metadata = {}) {
    const interaction = {
      type,
      element,
      metadata,
      timestamp: Date.now(),
    };

    this.metrics.userInteractions.push(interaction);

    // Keep only last 200 interactions
    if (this.metrics.userInteractions.length > 200) {
      this.metrics.userInteractions.shift();
    }

    return interaction;
  }

  /**
   * Track page view
   */
  trackPageView(pathname, metadata = {}) {
    const pageView = {
      pathname,
      metadata,
      timestamp: Date.now(),
    };

    this.metrics.pageViews.push(pageView);

    // Keep only last 50 page views
    if (this.metrics.pageViews.length > 50) {
      this.metrics.pageViews.shift();
    }

    return pageView;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const sessionDuration = Date.now() - this.startTime;
    
    // Calculate API performance
    const apiCalls = this.metrics.apiCalls;
    const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
    const failedCalls = apiCalls.filter(call => call.status >= 400 || call.error);
    const avgAPIDuration = apiCalls.length > 0
      ? apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length
      : 0;

    // Calculate error rate
    const errorRate = this.metrics.errors.length / Math.max(this.metrics.pageViews.length, 1);

    // Get Web Vitals summary
    const webVitalsSummary = {};
    Object.entries(this.metrics.webVitals).forEach(([name, data]) => {
      webVitalsSummary[name] = {
        average: Math.round(data.average),
        min: Math.round(data.min),
        max: Math.round(data.max),
        count: data.count,
      };
    });

    return {
      sessionDuration: Math.round(sessionDuration / 1000), // seconds
      pageViews: this.metrics.pageViews.length,
      apiCalls: {
        total: apiCalls.length,
        successful: successfulCalls.length,
        failed: failedCalls.length,
        successRate: apiCalls.length > 0 ? (successfulCalls.length / apiCalls.length) * 100 : 100,
        averageDuration: Math.round(avgAPIDuration),
      },
      errors: {
        total: this.metrics.errors.length,
        errorRate: Math.round(errorRate * 100) / 100,
      },
      userInteractions: this.metrics.userInteractions.length,
      webVitals: webVitalsSummary,
    };
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights() {
    const summary = this.getPerformanceSummary();
    const insights = [];

    // Web Vitals insights
    if (summary.webVitals.LCP?.average > 2500) {
      insights.push({
        type: 'warning',
        category: 'Performance',
        message: `LCP is ${summary.webVitals.LCP.average}ms (target: <2500ms). Consider optimizing images and reducing render-blocking resources.`,
      });
    }

    if (summary.webVitals.CLS?.average > 0.1) {
      insights.push({
        type: 'warning',
        category: 'Performance',
        message: `CLS is ${summary.webVitals.CLS.average} (target: <0.1). Consider adding dimensions to images and avoiding layout shifts.`,
      });
    }

    if (summary.webVitals.INP?.average > 200) {
      insights.push({
        type: 'warning',
        category: 'Performance',
        message: `INP is ${summary.webVitals.INP.average}ms (target: <200ms). Consider optimizing JavaScript execution and reducing main thread work.`,
      });
    }

    // API insights
    if (summary.apiCalls.averageDuration > 1000) {
      insights.push({
        type: 'info',
        category: 'API',
        message: `Average API call duration is ${summary.apiCalls.averageDuration}ms. Consider optimizing slow endpoints.`,
      });
    }

    if (summary.apiCalls.successRate < 95) {
      insights.push({
        type: 'error',
        category: 'API',
        message: `API success rate is ${summary.apiCalls.successRate.toFixed(1)}%. Investigate failed API calls.`,
      });
    }

    // Error insights
    if (summary.errors.errorRate > 0.05) {
      insights.push({
        type: 'error',
        category: 'Errors',
        message: `Error rate is ${(summary.errors.errorRate * 100).toFixed(1)}%. Review error logs.`,
      });
    }

    return insights;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      summary: this.getPerformanceSummary(),
      insights: this.getPerformanceInsights(),
      detailed: {
        webVitals: this.metrics.webVitals,
        apiCalls: this.metrics.apiCalls.slice(-20), // Last 20
        errors: this.metrics.errors.slice(-10), // Last 10
        userInteractions: this.metrics.userInteractions.slice(-50), // Last 50
        pageViews: this.metrics.pageViews,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Send metrics to server (for dashboard)
   */
  async sendMetricsToServer() {
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Dashboard Metrics:', this.exportMetrics());
    }

    // In production, send to your analytics endpoint
    // try {
    //   await fetch('/api/analytics', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(this.exportMetrics()),
    //   });
    // } catch (error) {
    //   console.error('Failed to send analytics:', error);
    // }
  }
}

// Export singleton instance
export const analyticsDashboard = new AnalyticsDashboard();

// Auto-send metrics periodically (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    analyticsDashboard.sendMetricsToServer();
  }, 5 * 60 * 1000); // 5 minutes

  // Send on page unload
  window.addEventListener('beforeunload', () => {
    analyticsDashboard.sendMetricsToServer();
  });
}
