/**
 * ✅ Advanced Error Tracking Utility
 * Comprehensive error monitoring and reporting
 */

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Error categories
 */
export const ErrorCategory = {
  JAVASCRIPT: 'javascript',
  NETWORK: 'network',
  API: 'api',
  RENDERING: 'rendering',
  RESOURCE: 'resource',
  UNKNOWN: 'unknown',
};

/**
 * Advanced Error Tracker
 */
export class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Limit stored errors
    this.errorCounts = {};
  }

  /**
   * Categorize error
   */
  categorizeError(error) {
    if (!error) return ErrorCategory.UNKNOWN;
    
    const message = error.message || error.toString() || '';
    
    if (message.includes('Network') || message.includes('fetch') || message.includes('ECONNREFUSED')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('API') || error.url || error.requestUrl || error.status) {
      return ErrorCategory.API;
    }
    if (message.includes('render') || message.includes('React')) {
      return ErrorCategory.RENDERING;
    }
    if (message.includes('Failed to load') || message.includes('resource')) {
      return ErrorCategory.RESOURCE;
    }
    return ErrorCategory.JAVASCRIPT;
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, category) {
    if (!error) return ErrorSeverity.LOW;
    
    const status = error.status || error.response?.status;
    
    if (category === ErrorCategory.NETWORK && status >= 500) {
      return ErrorSeverity.CRITICAL;
    }
    if (category === ErrorCategory.RENDERING) {
      return ErrorSeverity.HIGH;
    }
    if (category === ErrorCategory.API && status >= 400) {
      return ErrorSeverity.MEDIUM;
    }
    if (error.fatal) {
      return ErrorSeverity.CRITICAL;
    }
    return ErrorSeverity.LOW;
  }

  /**
   * Track error
   */
  trackError(error, context = {}) {
    // Ensure error is an object - handle null, undefined, or empty objects
    let errorObj = error;
    
    // Handle null or undefined
    if (!errorObj) {
      errorObj = { message: 'Unknown error' };
    }
    
    // Handle empty objects
    if (typeof errorObj === 'object' && Object.keys(errorObj).length === 0) {
      errorObj = { message: 'Empty error object' };
    }
    
    // Handle non-object types
    if (typeof errorObj !== 'object' && typeof errorObj !== 'string') {
      errorObj = { message: String(errorObj) || 'Unknown error' };
    }
    
    // Safely extract error message
    let errorMessage = 'Unknown error';
    try {
      if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.trim() !== '') {
        errorMessage = String(errorObj.message);
      } else if (typeof errorObj === 'string' && errorObj.trim() !== '') {
        errorMessage = errorObj;
      } else if (errorObj instanceof Error && errorObj.message) {
        errorMessage = String(errorObj.message);
      } else if (errorObj.toString && typeof errorObj.toString === 'function') {
        const toStringResult = errorObj.toString();
        if (toStringResult !== '[object Object]' && toStringResult.trim() !== '') {
          errorMessage = toStringResult;
        }
      }
      // If we still don't have a message, try to get it from context
      if (errorMessage === 'Unknown error' && context?.url) {
        errorMessage = `Error occurred at ${context.url}`;
      }
    } catch (e) {
      errorMessage = 'Error parsing error message';
    }
    
    // Safely extract stack
    const errorStack = errorObj.stack || (errorObj instanceof Error ? error.stack : undefined);
    
    // Safely get URL
    let currentUrl = '';
    try {
      currentUrl = typeof window !== 'undefined' && window.location ? window.location.href : '';
    } catch (e) {
      // Ignore
    }
    
    // Safely get user agent
    let userAgent = '';
    try {
      userAgent = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
    } catch (e) {
      // Ignore
    }
    
    // Build context safely
    const safeContext = { ...context };
    try {
      if (typeof window !== 'undefined' && window.innerWidth && window.innerHeight) {
        safeContext.viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      }
    } catch (e) {
      // Ignore
    }
    
    // Get category and severity
    const category = this.categorizeError(errorObj);
    const severity = this.determineSeverity(errorObj, category);
    
    // Build error data with all required fields - ensure all fields have values
    const errorData = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: errorMessage || 'Unknown error',
      category: category || ErrorCategory.UNKNOWN,
      severity: severity || ErrorSeverity.LOW,
      timestamp: Date.now(),
      url: currentUrl || '',
      userAgent: userAgent || '',
      context: safeContext || {},
    };
    
    // Add optional fields
    if (errorStack) {
      errorData.stack = errorStack;
    }
    if (errorObj?.status) {
      errorData.status = errorObj.status;
    }
    if (errorObj?.url) {
      errorData.requestUrl = errorObj.url;
    }
    if (errorObj?.requestUrl) {
      errorData.requestUrl = errorObj.requestUrl;
    }

    // Validate errorData before storing
    if (!errorData.id || !errorData.message || !errorData.category || !errorData.severity) {
      // If critical fields are missing, create a minimal valid errorData
      errorData.id = errorData.id || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      errorData.message = errorData.message || 'Unknown error';
      errorData.category = errorData.category || ErrorCategory.UNKNOWN;
      errorData.severity = errorData.severity || ErrorSeverity.LOW;
    }

    // Store error
    this.errors.push(errorData);

    // Limit errors array
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Count errors by category
    this.errorCounts[errorData.category] = (this.errorCounts[errorData.category] || 0) + 1;

    // Send to analytics (only in production)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorData.message || 'Unknown error',
        fatal: errorData.severity === ErrorSeverity.CRITICAL,
        error_category: errorData.category,
        error_severity: errorData.severity,
      });
    }

    // Log in development - ensure errorData is valid before logging
    if (process.env.NODE_ENV === 'development') {
      // Validate errorData has at least required fields
      if (errorData && errorData.id && errorData.message && errorData.category && errorData.severity) {
        console.error('Error tracked:', errorData);
      } else {
        // Fallback logging with all available information
        console.error('Error tracked (fallback):', {
          id: errorData?.id || 'missing',
          message: errorData?.message || errorMessage || 'missing',
          category: errorData?.category || 'unknown',
          severity: errorData?.severity || 'unknown',
          timestamp: errorData?.timestamp || Date.now(),
          originalError: errorObj,
          context: context,
        });
      }
    }

    // Send critical errors immediately
    if (errorData.severity === ErrorSeverity.CRITICAL) {
      this.sendErrorToServer(errorData);
    }

    return errorData;
  }

  /**
   * Track API error
   */
  trackAPIError(url, status, error, context = {}) {
    // Extract error message from Axios error object
    const errorMessage = error?.message || 
                        error?.response?.data?.message || 
                        error?.response?.data?.error || 
                        `API Error: ${url} - ${status}`;
    
    return this.trackError(
      {
        message: errorMessage,
        status,
        url: url || error?.config?.url || '',
        requestUrl: url,
        ...(error?.response?.data && { responseData: error.response.data }),
        ...(error?.config && { 
          method: error.config.method,
          baseURL: error.config.baseURL,
        }),
        ...(error?.stack && { stack: error.stack }),
      },
      { ...context, apiError: true }
    );
  }

  /**
   * Track network error
   */
  trackNetworkError(url, error, context = {}) {
    // Safely extract error message from network error
    let errorMessage = `Network Error: ${url || 'unknown URL'}`;
    
    try {
      // Handle different error object structures
      if (error && typeof error === 'object') {
        // Check if error has a message property
        if (error.message && typeof error.message === 'string' && error.message.trim() !== '') {
          errorMessage = String(error.message);
        } 
        // Check for error code
        else if (error.code) {
          errorMessage = `Network Error (${error.code}): ${url || 'unknown URL'}`;
        }
        // Check for error name
        else if (error.name) {
          errorMessage = `Network Error (${error.name}): ${url || 'unknown URL'}`;
        }
        // Check if error is an Error instance
        else if (error instanceof Error) {
          errorMessage = error.message || `Network Error: ${url || 'unknown URL'}`;
        }
        // Check if error has a toString method that returns something meaningful
        else if (error.toString && typeof error.toString === 'function') {
          const errorString = error.toString();
          if (errorString !== '[object Object]' && errorString.trim() !== '') {
            errorMessage = `Network Error: ${errorString}`;
          }
        }
      } 
      // Handle string errors
      else if (typeof error === 'string' && error.trim() !== '') {
        errorMessage = `Network Error: ${error}`;
      }
    } catch (e) {
      // If extraction fails, use default message
      errorMessage = `Network Error: ${url || 'unknown URL'}`;
    }
    
    // Build error object with all available information
    // Always ensure we have at least a message and URL
    const errorObj = {
      message: errorMessage,
      url: url || (error?.config?.url) || (error?.url) || '',
      requestUrl: url || (error?.config?.url) || (error?.url) || '',
    };
    
    // Add optional fields safely - only if error object exists and has properties
    if (error && typeof error === 'object' && Object.keys(error).length > 0) {
      if (error.code) {
        errorObj.code = String(error.code);
      }
      if (error.config?.method) {
        errorObj.method = String(error.config.method);
      }
      if (error.config?.baseURL) {
        errorObj.baseURL = String(error.config.baseURL);
      }
      if (error.stack && typeof error.stack === 'string') {
        errorObj.stack = error.stack;
      }
      if (error.response) {
        errorObj.response = {
          status: error.response.status,
          statusText: error.response.statusText || '',
        };
      }
      // Add error name if available
      if (error.name) {
        errorObj.name = String(error.name);
      }
    }
    
    // Ensure we always have a valid error object before tracking
    if (!errorObj.message || errorObj.message.trim() === '') {
      errorObj.message = `Network Error: ${url || 'unknown URL'}`;
    }
    
    return this.trackError(errorObj, { ...context, networkError: true });
  }

  /**
   * Send error to server
   */
  async sendErrorToServer(errorData) {
    // In production, send to your error tracking service
    // Example: Sentry, LogRocket, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending error to server:', errorData);
    }

    // Example implementation:
    // try {
    //   await fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorData),
    //   });
    // } catch (error) {
    //   console.error('Failed to send error to server:', error);
    // }
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    return {
      totalErrors: this.errors.length,
      errorsByCategory: this.errorCounts,
      recentErrors: this.errors.slice(-10),
      criticalErrors: this.errors.filter((e) => e.severity === ErrorSeverity.CRITICAL),
    };
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
    this.errorCounts = {};
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Global error handlers
if (typeof window !== 'undefined') {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    errorTracker.trackError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { unhandledRejection: true }
    );
  });
}
