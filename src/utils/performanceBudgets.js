/**
 * ✅ Performance Budgets Configuration
 * Defines performance budgets and monitors compliance
 */

/**
 * Performance budget thresholds
 * Based on Core Web Vitals and industry standards
 */
export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  LCP: {
    good: 2500,      // < 2.5s is good
    needsImprovement: 4000,  // 2.5s - 4s needs improvement
    poor: 4000,      // > 4s is poor
    target: 2000,    // Target: < 2s
  },
  INP: {
    good: 200,       // < 200ms is good
    needsImprovement: 500,   // 200ms - 500ms needs improvement
    poor: 500,       // > 500ms is poor
    target: 150,     // Target: < 150ms
  },
  CLS: {
    good: 0.1,       // < 0.1 is good
    needsImprovement: 0.25,  // 0.1 - 0.25 needs improvement
    poor: 0.25,      // > 0.25 is poor
    target: 0.05,    // Target: < 0.05
  },
  FCP: {
    good: 1800,      // < 1.8s is good
    needsImprovement: 3000,  // 1.8s - 3s needs improvement
    poor: 3000,      // > 3s is poor
    target: 1500,    // Target: < 1.5s
  },
  TTFB: {
    good: 800,       // < 800ms is good
    needsImprovement: 1800,  // 800ms - 1.8s needs improvement
    poor: 1800,      // > 1.8s is poor
    target: 600,     // Target: < 600ms
  },
  // Bundle size budgets
  BUNDLE_SIZE: {
    initialJS: 244000,  // 244KB (HTTP/2 optimal chunk size)
    totalJS: 1000000,   // 1MB total JS
    initialCSS: 50000,  // 50KB initial CSS
    totalCSS: 200000,  // 200KB total CSS
  },
  // Resource budgets
  RESOURCES: {
    maxImageSize: 500000,  // 500KB per image
    maxFontSize: 100000,   // 100KB per font
    maxScriptSize: 244000, // 244KB per script
  },
};

/**
 * Get performance rating for a metric
 * @param {string} metric - Metric name (LCP, INP, CLS, etc.)
 * @param {number} value - Metric value
 * @returns {string} Rating: 'good', 'needs-improvement', or 'poor'
 */
export function getPerformanceRating(metric, value) {
  const budget = PERFORMANCE_BUDGETS[metric];
  if (!budget) return 'unknown';

  if (value <= budget.good) {
    return 'good';
  } else if (value <= budget.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Check if performance budget is exceeded
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @returns {boolean} True if budget exceeded
 */
export function isBudgetExceeded(metric, value) {
  const budget = PERFORMANCE_BUDGETS[metric];
  if (!budget) return false;

  // For CLS, lower is better
  if (metric === 'CLS') {
    return value > budget.good;
  }
  // For others, higher is worse
  return value > budget.good;
}

/**
 * Get budget status for all metrics
 * @param {object} metrics - Metrics object
 * @returns {object} Budget status for each metric
 */
export function getBudgetStatus(metrics) {
  const status = {};
  
  Object.entries(metrics).forEach(([metric, value]) => {
    status[metric] = {
      value,
      rating: getPerformanceRating(metric, value),
      exceeded: isBudgetExceeded(metric, value),
      budget: PERFORMANCE_BUDGETS[metric],
    };
  });

  return status;
}

/**
 * Check bundle size against budgets
 * @param {object} bundleInfo - Bundle information
 * @returns {object} Budget status
 */
export function checkBundleBudget(bundleInfo) {
  const status = {
    passed: true,
    violations: [],
  };

  if (bundleInfo.initialJS > PERFORMANCE_BUDGETS.BUNDLE_SIZE.initialJS) {
    status.passed = false;
    status.violations.push({
      type: 'initialJS',
      actual: bundleInfo.initialJS,
      budget: PERFORMANCE_BUDGETS.BUNDLE_SIZE.initialJS,
      excess: bundleInfo.initialJS - PERFORMANCE_BUDGETS.BUNDLE_SIZE.initialJS,
    });
  }

  if (bundleInfo.totalJS > PERFORMANCE_BUDGETS.BUNDLE_SIZE.totalJS) {
    status.passed = false;
    status.violations.push({
      type: 'totalJS',
      actual: bundleInfo.totalJS,
      budget: PERFORMANCE_BUDGETS.BUNDLE_SIZE.totalJS,
      excess: bundleInfo.totalJS - PERFORMANCE_BUDGETS.BUNDLE_SIZE.totalJS,
    });
  }

  return status;
}

/**
 * Monitor performance budgets and alert on violations
 * @param {object} metrics - Current performance metrics
 */
export function monitorBudgets(metrics) {
  const status = getBudgetStatus(metrics);
  const violations = [];

  Object.entries(status).forEach(([metric, data]) => {
    if (data.exceeded) {
      violations.push({
        metric,
        value: data.value,
        budget: data.budget.good,
        rating: data.rating,
      });
    }
  });

  if (violations.length > 0) {
    // Log violations
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Performance Budget Violations:', violations);
    }

    // Send to analytics (only in production)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      violations.forEach((violation) => {
        window.gtag('event', 'budget_violation', {
          event_category: 'Performance',
          event_label: violation.metric,
          value: Math.round(violation.value),
          budget: violation.budget,
          rating: violation.rating,
        });
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    status,
  };
}
