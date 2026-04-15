import { Activity, Loader } from 'lucide-react';

/**
 * LoadingState Component
 *
 * Purpose: Display a consistent loading UI while data is being fetched
 * Provides visual feedback to users so they know something is happening
 *
 * Usage:
 * {loading ? <LoadingState /> : <YourContent />}
 *
 * Props:
 * - message: Optional custom loading message (default: "Loading...")
 * - variant: 'spinner' | 'skeleton' | 'pulse' (default: 'spinner')
 *
 * Best Practices:
 * - Show loading state immediately when fetching starts
 * - Replace with actual content once loading finishes
 * - Use skeleton screens for better perceived performance (variant='skeleton')
 */

export function LoadingState({ message = 'Loading...', variant = 'spinner' }) {
  if (variant === 'skeleton') {
    return <SkeletonLoading message={message} />;
  }

  if (variant === 'pulse') {
    return <PulseLoading message={message} />;
  }

  return <SpinnerLoading message={message} />;
}

/**
 * SpinnerLoading: Animated spinner with text
 * Best for: Quick loading operations (< 2 seconds)
 */
function SpinnerLoading({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated Spinner */}
      <div className="mb-4 flex justify-center">
        <div className="relative w-12 h-12">
          <Loader className="w-12 h-12 text-[#14748B] animate-spin" />
        </div>
      </div>

      {/* Loading Message */}
      <p className="text-[#627587] font-medium">{message}</p>

      {/* Small hint */}
      <p className="text-[#D7E4EA] text-xs mt-2">Fetching your data...</p>
    </div>
  );
}

/**
 * SkeletonLoading: Simulates content structure while loading
 * Best for: Content-heavy pages (improves perceived performance)
 * Shows placeholder shapes that look like actual content
 */
function SkeletonLoading({ message }) {
  return (
    <div className="student-shell">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header Skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>

        {/* Content Skeleton - Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 border border-gray-200 space-y-3"
            >
              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>

              {/* Text skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6"></div>
              </div>

              {/* Button skeleton */}
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse mt-4"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Centered message */}
      <div className="text-center mt-8">
        <p className="text-[#627587] font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * PulseLoading: Gentle pulsing animation
 * Best for: Background loading/polling
 */
function PulseLoading({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Pulsing circle */}
      <div className="mb-4">
        <div className="w-12 h-12 bg-[#14748B] rounded-full animate-pulse"></div>
      </div>

      {/* Message */}
      <p className="text-[#627587] font-medium">{message}</p>
    </div>
  );
}

/**
 * LoadingOverlay: Full-screen transparent loading overlay
 * Best for: Form submissions, critical operations
 * Prevents user interaction while loading
 */
export function LoadingOverlay({ isVisible = false, message = 'Processing...' }) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      role="progressbar"
      aria-label={message}
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-[#14748B] animate-spin" />
          <p className="font-medium text-gray-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * TableLoadingState: Loading skeleton for table-like data
 * Best for: Patient records, appointment lists
 */
export function TableLoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );
}

export default LoadingState;
