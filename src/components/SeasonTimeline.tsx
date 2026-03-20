import { getSeasonInfo } from '../lib/status';

export function SeasonTimeline() {
  const info = getSeasonInfo();
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (info.season === 'spring') {
    const { pct, closureEndPct, cautionEndPct, inClosure, inCaution } = info;
    const phase = inClosure ? 'Closed season' : inCaution ? 'Caution period' : 'Open season';

    return (
      <section aria-label="Season timeline" className="space-y-2">
        <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-2">
          Spring Mud Season Timeline
        </div>
        <div className="relative">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-status-closed/80" style={{ width: `${closureEndPct}%` }} aria-label="Closed: March" />
            <div className="bg-status-caution/80" style={{ width: `${cautionEndPct - closureEndPct}%` }} aria-label="Caution: early April" />
            <div className="bg-status-open/80" style={{ width: `${100 - cautionEndPct}%` }} aria-label="Open: mid April onward" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${pct}%` }}>
            <div className="w-4 h-4 rounded-full bg-text-primary border-2 border-bg-primary animate-glow-pulse" aria-label={`Today: ${dateLabel}`} />
          </div>
        </div>
        <div className="relative flex font-mono text-[12px] text-text-muted mt-1 h-4">
          <span className="absolute left-0">Mar 1</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${closureEndPct}%` }}>Apr 1</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${cautionEndPct}%` }}>Apr 15</span>
          <span className="absolute right-0">May 31</span>
        </div>
        <div className="font-mono text-[11px] text-text-secondary mt-1">
          <span className="text-text-primary font-semibold">Today</span> — {dateLabel} · {phase}
        </div>
      </section>
    );
  }

  if (info.season === 'fall') {
    const { pct, archeryEndPct } = info;
    const phase = pct <= archeryEndPct ? 'Archery season' : 'Firearm season';

    return (
      <section aria-label="Season timeline" className="space-y-2">
        <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-2">
          Fall Hunting Season Timeline
        </div>
        <div className="relative">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-status-caution/80" style={{ width: `${archeryEndPct}%` }} aria-label="Archery season: October" />
            <div className="bg-status-closed/80" style={{ width: `${100 - archeryEndPct}%` }} aria-label="Firearm season: Nov-Dec" />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${pct}%` }}>
            <div className="w-4 h-4 rounded-full bg-text-primary border-2 border-bg-primary animate-glow-pulse" aria-label={`Today: ${dateLabel}`} />
          </div>
        </div>
        <div className="relative flex font-mono text-[12px] text-text-muted mt-1 h-4">
          <span className="absolute left-0">Oct 1</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${archeryEndPct}%` }}>Nov 1</span>
          <span className="absolute right-0">Dec 31</span>
        </div>
        <div className="font-mono text-[11px] text-text-secondary mt-1">
          <span className="text-text-primary font-semibold">Today</span> — {dateLabel} · {phase} — wear blaze orange where required
        </div>
      </section>
    );
  }

  // Summer or winter — simple indicator
  const seasonLabel = info.season === 'summer' ? 'Summer Riding Season' : 'Winter Season';
  const seasonNote = info.season === 'summer'
    ? 'Peak riding season — most trails open. Check individual parks for event closures.'
    : 'Winter conditions — some trails closed for XC skiing or snow. Check parks for access.';

  return (
    <section aria-label="Season timeline" className="space-y-2">
      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary mb-2">
        {seasonLabel}
      </div>
      <div className="relative">
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className={`${info.season === 'summer' ? 'bg-status-open/80' : 'bg-status-caution/80'} w-full`} />
        </div>
      </div>
      <div className="font-mono text-[11px] text-text-secondary mt-1">
        <span className="text-text-primary font-semibold">Today</span> — {dateLabel} · {seasonNote}
      </div>
    </section>
  );
}
