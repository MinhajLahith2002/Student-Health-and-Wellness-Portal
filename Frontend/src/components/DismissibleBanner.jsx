import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

const toneClasses = {
  success: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
  error: 'border-red-100 bg-red-50/80 text-red-600',
  info: 'border-sky-100 bg-sky-50/80 text-sky-700'
};

export default function DismissibleBanner({
  message,
  tone = 'info',
  onClose,
  autoHideMs = 4000,
  className = ''
}) {
  useEffect(() => {
    if (!message || !onClose || !autoHideMs) return undefined;

    const timer = window.setTimeout(() => {
      onClose();
    }, autoHideMs);

    return () => window.clearTimeout(timer);
  }, [message, onClose, autoHideMs]);

  if (!message) return null;

  return (
    <section className={cn('pharmacy-panel flex items-start justify-between gap-4 border p-5', toneClasses[tone] || toneClasses.info, className)}>
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/15 bg-white/70 transition hover:bg-white"
        aria-label="Close message"
      >
        <X className="h-4 w-4" />
      </button>
    </section>
  );
}
