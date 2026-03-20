import { PARKS } from '../data/parks';
import { getTrailStatus, STATUS_CONFIG } from '../lib/status';
import { getSunTimes } from '../lib/sun';

/**
 * Standalone embeddable park status card.
 * Rendered when URL contains ?embed={parkId}.
 * Designed to be iframe-friendly at ~320px wide.
 */
export function EmbedCard({ parkId }: { parkId: string }) {
  const park = PARKS.find((p) => p.id === parkId);
  if (!park) {
    return (
      <div className="font-mono text-[13px] text-text-muted p-4">
        Park not found: {parkId}
      </div>
    );
  }

  const trail = getTrailStatus(park);
  const config = STATUS_CONFIG[trail.status];
  const sunTimes = getSunTimes(park.lat, park.lng, new Date());

  return (
    <div className="min-h-screen bg-bg-primary flex items-start justify-center p-4">
      <div className={`bg-bg-secondary ${config.border} border-l-2 border rounded-xl max-w-[360px] w-full`}>
        <div className="px-4 py-3">
          {/* Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${config.dot} ${trail.status === 'closed' ? 'animate-pulse-dot' : ''}`} />
            <span className={`${config.badgeBg} ${config.text} font-mono text-[11px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded`}>
              {trail.label}
            </span>
            <span className="font-mono text-[11px] text-text-muted truncate">
              {trail.sublabel}
            </span>
          </div>

          {/* Name */}
          <div className="font-mono text-[16px] font-bold text-text-primary leading-tight">
            {park.name}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] text-text-muted">
            <span>{park.miles} mi</span>
            <span>·</span>
            <span>{park.difficulty.split('-')[0]}</span>
            <span>·</span>
            <span>{park.region}</span>
          </div>

          {/* Daylight */}
          <div className="font-mono text-[11px] text-text-secondary mt-1.5">
            Sunrise {sunTimes.sunrise} · Sunset {sunTimes.sunset}
          </div>

          {/* CTA */}
          <a
            href={`https://dcr-trail-status.vercel.app/?search=${encodeURIComponent(park.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              block text-center font-mono text-[11px] font-semibold uppercase tracking-[0.05em]
              mt-3 px-3 py-1.5 rounded-md
              ${config.badgeBg} ${config.text}
              transition-colors duration-200 hover:opacity-80
            `}
          >
            View on MTB Trail Status
          </a>
        </div>
      </div>
    </div>
  );
}
