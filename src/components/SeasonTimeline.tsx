import { getSeasonInfo } from '../lib/status';

export function SeasonTimeline() {
  const { pct, closureEndPct, inClosure } = getSeasonInfo();
  const cautionEndPct = closureEndPct + (14 / 45) * 100; // Apr 1–14 as fraction of Mar 1–Apr 14

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const phase = inClosure ? 'Closed season' : pct <= cautionEndPct ? 'Caution period' : 'Open season';

  return (
    <section aria-label="Season timeline" className="space-y-2">
      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-2">
        DCR Mandatory Closure Timeline
      </div>

      <div className="relative">
        {/* Bar */}
        <div className="flex h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-status-closed/60"
            style={{ width: `${closureEndPct}%` }}
            aria-label="Closed season: March 1 to March 31"
          />
          <div
            className="bg-status-caution/60"
            style={{ width: `${cautionEndPct - closureEndPct}%` }}
            aria-label="Caution season: April 1 to April 14"
          />
          <div
            className="bg-status-open/60"
            style={{ width: `${100 - cautionEndPct}%` }}
            aria-label="Open season: April 15 onward"
          />
        </div>

        {/* Today marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${pct}%` }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full bg-text-primary border-2 border-bg-primary animate-glow-pulse"
            aria-label={`Today: ${dateLabel}`}
          />
        </div>
      </div>

      {/* Date labels */}
      <div className="relative flex font-mono text-[11px] text-text-muted mt-1">
        <span className="absolute left-0">Mar 1</span>
        <span
          className="absolute -translate-x-1/2"
          style={{ left: `${closureEndPct}%` }}
        >
          Apr 1
        </span>
        <span
          className="absolute -translate-x-1/2"
          style={{ left: `${cautionEndPct}%` }}
        >
          Apr 14
        </span>
      </div>

      {/* Today label */}
      <div className="font-mono text-[11px] text-text-secondary mt-1">
        <span className="text-text-primary font-semibold">Today</span> — {dateLabel} · {phase}
      </div>
    </section>
  );
}
