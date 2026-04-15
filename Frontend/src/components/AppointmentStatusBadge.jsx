import { CheckCircle2, Clock, AlertCircle, XCircle, Play, Pause } from 'lucide-react';

/**
 * AppointmentStatusBadge Component
 *
 * Purpose: Display appointment status with consistent color-coding and icons
 * Ensures status information is clear and visually distinct across the app
 *
 * Statuses:
 * - Booked: Light blue, pending confirmation
 * - Confirmed: Blue, confirmed by doctor
 * - Ready: Green, doctor is ready for consultation
 * - In Progress: Orange, consultation ongoing
 * - Completed: Green with checkmark, finished
 * - Cancelled: Red with X, cancelled
 * - No Show: Red, student didn't show up
 *
 * Usage:
 * <AppointmentStatusBadge status="Confirmed" size="md" />
 *
 * Props:
 * - status: Appointment status string (required)
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - variant: 'badge' | 'pill' | 'text' (default: 'badge')
 * - showIcon: Whether to show status icon (default: true)
 */

export function AppointmentStatusBadge({
  status = 'Booked',
  size = 'md',
  variant = 'badge',
  showIcon = true
}) {
  // Status configuration: color, icon, label, description
  const statusConfig = {
    Booked: {
      bgColor: 'bg-accent-primary/10',
      textColor: 'text-accent-primary',
      borderColor: 'border-accent-primary/25',
      icon: Clock,
      label: 'Booked',
      description: 'Awaiting confirmation'
    },
    Confirmed: {
      bgColor: 'bg-accent-primary/15',
      textColor: 'text-accent-primary',
      borderColor: 'border-accent-primary/35',
      icon: CheckCircle2,
      label: 'Confirmed',
      description: 'Appointment confirmed'
    },
    Ready: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      icon: Play,
      label: 'Ready',
      description: 'Doctor is ready'
    },
    'In Progress': {
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300',
      icon: Pause,
      label: 'In Progress',
      description: 'Consultation ongoing'
    },
    Completed: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      icon: CheckCircle2,
      label: 'Completed',
      description: 'Consultation finished'
    },
    Cancelled: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      icon: XCircle,
      label: 'Cancelled',
      description: 'Appointment cancelled'
    },
    'No Show': {
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      icon: AlertCircle,
      label: 'No Show',
      description: 'Student did not attend'
    }
  };

  const config = statusConfig[status] || statusConfig.Booked;
  const Icon = config.icon;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  // === BADGE VARIANT (default) ===
  if (variant === 'badge') {
    return (
      <div
        className={`
          inline-flex items-center gap-1.5
          rounded-lg border
          font-medium
          ${sizeClasses[size]}
          ${config.bgColor} ${config.textColor} ${config.borderColor}
        `}
        title={config.description}
      >
        {showIcon && <Icon className={getSizeIcon(size)} />}
        <span>{config.label}</span>
      </div>
    );
  }

  // === PILL VARIANT (rounded like a button) ===
  if (variant === 'pill') {
    return (
      <div
        className={`
          inline-flex items-center gap-2
          rounded-full border-2
          font-semibold
          ${sizeClasses[size]}
          ${config.bgColor} ${config.textColor} ${config.borderColor}
        `}
        title={config.description}
      >
        {showIcon && <Icon className={getSizeIcon(size)} />}
        <span>{config.label}</span>
      </div>
    );
  }

  // === TEXT VARIANT (just the text, colored) ===
  if (variant === 'text') {
    return (
      <div
        className={`inline-flex items-center gap-1 font-semibold ${config.textColor}`}
        title={config.description}
      >
        {showIcon && <Icon className={getSizeIcon(size)} />}
        <span className={sizeClasses[size]}>{config.label}</span>
      </div>
    );
  }

  return null;
}

/**
 * Get appropriate icon size based on badge size
 */
function getSizeIcon(size) {
  const sizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  return sizeMap[size] || sizeMap.md;
}

/**
 * StatusTimeline Component
 *
 * Purpose: Show appointment status progression timeline
 * Helps users understand where they are in the appointment process
 *
 * Usage:
 * <StatusTimeline currentStatus="Ready" />
 *
 * Shows all possible states and highlights current and completed states
 */

export function StatusTimeline({ currentStatus = 'Booked' }) {
  const statuses = ['Booked', 'Confirmed', 'Ready', 'In Progress', 'Completed'];

  const statusIndex = statuses.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between py-6 px-4 bg-white rounded-xl border border-gray-200">
      {statuses.map((status, index) => {
        const isCompleted = index < statusIndex;
        const isCurrent = index === statusIndex;

        return (
          <div key={status} className="flex-1 flex items-center">
            {/* Status dot */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${
                    isCurrent
                      ? 'bg-[#14748B] text-white ring-2 ring-[#14748B] ring-offset-2'
                      : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <p
                className={`text-xs font-semibold mt-2 text-center ${
                  isCurrent ? 'text-[#14748B]' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {status}
              </p>
            </div>

            {/* Connector line */}
            {index < statuses.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-2 rounded-full
                  ${isCompleted || isCurrent ? 'bg-[#14748B]' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * StatusAlert Component
 *
 * Purpose: Display important status information in alert format
 * Shows actionable info about appointment status
 *
 * Usage:
 * <StatusAlert status="Booked" message="Awaiting doctor confirmation" />
 */

export function StatusAlert({ status, message }) {
  const alertConfig = {
    Booked: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-l-4 border-blue-400',
      icon: Clock
    },
    Confirmed: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-l-4 border-blue-400',
      icon: CheckCircle2
    },
    Ready: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-l-4 border-green-400',
      icon: Play
    },
    'In Progress': {
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      borderColor: 'border-l-4 border-orange-400',
      icon: Pause
    },
    Completed: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-l-4 border-green-400',
      icon: CheckCircle2
    },
    Cancelled: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-l-4 border-red-400',
      icon: XCircle
    },
    'No Show': {
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-l-4 border-red-400',
      icon: AlertCircle
    }
  };

  const config = alertConfig[status] || alertConfig.Booked;
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} rounded-lg p-4 flex items-start gap-3`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.textColor}`} />
      <div>
        <h3 className={`font-semibold ${config.textColor}`}>{status}</h3>
        <p className={`text-sm mt-1 ${config.textColor}`}>{message}</p>
      </div>
    </div>
  );
}

export default AppointmentStatusBadge;
