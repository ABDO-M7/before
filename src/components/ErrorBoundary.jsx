"use client";
import React from "react";
import { Component } from "react";
import { t } from "@/utils";
import Image from "next/image";
import somthingWrong from "../../public/assets/something_went_wrong.svg";
import { placeholderImage } from "@/utils";

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

      // Default fallback UI
      return (
        <div className="wentWrong" style={{ padding: "2rem", textAlign: "center" }}>
          <div className="col-12 text-center">
            <div>
              <Image
                loading="lazy"
                src={somthingWrong}
                alt="Error"
                width={200}
                height={200}
                onError={placeholderImage}
              />
            </div>
            <div className="no_data_found_text">
              <h3>{t("somthingWentWrong") || "Something went wrong"}</h3>
              <span>{t("tryLater") || "Please try again later"}</span>
              <button onClick={this.handleReset} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
                {t("tryAgain") || "Try Again"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
