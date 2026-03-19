import type { TrailStatus } from '../data/parks';
import { PARKS } from '../data/parks';
import { XIcon } from 'lucide-react';

interface StatusChangeBannerProps {
  changes: Map<string, { from: TrailStatus; to: TrailStatus }>;
  onDismiss: () => void;
}

const STATUS_LABELS: Record<TrailStatus, string> = {
  open: 'Open',
  caution: 'Caution',
  closed: 'Closed',
};

export function StatusChangeBanner({ changes, onDismiss }: StatusChangeBannerProps) {
  if (changes.size === 0) return null;

  const entries = Array.from(changes.entries()).slice(0, 5);

  return (
    <div className="bg-bg-secondary border border-status-caution/30 rounded-xl px-4 py-3 mb-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-status-caution mb-1.5">
            Status changes since your last visit
          </div>
          <div className="space-y-1">
            {entries.map(([id, { from, to }]) => {
              const park = PARKS.find((p) => p.id === id);
              if (!park) return null;
              return (
                <p key={id} className="font-mono text-[12px] text-text-secondary">
                  <span className="text-text-primary font-semibold">{park.name}</span>
                  {' '}{STATUS_LABELS[from]} → {STATUS_LABELS[to]}
                </p>
              );
            })}
            {changes.size > 5 && (
              <p className="font-mono text-[11px] text-text-muted">
                +{changes.size - 5} more
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary flex-shrink-0 mt-0.5"
          aria-label="Dismiss status changes"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
