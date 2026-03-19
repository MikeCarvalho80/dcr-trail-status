import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ExternalLinkIcon, NavigationIcon, StarIcon, Share2Icon, CloudSunIcon } from 'lucide-react';
import type { Park } from '../data/parks';
import { getTrailStatus, getNavUrl, STATUS_CONFIG } from '../lib/status';

interface ParkCardProps {
  park: Park;
  distanceMiles?: number;
  driveMinutes?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
        {label}
      </div>
      <div className="font-mono text-[13px] text-text-primary">{value}</div>
    </div>
  );
}

function formatVerifiedDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWeatherUrl(park: Park): string {
  return `https://forecast.weather.gov/MapClick.php?lat=${park.lat}&lon=${park.lng}`;
}

export function ParkCard({ park, distanceMiles, driveMinutes, isFavorite, onToggleFavorite }: ParkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const trail = getTrailStatus(park);
  const config = STATUS_CONFIG[trail.status];

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const text = `${park.name} — ${trail.label}\n${trail.sublabel}\n${park.miles} mi · ${park.difficulty}\n${park.url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: park.name, text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg('Copied!');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch {
      // user cancelled share
    }
  }

  return (
    <div
      className={`
        bg-bg-secondary ${config.border} border-l-2 border rounded-xl
        transition-colors duration-200
        ${isExpanded ? 'bg-bg-elevated' : 'hover:bg-bg-elevated'}
      `}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-4 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30 focus-visible:ring-inset rounded-xl"
        aria-expanded={isExpanded}
        aria-label={`${park.name}: ${trail.label}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
      >
        {/* Top row: status dot + badges + distance */}
        <div className="flex items-center gap-2">
          <span
            className={`
              w-2 h-2 rounded-full flex-shrink-0 ${config.dot}
              ${trail.status === 'closed' ? 'animate-pulse-dot' : ''}
            `}
            aria-hidden="true"
          />
          <span className="sr-only">{trail.status}</span>

          {/* Status badge */}
          <span
            className={`${config.badgeBg} ${config.text} font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded`}
          >
            {trail.label}
          </span>

          {/* Manager tag */}
          <span className="bg-bg-elevated text-text-secondary font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded">
            {park.manager}
          </span>

          <div className="flex-1" />

          {/* Distance + miles */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {distanceMiles != null && (
              <span className="font-mono text-[12px] text-text-secondary">
                ~{driveMinutes} min
              </span>
            )}
            <span className="font-mono text-[12px] text-text-muted">
              {park.miles} mi
            </span>
          </div>

          {/* Favorite star */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onToggleFavorite(); } }}
            className="flex-shrink-0 ml-0.5 cursor-pointer"
            aria-label={isFavorite ? `Remove ${park.name} from favorites` : `Add ${park.name} to favorites`}
          >
            <StarIcon
              className={`w-4 h-4 transition-colors duration-200 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-text-muted hover:text-amber-400/60'}`}
            />
          </span>

          {/* Chevron */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-0.5"
          >
            <ChevronDownIcon className="w-4 h-4 text-text-muted" />
          </motion.span>
        </div>

        {/* Park name */}
        <div className="font-mono text-[18px] font-bold text-text-primary mt-1.5 leading-tight">
          {park.name}
        </div>

        {/* Sublabel */}
        <div className="font-mono text-[12px] text-text-muted mt-0.5">
          {trail.sublabel}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="border-t border-bg-elevated my-2.5" />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <DetailItem label="Difficulty" value={park.difficulty} />
                <DetailItem label="NEMBA Chapter" value={park.nemba} />
                <DetailItem label="Trail Miles" value={park.miles} />
                <DetailItem label="Parking" value={park.parking} />
                <DetailItem label="Last Verified" value={formatVerifiedDate(park.lastVerified)} />
              </div>

              {/* Closure policy */}
              <div className="mt-3">
                <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                  Closure Policy
                </div>
                <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                  {park.closureRule}
                </p>
                {park.additionalClosures && park.additionalClosures.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {park.additionalClosures.map((c, i) => (
                      <p key={i} className="font-mono text-[12px] text-text-secondary leading-relaxed">
                        <span className="text-status-caution font-semibold">{c.label}:</span> {c.rule} ({c.start.month}/{c.start.day}–{c.end.month}/{c.end.day})
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Why this status */}
              <div className="mt-3">
                <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                  Why This Status
                </div>
                <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                  {trail.reason}
                </p>
              </div>

              {/* Source */}
              {park.source && (
                <div className="mt-2">
                  <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                    Source
                  </div>
                  <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                    {park.source}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="mt-2">
                <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                  Notes
                </div>
                <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                  {park.notes}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href={getNavUrl(park)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    inline-flex items-center gap-1.5
                    font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                    px-3 py-1.5 rounded-md border
                    ${config.border} ${config.text}
                    transition-colors duration-200
                    hover:opacity-80
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30
                  `}
                  aria-label={`Navigate to ${park.name} parking`}
                >
                  <NavigationIcon className="w-4 h-4" />
                  Navigate
                </a>
                <a
                  href={park.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    inline-flex items-center gap-1.5
                    font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                    px-3 py-1.5 rounded-md border
                    border-bg-elevated text-text-secondary
                    transition-colors duration-200
                    hover:text-text-primary hover:border-text-muted
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30
                  `}
                  aria-label={`View ${park.name} official page`}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  Park Info
                </a>
                <a
                  href={getWeatherUrl(park)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    inline-flex items-center gap-1.5
                    font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                    px-3 py-1.5 rounded-md border
                    border-bg-elevated text-text-secondary
                    transition-colors duration-200
                    hover:text-text-primary hover:border-text-muted
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30
                  `}
                  aria-label={`Weather forecast for ${park.name}`}
                >
                  <CloudSunIcon className="w-4 h-4" />
                  Weather
                </a>
                <button
                  onClick={handleShare}
                  className={`
                    inline-flex items-center gap-1.5
                    font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                    px-3 py-1.5 rounded-md border
                    border-bg-elevated text-text-secondary
                    transition-colors duration-200
                    hover:text-text-primary hover:border-text-muted
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30
                  `}
                  aria-label={`Share ${park.name} status`}
                >
                  <Share2Icon className="w-4 h-4" />
                  {shareMsg || 'Share'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
