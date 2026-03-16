/**
 * ✅ Lighthouse CI Configuration
 * Performance budgets and thresholds for continuous monitoring
 * Run with: npx @lhci/cli autorun
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      // ✅ Performance Budgets - Set thresholds for Core Web Vitals
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }], // 85% minimum performance score
        'categories:accessibility': ['error', { minScore: 0.9 }], // 90% minimum accessibility score
        'categories:best-practices': ['error', { minScore: 0.9 }], // 90% minimum best practices score
        'categories:seo': ['error', { minScore: 0.9 }], // 90% minimum SEO score
        
        // ✅ Core Web Vitals Thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // FCP < 1.8s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // LCP < 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // CLS < 0.1
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // TBT < 200ms
        'speed-index': ['error', { maxNumericValue: 3400 }], // SI < 3.4s
        
        // ✅ Resource Size Budgets
        'total-byte-weight': ['error', { maxNumericValue: 1600000 }], // Total < 1.6MB
        'dom-size': ['error', { maxNumericValue: 1500 }], // DOM nodes < 1500
        
        // ✅ Image Optimization
        'uses-optimized-images': 'error',
        'uses-responsive-images': 'error',
        'modern-image-formats': 'error',
        
        // ✅ JavaScript Optimization
        'unused-javascript': ['warn', { maxLength: 3 }], // Warn if > 3 unused scripts
        'unused-css-rules': ['warn', { maxLength: 3 }], // Warn if > 3 unused CSS rules
        
        // ✅ Caching
        'uses-long-cache-ttl': 'error',
        'uses-text-compression': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage', // Store results temporarily
    },
  },
};
