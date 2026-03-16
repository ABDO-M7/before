"use client";
import ErrorBoundary from "@/components/ErrorBoundary";

/**
 * ✅ Component-Level Error Boundary
 * Wraps individual components to prevent errors from crashing the entire page
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to wrap
 * @param {string} props.componentName - Name of the component (for error tracking)
 * @param {React.ReactNode} [props.fallback] - Custom fallback UI
 */
const ComponentErrorBoundary = ({ children, componentName, fallback }) => {
  const handleError = (error, errorInfo) => {
    // Error is already tracked by ErrorBoundary component
    // This is just for component-specific handling if needed
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Error in ${componentName}:`, error);
    }
  };

  const defaultFallback = (
    <div style={{ 
      padding: '1rem', 
      textAlign: 'center', 
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <p style={{ color: '#6c757d', margin: 0 }}>
        {componentName ? `Error loading ${componentName}` : 'Error loading component'}
      </p>
      <small style={{ color: '#adb5bd' }}>
        This section failed to load. Please refresh the page.
      </small>
    </div>
  );

  return (
    <ErrorBoundary
      name={componentName}
      onError={handleError}
      fallback={fallback || defaultFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ComponentErrorBoundary;
