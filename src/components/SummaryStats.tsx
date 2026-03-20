import type { TrailStatus } from '../data/parks';

interface StatBlockProps {
  count: number;
  label: string;
  status: TrailStatus;
  isActive: boolean;
  onClick: () => void;
}

const colorMap: Record<TrailStatus, { text: string; bg: string; border: string; activeBorder: string }> = {
  open: {
    text: 'text-status-open',
    bg: 'bg-status-open-bg',
    border: 'border-status-open/[0.27]',
    activeBorder: 'border-status-open',
  },
  caution: {
    text: 'text-status-caution',
    bg: 'bg-status-caution-bg',
    border: 'border-status-caution/[0.27]',
    activeBorder: 'border-status-caution',
  },
  closed: {
    text: 'text-status-closed',
    bg: 'bg-status-closed-bg',
    border: 'border-status-closed/[0.27]',
    activeBorder: 'border-status-closed',
  },
};

function StatBlock({ count, label, status, isActive, onClick }: StatBlockProps) {
  const colors = colorMap[status];
  return (
    <button
      onClick={onClick}
      className={`
        ${colors.bg} border rounded-lg px-3 py-3 text-center w-full
        transition-all duration-200 cursor-pointer
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/50
        ${isActive ? `${colors.activeBorder} border-2 ring-1 ring-inset ${colors.activeBorder}/30` : `${colors.border} hover:opacity-80`}
      `}
      aria-pressed={isActive}
      aria-label={`${label}: ${count} parks. ${isActive ? 'Click to clear filter' : 'Click to filter'}`}
    >
      <div className={`${colors.text} font-mono text-[32px] font-bold leading-none`}>
        {count}
      </div>
      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary mt-1.5">
        {label}
      </div>
    </button>
  );
}

export type StatusFilter = TrailStatus | null;

interface SummaryStatsProps {
  counts: { open: number; caution: number; closed: number };
  activeFilter: StatusFilter;
  onFilterChange: (status: StatusFilter) => void;
}

export function SummaryStats({ counts, activeFilter, onFilterChange }: SummaryStatsProps) {
  function handleClick(status: TrailStatus) {
    onFilterChange(activeFilter === status ? null : status);
  }

  return (
    <section aria-label="Trail status summary" className="grid grid-cols-3 gap-2.5">
      <StatBlock count={counts.open} label="Open" status="open" isActive={activeFilter === 'open'} onClick={() => handleClick('open')} />
      <StatBlock count={counts.caution} label="Caution" status="caution" isActive={activeFilter === 'caution'} onClick={() => handleClick('caution')} />
      <StatBlock count={counts.closed} label="Closed" status="closed" isActive={activeFilter === 'closed'} onClick={() => handleClick('closed')} />
    </section>
  );
}
