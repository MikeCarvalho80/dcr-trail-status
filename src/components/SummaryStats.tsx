import type { TrailStatus } from '../data/parks';

interface StatBlockProps {
  count: number;
  label: string;
  status: TrailStatus;
}

const colorMap: Record<TrailStatus, { text: string; bg: string; border: string }> = {
  open: {
    text: 'text-status-open',
    bg: 'bg-status-open-bg',
    border: 'border-status-open/[0.27]',
  },
  caution: {
    text: 'text-status-caution',
    bg: 'bg-status-caution-bg',
    border: 'border-status-caution/[0.27]',
  },
  closed: {
    text: 'text-status-closed',
    bg: 'bg-status-closed-bg',
    border: 'border-status-closed/[0.27]',
  },
};

function StatBlock({ count, label, status }: StatBlockProps) {
  const colors = colorMap[status];
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg px-3 py-3 text-center`}>
      <div className={`${colors.text} font-mono text-[32px] font-bold leading-none`}>
        {count}
      </div>
      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary mt-1.5">
        {label}
      </div>
    </div>
  );
}

interface SummaryStatsProps {
  counts: { open: number; caution: number; closed: number };
}

export function SummaryStats({ counts }: SummaryStatsProps) {
  return (
    <section aria-label="Trail status summary" className="grid grid-cols-3 gap-2.5">
      <StatBlock count={counts.open} label="Open" status="open" />
      <StatBlock count={counts.caution} label="Caution" status="caution" />
      <StatBlock count={counts.closed} label="Closed" status="closed" />
    </section>
  );
}
