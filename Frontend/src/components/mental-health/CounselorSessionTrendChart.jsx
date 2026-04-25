import {
  Activity,
  AlertCircle,
  RefreshCcw,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { cn } from '../../lib/utils';

const RANGE_OPTIONS = [
  { value: '14d', label: '14D' },
  { value: '8w', label: '8W' },
  { value: '12m', label: '12M' }
];

const GROUP_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' }
];

function formatDelta(current, previous) {
  if (typeof current !== 'number' || typeof previous !== 'number') return '';
  const diff = current - previous;
  if (diff === 0) return 'No change';
  return `${diff > 0 ? '+' : ''}${diff}`;
}

function TrendSummary({ label, value, delta, tone = 'neutral' }) {
  const toneClass = tone === 'positive'
    ? 'bg-emerald-50 text-emerald-700'
    : tone === 'warning'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-50 text-slate-700';

  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-2xl font-semibold text-primary-text">{value}</p>
        {delta ? (
          <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', toneClass)}>
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const completed = payload.find((item) => item.name === 'Completed Sessions')?.value ?? 0;
  const pending = payload.find((item) => item.name === 'Pending Sessions')?.value ?? 0;

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-primary-text">{label}</p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-2 text-secondary-text">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            Completed Sessions
          </span>
          <span className="font-semibold text-primary-text">{completed}</span>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-2 text-secondary-text">
            <span className="h-0.5 w-3 bg-amber-500" />
            Pending Sessions
          </span>
          <span className="font-semibold text-primary-text">{pending}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-secondary-text">
        {pending > completed
          ? 'Pending load is outpacing completions in this period.'
          : 'Completions are keeping pace with unresolved load in this period.'}
      </p>
    </div>
  );
}

export default function CounselorSessionTrendChart({
  data,
  loading = false,
  refreshing = false,
  error = '',
  range,
  groupBy,
  onRangeChange,
  onGroupByChange,
  onRetry,
  pendingThreshold = 0,
  title = 'Completed vs Pending Sessions Trend',
  subtitle = 'Track counselor throughput against unresolved workload over time.',
  generatedAt = '',
  className = ''
}) {
  const safeData = Array.isArray(data) ? data : [];
  const latest = safeData[safeData.length - 1];
  const previous = safeData[safeData.length - 2];
  const currentPeriodLabel = safeData.find((point) => point.isCurrentPeriod)?.periodLabel;

  const completedTotal = safeData.reduce((sum, point) => sum + (point.completedSessions || 0), 0);
  const pendingTotal = safeData.reduce((sum, point) => sum + (point.pendingSessions || 0), 0);
  const latestCompleted = latest?.completedSessions || 0;
  const latestPending = latest?.pendingSessions || 0;
  const generatedLabel = generatedAt ? new Date(generatedAt).toLocaleString() : '';

  if (loading && !safeData.length) {
    return (
      <section className={cn('pharmacy-panel p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 rounded-full bg-slate-200" />
          <div className="h-4 w-80 rounded-full bg-slate-100" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-20 rounded-[1.5rem] bg-slate-100" />
            <div className="h-20 rounded-[1.5rem] bg-slate-100" />
            <div className="h-20 rounded-[1.5rem] bg-slate-100" />
          </div>
          <div className="h-[320px] rounded-[2rem] bg-slate-100" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={cn('pharmacy-panel border border-red-100 bg-red-50/80 p-6', className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-red-700">Unable to load trend data</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (!safeData.length) {
    return (
      <section className={cn('pharmacy-panel p-6', className)}>
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 text-secondary-text" />
          <div>
            <h3 className="text-lg font-semibold text-primary-text">No session trend data yet</h3>
            <p className="mt-1 text-sm text-secondary-text">
              Session trends will appear here once this counselor has enough scheduled counseling activity in the selected range.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn('pharmacy-panel p-6', className)}>
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary-text">Counselor analytics</p>
          <h3 className="mt-2 text-2xl font-semibold text-primary-text">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-text">{subtitle}</p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex min-h-11 min-w-[6.9rem] items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-secondary-text transition-opacity',
                refreshing ? 'opacity-100' : 'opacity-0'
              )}
              aria-live="polite"
            >
              <RefreshCcw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              Updating
            </span>
            <div className="inline-flex min-h-11 rounded-full border border-slate-200 bg-slate-50 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onRangeChange?.(option.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-semibold transition',
                  range === option.value ? 'bg-white text-primary-text shadow-sm' : 'text-secondary-text'
                )}
              >
                {option.label}
              </button>
            ))}
            </div>
          </div>

          <select
            value={groupBy}
            onChange={(event) => onGroupByChange?.(event.target.value)}
            className="student-field min-h-11 w-full rounded-full px-4 py-2 text-sm font-medium xl:min-w-[11rem]"
          >
            {GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <TrendSummary
          label="Completed This Range"
          value={completedTotal}
          delta={previous ? formatDelta(latestCompleted, previous.completedSessions || 0) : ''}
          tone="positive"
        />
        <TrendSummary
          label="Pending This Range"
          value={pendingTotal}
          delta={previous ? formatDelta(latestPending, previous.pendingSessions || 0) : ''}
          tone={latestPending > latestCompleted ? 'warning' : 'neutral'}
        />
        <TrendSummary
          label="Current Pending"
          value={latestPending}
          delta={pendingThreshold ? `Threshold ${pendingThreshold}` : 'Monitor load'}
          tone={pendingThreshold && latestPending > pendingThreshold ? 'warning' : 'neutral'}
        />
      </div>

      <div className="mt-6 h-[320px] w-full md:h-[300px] lg:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={safeData} margin={{ top: 16, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="periodLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              minTickGap={18}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            />

            {pendingThreshold ? (
              <ReferenceLine
                y={pendingThreshold}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: 'Pending attention threshold',
                  position: 'insideTopRight',
                  fill: '#B45309',
                  fontSize: 11
                }}
              />
            ) : null}

            {currentPeriodLabel ? (
              <ReferenceLine
                x={currentPeriodLabel}
                stroke="#CBD5E1"
                strokeDasharray="3 3"
                label={{ value: 'Current', position: 'top', fill: '#64748B', fontSize: 11 }}
              />
            ) : null}

            <Line
              type="monotone"
              dataKey="completedSessions"
              name="Completed Sessions"
              stroke="#0F9D80"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#0F9D80' }}
            />
            <Line
              type="monotone"
              dataKey="pendingSessions"
              name="Pending Sessions"
              stroke="#F59E0B"
              strokeWidth={3}
              strokeDasharray="7 5"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#F59E0B' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-secondary-text">
        <div className="inline-flex items-center gap-2">
          {latestPending > latestCompleted ? (
            <TrendingUp className="h-4 w-4 text-amber-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-emerald-600" />
          )}
          <span>
            {latestPending > latestCompleted
              ? 'Pending workload is currently outpacing completions.'
              : 'Completions are keeping pace with unresolved workload.'}
          </span>
        </div>
        {generatedLabel ? <span>Updated {generatedLabel}</span> : null}
      </div>
    </section>
  );
}
