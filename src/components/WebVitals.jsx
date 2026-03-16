"use client";
import { useEffect } from "react";
import { performanceMonitor } from "@/utils/performanceMonitor";
import { monitorPerformance, getPerformanceScore } from "@/utils/performanceAlerts";
import { analyticsDashboard } from "@/utils/analyticsDashboard";
import { monitorBudgets } from "@/utils/performanceBudgets";

/**
 * ✅ Web Vitals Monitoring Component
 * Tracks Core Web Vitals (LCP, INP, CLS, FCP, TTFB) and sends to analytics
 * Helps monitor real user performance metrics
 * 
 * Note: INP (Interaction to Next Paint) replaces FID in web-vitals v3+
 */
export default function WebVitals() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // ✅ Start advanced performance monitoring
    performanceMonitor.start();

    // Import web-vitals dynamically to reduce initial bundle size
    import("web-vitals").then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      // Largest Contentful Paint (LCP) - Measures loading performance
      onLCP((metric) => {
        // Send to Google Analytics (only in production)
        if (process.env.NODE_ENV === 'production' && typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "LCP",
            value: Math.round(metric.value),
            non_interaction: true,
          });
        }
        // ✅ Monitor and alert on performance issues
        monitorPerformance({ LCP: metric.value });
        // ✅ Check performance budgets
        monitorBudgets({ LCP: metric.value });
        // ✅ Aggregate for analytics dashboard
        analyticsDashboard.aggregateWebVitals(metric);
        // Log in development
        if (process.env.NODE_ENV === "development") {
          console.log("LCP:", metric.value, metric);
        }
      });

      // Cumulative Layout Shift (CLS) - Measures visual stability
      onCLS((metric) => {
        if (process.env.NODE_ENV === 'production' && typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "CLS",
            value: Math.round(metric.value * 1000) / 1000, // Round to 3 decimal places
            non_interaction: true,
          });
        }
        // ✅ Monitor and alert on performance issues
        monitorPerformance({ CLS: metric.value });
        // ✅ Check performance budgets
        monitorBudgets({ CLS: metric.value });
        // ✅ Aggregate for analytics dashboard
        analyticsDashboard.aggregateWebVitals(metric);
        if (process.env.NODE_ENV === "development") {
          console.log("CLS:", metric.value, metric);
        }
      });

      // First Contentful Paint (FCP) - Measures loading performance
      onFCP((metric) => {
        if (process.env.NODE_ENV === 'production' && typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "FCP",
            value: Math.round(metric.value),
            non_interaction: true,
          });
        }
        // ✅ Aggregate for analytics dashboard
        analyticsDashboard.aggregateWebVitals(metric);
        if (process.env.NODE_ENV === "development") {
          console.log("FCP:", metric.value, metric);
        }
      });

      // Time to First Byte (TTFB) - Measures server response time
      onTTFB((metric) => {
        if (process.env.NODE_ENV === 'production' && typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "TTFB",
            value: Math.round(metric.value),
            non_interaction: true,
          });
        }
        // ✅ Aggregate for analytics dashboard
        analyticsDashboard.aggregateWebVitals(metric);
        if (process.env.NODE_ENV === "development") {
          console.log("TTFB:", metric.value, metric);
        }
      });

      // Interaction to Next Paint (INP) - Measures responsiveness
      // Note: INP replaces FID in web-vitals v3+ and is the recommended metric
      onINP((metric) => {
        if (process.env.NODE_ENV === 'production' && typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "INP",
            value: Math.round(metric.value),
            non_interaction: true,
          });
        }
        // ✅ Monitor and alert on performance issues
        monitorPerformance({ INP: metric.value });
        // ✅ Check performance budgets
        monitorBudgets({ INP: metric.value });
        // ✅ Aggregate for analytics dashboard
        analyticsDashboard.aggregateWebVitals(metric);
        if (process.env.NODE_ENV === "development") {
          console.log("INP:", metric.value, metric);
        }
      });
    });

    // Cleanup on unmount
    return () => {
      performanceMonitor.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}
