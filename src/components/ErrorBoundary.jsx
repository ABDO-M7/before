"use client";
import React from "react";
import { Component } from "react";
import { t } from "@/utils";

/**
 * ✅ Error Boundary Component
 * Catches JavaScript errors in child components, logs them, and displays fallback UI
 * Prevents entire app from crashing when a component throws an error
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {React.ReactNode} [props.fallback] - Custom fallback UI (optional)
 * @param {Function} [props.onError] - Error handler callback (optional)
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // ✅ Send to error tracking service
    if (typeof window !== 'undefined') {
      // Dynamically import error tracker to avoid circular dependencies
      import('@/utils/errorTracker').then(({ errorTracker }) => {
        errorTracker.trackError({
          message: error?.message || 'Component Error',
          error: error?.toString() || 'Unknown error',
          stack: error?.stack,
          componentStack: errorInfo?.componentStack,
          errorBoundary: true,
          context: {
            name: this.props.name || 'ErrorBoundary',
            location: typeof window !== 'undefined' ? window.location.href : 'unknown',
          },
        });
      }).catch((err) => {
        // Fallback if error tracker fails
        console.error('Failed to track error:', err);
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or use provided fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Keep default fallback intentionally minimal so it does not become
      // a large LCP element on low-end devices when an exception occurs.
      return (
        <div
          className="wentWrong"
          role="alert"
          style={{ padding: "0.75rem 1rem", textAlign: "center" }}
        >
          <div className="no_data_found_text" style={{ lineHeight: 1.4 }}>
            <span>{t("somthingWentWrong") || "Something went wrong"}</span>
            <button
              onClick={this.handleReset}
              style={{ marginInlineStart: "0.5rem", padding: "0.25rem 0.6rem" }}
            >
              {t("tryAgain") || "Try Again"}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
