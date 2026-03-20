import type { Park } from '../data/parks';
import { getTrailStatus, STATUS_CONFIG } from '../lib/status';
import { estimateDriveMinutes } from '../lib/geo';
import { SparklesIcon } from 'lucide-react';

interface SuggestedRidesProps {
  parks: Park[];
  distances: Map<string, number>;
  onParkClick: (parkId: string) => void;
}

export function SuggestedRides({ parks, distances, onParkClick }: SuggestedRidesProps) {
  if (parks.length === 0) return null;

  return (
    <section aria-label="Suggested rides" className="mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        <SparklesIcon className="w-3.5 h-3.5 text-status-open" />
        <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
          Suggested Rides
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {parks.map((park) => {
          const trail = getTrailStatus(park);
          const config = STATUS_CONFIG[trail.status];
          const dist = distances.get(park.id);
          return (
            <button
              key={park.id}
              onClick={() => onParkClick(park.id)}
              className="flex-shrink-0 bg-bg-secondary border border-bg-elevated rounded-lg px-3.5 py-3 text-left hover:bg-bg-elevated transition-colors duration-200 max-w-[200px]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                <span className={`${config.text} font-mono text-[11px] font-semibold uppercase`}>
                  {trail.label}
                </span>
              </div>
              <div className="font-mono text-[12px] font-bold text-text-primary leading-tight truncate">
                {park.name}
              </div>
              <div className="font-mono text-[11px] text-text-muted mt-0.5">
                {park.miles} mi · {park.difficulty.split('-')[0]}
                {dist != null && <> · ~{estimateDriveMinutes(dist)} min</>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
