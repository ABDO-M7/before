/**
 * ✅ Performance Alerting Utility
 * Monitors performance metrics and alerts when thresholds are exceeded
 */

/**
 * Performance thresholds
 */
const THRESHOLDS = {
  LCP: 2500, // 2.5 seconds
  FID: 100, // 100ms
  INP: 200, // 200ms
  CLS: 0.1, // 0.1
  FCP: 1800, // 1.8 seconds
  TTFB: 800, // 800ms
};

/**
 * Check if performance metric exceeds threshold
 * @param {string} metric - Metric name (LCP, FID, etc.)
 * @param {number} value - Metric value
 * @returns {boolean} True if threshold exceeded
 */
export function isThresholdExceeded(metric, value) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return false;

  // CLS is lower is better, others are higher is better
  if (metric === 'CLS') {
    return value > threshold;
  }
  return value > threshold;
}

/**
 * Log performance alert
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {number} threshold - Threshold value
 */
export function logPerformanceAlert(metric, value, threshold) {
  const message = `⚠️ Performance Alert: ${metric} is ${value}ms (threshold: ${threshold}ms)`;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(message);
  }

  // Send to analytics/monitoring service (only in production)
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'performance_alert', {
      event_category: 'Performance',
      event_label: metric,
      value: Math.round(value),
      non_interaction: true,
    });
  }

  // In production, you could send to error tracking service:
  // Sentry.captureMessage(message, 'warning');
}

/**
 * Monitor performance and alert on threshold breaches
 * @param {object} metrics - Performance metrics object
 */
export function monitorPerformance(metrics) {
  Object.entries(metrics).forEach(([metric, value]) => {
    if (isThresholdExceeded(metric, value)) {
      logPerformanceAlert(metric, value, THRESHOLDS[metric]);
    }
  });
}

/**
 * Get performance score based on metrics
 * @param {object} metrics - Performance metrics
 * @returns {number} Performance score (0-100)
 */
export function getPerformanceScore(metrics) {
  let score = 100;
  const weights = {
    LCP: 0.25,
    FID: 0.25,
    INP: 0.25,
    CLS: 0.25,
  };

  Object.entries(metrics).forEach(([metric, value]) => {
    const threshold = THRESHOLDS[metric];
    if (!threshold) return;

    let metricScore = 100;
    if (metric === 'CLS') {
      // CLS: 0.1 = 100, 0.25 = 0
      metricScore = Math.max(0, 100 - (value / 0.25) * 100);
    } else {
      // Other metrics: threshold = 100, 2x threshold = 0
      metricScore = Math.max(0, 100 - ((value - threshold) / threshold) * 100);
    }

    score -= (100 - metricScore) * (weights[metric] || 0);
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}
