import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ErrorBoundary Component
 *
 * Purpose: Catch unexpected React rendering errors and display a fallback UI
 * instead of letting them crash the entire application.
 *
 * Benefits:
 * - Prevents entire app from becoming unusable due to a single component error
 * - Provides user-friendly error messages
 * - Logs errors for debugging
 * - Allows users to recover by reloading the page
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * Note: Only catches errors during rendering, not in event handlers or async code.
 * For those, use try-catch blocks in your components.
 */

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    /**
     * State object for error tracking
     * - hasError: Whether an error was caught
     * - error: The caught error object with message stack trace
     */
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * Update state when error is caught
   * Called after an error is thrown in a child component
   * This ensures the component switches to error UI on next render
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Log error details for debugging/monitoring
   * In production, send to error tracking service (Sentry, LogRocket, etc.)
   */
  componentDidCatch(error, errorInfo) {
    console.error('🔴 ErrorBoundary caught an error:', error);
    console.error('📋 Error details:', errorInfo);

    // TODO: Send to error tracking service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  /**
   * Render either the error UI or children
   */
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-red-700 mb-2">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>

            {/* Error Details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                <summary className="font-semibold text-red-700 cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-red-600 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                type="button"
              >
                🔄 Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                type="button"
              >
                🏠 Go to Home
              </button>
            </div>

            {/* Support Message */}
            <p className="text-gray-500 text-xs mt-6">
              If the problem persists, please contact support at support@campushealth.edu
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
